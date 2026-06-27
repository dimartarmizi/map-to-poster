import { themes } from './themes.js';
import { artisticThemes } from './artistic-themes.js';
import { loadCustomThemes } from './custom-themes.js';

let observers = [];

const STORAGE_KEY = 'map-to-poster:settings';

export const defaultState = {
	city: "BATON ROUGE",
	cityOverride: "",
	country: "LOUISIANA",
	countryOverride: "",
	cityFont: "'Playfair Display', serif",
	countryFont: "'Outfit', sans-serif",
	coordsFont: "'Outfit', sans-serif",
	lat: 30.4405,
	lon: -91.126,
	zoom: 11,
	theme: "minimal",
	width: 7200,
	height: 5400,
	isExporting: false,
	overlayBgType: 'vignette',
	overlaySize: 'medium',
	showLabels: true,
	renderMode: 'artistic',
	artisticTheme: 'blueprint_classic',
	matEnabled: true,
	matWidth: 80,
	matShowBorder: true,
	matBorderWidth: 2,
	matBorderOpacity: 0.9,
	showMarker: false,
	markers: [
		{ lat: 30.4405, lon: -91.126 }
	],
	markerIcon: 'pin',
	markerSize: 1,
	showRoute: false,
	routeStartLat: 30.4405,
	routeStartLon: -91.126,
	routeEndLat: 30.45,
	routeEndLon: -91.18,
	routeGeometry: [],
	routeViaPoints: [],
	overlayX: 0.5,
	overlayY: 0.88,
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
