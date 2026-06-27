#!/usr/bin/env node
// Minimal validation for BR high-res data (non-trivial geo integration)
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname || '.', '..');
const files = [
	'public/data/br-hydro.geojson',
	'public/data/br-roads.geojson',
	'public/data/br-buildings.geojson',
	'public/data/br-neighborhoods.geojson',
	'public/data/br-boundary.geojson'
];

let ok = true;
for (const f of files) {
	try {
		const data = JSON.parse(readFileSync(resolve(ROOT, f), 'utf8'));
		const n = data.features ? data.features.length : 0;
		if (n < 1) { console.error('FAIL', f, 'no features'); ok = false; }
		else { console.log('OK', f, n, 'features'); }
	} catch (e) {
		console.error('FAIL', f, e.message);
		ok = false;
	}
}
if (!ok) process.exit(1);
console.log('All BR data validations passed.');
