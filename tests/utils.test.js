import { describe, it, expect } from 'vitest';
import { hexToRgba, findBestInsertIndex, getSqSegDist } from '../src/core/utils.js';

describe('hexToRgba', () => {
	it('converts 6-digit hex to rgba', () => {
		expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
		expect(hexToRgba('#00ff00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
		expect(hexToRgba('#0000ff', 0)).toBe('rgba(0, 0, 255, 0)');
	});

	it('converts 3-digit hex', () => {
		expect(hexToRgba('#f00', 1)).toBe('rgba(255, 0, 0, 1)');
		expect(hexToRgba('#abc', 1)).toBe('rgba(170, 187, 204, 1)');
	});

	it('handles rgb/rgba input strings', () => {
		expect(hexToRgba('rgb(10, 20, 30)', 0.8)).toBe('rgba(10, 20, 30, 0.8)');
	});

	it('returns white fallback for invalid input', () => {
		expect(hexToRgba(null, 1)).toBe('rgba(255, 255, 255, 1)');
		expect(hexToRgba('', 1)).toBe('rgba(255, 255, 255, 1)');
		expect(hexToRgba('notacolor', 1)).toBe('rgba(255, 255, 255, 1)');
		expect(hexToRgba(undefined, 0.5)).toBe('rgba(255, 255, 255, 0.5)');
	});

	it('defaults alpha to 1', () => {
		expect(hexToRgba('#000000')).toBe('rgba(0, 0, 0, 1)');
	});
});

describe('getSqSegDist', () => {
	it('returns 0 when point is on the segment', () => {
		expect(getSqSegDist(0.5, 0.5, 0, 0, 1, 1)).toBeCloseTo(0, 10);
	});

	it('returns squared distance to nearest point on segment', () => {
		// Point (0, 1) to segment (0,0)-(1,0) should be distance 1, squared = 1
		expect(getSqSegDist(0, 1, 0, 0, 1, 0)).toBeCloseTo(1);
	});

	it('returns distance to endpoint when projection is outside segment', () => {
		// Point (2, 0) to segment (0,0)-(1,0) - closest is (1,0), dist = 1
		expect(getSqSegDist(2, 0, 0, 0, 1, 0)).toBeCloseTo(1);
	});
});

describe('findBestInsertIndex', () => {
	it('returns 0 for less than 2 route points', () => {
		expect(findBestInsertIndex(0, 0, [{ lat: 1, lon: 1 }])).toBe(0);
	});

	it('finds correct segment for insertion', () => {
		const points = [
			{ lat: 0, lon: 0 },
			{ lat: 1, lon: 0 },
			{ lat: 2, lon: 0 },
		];
		// Point near second segment
		expect(findBestInsertIndex(1.5, 0.1, points)).toBe(1);
		// Point near first segment
		expect(findBestInsertIndex(0.5, 0.1, points)).toBe(0);
	});
});
