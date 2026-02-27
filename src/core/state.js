import { themes } from './themes.js';
import { artisticThemes } from './artistic-themes.js';
import { loadCustomThemes } from './custom-themes.js';

let observers = [];

const STORAGE_KEY = 'map-to-poster:settings';

export const defaultState = {
	city: "JAKARTA",
	cityOverride: "",
	country: "INDONESIA",
	countryOverride: "",
	cityFont: "'Playfair Display', serif",
	countryFont: "'Outfit', sans-serif",
	coordsFont: "'Outfit', sans-serif",
	lat: -6.2088,
	lon: 106.8456,
	zoom: 12,
	theme: "minimal",
	width: 1080,
	height: 1080,
	isExporting: false,
	overlayBgType: 'vignette',
	overlaySize: 'medium',
	showLabels: true,
	renderMode: 'tile',
	artisticTheme: 'cyber_noir',
	matEnabled: false,
	matWidth: 40,
	matShowBorder: true,
	matBorderWidth: 1,
	matBorderOpacity: 1,
	showMarker: false,
	markers: [
		{ lat: -6.2088, lon: 106.8456 }
	],
	markerIcon: 'pin',
	markerSize: 1,
	showRoute: false,
	routeStartLat: -6.2088,
	routeStartLon: 106.8456,
	routeEndLat: -6.2150,
	routeEndLon: 106.8550,
	routeGeometry: [],
	routeViaPoints: [],
	overlayX: 0.5,
	overlayY: 0.85,
	showCountry: true,
	showCoords: true,
};

export const state = { ...defaultState };

const SAVED_KEYS = [
	'city',
	'cityOverride',
	'country',
	'countryOverride',
	'cityFont',
	'countryFont',
	'coordsFont',
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
	'artisticTheme',
	'matEnabled',
	'matWidth',
	'matShowBorder',
	'matBorderWidth',
	'matBorderOpacity',
	'showMarker',
	'markers',
	'markerIcon',
	'markerSize',
	'showRoute',
	'routeStartLat',
	'routeStartLon',
	'routeEndLat',
	'routeEndLon',
	'routeViaPoints',
	'overlayX',
	'overlayY',
	'showCountry',
	'showCoords'
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
	return themes[state.theme] || themes.standard || themes.minimal;
}

export function getSelectedArtisticTheme() {
	if (state.artisticTheme && state.artisticTheme.startsWith('custom_')) {
		const custom = loadCustomThemes();
		if (custom[state.artisticTheme]) return custom[state.artisticTheme];
	}
	return artisticThemes[state.artisticTheme] || artisticThemes.cyber_noir;
}
