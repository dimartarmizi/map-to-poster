import { state, updateState } from '../core/state.js';
import { updateMarkerStyles, updateRouteStyles, updateRouteGeometry } from '../map/map-init.js';

export function setupMarkerRouteControls() {
	const markerToggle = document.getElementById('show-marker-toggle');
	const routeToggle = document.getElementById('show-route-toggle');
	const markerSettings = document.getElementById('marker-settings');
	const markerIconSelect = document.getElementById('marker-icon-select');
	const markerSizeSlider = document.getElementById('marker-size-slider');
	const markerSizeValue = document.getElementById('marker-size-value');

	if (markerIconSelect) {
		markerIconSelect.addEventListener('change', (e) => {
			updateState({ markerIcon: e.target.value });
			updateMarkerStyles(state);
		});
	}

	if (markerSizeSlider) {
		markerSizeSlider.addEventListener('input', (e) => {
			const size = parseInt(e.target.value);
			updateState({ markerSize: size / 40.0 });
			updateMarkerStyles(state);
			if (markerSizeValue) markerSizeValue.textContent = `${size}px`;
		});
	}

	if (markerToggle) {
		markerToggle.addEventListener('change', (e) => {
			const show = e.target.checked;
			if (show && (!state.markers || state.markers.length === 0)) {
				updateState({ markers: [{ lat: state.lat, lon: state.lon }] });
			}
			updateState({ showMarker: show });
			updateMarkerStyles(state);
			const settings = document.getElementById('marker-settings');
			if (settings) settings.classList.toggle('hidden', !show);
		});
	}

	const addMarkerBtn = document.getElementById('add-marker-btn');
	if (addMarkerBtn) {
		addMarkerBtn.addEventListener('click', () => {
			const newMarkers = [...(state.markers || [])];
			newMarkers.push({ lat: state.lat, lon: state.lon });
			updateState({ markers: newMarkers });
			updateMarkerStyles(state);
		});
	}

	const removeMarkerBtn = document.getElementById('remove-marker-btn');
	if (removeMarkerBtn) {
		removeMarkerBtn.addEventListener('click', () => {
			const newMarkers = [...(state.markers || [])];
			if (newMarkers.length > 0) {
				newMarkers.pop();
				updateState({ markers: newMarkers });
				updateMarkerStyles(state);
			}
		});
	}

	const clearMarkersBtn = document.getElementById('clear-markers-btn');
	if (clearMarkersBtn) {
		clearMarkersBtn.addEventListener('click', () => {
			updateState({ markers: [], showMarker: false });
			if (markerToggle) markerToggle.checked = false;
			updateMarkerStyles(state);
			const settings = document.getElementById('marker-settings');
			if (settings) settings.classList.add('hidden');
		});
	}

	if (routeToggle) {
		routeToggle.addEventListener('change', async (e) => {
			const show = e.target.checked;
			if (show) {
				updateState({
					routeStartLat: state.lat, routeStartLon: state.lon,
					routeEndLat: state.lat - 0.005, routeEndLon: state.lon + 0.005,
					routeViaPoints: []
				});
				await updateRouteGeometry();
			}
			updateState({ showRoute: show });
			const settings = document.getElementById('route-settings');
			if (settings) settings.classList.toggle('hidden', !show);
			updateRouteStyles(state);
		});
	}

	const resetRouteBtn = document.getElementById('reset-route-btn');
	if (resetRouteBtn) {
		resetRouteBtn.addEventListener('click', async () => {
			updateState({ routeViaPoints: [] });
			await updateRouteGeometry();
			updateRouteStyles(state);
		});
	}

	return {
		syncMarkerRouteUI(currentState) {
			if (markerToggle) {
				markerToggle.checked = !!currentState.showMarker;
				const settings = document.getElementById('marker-settings');
				if (settings) settings.classList.toggle('hidden', !currentState.showMarker);
			}

			const markerCountDisplay = document.getElementById('marker-count');
			if (markerCountDisplay) {
				markerCountDisplay.textContent = (currentState.markers || []).length;
			}

			if (markerIconSelect) markerIconSelect.value = currentState.markerIcon || 'pin';
			if (markerSizeSlider) {
				const size = Math.round((currentState.markerSize || 1) * 40);
				markerSizeSlider.value = size;
				if (markerSizeValue) markerSizeValue.textContent = `${size}px`;
			}

			if (routeToggle) {
				routeToggle.checked = !!currentState.showRoute;
				const settings = document.getElementById('route-settings');
				if (settings) settings.classList.toggle('hidden', !currentState.showRoute);
			}

			const routeCountDisplay = document.getElementById('route-count');
			if (routeCountDisplay) {
				const viaPoints = (currentState.routeViaPoints || []).length;
				routeCountDisplay.textContent = 2 + viaPoints;
			}
		}
	};
}
