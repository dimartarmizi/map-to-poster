import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store = {};
const localStorageMock = {
	getItem: vi.fn(key => store[key] || null),
	setItem: vi.fn((key, val) => { store[key] = val; }),
	removeItem: vi.fn(key => { delete store[key]; }),
};
vi.stubGlobal('localStorage', localStorageMock);

const {
	loadCustomThemes,
	saveCustomTheme,
	deleteCustomTheme,
	importCustomThemesFromJSON,
	clearCustomThemes,
} = await import('../src/core/custom-themes.js');

describe('custom-themes', () => {
	beforeEach(() => {
		Object.keys(store).forEach(k => delete store[k]);
		vi.clearAllMocks();
	});

	it('loadCustomThemes returns empty object when nothing stored', () => {
		expect(loadCustomThemes()).toEqual({});
	});

	it('saveCustomTheme stores and retrieves themes', () => {
		saveCustomTheme('test_1', { name: 'Test', bg: '#ff0000', text: '#000000' });
		const themes = loadCustomThemes();
		expect(themes.test_1).toBeDefined();
		expect(themes.test_1.name).toBe('Test');
		expect(themes.test_1.bg).toBe('#ff0000');
	});

	it('saveCustomTheme sanitizes color values', () => {
		saveCustomTheme('bad', { name: 'Bad', bg: 'url(evil)', text: '#000000' });
		const themes = loadCustomThemes();
		expect(themes.bad.bg).toBe('#000000'); // sanitized to fallback
	});

	it('deleteCustomTheme removes a theme', () => {
		saveCustomTheme('del_1', { name: 'Delete Me', bg: '#111111' });
		expect(loadCustomThemes().del_1).toBeDefined();
		deleteCustomTheme('del_1');
		expect(loadCustomThemes().del_1).toBeUndefined();
	});

	it('clearCustomThemes removes all themes', () => {
		saveCustomTheme('a', { name: 'A', bg: '#aaaaaa' });
		saveCustomTheme('b', { name: 'B', bg: '#bbbbbb' });
		clearCustomThemes();
		expect(loadCustomThemes()).toEqual({});
	});

	it('importCustomThemesFromJSON imports valid themes', () => {
		const json = JSON.stringify({
			imported_1: { name: 'Imported', bg: '#123456', text: '#ffffff' }
		});
		const result = importCustomThemesFromJSON(json);
		expect(result.imported).toBe(1);
		expect(result.skipped).toBe(0);
		const themes = loadCustomThemes();
		expect(themes.imported_1.name).toBe('Imported');
	});

	it('importCustomThemesFromJSON skips invalid entries', () => {
		const json = JSON.stringify({
			good: { name: 'Good', bg: '#000000' },
			bad: 'not an object',
			bad2: { noName: true }
		});
		const result = importCustomThemesFromJSON(json);
		expect(result.imported).toBe(1);
		expect(result.skipped).toBe(2);
	});

	it('importCustomThemesFromJSON rejects non-object JSON', () => {
		expect(() => importCustomThemesFromJSON('"string"')).toThrow('Invalid format');
		expect(() => importCustomThemesFromJSON('[1,2,3]')).toThrow('Invalid format');
	});

	it('importCustomThemesFromJSON sanitizes color values', () => {
		const json = JSON.stringify({
			injected: { name: 'Evil', bg: 'expression(alert(1))', text: '#fff000' }
		});
		importCustomThemesFromJSON(json);
		const themes = loadCustomThemes();
		expect(themes.injected.bg).toBe('#000000'); // sanitized
		expect(themes.injected.text).toBe('#fff000'); // valid, kept
	});

	it('saveCustomTheme truncates long names', () => {
		const longName = 'A'.repeat(200);
		saveCustomTheme('long', { name: longName, bg: '#000000' });
		const themes = loadCustomThemes();
		expect(themes.long.name.length).toBeLessThanOrEqual(100);
	});
});
