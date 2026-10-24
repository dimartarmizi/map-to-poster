#!/usr/bin/env node
/**
 * Fetch Baton Rouge vector data from Neon Postgres for highest-resolution poster rendering.
 * Run: node scripts/fetch-br-data.js
 * Requires NEON_DATABASE_URL in env or .env
 */
import { Client } from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnv() {
  try {
    const envPath = resolve(ROOT, '.env');
    const content = require('fs').readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
    });
  } catch {}
}

loadEnv();

const DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('NEON_DATABASE_URL not set');
  process.exit(1);
}

// View bbox for Baton Rouge metro (expanded for context + river bend)
const BBOX = {
  minLon: -91.30,
  minLat: 30.28,
  maxLon: -90.92,
  maxLat: 30.62
};

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function queryAsFC(sql, params = []) {
  const { rows } = await client.query(sql, params);
  const features = [];
  for (const r of rows) {
    if (!r.geometry) continue;
    features.push({
      type: 'Feature',
      geometry: typeof r.geometry === 'string' ? JSON.parse(r.geometry) : r.geometry,
      properties: r.props || {}
    });
  }
  return { type: 'FeatureCollection', features };
}

async function main() {
  console.log('Connecting to Neon...');
  await client.connect();

  const env = `ST_MakeEnvelope(${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat},4326)`;

  mkdirSync(resolve(ROOT, 'public/data'), { recursive: true });

  // 1. HYDROGRAPHY - Mississippi + major lakes/ponds
  console.log('Fetching hydrography...');
  const hydroSQL = `
    SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.00004), 6) AS geometry,
           json_build_object(
             'ftype', ftype,
             'name', COALESCE(gnis_name, '')
           ) AS props
    FROM ebr_hydrography
    WHERE geom && ${env}
      AND (ftype IN ('StreamRiver', 'LakePond', 'Reservoir') OR gnis_name ILIKE '%mississippi%' OR gnis_name ILIKE '%university%' OR gnis_name ILIKE '%capitol%')
    LIMIT 8000;
  `;
  const hydro = await queryAsFC(hydroSQL);
  writeFileSync(resolve(ROOT, 'public/data/br-hydro.geojson'), JSON.stringify(hydro));
  console.log(`  hydro: ${hydro.features.length} features`);

  // 2. MAJOR ROADS (arterial + interstate + major collectors)
  console.log('Fetching major roads...');
  const roadsSQL = `
    SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.00003), 6) AS geometry,
           json_build_object(
             'name', COALESCE(street_name_complete, ''),
             'class', COALESCE(road_class, 'OTHER'),
             'lanes', COALESCE(number_lanes, 2),
             'truck', COALESCE(truck_route, '')
           ) AS props
    FROM ebr_street_segment
    WHERE geom && ${env}
      AND road_class IN ('INTERSTATE', 'OTHER PRINCIPAL ARTERIAL', 'MINOR ARTERIAL', 'MAJOR COLLECTOR')
    LIMIT 12000;
  `;
  const roads = await queryAsFC(roadsSQL);
  writeFileSync(resolve(ROOT, 'public/data/br-roads.geojson'), JSON.stringify(roads));
  console.log(`  roads: ${roads.features.length} features`);

  // 3. CITY / PARISH BOUNDARY
  console.log('Fetching boundaries...');
  const boundarySQL = `
    SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.0001), 6) AS geometry,
           json_build_object(
             'name', COALESCE(name, ''),
             'subtype', COALESCE(boundary_subtype, '')
           ) AS props
    FROM ebr_govt_boundary
    WHERE geom && ${env}
      AND (name ILIKE '%BATON ROUGE%' OR boundary_subtype ILIKE '%city%' OR boundary_subtype ILIKE '%parish%')
    LIMIT 50;
  `;
  const boundary = await queryAsFC(boundarySQL);
  writeFileSync(resolve(ROOT, 'public/data/br-boundary.geojson'), JSON.stringify(boundary));
  console.log(`  boundary: ${boundary.features.length} features`);

  // 4. NEIGHBORHOODS (for subtle area definition)
  console.log('Fetching neighborhoods...');
  const hoodSQL = `
    SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.00008), 6) AS geometry,
           json_build_object('name', COALESCE(neighborhood, community, '')) AS props
    FROM ebr_neighborhood
    WHERE geom && ${env}
    LIMIT 400;
  `;
  const neighborhoods = await queryAsFC(hoodSQL);
  writeFileSync(resolve(ROOT, 'public/data/br-neighborhoods.geojson'), JSON.stringify(neighborhoods));
  console.log(`  neighborhoods: ${neighborhoods.features.length} features`);

  // 5. SELECTED BUILDINGS (larger footprints in core for texture/detail at high res)
  console.log('Fetching building footprints (filtered)...');
  const bldgSQL = `
    SELECT ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.00002), 6) AS geometry,
           json_build_object(
             'area', footprint_area_sqft,
             'height', height_ft,
             'type', COALESCE(structure_type, '')
           ) AS props
    FROM building_footprints
    WHERE geom && ${env}
      AND footprint_area_sqft > 1500
    ORDER BY footprint_area_sqft DESC
    LIMIT 6500;
  `;
  const buildings = await queryAsFC(bldgSQL);
  writeFileSync(resolve(ROOT, 'public/data/br-buildings.geojson'), JSON.stringify(buildings));
  console.log(`  buildings: ${buildings.features.length} features`);

  await client.end();
  console.log('Done. Data written to public/data/br-*.geojson');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
