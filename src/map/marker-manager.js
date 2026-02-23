import L from 'leaflet';
import maplibregl from 'maplibre-gl';
import { state, updateState, getSelectedTheme, getSelectedArtisticTheme } from '../core/state.js';
import { markerIcons } from '../core/marker-icons.js';
import { getMap, getArtisticMap } from './map-init.js';

let markers = [];
let artisticMarkers = [];

export function getMarkers() { return markers; }
export function getArtisticMarkers() { return artisticMarkers; }

export function clearMarkers() {
	markers.forEach(m => m.remove());
	artisticMarkers.forEach(m => m.remove());
	markers = [];
	artisticMarkers = [];
}

function getIconAnchor(iconName, size) {
	if (iconName === 'pin') return [size / 2, size];
	return [size / 2, size / 2];
}

export function updateMarkerStyles(currentState) {
	const map = getMap();
	const artisticMap = getArtisticMap();
	if (!map) return;

	markers.forEach(m => m.remove());
	artisticMarkers.forEach(m => m.remove());
	markers = [];
	artisticMarkers = [];

	if (!currentState.showMarker) return;

	const iconType = currentState.markerIcon || 'pin';
	const baseSize = 40;
	const size = Math.round(baseSize * (currentState.markerSize || 1));

	const isArtistic = currentState.renderMode === 'artistic';
	const theme = isArtistic ? getSelectedArtisticTheme() : getSelectedTheme();
	const color = theme.route || (isArtistic ? (theme.text || '#0f172a') : (theme.textColor || '#0f172a'));

	const html = (markerIcons[iconType] || markerIcons.pin)
		.replace('class="marker-pin"', `style="width: ${size}px; height: ${size}px; color: ${color};"`);

	const anchorX = size / 2;
	const anchorY = iconType === 'pin' ? size : size / 2;

	(currentState.markers || []).forEach((markerData, index) => {
		const icon = L.divIcon({
			className: 'custom-marker',
			html: html,
			iconSize: [size, size],
			iconAnchor: [anchorX, anchorY]
		});

		const lMarker = L.marker([markerData.lat, markerData.lon], {
			icon: icon,
			draggable: true
		}).addTo(map);

		lMarker.on('dragend', () => {
			const pos = lMarker.getLatLng();
			const newMarkers = [...currentState.markers];
			newMarkers[index] = { lat: pos.lat, lon: pos.lng };
			updateState({ markers: newMarkers });
		});

		lMarker.on('dblclick', (e) => {
			L.DomEvent.stopPropagation(e);
			const newMarkers = currentState.markers.filter((_, i) => i !== index);
			updateState({ markers: newMarkers });
		});

		markers.push(lMarker);

		if (artisticMap) {
			const el = document.createElement('div');
			el.className = 'custom-marker';
			el.innerHTML = html;
			el.style.width = `${size}px`;
			el.style.height = `${size}px`;

			el.addEventListener('dblclick', (e) => {
				e.stopPropagation();
				const newMarkers = currentState.markers.filter((_, i) => i !== index);
				updateState({ markers: newMarkers });
			});

			const aMarker = new maplibregl.Marker({
				element: el,
				draggable: true,
				anchor: iconType === 'pin' ? 'bottom' : 'center'
			})
				.setLngLat([markerData.lon, markerData.lat])
				.addTo(artisticMap);

			aMarker.on('dragend', () => {
				const pos = aMarker.getLngLat();
				const newMarkers = [...currentState.markers];
				newMarkers[index] = { lat: pos.lat, lon: pos.lng };
				updateState({ markers: newMarkers });
			});

			artisticMarkers.push(aMarker);
		}
	});
}

export function updateMarkerIcon(iconName, size) {
	updateMarkerStyles(state);
}

export function updateMarkerSize(size, iconName) {
	updateMarkerStyles(state);
}

export function updateMarkerVisibility(show) {
	updateMarkerStyles(state);
}

export function updateMarkerPosition(lat, lon) {
	const newMarkers = [...state.markers];
	if (newMarkers.length > 0) {
		newMarkers[0] = { lat, lon };
		updateState({ markers: newMarkers });
	} else {
		updateState({ markers: [{ lat, lon }] });
	}
}
