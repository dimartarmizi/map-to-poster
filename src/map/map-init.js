import L from 'leaflet';
import maplibregl from 'maplibre-gl';
import { updateState } from '../core/state.js';

let map = null;
let tileLayer = null;
let artisticMap = null;
let currentArtisticThemeName = null;
let isSyncing = false;

export function initMap(containerId, initialCenter, initialZoom, initialTileUrl) {
	map = L.map(containerId, {
		zoomControl: false,
		attributionControl: false,
		scrollWheelZoom: 'center',
		touchZoom: 'center'
	}).setView(initialCenter, initialZoom);

	tileLayer = L.tileLayer(initialTileUrl, {
		maxZoom: 19,
		crossOrigin: true,
	}).addTo(map);

	map.on('moveend', () => {
		if (isSyncing) return;
		isSyncing = true;

		const center = map.getCenter();
		const zoom = map.getZoom();
		updateState({
			lat: center.lat,
			lon: center.lng,
			zoom: zoom
		});

		if (artisticMap) {
			artisticMap.jumpTo({
				center: [center.lng, center.lat],
				zoom: zoom - 1
			});
		}

		isSyncing = false;
	});

	initArtisticMap('artistic-map', [initialCenter[1], initialCenter[0]], initialZoom - 1);

	return map;
}

function initArtisticMap(containerId, center, zoom) {
	artisticMap = new maplibregl.Map({
		container: containerId,
		style: { version: 8, sources: {}, layers: [] },
		center: center,
		zoom: zoom,
		interactive: true,
		attributionControl: false,
		preserveDrawingBuffer: true
	});

	artisticMap.scrollZoom.setWheelZoomRate(1);
	artisticMap.scrollZoom.setZoomRate(1 / 600);

	artisticMap.on('moveend', () => {
		if (isSyncing) return;
		isSyncing = true;

		const center = artisticMap.getCenter();
		const zoom = artisticMap.getZoom();

		updateState({
			lat: center.lat,
			lon: center.lng,
			zoom: zoom + 1
		});

		if (map) {
			map.setView([center.lat, center.lng], zoom + 1, { animate: false });
		}

		isSyncing = false;
	});
}

export function updateArtisticStyle(theme) {
	if (!artisticMap) return;
	if (currentArtisticThemeName === theme.name) return;

	currentArtisticThemeName = theme.name;
	const style = generateMapLibreStyle(theme);
	artisticMap.setStyle(style);
}

function generateMapLibreStyle(theme) {
	return {
		version: 8,
		names: theme.name,
		sources: {
			openfreemap: {
				type: 'vector',
				url: 'https://tiles.openfreemap.org/planet'
			}
		},
		layers: [
			{
				id: 'background',
				type: 'background',
				paint: { 'background-color': theme.bg }
			},
			{
				id: 'water',
				source: 'openfreemap',
				'source-layer': 'water',
				type: 'fill',
				paint: { 'fill-color': theme.water }
			},
			{
				id: 'park',
				source: 'openfreemap',
				'source-layer': 'park',
				type: 'fill',
				paint: { 'fill-color': theme.parks }
			},
			{
				id: 'road-default',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['!', ['match', ['get', 'class'], ['motorway', 'primary', 'secondary', 'tertiary', 'residential'], true, false]],
				paint: { 'line-color': theme.road_default, 'line-width': 0.5 }
			},
			{
				id: 'road-residential',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'residential'],
				paint: { 'line-color': theme.road_residential, 'line-width': 0.5 }
			},
			{
				id: 'road-tertiary',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'tertiary'],
				paint: { 'line-color': theme.road_tertiary, 'line-width': 0.8 }
			},
			{
				id: 'road-secondary',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'secondary'],
				paint: { 'line-color': theme.road_secondary, 'line-width': 1.0 }
			},
			{
				id: 'road-primary',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'primary'],
				paint: { 'line-color': theme.road_primary, 'line-width': 1.5 }
			},
			{
				id: 'road-motorway',
				source: 'openfreemap',
				'source-layer': 'transportation',
				type: 'line',
				filter: ['==', ['get', 'class'], 'motorway'],
				paint: { 'line-color': theme.road_motorway, 'line-width': 2.0 }
			}
		]
	};
}

export function updateMapPosition(lat, lon, zoom, options = { animate: true }) {
	if (map) {
		if (lat !== undefined && lon !== undefined) {
			map.setView([lat, lon], zoom || map.getZoom(), options);
		} else if (zoom !== undefined) {
			map.setZoom(zoom, options);
		}
	}
}

export function updateMapTheme(tileUrl) {
	if (tileLayer) {
		tileLayer.setUrl(tileUrl);
	}
}

export function waitForTilesLoad(timeout = 5000) {
	return new Promise((resolve) => {
		if (!map || !tileLayer) return resolve();

		let resolved = false;
		const onLoad = () => {
			if (resolved) return;
			resolved = true;
			clearTimeout(timer);
			resolve();
		};

		tileLayer.once('load', onLoad);

		const timer = setTimeout(() => {
			if (resolved) return;
			resolved = true;
			resolve();
		}, timeout);
	});
}

export function getMapInstance() {
	return map;
}

export function getArtisticMapInstance() {
	return artisticMap;
}

export function invalidateMapSize() {
	if (map) {
		map.invalidateSize({ animate: false });
	}
	if (artisticMap) {
		artisticMap.resize();
	}
}
