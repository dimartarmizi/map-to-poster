import { describe, it, expect } from 'vitest';
import { formatCoords } from '../src/map/geocoder.js';

describe('formatCoords', () => {
	it('formats positive coordinates with N/E', () => {
		expect(formatCoords(40.7128, 74.006)).toBe('40.7128\u00B0 N, 74.0060\u00B0 E');
	});

	it('formats negative coordinates with S/W', () => {
		expect(formatCoords(-23.5505, -46.6333)).toBe('23.5505\u00B0 S, 46.6333\u00B0 W');
	});

	it('formats zero as N/E', () => {
		expect(formatCoords(0, 0)).toBe('0.0000\u00B0 N, 0.0000\u00B0 E');
	});
});
