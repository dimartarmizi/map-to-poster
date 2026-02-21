import { state, updateState, defaultState, getSelectedTheme, getSelectedArtisticTheme } from '../core/state.js';
import { hexToRgba } from '../core/utils.js';
import { artisticThemes } from '../core/artistic-themes.js';
import { themes } from '../core/themes.js';
import { outputPresets } from '../core/output-presets.js';
import {
	updateMapPosition,
	invalidateMapSize,
	updateArtisticStyle,
	updateMapTheme,
	updateMarkerStyles
} from '../map/map-init.js';
import { searchLocation, formatCoords } from '../map/geocoder.js';


export function setupControls() {
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

	const modeTile = document.getElementById('mode-tile');
	const modeArtistic = document.getElementById('mode-artistic');
	const standardThemeConfig = document.getElementById('standard-theme-config');
	const artisticThemeConfig = document.getElementById('artistic-theme-config');
	const labelsControl = document.getElementById('labels-control');

	const themeSelect = document.getElementById('theme-select');
	const artisticMainGrid = document.getElementById('artistic-main-grid');
	const artisticDesc = document.getElementById('artistic-desc');

	const paletteFor = (t) => {
		const candidates = [t.road_motorway, t.road_primary, t.road_secondary, t.road_tertiary, t.text, t.bg];
		return candidates.map(c => c || '#cccccc').slice(0, 4);
	};

	if (artisticMainGrid) {
		const mainKeys = ['cyber_noir', 'golden_era', 'mangrove_maze'];

		const makeCard = (key, theme, isOther = false) => {
			const p = paletteFor(theme);
			const label = theme && theme.name ? theme.name : (isOther ? 'Other Theme' : key);
			return `
				<button type="button" data-key="${key}" class="art-card group p-3 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col items-center text-center hover:shadow-xl transition-all">
					<div class="flex items-center justify-center -space-x-2">
						<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[0]}"></span>
						<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[1]}"></span>
						<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[2]}"></span>
						<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[3]}"></span>
					</div>
					<div class="mt-3 text-[11px] font-semibold text-slate-900">${label}</div>
				</button>
			`;
		};

		const mainHtml = mainKeys.map(k => makeCard(k, artisticThemes[k] || {})).join('') + makeCard('other', { name: 'Other Theme' }, true);
		artisticMainGrid.innerHTML = mainHtml;

		artisticMainGrid.querySelectorAll('.art-card').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const k = btn.dataset.key;
				if (k === 'other') {
					const artModal = document.getElementById('artistic-modal');
					if (artModal) {
						artModal.classList.add('show');
						populateArtisticModal();
					}
					return;
				}
				updateState({ artisticTheme: k });
				if (state.renderMode === 'artistic') {
					const theme = getSelectedArtisticTheme();
					updateArtisticStyle(theme);
				}
			});
		});
	}

	if (themeSelect) {
		themeSelect.innerHTML = Object.keys(themes)
			.sort((a, b) => (themes[a].name || a).localeCompare(themes[b].name || b))
			.map(key => {
				const t = themes[key];
				return `<option value="${key}">${t.name || key}</option>`;
			})
			.join('\n');
	}

	const labelsToggle = document.getElementById('show-labels-toggle');
	const markerToggle = document.getElementById('show-marker-toggle');
	const markerSettings = document.getElementById('marker-settings');
	const markerIconSelect = document.getElementById('marker-icon-select');
	const markerSizeSlider = document.getElementById('marker-size-slider');
	const markerSizeValue = document.getElementById('marker-size-value');

	const overlayBgButtons = document.querySelectorAll('.overlay-bg-btn');
	const overlaySizeButtons = document.querySelectorAll('.overlay-size-btn');
	const overlaySizeGroup = document.getElementById('overlay-size-group');
	const customW = document.getElementById('custom-w');
	const customH = document.getElementById('custom-h');
	const presetBtns = document.querySelectorAll('.preset-btn');
	const exportBtn = document.getElementById('export-btn');

	const matToggle = document.getElementById('mat-toggle');
	const matSettings = document.getElementById('mat-settings');
	const matWidthSlider = document.getElementById('mat-width-slider');
	const matWidthValue = document.getElementById('mat-width-value');
	const matBorderToggle = document.getElementById('mat-border-toggle');
	const matBorderSettings = document.getElementById('mat-border-settings');
	const matBorderWidthSlider = document.getElementById('mat-border-width-slider');
	const matBorderWidthValue = document.getElementById('mat-border-width-value');
	const matBorderOpacitySlider = document.getElementById('mat-border-opacity-slider');
	const matBorderOpacityValue = document.getElementById('mat-border-opacity-value');

	if (matToggle) {
		matToggle.addEventListener('change', (e) => {
			updateState({ matEnabled: e.target.checked });
		});
	}

	if (matWidthSlider) {
		matWidthSlider.addEventListener('input', (e) => {
			updateState({ matWidth: parseInt(e.target.value) });
		});
	}

	if (matBorderToggle) {
		matBorderToggle.addEventListener('change', (e) => {
			updateState({ matShowBorder: e.target.checked });
		});
	}

	if (matBorderWidthSlider) {
		matBorderWidthSlider.addEventListener('input', (e) => {
			updateState({ matBorderWidth: parseInt(e.target.value) });
		});
	}

	if (matBorderOpacitySlider) {
		matBorderOpacitySlider.addEventListener('input', (e) => {
			updateState({ matBorderOpacity: parseFloat(e.target.value) });
		});
	}

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

	const logoBtn = document.getElementById('logo-btn');
	const creditsModal = document.getElementById('credits-modal');
	const closeCredits = document.getElementById('close-credits');
	const creditsOverlay = document.getElementById('credits-overlay');

	if (logoBtn) {
		logoBtn.addEventListener('click', () => {
			if (creditsModal) creditsModal.classList.add('show');
		});
	}

	const closeCreditsFunctions = [closeCredits, creditsOverlay];
	closeCreditsFunctions.forEach(el => {
		if (el) {
			el.addEventListener('click', () => {
				if (creditsModal) creditsModal.classList.remove('show');
			});
		}
	});

	const otherPresetsBtn = document.getElementById('other-presets-btn');
	const presetsModal = document.getElementById('presets-modal');
	const closeModal = document.getElementById('close-modal');
	const closeModalBtn = document.getElementById('close-modal-btn');
	const modalContent = document.getElementById('modal-content');
	const modalOverlay = document.getElementById('modal-overlay');

	if (otherPresetsBtn) {
		otherPresetsBtn.addEventListener('click', () => {
			presetsModal.classList.add('show');
			populateModal();
		});
	}

	const closeFunctions = [closeModal, closeModalBtn, modalOverlay];
	closeFunctions.forEach(el => {
		if (el) {
			el.addEventListener('click', () => {
				if (presetsModal) presetsModal.classList.remove('show');
			});
		}
	});

	const artisticModal = document.getElementById('artistic-modal');
	const artisticModalContent = document.getElementById('artistic-modal-content');
	const closeArtisticModal = document.getElementById('close-artistic-modal');
	const closeArtisticModalBtn = document.getElementById('close-artistic-modal-btn');
	const artisticModalOverlay = document.getElementById('artistic-modal-overlay');

	const closeArtisticFuncs = [closeArtisticModal, closeArtisticModalBtn, artisticModalOverlay];
	closeArtisticFuncs.forEach(el => {
		if (el) el.addEventListener('click', () => { if (artisticModal) artisticModal.classList.remove('show'); });
	});

	function populateArtisticModal() {
		if (!artisticModalContent) return;
		const mainKeys = new Set(['cyber_noir', 'golden_era', 'mangrove_maze']);
		artisticModalContent.innerHTML = Object.entries(artisticThemes)
			.filter(([k]) => !mainKeys.has(k))
			.map(([key, t]) => {
				const candidates = [t.road_motorway, t.road_primary, t.road_secondary, t.road_tertiary, t.text, t.bg];
				const p = candidates.map(c => c || '#cccccc').slice(0, 4);
				return `
					<button class="artistic-modal-item group w-full flex items-center p-4 border border-slate-100 rounded-2xl hover:shadow-xl transition-all" data-key="${key}">
						<div class="flex -space-x-2 mr-4">
							<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[0]}"></span>
							<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[1]}"></span>
							<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[2]}"></span>
							<span class="w-6 h-6 rounded-full ring-1 ring-white" style="background:${p[3]}"></span>
						</div>
						<div class="text-left">
							<div class="text-sm font-semibold text-slate-900">${t.name || key}</div>
							<div class="text-[10px] text-slate-400 mt-1">${t.description || ''}</div>
						</div>
					</button>
				`;
			}).join('\n');

		artisticModalContent.querySelectorAll('.artistic-modal-item').forEach(btn => {
			btn.addEventListener('click', () => {
				const k = btn.dataset.key;
				updateState({ artisticTheme: k });
				if (state.renderMode === 'artistic') {
					const theme = getSelectedArtisticTheme();
					updateArtisticStyle(theme);
				}
				if (artisticModal) artisticModal.classList.remove('show');
			});
		});
	}

	function populateModal() {
		if (!modalContent) return;
		modalContent.innerHTML = Object.entries(outputPresets).map(([key, presets]) => `
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <div class="w-1 h-5 bg-accent rounded-full"></div>
          <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">${key.replace('_', ' ')}</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${presets.map(p => {
			const isActive = state.width === p.width && state.height === p.height;
			return `
              <button class="modal-preset-btn group flex flex-col items-start p-4 border ${isActive ? 'border-accent bg-accent-light' : 'border-slate-100 bg-slate-50/50'} rounded-2xl hover:border-accent hover:bg-white hover:shadow-xl transition-all text-left" 
                      data-width="${p.width}" data-height="${p.height}">
                <span class="text-[11px] font-bold ${isActive ? 'text-accent' : 'text-slate-800'} group-hover:text-accent transition-colors">${p.name}</span>
                <span class="text-[9px] ${isActive ? 'text-accent/60' : 'text-slate-400'} font-bold mt-1 uppercase tracking-tight">${p.width} × ${p.height} px</span>
              </button>
            `;
		}).join('')}
        </div>
      </div>
    `).join('');

		modalContent.querySelectorAll('.modal-preset-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const width = parseInt(btn.dataset.width);
				const height = parseInt(btn.dataset.height);
				updateState({ width, height });
				presetsModal.classList.remove('show');
			});
		});
	}

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
				searchResults.innerHTML = results.map(r => `
		  <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.shortName}" data-country="${r.country || ''}">
			${r.name}
		  </div>
		`).join('');
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
			lat,
			lon,
			markerLat: lat,
			markerLon: lon
		});

		updateMapPosition(lat, lon);

		searchInput.value = name;
		searchResults.classList.add('hidden');
		lastSelectionAt = Date.now();
	}

	searchResults.addEventListener('pointerdown', (e) => {
		const item = e.target.closest('[data-lat]');
		if (item) {
			selectResultElement(item);
			e.preventDefault();
		}
	});

	searchResults.addEventListener('click', (e) => {
		if (Date.now() - lastSelectionAt < 500) return;
		const item = e.target.closest('[data-lat]');
		if (item) selectResultElement(item);
	});

	latInput.addEventListener('change', (e) => {
		const lat = parseFloat(e.target.value);
		updateState({ lat, markerLat: lat });
		updateMapPosition(lat, state.lon);
	});

	lonInput.addEventListener('change', (e) => {
		const lon = parseFloat(e.target.value);
		updateState({ lon, markerLon: lon });
		updateMapPosition(state.lat, lon);
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
		toggleCountryBtn.addEventListener('click', () => {
			updateState({ showCountry: !state.showCountry });
		});
	}

	const toggleCoordsBtn = document.getElementById('toggle-coords-btn');
	if (toggleCoordsBtn) {
		toggleCoordsBtn.addEventListener('click', () => {
			updateState({ showCoords: !state.showCoords });
		});
	}

	if (cityFontSelect) {
		cityFontSelect.addEventListener('change', (e) => {
			updateState({ cityFont: e.target.value });
		});
	}

	if (countryFontSelect) {
		countryFontSelect.addEventListener('change', (e) => {
			updateState({ countryFont: e.target.value });
		});
	}

	if (coordsFontSelect) {
		coordsFontSelect.addEventListener('change', (e) => {
			updateState({ coordsFont: e.target.value });
		});
	}


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

	modeTile.addEventListener('click', () => updateState({ renderMode: 'tile' }));
	modeArtistic.addEventListener('click', () => updateState({ renderMode: 'artistic' }));

	let _themeChangeTimer = null;
	function applyThemeChange(value) {
		updateState({ theme: value });
		if (state.renderMode === 'tile') {
			const t = getSelectedTheme();
			if (t && t.tileUrl) updateMapTheme(t.tileUrl);
			invalidateMapSize();
		}
	}

	if (themeSelect) {
		const onThemeInput = (e) => {
			const v = e.target.value;
			clearTimeout(_themeChangeTimer);
			_themeChangeTimer = setTimeout(() => applyThemeChange(v), 120);
		};
		themeSelect.addEventListener('change', onThemeInput);
		themeSelect.addEventListener('input', onThemeInput);
	}


	if (labelsToggle) {
		labelsToggle.addEventListener('change', (e) => {
			updateState({ showLabels: e.target.checked });
		});
	}

	if (markerToggle) {
		markerToggle.addEventListener('change', (e) => {
			const show = e.target.checked;
			updateState({ showMarker: show });
			updateMarkerStyles(state);
			const settings = document.getElementById('marker-settings');
			if (settings) settings.classList.toggle('hidden', !show);
		});
	}

	if (overlayBgButtons) {
		overlayBgButtons.forEach(btn => {
			btn.addEventListener('click', () => {
				updateState({ overlayBgType: btn.dataset.bg });
			});
		});
	}

	if (overlaySizeGroup && overlaySizeButtons) {
		overlaySizeButtons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				const size = btn.dataset.size;
				updateState({ overlaySize: size });
			});
		});
	}

	presetBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			const width = parseInt(btn.dataset.width);
			const height = parseInt(btn.dataset.height);
			updateState({ width, height });
		});
	});

	const MAX_RES = 50000;
	customW.addEventListener('change', (e) => {
		let val = parseInt(e.target.value) || state.width;
		if (val > MAX_RES) val = MAX_RES;
		updateState({ width: val });
	});
	customH.addEventListener('change', (e) => {
		let val = parseInt(e.target.value) || state.height;
		if (val > MAX_RES) val = MAX_RES;
		updateState({ height: val });
	});

	const resetSettingsBtn = document.getElementById('reset-settings-btn');
	if (resetSettingsBtn) {
		resetSettingsBtn.addEventListener('click', () => {
			if (confirm('Are you sure you want to reset all settings?')) {
				updateState(defaultState);
			}
		});
	}

	const overlayPosBtns = document.querySelectorAll('.overlay-pos-btn');
	const overlayPositionGroup = document.getElementById('overlay-position-group');
	overlayPosBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			const x = parseFloat(btn.dataset.overlayX);
			const y = parseFloat(btn.dataset.overlayY);
			updateState({ overlayX: x, overlayY: y });
		});
	});

	const resetOverlayPosBtn = document.getElementById('reset-overlay-pos-btn');
	if (resetOverlayPosBtn) {
		resetOverlayPosBtn.addEventListener('click', () => {
			updateState({ overlayX: 0.5, overlayY: 0.85 });
		});
	}

	const draggableOverlay = document.getElementById('poster-overlay');
	const posterContainerForDrag = document.getElementById('poster-container');

	if (draggableOverlay && posterContainerForDrag) {
		let isDragging = false;
		let dragStartClientX = 0;
		let dragStartClientY = 0;
		let dragStartOverlayX = 0.5;
		let dragStartOverlayY = 0.85;

		const startDrag = (clientX, clientY) => {
			if (state.overlaySize === 'none') return;
			isDragging = true;
			dragStartClientX = clientX;
			dragStartClientY = clientY;
			dragStartOverlayX = state.overlayX !== undefined ? state.overlayX : 0.5;
			dragStartOverlayY = state.overlayY !== undefined ? state.overlayY : 0.85;
			draggableOverlay.style.cursor = 'grabbing';
			document.body.style.userSelect = 'none';
		};

		const doDrag = (clientX, clientY) => {
			if (!isDragging) return;
			const rect = posterContainerForDrag.getBoundingClientRect();
			const dx = (clientX - dragStartClientX) / rect.width;
			const dy = (clientY - dragStartClientY) / rect.height;

			const EDGE = 8;
			const cW = posterContainerForDrag.offsetWidth;
			const cH = posterContainerForDrag.offsetHeight;
			const oW = draggableOverlay.offsetWidth;
			const oH = draggableOverlay.offsetHeight;
			const minX = cW > 0 && oW > 0 ? (oW / 2 + EDGE) / cW : 0.05;
			const maxX = cW > 0 && oW > 0 ? 1 - (oW / 2 + EDGE) / cW : 0.95;
			const minY = cH > 0 && oH > 0 ? (oH / 2 + EDGE) / cH : 0.05;
			const maxY = cH > 0 && oH > 0 ? 1 - (oH / 2 + EDGE) / cH : 0.95;

			const newX = Math.max(minX, Math.min(maxX, dragStartOverlayX + dx));
			const newY = Math.max(minY, Math.min(maxY, dragStartOverlayY + dy));
			updateState({ overlayX: newX, overlayY: newY });
		};

		const endDrag = () => {
			if (!isDragging) return;
			isDragging = false;
			draggableOverlay.style.cursor = '';
			document.body.style.userSelect = '';
		};

		draggableOverlay.addEventListener('mousedown', (e) => {
			startDrag(e.clientX, e.clientY);
			e.preventDefault();
		});
		document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
		document.addEventListener('mouseup', endDrag);

		draggableOverlay.addEventListener('touchstart', (e) => {
			if (e.touches.length === 1) {
				startDrag(e.touches[0].clientX, e.touches[0].clientY);
				e.preventDefault();
			}
		}, { passive: false });
		document.addEventListener('touchmove', (e) => {
			if (isDragging && e.touches.length === 1) {
				doDrag(e.touches[0].clientX, e.touches[0].clientY);
				e.preventDefault();
			}
		}, { passive: false });
		document.addEventListener('touchend', endDrag);
	}

	return (currentState) => {
		if (cityOverrideInput) cityOverrideInput.value = currentState.cityOverride || '';
		if (countryOverrideInput) countryOverrideInput.value = currentState.countryOverride || '';
		if (cityFontSelect) cityFontSelect.value = currentState.cityFont;
		if (countryFontSelect) countryFontSelect.value = currentState.countryFont;
		if (coordsFontSelect) coordsFontSelect.value = currentState.coordsFont;

		const EYE_OPEN_SVG = `<svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
		const EYE_OFF_SVG = `<svg class="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`;

		const toggleCountryBtnSync = document.getElementById('toggle-country-btn');
		if (toggleCountryBtnSync) {
			toggleCountryBtnSync.innerHTML = (currentState.showCountry !== false) ? EYE_OPEN_SVG : EYE_OFF_SVG;
		}
		const toggleCoordsBtnSync = document.getElementById('toggle-coords-btn');
		if (toggleCoordsBtnSync) {
			toggleCoordsBtnSync.innerHTML = (currentState.showCoords !== false) ? EYE_OPEN_SVG : EYE_OFF_SVG;
		}

		const overlayPosBtnsSync = document.querySelectorAll('.overlay-pos-btn');
		const curX = currentState.overlayX !== undefined ? currentState.overlayX : 0.5;
		const curY = currentState.overlayY !== undefined ? currentState.overlayY : 0.85;

		if (overlayPositionGroup) {
			overlayPositionGroup.classList.toggle('hidden', (currentState.overlaySize || 'medium') === 'none');
		}
		const TOLERANCE = 0.02;
		overlayPosBtnsSync.forEach(btn => {
			const bx = parseFloat(btn.dataset.overlayX);
			const by = parseFloat(btn.dataset.overlayY);
			const isActive = Math.abs(curX - bx) < TOLERANCE && Math.abs(curY - by) < TOLERANCE;
			const dot = btn.querySelector('.pos-dot');
			if (isActive) {
				btn.classList.add('border-accent', 'bg-accent-light');
				btn.classList.remove('border-slate-100', 'bg-slate-50');
				if (dot) { dot.classList.add('bg-accent'); dot.classList.remove('bg-slate-300'); }
			} else {
				btn.classList.remove('border-accent', 'bg-accent-light');
				btn.classList.add('border-slate-100', 'bg-slate-50');
				if (dot) { dot.classList.remove('bg-accent'); dot.classList.add('bg-slate-300'); }
			}
		});

		latInput.value = currentState.lat.toFixed(6);
		lonInput.value = currentState.lon.toFixed(6);
		zoomSlider.value = currentState.zoom;
		zoomValue.textContent = currentState.zoom;

		if (currentState.renderMode === 'tile') {
			modeTile.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-accent text-white shadow-sm';
			modeArtistic.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-900';
			if (standardThemeConfig) standardThemeConfig.classList.remove('hidden');
			if (artisticThemeConfig) artisticThemeConfig.classList.add('hidden');
			if (labelsControl) labelsControl.classList.remove('hidden');
		} else {
			modeTile.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-900';
			modeArtistic.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-accent text-white shadow-sm';
			if (standardThemeConfig) standardThemeConfig.classList.add('hidden');
			if (artisticThemeConfig) artisticThemeConfig.classList.remove('hidden');
			if (labelsControl) labelsControl.classList.add('hidden');
		}

		themeSelect.value = currentState.theme;
		if (artisticMainGrid) {
			const mainKeys = new Set(['cyber_noir', 'golden_era', 'mangrove_maze']);
			const selectedKey = currentState.artisticTheme;
			artisticMainGrid.querySelectorAll('.art-card').forEach(btn => {
				const k = btn.dataset.key;
				let active = false;
				if (k === 'other') {
					active = !!(selectedKey && !mainKeys.has(selectedKey));
				} else {
					active = k === selectedKey;
				}
				btn.classList.toggle('border-accent', active);
				btn.classList.toggle('bg-accent-light', active);
				if (active) btn.classList.add('ring-accent'); else btn.classList.remove('ring-accent');

				if (k === 'other') {
					const spans = btn.querySelectorAll('span.w-6.h-6');
					if (selectedKey && artisticThemes[selectedKey] && !mainKeys.has(selectedKey)) {
						const p = paletteFor(artisticThemes[selectedKey]);
						spans.forEach((s, i) => { s.style.background = p[i] || '#cccccc'; });
					} else {
						spans.forEach((s) => { s.style.background = '#cccccc'; });
					}
				}
			});
		}

		const artisticTheme = getSelectedArtisticTheme();
		artisticDesc.textContent = artisticTheme.description;

		if (labelsToggle) labelsToggle.checked = !!currentState.showLabels;
		if (overlayBgButtons && overlayBgButtons.length) {
			overlayBgButtons.forEach(b => {
				const style = b.dataset.bg;
				if (style === (currentState.overlayBgType || 'vignette')) {
					b.classList.add('bg-accent', 'text-white');
					b.classList.remove('bg-slate-50');
				} else {
					b.classList.remove('bg-accent', 'text-white');
					b.classList.add('bg-slate-50');
				}
			});
		}
		if (overlaySizeButtons && overlaySizeButtons.length) {
			overlaySizeButtons.forEach(b => {
				const s = b.dataset.size;
				if (s === (currentState.overlaySize || 'medium')) {
					b.classList.add('bg-accent', 'text-white');
					b.classList.remove('bg-slate-50');
				} else {
					b.classList.remove('bg-accent', 'text-white');
					b.classList.add('bg-slate-50');
				}
			});
		}

		if (customW) customW.value = currentState.width;
		if (customH) customH.value = currentState.height;

		if (labelsToggle) labelsToggle.checked = !!currentState.showLabels;
		if (markerToggle) markerToggle.checked = !!currentState.showMarker;
		if (markerSettings) {
			if (currentState.showMarker) markerSettings.classList.remove('hidden');
			else markerSettings.classList.add('hidden');
		}

		if (markerIconSelect) markerIconSelect.value = currentState.markerIcon || 'pin';
		if (markerSizeSlider) {
			const sizePx = Math.round((currentState.markerSize || 1) * 40);
			markerSizeSlider.value = sizePx;
			if (markerSizeValue) markerSizeValue.textContent = `${sizePx}px`;
		}

		if (matToggle) matToggle.checked = !!currentState.matEnabled;
		if (matSettings) {
			if (currentState.matEnabled) matSettings.classList.remove('hidden');
			else matSettings.classList.add('hidden');
		}
		if (matWidthSlider) matWidthSlider.value = currentState.matWidth || 40;
		if (matWidthValue) matWidthValue.textContent = `${currentState.matWidth || 40}px`;
		if (matBorderToggle) matBorderToggle.checked = !!currentState.matShowBorder;

		if (matBorderSettings) {
			if (currentState.matEnabled && currentState.matShowBorder) matBorderSettings.classList.remove('hidden');
			else matBorderSettings.classList.add('hidden');
		}
		if (matBorderWidthSlider) matBorderWidthSlider.value = currentState.matBorderWidth || 1;
		if (matBorderWidthValue) matBorderWidthValue.textContent = `${currentState.matBorderWidth || 1}px`;
		if (matBorderOpacitySlider) matBorderOpacitySlider.value = currentState.matBorderOpacity || 1;
		if (matBorderOpacityValue) matBorderOpacityValue.textContent = `${Math.round((currentState.matBorderOpacity || 1) * 100)}%`;

		let isMainPresetActive = false;
		if (presetBtns && presetBtns.length) {
			presetBtns.forEach(btn => {
				const w = parseInt(btn.dataset.width);
				const h = parseInt(btn.dataset.height);
				if (w === currentState.width && h === currentState.height) {
					btn.classList.add('bg-accent', 'text-white');
					btn.classList.remove('bg-slate-50');
					isMainPresetActive = true;
				} else {
					btn.classList.remove('bg-accent', 'text-white');
					btn.classList.add('bg-slate-50');
				}
			});
		}

		if (otherPresetsBtn) {
			if (!isMainPresetActive) {
				otherPresetsBtn.classList.add('bg-accent', 'text-white');
				otherPresetsBtn.classList.remove('bg-slate-50');
			} else {
				otherPresetsBtn.classList.remove('bg-accent', 'text-white');
				otherPresetsBtn.classList.add('bg-slate-50');
			}
		}

		let accentColor = '#0f172a';
		if (currentState.renderMode === 'artistic') {
			const theme = getSelectedArtisticTheme();
			accentColor = theme.road_primary || theme.text || '#0f172a';
			exportBtn.classList.remove('bg-slate-900');
			exportBtn.classList.add('bg-accent');
		} else {
			accentColor = '#0f172a';
			exportBtn.classList.add('bg-slate-900');
			exportBtn.classList.remove('bg-accent');
		}

		const r = parseInt(accentColor.slice(1, 3), 16);
		const g = parseInt(accentColor.slice(3, 5), 16);
		const b = parseInt(accentColor.slice(5, 7), 16);
		document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
	};
}

let lastWidth = null;
let lastHeight = null;
let lastMatEnabled = null;
let lastMatWidth = null;

export function updatePreviewStyles(currentState) {
	const posterContainer = document.getElementById('poster-container');
	const posterScaler = document.getElementById('poster-scaler');
	const displayCity = document.getElementById('display-city');
	const displayCountry = document.getElementById('display-country');
	const displayCoords = document.getElementById('display-coords');
	const overlay = document.getElementById('poster-overlay');
	const overlayBg = overlay ? overlay.querySelector('.overlay-bg') : null;
	const vignetteOverlay = document.getElementById('vignette-overlay');
	const matBorder = document.getElementById('mat-border');
	const divider = document.getElementById('poster-divider');
	const attribution = document.getElementById('poster-attribution');

	const theme = getSelectedTheme();
	const artisticTheme = getSelectedArtisticTheme();

	const isArtistic = currentState.renderMode === 'artistic';
	const mapPreview = document.getElementById('map-preview');
	const artisticMapDiv = document.getElementById('artistic-map');

	const activeTheme = isArtistic ? artisticTheme : theme;

	const matEnabled = currentState.matEnabled;
	const matWidth = matEnabled ? (currentState.matWidth || 0) : 0;
	const showBorder = matEnabled && currentState.matShowBorder;
	const borderColor = activeTheme.text || activeTheme.textColor || '#000000';
	const borderWidth = currentState.matBorderWidth || 1;
	const borderOpacity = currentState.matBorderOpacity || 1;

	if (isArtistic) {
		mapPreview.style.visibility = 'hidden';
		mapPreview.style.pointerEvents = 'none';
		artisticMapDiv.style.visibility = 'visible';
		artisticMapDiv.style.pointerEvents = 'auto';
		updateArtisticStyle(artisticTheme);
	} else {
		mapPreview.style.visibility = 'visible';
		mapPreview.style.pointerEvents = 'auto';
		artisticMapDiv.style.visibility = 'hidden';
		artisticMapDiv.style.pointerEvents = 'none';
	}

	[mapPreview, artisticMapDiv].forEach(el => {
		if (el) {
			el.style.top = `${matWidth}px`;
			el.style.left = `${matWidth}px`;
			el.style.right = `${matWidth}px`;
			el.style.bottom = `${matWidth}px`;
			el.style.outline = 'none';
		}
	});

	if (matBorder) {
		if (matEnabled && showBorder) {
			matBorder.style.display = 'block';
			matBorder.style.top = `${matWidth}px`;
			matBorder.style.left = `${matWidth}px`;
			matBorder.style.right = `${matWidth}px`;
			matBorder.style.bottom = `${matWidth}px`;
			matBorder.style.border = `${borderWidth}px solid ${borderColor}`;
			matBorder.style.opacity = borderOpacity;
		} else {
			matBorder.style.display = 'none';
		}
	}

	if (vignetteOverlay) {
		vignetteOverlay.style.top = `${matWidth}px`;
		vignetteOverlay.style.left = `${matWidth}px`;
		vignetteOverlay.style.right = `${matWidth}px`;
		vignetteOverlay.style.bottom = `${matWidth}px`;
	}

	const sizeChanged = lastWidth !== currentState.width || lastHeight !== currentState.height;
	const matChanged = lastMatEnabled !== currentState.matEnabled || lastMatWidth !== currentState.matWidth;

	lastWidth = currentState.width;
	lastHeight = currentState.height;
	lastMatEnabled = currentState.matEnabled;
	lastMatWidth = currentState.matWidth;

	posterContainer.style.width = `${currentState.width}px`;
	posterContainer.style.height = `${currentState.height}px`;
	posterContainer.style.backgroundColor = activeTheme.bg || activeTheme.background;

	const parent = posterScaler.parentElement;
	const isMobile = window.innerWidth < 768;
	const padding = isMobile ? 40 : 120;
	const availableW = parent.clientWidth - padding;
	const availableH = parent.clientHeight - padding;

	const scaleW = availableW / currentState.width;
	const scaleH = availableH / currentState.height;
	const scale = Math.min(scaleW, scaleH, 1);

	posterScaler.style.transform = `scale(${scale})`;

	displayCity.textContent = (currentState.cityOverride && currentState.cityOverride.length) ? currentState.cityOverride : currentState.city;
	displayCity.style.color = activeTheme.text || activeTheme.textColor;
	displayCity.style.fontFamily = currentState.cityFont;

	if (displayCountry) {
		displayCountry.textContent = (currentState.countryOverride && currentState.countryOverride.length) ? currentState.countryOverride : currentState.country;
		displayCountry.style.color = activeTheme.text || activeTheme.textColor;
		displayCountry.style.fontFamily = currentState.countryFont;
		const countryHasText = !!displayCountry.textContent;
		displayCountry.style.display = (currentState.showCountry !== false && countryHasText) ? 'block' : 'none';
	}

	displayCoords.textContent = formatCoords(currentState.lat, currentState.lon);
	displayCoords.style.color = activeTheme.text || activeTheme.textColor;
	displayCoords.style.fontFamily = currentState.coordsFont;
	displayCoords.style.display = (currentState.showCoords !== false) ? '' : 'none';

	if (overlay) {
		const size = currentState.overlaySize || 'medium';
		if (size === 'none') {
			overlay.style.display = 'none';
			if (overlayBg) {
				overlayBg.style.display = 'none';
				overlayBg.style.backdropFilter = '';
				overlayBg.style.webkitBackdropFilter = '';
			}
			const bgTypeNone = currentState.overlayBgType || 'vignette';
			const colorNone = activeTheme.background || activeTheme.bg || activeTheme.overlayBg || '#ffffff';
			if (vignetteOverlay) {
				if (bgTypeNone === 'vignette') {
					vignetteOverlay.style.display = '';
					vignetteOverlay.style.opacity = '1';
					const colorSolid = hexToRgba(colorNone, 1);
					const colorTrans = hexToRgba(colorNone, 0);
					vignetteOverlay.style.background = `linear-gradient(to bottom, ${colorSolid} 0%, ${colorSolid} 3%, ${colorTrans} 20%, ${colorTrans} 80%, ${colorSolid} 97%, ${colorSolid} 100%)`;
				} else {
					vignetteOverlay.style.display = 'none';
					vignetteOverlay.style.opacity = '0';
					vignetteOverlay.style.background = '';
				}
			}
		} else {
			overlay.style.display = '';
			const isMobile = window.innerWidth < 768;
			let pad = isMobile ? 24 : 48;
			let citySize = isMobile ? 32 : 64;
			let countrySize = isMobile ? 12 : 20;
			let coordsSize = isMobile ? 10 : 16;

			if (size === 'small') {
				pad = isMobile ? 12 : 24;
				citySize = isMobile ? 24 : 40;
				countrySize = isMobile ? 10 : 14;
				coordsSize = isMobile ? 8 : 12;
			} else if (size === 'large') {
				pad = isMobile ? 40 : 80;
				citySize = isMobile ? 48 : 96;
				countrySize = isMobile ? 16 : 24;
				coordsSize = isMobile ? 14 : 20;
			}
			overlay.style.padding = `${pad}px`;
			displayCity.style.fontSize = `${citySize}px`;
			if (displayCountry) displayCountry.style.fontSize = `${countrySize}px`;
			displayCoords.style.fontSize = `${coordsSize}px`;

			const overlayX = currentState.overlayX !== undefined ? currentState.overlayX : 0.5;
			const overlayY = currentState.overlayY !== undefined ? currentState.overlayY : 0.85;
			overlay.style.right = '';
			overlay.style.bottom = '';
			overlay.style.transform = 'translate(-50%, -50%)';
			overlay.style.maxWidth = '90%';
			overlay.style.width = '';

			overlay.style.left = `${overlayX * 100}%`;
			overlay.style.top = `${overlayY * 100}%`;
			{
				const EDGE = 8;
				const cW = posterContainer.offsetWidth;
				const cH = posterContainer.offsetHeight;
				const oW = overlay.offsetWidth;
				const oH = overlay.offsetHeight;
				if (cW > 0 && cH > 0 && oW > 0 && oH > 0) {
					const cx = Math.max((oW / 2 + EDGE) / cW, Math.min(1 - (oW / 2 + EDGE) / cW, overlayX));
					const cy = Math.max((oH / 2 + EDGE) / cH, Math.min(1 - (oH / 2 + EDGE) / cH, overlayY));
					overlay.style.left = `${cx * 100}%`;
					overlay.style.top = `${cy * 100}%`;
				}
			}

			const bgType = currentState.overlayBgType || 'vignette';
			const color = activeTheme.background || activeTheme.bg || activeTheme.overlayBg || '#ffffff';

			if (overlayBg) {
				overlayBg.style.display = 'none';
				overlayBg.style.backdropFilter = '';
				overlayBg.style.webkitBackdropFilter = '';
			}

			if (vignetteOverlay) {
				if (bgType === 'vignette') {
					vignetteOverlay.style.display = '';
					vignetteOverlay.style.opacity = '1';
					const colorSolid = hexToRgba(color, 1);
					const colorTrans = hexToRgba(color, 0);
					vignetteOverlay.style.background = `linear-gradient(to bottom, ${colorSolid} 0%, ${colorSolid} 3%, ${colorTrans} 20%, ${colorTrans} 80%, ${colorSolid} 97%, ${colorSolid} 100%)`;
				} else {
					vignetteOverlay.style.display = 'none';
				}
			}
		}
	}
	if (divider) {
		divider.style.backgroundColor = activeTheme.text || activeTheme.textColor;
		const countryVisible = currentState.showCountry !== false && !!(displayCountry && displayCountry.textContent);
		const coordsVisible = currentState.showCoords !== false;
		divider.style.display = (countryVisible || coordsVisible) ? '' : 'none';
	}
	if (attribution) {
		attribution.style.color = activeTheme.text || activeTheme.textColor;
		attribution.style.right = `${matWidth + 12}px`;
		attribution.style.bottom = `${matWidth + 12}px`;
	}

	updateMarkerStyles(currentState);

	if (sizeChanged || matChanged) {
		setTimeout(() => {
			invalidateMapSize();
			updateMapPosition(currentState.lat, currentState.lon, currentState.zoom, { animate: false });
		}, 350);

		setTimeout(() => {
			invalidateMapSize();
			updateMapPosition(currentState.lat, currentState.lon, currentState.zoom, { animate: false });
		}, 550);
	}
}
