#!/usr/bin/env node
/**
 * Highest-resolution Baton Rouge poster generator.
 * Uses local vector data fetched from Neon + styling from the MapToPoster codebase.
 * Produces an ultra-crisp PNG (no tile artifacts) suitable for large-format print.
 *
 * Usage: npm run generate-br-poster
 * Output: posters/Baton-Rouge-Poster-<w>x<h>.png
 */
import { createCanvas } from 'canvas';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Inline minimal poster text scale logic from repo export.js (pure math, no DOM)
function getPosterTextScale(width, height) {
	const TEXT_SCALE_REFERENCE = 1080;
	const shortest = Math.max(1, Math.min(width || TEXT_SCALE_REFERENCE, height || TEXT_SCALE_REFERENCE));
	return shortest / TEXT_SCALE_REFERENCE;
}
function getOverlayTextConfigWH(width, height, size = 'large') {
	const OVERLAY_SIZE_MULTIPLIER = { small: 0.75, medium: 1, large: 1.35 };
	const posterScale = getPosterTextScale(width, height);
	const mul = OVERLAY_SIZE_MULTIPLIER[size] || 1;
	const s = posterScale * mul;
	const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
	return {
		city: clamp(64 * s, 48, 520),
		country: clamp(20 * s, 18, 160),
		coords: clamp(16 * s, 14, 110)
	};
}

// Colors inspired by blueprint_classic + river_heritage (from artistic-themes)
const THEME = {
	name: 'River Heritage (BR Ultra)',
	bg: '#0F172A',
	text: '#E0F2FE',
	water: '#0C3D6B',
	waterLine: '#020617',
	parks: '#052E16',
	roadMotorway: '#BAE6FD',
	roadPrimary: '#7DD3FC',
	roadSecondary: '#64748B',
	roadDefault: '#475569',
	building: '#020617',
	overlayBg: 'rgba(15,23,42,0.55)'
};

// Data bbox we fetched (matches fetch script)
const DATA_BBOX = { minLon: -91.30, minLat: 30.28, maxLon: -90.92, maxLat: 30.62 };

// Choose highest practical res (vector, no limit). 16384x10922 ~ 179Mpx landscape honoring river aspect.
const OUTPUT_WIDTH = 16384;
const OUTPUT_HEIGHT = 10922;

function loadGeo(path) {
	try {
		const raw = readFileSync(resolve(ROOT, path), 'utf8');
		return JSON.parse(raw);
	} catch (e) {
		console.warn('Missing data (run npm run fetch-br-data):', path);
		return { type: 'FeatureCollection', features: [] };
	}
}

function projectLonLatToCanvas(lon, lat, sx, sy, padX, padY) {
	const x = padX + (lon - DATA_BBOX.minLon) * sx;
	const y = padY + (DATA_BBOX.maxLat - lat) * sy; // flip y
	return [x, y];
}

function drawPath(ctx, coords, sx, sy, padX, padY, isRing = false) {
	if (!coords || !coords.length) return;
	ctx.beginPath();
	const [x0, y0] = projectLonLatToCanvas(coords[0][0], coords[0][1], sx, sy, padX, padY);
	ctx.moveTo(x0, y0);
	for (let i = 1; i < coords.length; i++) {
		const [x, y] = projectLonLatToCanvas(coords[i][0], coords[i][1], sx, sy, padX, padY);
		ctx.lineTo(x, y);
	}
	if (isRing) ctx.closePath();
}

function drawMultiPolygon(ctx, multi, sx, sy, padX, padY, fill, stroke = null, lineW = 1) {
	for (const poly of multi) {
		for (let r = 0; r < poly.length; r++) {
			drawPath(ctx, poly[r], sx, sy, padX, padY, true);
			if (r === 0 && fill) {
				ctx.fillStyle = fill;
				ctx.fill();
			}
		}
		if (stroke) {
			ctx.strokeStyle = stroke;
			ctx.lineWidth = lineW;
			ctx.stroke();
		}
	}
}

function drawLineString(ctx, line, sx, sy, padX, padY, stroke, lineW = 1.5) {
	drawPath(ctx, line, sx, sy, padX, padY, false);
	ctx.strokeStyle = stroke;
	ctx.lineWidth = lineW;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.stroke();
}

function main() {
	console.log('Generating highest-resolution Baton Rouge poster...');
	console.log(`  Resolution: ${OUTPUT_WIDTH}×${OUTPUT_HEIGHT}`);

	const hydro = loadGeo('public/data/br-hydro.geojson');
	const roads = loadGeo('public/data/br-roads.geojson');
	const bldgs = loadGeo('public/data/br-buildings.geojson');
	const hoods = loadGeo('public/data/br-neighborhoods.geojson');

	const pad = Math.round(OUTPUT_WIDTH * 0.018);
	const sx = (OUTPUT_WIDTH - pad * 2) / (DATA_BBOX.maxLon - DATA_BBOX.minLon);
	const sy = (OUTPUT_HEIGHT - pad * 2) / (DATA_BBOX.maxLat - DATA_BBOX.minLat);

	const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
	const ctx = canvas.getContext('2d', { alpha: false });

	// Background
	ctx.fillStyle = THEME.bg;
	ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

	// Subtle vignette edges (re-uses concept from app)
	const grad = ctx.createRadialGradient(
		OUTPUT_WIDTH * 0.5, OUTPUT_HEIGHT * 0.5, Math.min(OUTPUT_WIDTH, OUTPUT_HEIGHT) * 0.35,
		OUTPUT_WIDTH * 0.5, OUTPUT_HEIGHT * 0.5, Math.max(OUTPUT_WIDTH, OUTPUT_HEIGHT) * 0.72
	);
	grad.addColorStop(0, 'rgba(0,0,0,0)');
	grad.addColorStop(1, 'rgba(0,0,0,0.45)');
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

	// 1. Water (hydro) - Mississippi is the star
	ctx.lineWidth = 1.0;
	for (const f of hydro.features) {
		const g = f.geometry;
		const props = f.properties || {};
		const isRiver = (props.name || '').toLowerCase().includes('mississippi') || props.ftype === 'StreamRiver';
		if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
			const fill = isRiver ? THEME.water : '#0A3559';
			if (g.type === 'Polygon') drawMultiPolygon(ctx, [g.coordinates], sx, sy, pad, pad, fill, THEME.waterLine, 0.8);
			else drawMultiPolygon(ctx, g.coordinates, sx, sy, pad, pad, fill, THEME.waterLine, 0.8);
		}
	}

	// 2. Neighborhoods (subtle structure)
	ctx.lineWidth = 1.2;
	ctx.strokeStyle = 'rgba(224,242,254,0.12)';
	for (const f of hoods.features) {
		const g = f.geometry;
		if (!g) continue;
		if (g.type === 'Polygon') drawMultiPolygon(ctx, [g.coordinates], sx, sy, pad, pad, null, 'rgba(224,242,254,0.10)', 1.0);
		else if (g.type === 'MultiPolygon') drawMultiPolygon(ctx, g.coordinates, sx, sy, pad, pad, null, 'rgba(224,242,254,0.10)', 1.0);
	}

	// 3. Buildings - crisp architectural massing at this res
	for (const f of bldgs.features) {
		const g = f.geometry;
		if (!g) continue;
		const area = (f.properties && f.properties.area) || 0;
		const op = area > 8000 ? 0.85 : 0.45;
		ctx.fillStyle = THEME.building;
		ctx.globalAlpha = op;
		if (g.type === 'Polygon') drawMultiPolygon(ctx, [g.coordinates], sx, sy, pad, pad, THEME.building);
		else if (g.type === 'MultiPolygon') drawMultiPolygon(ctx, g.coordinates, sx, sy, pad, pad, THEME.building);
	}
	ctx.globalAlpha = 1;

	// 4. Roads - hierarchy, scaled for print
	// default
	for (const f of roads.features) {
		const g = f.geometry;
		if (!g || g.type !== 'LineString') continue;
		const cls = (f.properties && f.properties.class) || '';
		let w = 1.6;
		let c = THEME.roadDefault;
		if (cls === 'INTERSTATE') { w = 5.5; c = THEME.roadMotorway; }
		else if (cls.includes('ARTERIAL')) { w = 3.8; c = THEME.roadPrimary; }
		else if (cls.includes('COLLECTOR')) { w = 2.4; c = THEME.roadSecondary; }
		drawLineString(ctx, g.coordinates, sx, sy, pad, pad, c, w);
	}

	// 5. Overlay text area (matte plate) + typography using repo layout math
	const elements = {
		overlay: { style: {} },
		city: { style: {} },
		country: { style: {} },
		coords: { style: {} },
		divider: { style: {} }
	};

	// Compute sizes using the same math as the app
	const sz = getOverlayTextConfigWH(OUTPUT_WIDTH, OUTPUT_HEIGHT, 'large');

	// Draw overlay plate (bottom area)
	const overlayH = Math.round(OUTPUT_HEIGHT * 0.22);
	const overlayY = OUTPUT_HEIGHT - overlayH - Math.round(OUTPUT_HEIGHT * 0.04);
	ctx.fillStyle = THEME.overlayBg;
	ctx.fillRect(0, overlayY, OUTPUT_WIDTH, overlayH + 60);

	// City name
	ctx.fillStyle = THEME.text;
	ctx.font = `700 ${Math.round(sz.city)}px/1.05 "Playfair Display", "Georgia", serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';
	const cityY = overlayY + Math.round(overlayH * 0.38);
	ctx.fillText('BATON ROUGE', OUTPUT_WIDTH / 2, cityY);

	// Divider
	ctx.strokeStyle = THEME.text;
	ctx.lineWidth = Math.max(4, Math.round(sz.city * 0.035));
	const divY = cityY + Math.round(overlayH * 0.12);
	const divW = Math.min(OUTPUT_WIDTH * 0.22, 4200);
	ctx.beginPath();
	ctx.moveTo(OUTPUT_WIDTH / 2 - divW / 2, divY);
	ctx.lineTo(OUTPUT_WIDTH / 2 + divW / 2, divY);
	ctx.stroke();

	// Country
	ctx.font = `600 ${Math.round(sz.country)}px/1.1 "Outfit", "Helvetica Neue", sans-serif`;
	ctx.fillText('LOUISIANA', OUTPUT_WIDTH / 2, divY + Math.round(overlayH * 0.18));

	// Coords
	const lat = 30.4405, lon = -91.126;
	ctx.font = `500 ${Math.round(sz.coords)}px/1.2 "Outfit", monospace`;
	ctx.fillStyle = 'rgba(224,242,254,0.75)';
	ctx.fillText(`${lat.toFixed(4)}° N  /  ${Math.abs(lon).toFixed(4)}° W`, OUTPUT_WIDTH / 2, divY + Math.round(overlayH * 0.32));

	// Subtle attribution (bottom right)
	ctx.font = '600 32px/1 "Inter", sans-serif';
	ctx.fillStyle = 'rgba(224,242,254,0.25)';
	ctx.textAlign = 'right';
	ctx.fillText('Highest-resolution vector render • EBR GIS + OpenStreetMap', OUTPUT_WIDTH - pad, OUTPUT_HEIGHT - 48);

	// Write file
	mkdirSync(resolve(ROOT, 'posters'), { recursive: true });
	const outPath = resolve(ROOT, `posters/Baton-Rouge-Highest-Res-${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}.png`);
	const buffer = canvas.toBuffer('image/png');
	writeFileSync(outPath, buffer);

	console.log('Wrote:', outPath);
	console.log('Size on disk:', (buffer.length / 1024 / 1024).toFixed(1), 'MB');
	console.log('Done. This is a true vector-derived poster at maximum practical resolution.');
}

main();
