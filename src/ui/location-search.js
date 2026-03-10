import { state, updateState } from '../core/state.js';
import { updateMapPosition, updateMarkerStyles, updateRouteStyles, updateRouteGeometry } from '../map/map-init.js';
import { searchLocation, formatCoords } from '../map/geocoder.js';

function sanitizeCoordInput(v) {
	if (!v) return v;
	v = String(v).replace(/,/g, '.');
	v = v.replace(/[^0-9.\-]/g, '');
	const hasMinus = v.indexOf('-') !== -1;
	v = v.replace(/\-/g, '');
	if (hasMinus) v = '-' + v;
	const firstDot = v.indexOf('.');
	if (firstDot !== -1) {
		v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
	}
	return v;
}

export function setupLocationSearch() {
	const searchInput = document.getElementById('search-input');
	const searchResults = document.getElementById('search-results');
	const searchLoading = document.getElementById('search-loading');
	const latInput = document.getElementById('lat-input');
	const lonInput = document.getElementById('lon-input');
	const cityOverrideInput = document.getElementById('city-override-input');
	const countryOverrideInput = document.getElementById('country-override-input');
	const cityFontSelect = document.getElementById('city-font-select');
	const countryFontSelect = document.getElementById('country-font-select');
	const coordsFontSelect = document.getElementById('coords-font-select');
	const zoomSlider = document.getElementById('zoom-slider');
	const zoomValue = document.getElementById('zoom-value');

	let searchTimeout;
	let currentSearchController = null;
	let searchRequestId = 0;

	searchInput.addEventListener('input', (e) => {
		clearTimeout(searchTimeout);
		const query = e.target.value;
		if (!query || query.length < 2) {
			if (searchResults) searchResults.classList.add('hidden');
			if (currentSearchController) {
				try { currentSearchController.abort(); } catch (err) { }
				currentSearchController = null;
			}
			return;
		}

		searchTimeout = setTimeout(async () => {
			if (currentSearchController) {
				try { currentSearchController.abort(); } catch (err) { }
			}
			const controller = new AbortController();
			currentSearchController = controller;
			const thisRequestId = ++searchRequestId;

			if (searchLoading) searchLoading.classList.remove('hidden');

			let results = [];
			try {
				results = await searchLocation(query, { limit: 15, signal: controller.signal });
			} catch (err) {
				results = [];
			}

			if (thisRequestId !== searchRequestId) return;
			if (searchLoading) searchLoading.classList.add('hidden');

			if (results && results.length > 0) {
				searchResults.textContent = '';
				results.forEach(r => {
					const div = document.createElement('div');
					div.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
					div.dataset.lat = r.lat;
					div.dataset.lon = r.lon;
					div.dataset.name = r.shortName;
					div.dataset.country = r.country || '';
					div.textContent = r.name;
					searchResults.appendChild(div);
				});
				searchResults.classList.remove('hidden');
			} else {
				searchResults.classList.add('hidden');
			}

			if (currentSearchController === controller) currentSearchController = null;
		}, 1000);
	});

	let lastSelectionAt = 0;
	function selectResultElement(item) {
		const lat = parseFloat(item.dataset.lat);
		const lon = parseFloat(item.dataset.lon);
		const name = item.dataset.name;
		const country = item.dataset.country;

		updateState({
			city: (name || '').toUpperCase(),
			country: (country || '').toUpperCase(),
			lat, lon,
			markers: [{ lat, lon }],
			routeStartLat: lat, routeStartLon: lon,
			routeEndLat: lat - 0.005, routeEndLon: lon + 0.005,
			routeViaPoints: [], routeGeometry: []
		});

		updateMapPosition(lat, lon);
		updateMarkerStyles(state);

		if (state.showRoute) {
			updateRouteGeometry().then(() => updateRouteStyles(state));
		}

		searchInput.value = name;
		searchResults.classList.add('hidden');
		lastSelectionAt = Date.now();
	}

	searchResults.addEventListener('pointerdown', (e) => {
		const item = e.target.closest('[data-lat]');
		if (item) { selectResultElement(item); e.preventDefault(); }
	});

	searchResults.addEventListener('click', (e) => {
		if (Date.now() - lastSelectionAt < 500) return;
		const item = e.target.closest('[data-lat]');
		if (item) selectResultElement(item);
	});

	latInput.addEventListener('change', (e) => {
		const lat = parseFloat(e.target.value);
		const newMarkers = [...(state.markers || [])];
		if (newMarkers.length > 0) newMarkers[0].lat = lat;
		updateState({ lat, markers: newMarkers });
		updateMapPosition(lat, state.lon);
		updateMarkerStyles(state);
	});

	lonInput.addEventListener('change', (e) => {
		const lon = parseFloat(e.target.value);
		const newMarkers = [...(state.markers || [])];
		if (newMarkers.length > 0) newMarkers[0].lon = lon;
		updateState({ lon, markers: newMarkers });
		updateMapPosition(state.lat, lon);
		updateMarkerStyles(state);
	});

	if (cityOverrideInput) {
		cityOverrideInput.value = state.cityOverride || '';
		cityOverrideInput.addEventListener('input', (e) => {
			const v = e.target.value;
			updateState({ cityOverride: v ? v.toUpperCase() : '' });
		});
	}

	if (countryOverrideInput) {
		countryOverrideInput.value = state.countryOverride || '';
		countryOverrideInput.addEventListener('input', (e) => {
			const v = e.target.value;
			updateState({ countryOverride: v ? v.toUpperCase() : '' });
		});
	}

	const toggleCountryBtn = document.getElementById('toggle-country-btn');
	if (toggleCountryBtn) {
		toggleCountryBtn.addEventListener('click', () => updateState({ showCountry: !state.showCountry }));
	}

	const toggleCoordsBtn = document.getElementById('toggle-coords-btn');
	if (toggleCoordsBtn) {
		toggleCoordsBtn.addEventListener('click', () => updateState({ showCoords: !state.showCoords }));
	}

	if (cityFontSelect) cityFontSelect.addEventListener('change', (e) => updateState({ cityFont: e.target.value }));
	if (countryFontSelect) countryFontSelect.addEventListener('change', (e) => updateState({ countryFont: e.target.value }));
	if (coordsFontSelect) coordsFontSelect.addEventListener('change', (e) => updateState({ coordsFont: e.target.value }));

	latInput.addEventListener('input', (e) => {
		const cleaned = sanitizeCoordInput(e.target.value);
		if (cleaned !== e.target.value) e.target.value = cleaned;
	});

	lonInput.addEventListener('input', (e) => {
		const cleaned = sanitizeCoordInput(e.target.value);
		if (cleaned !== e.target.value) e.target.value = cleaned;
	});

	zoomSlider.addEventListener('input', (e) => {
		const zoom = parseInt(e.target.value);
		updateState({ zoom });
		updateMapPosition(undefined, undefined, zoom);
	});

	const EYE_OPEN_SVG = '<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>';
	const EYE_OFF_SVG = '<svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>';

	return {
		syncLocationUI(currentState) {
			if (cityOverrideInput) cityOverrideInput.value = currentState.cityOverride || '';
			if (countryOverrideInput) countryOverrideInput.value = currentState.countryOverride || '';
			if (cityFontSelect) cityFontSelect.value = currentState.cityFont;
			if (countryFontSelect) countryFontSelect.value = currentState.countryFont;
			if (coordsFontSelect) coordsFontSelect.value = currentState.coordsFont;

			const toggleCountryBtnSync = document.getElementById('toggle-country-btn');
			if (toggleCountryBtnSync) {
				toggleCountryBtnSync.innerHTML = (currentState.showCountry !== false) ? EYE_OPEN_SVG : EYE_OFF_SVG;
			}
			const toggleCoordsBtnSync = document.getElementById('toggle-coords-btn');
			if (toggleCoordsBtnSync) {
				toggleCoordsBtnSync.innerHTML = (currentState.showCoords !== false) ? EYE_OPEN_SVG : EYE_OFF_SVG;
			}

			latInput.value = currentState.lat.toFixed(6);
			lonInput.value = currentState.lon.toFixed(6);
			zoomSlider.value = currentState.zoom;
			zoomValue.textContent = currentState.zoom;
		},

		selectLocation(lat, lon, name, country) {
			updateState({
				city: (name || '').toUpperCase(),
				country: (country || '').toUpperCase(),
				lat, lon,
				markers: [{ lat, lon }],
				routeStartLat: lat, routeStartLon: lon,
				routeEndLat: lat - 0.005, routeEndLon: lon + 0.005,
				routeViaPoints: [], routeGeometry: []
			});
			updateMapPosition(lat, lon);
			updateMarkerStyles(state);
			if (state.showRoute) {
				updateRouteGeometry().then(() => updateRouteStyles(state));
			}
			searchInput.value = name || '';
		}
	};
}
