const STORAGE_KEY = 'map-to-poster:custom-themes';

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
const COLOR_KEYS = ['bg', 'text', 'water', 'parks', 'road_motorway', 'road_primary', 'road_secondary', 'road_tertiary', 'road_residential', 'road_default', 'route'];

function sanitizeTheme(theme) {
	const clean = { ...theme };
	if (typeof clean.name === 'string') {
		clean.name = clean.name.slice(0, 100);
	}
	for (const key of COLOR_KEYS) {
		if (key in clean && !HEX_COLOR_RE.test(clean[key])) {
			clean[key] = '#000000';
		}
	}
	return clean;
}

export function loadCustomThemes() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch { return {}; }
}

export function saveCustomTheme(key, theme) {
	const all = loadCustomThemes();
	all[key] = sanitizeTheme(theme);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteCustomTheme(key) {
	const all = loadCustomThemes();
	delete all[key];
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function newCustomThemeKey() {
	return 'custom_' + Date.now();
}

export function exportCustomThemes() {
	const all = loadCustomThemes();
	const json = JSON.stringify(all, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'map-to-poster-custom-themes.json';
	a.click();
	URL.revokeObjectURL(url);
}

export function clearCustomThemes() {
	localStorage.removeItem(STORAGE_KEY);
}

export function importCustomThemesFromJSON(jsonString) {
	const parsed = JSON.parse(jsonString);
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error('Invalid format');
	}
	const all = loadCustomThemes();
	let imported = 0;
	let skipped = 0;
	for (const [key, theme] of Object.entries(parsed)) {
		if (typeof theme === 'object' && theme !== null && theme.name) {
			const finalKey = all[key] ? 'custom_' + Date.now() + '_' + imported : key;
			all[finalKey] = sanitizeTheme(theme);
			imported++;
		} else {
			skipped++;
		}
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
	return { imported, skipped };
}
