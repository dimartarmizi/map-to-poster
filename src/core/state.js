import { themes } from './themes.js';
import { artisticThemes } from './artistic-themes.js';

let observers = [];

const STORAGE_KEY = 'map-to-poster:settings';

export const state = {
	city: "JAKARTA",
	cityOverride: "",
	lat: -6.2088,
	lon: 106.8456,
	zoom: 12,
	theme: "minimal",
	width: 2480,
	height: 3508,
	isExporting: false,
	overlayBgType: 'solid',
	overlaySize: 'medium',
	showLabels: true,
	renderMode: 'tile',
	artisticTheme: 'arctic_frost',
};

const SAVED_KEYS = [
	'city',
	'cityOverride',
	'lat',
	'lon',
	'zoom',
	'theme',
	'width',
	'height',
	'overlayBgType',
	'overlaySize',
	'showLabels',
	'renderMode',
	'artisticTheme'
];

function loadSettings() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return;
		const toApply = {};
		for (const k of SAVED_KEYS) {
			if (k in parsed) toApply[k] = parsed[k];
		}
		Object.assign(state, toApply);
	} catch (e) {
	}
}

function saveSettings() {
	try {
		const out = {};
		for (const k of SAVED_KEYS) {
			out[k] = state[k];
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
	} catch (e) {
	}
}

loadSettings();

export function updateState(partialState) {
	Object.assign(state, partialState);
	saveSettings();
	notifyObservers();
}

export function subscribe(callback) {
	observers.push(callback);
	callback(state);
}

function notifyObservers() {
	observers.forEach(callback => callback(state));
}

export function getSelectedTheme() {
	return themes[state.theme] || themes.minimal;
}

export function getSelectedArtisticTheme() {
	return artisticThemes[state.artisticTheme] || artisticThemes.arctic_frost;
}
