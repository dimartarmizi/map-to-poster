import L from 'leaflet';
import maplibregl from 'maplibre-gl';
import { state, updateState } from '../core/state.js';
import { markerIcons } from '../core/marker-icons.js';
import { findBestInsertIndex } from '../core/utils.js';
import { updateRouteGeometry, syncRouteMarkers } from './route-manager.js';
import { generateMapLibreStyle } from './artistic-style.js';
import { clearMarkers } from './marker-manager.js';

let map = null;
let tileLayer = null;
let artisticMap = null;
let currentArtisticThemeName = null;
let isSyncing = false;
let styleChangeInProgress = false;
let pendingArtisticStyle = null;
let pendingArtisticThemeName = null;

export const getMap = () => map;
export const getArtisticMap = () => artisticMap;

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

	try {
		initArtisticMap('artistic-map', [initialCenter[1], initialCenter[0]], initialZoom - 1);
	} catch (err) {
		console.error('Failed to initialize artistic map (MapLibre GL):', err);
	}

	if (state.showRoute) {
		updateRouteGeometry();
	}

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

	artisticMap.on('style.load', () => {
		if (pendingArtisticStyle) {
			const next = pendingArtisticStyle;
			const nextName = pendingArtisticThemeName;
			pendingArtisticStyle = null;
			pendingArtisticThemeName = null;
			currentArtisticThemeName = nextName;
			artisticMap.setStyle(next);
		} else {
			styleChangeInProgress = false;
		}
	});

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

	artisticMap.on('mousedown', 'route-line', (e) => {
		e.preventDefault();
		const startPos = e.point;
		let pointAdded = false;
		let index = -1;

		isSyncing = true;
		artisticMap.dragPan.disable();

		const onMouseMove = (me) => {
			const currentPos = me.point;
			const dist = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));

			if (!pointAdded && dist > 5) {
				const via = [...(state.routeViaPoints || [])];
				const routePoints = [
					{ lat: state.routeStartLat, lon: state.routeStartLon },
					...via,
					{ lat: state.routeEndLat, lon: state.routeEndLon }
				];
				index = findBestInsertIndex(me.lngLat.lat, me.lngLat.lng, routePoints);
				via.splice(index, 0, { lat: me.lngLat.lat, lon: me.lngLat.lng });
				updateState({ routeViaPoints: via });
				pointAdded = true;
			}

			if (pointAdded && index !== -1) {
				const v = [...state.routeViaPoints];
				v[index] = { lat: me.lngLat.lat, lon: me.lngLat.lng };
				updateState({ routeViaPoints: v });
				syncRouteMarkers(false);
			}
		};

		const onMouseUp = () => {
			artisticMap.off('mousemove', onMouseMove);
			artisticMap.off('mouseup', onMouseUp);
			artisticMap.dragPan.enable();
			isSyncing = false;
			if (pointAdded) {
				updateRouteGeometry();
			}
		};

		artisticMap.on('mousemove', onMouseMove);
		artisticMap.on('mouseup', onMouseUp);
	});

	artisticMap.on('mouseenter', 'route-line', () => {
		artisticMap.getCanvas().style.cursor = 'crosshair';
	});

	artisticMap.on('mouseleave', 'route-line', () => {
		artisticMap.getCanvas().style.cursor = '';
	});
}

export function updateArtisticStyle(theme) {
	if (!artisticMap) return;
	if (currentArtisticThemeName === theme.name) return;

	currentArtisticThemeName = theme.name;
	const style = generateMapLibreStyle(theme);

	if (styleChangeInProgress) {
		pendingArtisticStyle = style;
		pendingArtisticThemeName = theme.name;
		try { artisticMap.setStyle(style); } catch (e) { }
		return;
	}

	styleChangeInProgress = true;
	try {
		artisticMap.setStyle(style);
	} catch (e) {
		pendingArtisticStyle = style;
		pendingArtisticThemeName = theme.name;
	}
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

export function waitForTilesLoad(timeout = 30000) {
	return new Promise((resolve) => {
		if (!map || !tileLayer) return resolve();
		try {
			if (tileLayer._tiles) {
				const tiles = Object.values(tileLayer._tiles || {});
				const anyLoading = tiles.some(t => {
					const el = t.el || t.tile || (t._el);
					return el && el.complete === false;
				});
				if (!anyLoading) return resolve();
			}
		} catch (e) { }

		let resolved = false;
		const onLoad = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve(); } };
		tileLayer.once('load', onLoad);
		const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, timeout);
	});
}

export function waitForArtisticIdle(timeout = 30000) {
	return new Promise((resolve) => {
		if (!artisticMap) return resolve();
		let resolved = false;
		const onIdle = () => { if (!resolved) { resolved = true; clearTimeout(timer); resolve(); } };
		try { artisticMap.once('idle', onIdle); } catch (e) { resolve(); return; }
		const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(); } }, timeout);
	});
}

export function getMapInstance() { return map; }
export function getArtisticMapInstance() { return artisticMap; }

export function invalidateMapSize() {
	if (map) map.invalidateSize({ animate: false });
	if (artisticMap) artisticMap.resize();
}

export { updateRouteStyles, syncRouteMarkers, updateRouteGeometry } from './route-manager.js';
export { updateMarkerStyles, updateMarkerIcon, updateMarkerSize, updateMarkerVisibility, updateMarkerPosition } from './marker-manager.js';

