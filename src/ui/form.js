import { state, updateState, getSelectedTheme, getSelectedArtisticTheme } from '../core/state.js';
import { hexToRgba } from '../core/utils.js';
import { artisticThemes } from '../core/artistic-themes.js';
import { themes } from '../core/themes.js';
import { outputPresets } from '../core/output-presets.js';
import { updateMapPosition, invalidateMapSize, updateArtisticStyle, updateMapTheme } from '../map/map-init.js';
import { searchLocation, formatCoords } from '../map/geocoder.js';


export function setupControls() {
	const searchInput = document.getElementById('search-input');
	const searchResults = document.getElementById('search-results');
	const searchLoading = document.getElementById('search-loading');
	const latInput = document.getElementById('lat-input');
	const lonInput = document.getElementById('lon-input');
	const cityOverrideInput = document.getElementById('city-override-input');
	const zoomSlider = document.getElementById('zoom-slider');
	const zoomValue = document.getElementById('zoom-value');

	const modeTile = document.getElementById('mode-tile');
	const modeArtistic = document.getElementById('mode-artistic');
	const standardThemeConfig = document.getElementById('standard-theme-config');
	const artisticThemeConfig = document.getElementById('artistic-theme-config');
	const labelsControl = document.getElementById('labels-control');

	const themeSelect = document.getElementById('theme-select');
	const artisticThemeSelect = document.getElementById('artistic-theme-select');
	const artisticDesc = document.getElementById('artistic-desc');

	if (artisticThemeSelect) {
		artisticThemeSelect.innerHTML = Object.keys(artisticThemes)
			.sort((a, b) => (artisticThemes[a].name || a).localeCompare(artisticThemes[b].name || b))
			.map(key => {
				const t = artisticThemes[key];
				return `<option value="${key}">${t.name || key}</option>`;
			})
			.join('\n');
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
	const overlayBgButtons = document.querySelectorAll('.overlay-bg-btn');
	const overlaySizeButtons = document.querySelectorAll('.overlay-size-btn');
	const overlaySizeGroup = document.getElementById('overlay-size-group');
	const customW = document.getElementById('custom-w');
	const customH = document.getElementById('custom-h');
	const presetBtns = document.querySelectorAll('.preset-btn');
	const exportBtn = document.getElementById('export-btn');

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
		  <div class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.shortName}">
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

		if (!cityOverrideInput || !cityOverrideInput.value.trim()) {
			updateState({ city: name.toUpperCase() });
		}
		updateState({ lat, lon });
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
		updateState({ lat });
		updateMapPosition(lat, state.lon);
	});

	lonInput.addEventListener('change', (e) => {
		const lon = parseFloat(e.target.value);
		updateState({ lon });
		updateMapPosition(state.lat, lon);
	});

	if (cityOverrideInput) {
		cityOverrideInput.value = state.cityOverride || '';
		cityOverrideInput.addEventListener('input', (e) => {
			const v = e.target.value;
			updateState({ cityOverride: v ? v.toUpperCase() : '' });
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

	artisticThemeSelect.addEventListener('change', (e) => {
		updateState({ artisticTheme: e.target.value });
		if (state.renderMode === 'artistic') {
			const theme = getSelectedArtisticTheme();
			updateArtisticStyle(theme);
		}
	});

	if (labelsToggle) {
		labelsToggle.addEventListener('change', (e) => {
			updateState({ showLabels: e.target.checked });
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
				if (size === 'none') {
					updateState({ overlaySize: size, overlayBgType: 'none' });
					overlayBgButtons.forEach(b => {
						b.disabled = true;
						b.classList.add('opacity-50', 'pointer-events-none');
					});
				} else {
					updateState({ overlaySize: size });
					overlayBgButtons.forEach(b => {
						b.disabled = false;
						b.classList.remove('opacity-50', 'pointer-events-none');
					});
				}
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

	customW.addEventListener('change', (e) => updateState({ width: parseInt(e.target.value) || state.width }));
	customH.addEventListener('change', (e) => updateState({ height: parseInt(e.target.value) || state.height }));

	return (currentState) => {
		if (cityOverrideInput) cityOverrideInput.value = currentState.cityOverride || '';
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
		artisticThemeSelect.value = currentState.artisticTheme;

		const artisticTheme = getSelectedArtisticTheme();
		artisticDesc.textContent = artisticTheme.description;

		if (labelsToggle) labelsToggle.checked = !!currentState.showLabels;
		if (overlayBgButtons && overlayBgButtons.length) {
			overlayBgButtons.forEach(b => {
				const style = b.dataset.bg;
				if (currentState.overlaySize === 'none') {
					b.disabled = true;
					b.classList.add('opacity-50', 'pointer-events-none');
				} else {
					b.disabled = false;
					b.classList.remove('opacity-50', 'pointer-events-none');
				}
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

		customW.value = currentState.width;
		customH.value = currentState.height;

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

export function updatePreviewStyles(currentState) {
	const posterContainer = document.getElementById('poster-container');
	const posterScaler = document.getElementById('poster-scaler');
	const displayCity = document.getElementById('display-city');
	const displayCoords = document.getElementById('display-coords');
	const overlay = document.getElementById('poster-overlay');
	const overlayBg = overlay ? overlay.querySelector('.overlay-bg') : null;
	const vignetteOverlay = document.getElementById('vignette-overlay');
	const divider = document.getElementById('poster-divider');

	const theme = getSelectedTheme();
	const artisticTheme = getSelectedArtisticTheme();

	const isArtistic = currentState.renderMode === 'artistic';
	const mapPreview = document.getElementById('map-preview');
	const artisticMapDiv = document.getElementById('artistic-map');

	const activeTheme = isArtistic ? artisticTheme : theme;

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

	const sizeChanged = lastWidth !== currentState.width || lastHeight !== currentState.height;
	lastWidth = currentState.width;
	lastHeight = currentState.height;

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
	displayCoords.textContent = formatCoords(currentState.lat, currentState.lon);
	displayCoords.style.color = activeTheme.text || activeTheme.textColor;

	if (overlay) {
		const size = currentState.overlaySize || 'medium';
		if (size === 'none') {
			overlay.style.display = 'none';
			if (overlayBg) {
				overlayBg.style.display = 'none';
				overlayBg.style.backdropFilter = '';
				overlayBg.style.webkitBackdropFilter = '';
			}
			if (vignetteOverlay) {
				vignetteOverlay.style.display = 'none';
				vignetteOverlay.style.opacity = '0';
				vignetteOverlay.style.background = '';
			}
		} else {
			overlay.style.display = '';
			const isMobile = window.innerWidth < 768;
			let pad = isMobile ? 24 : 48;
			let citySize = isMobile ? 32 : 64;
			let coordsSize = isMobile ? 10 : 16;

			if (size === 'small') {
				pad = isMobile ? 12 : 24;
				citySize = isMobile ? 24 : 40;
				coordsSize = isMobile ? 8 : 12;
			} else if (size === 'large') {
				pad = isMobile ? 40 : 80;
				citySize = isMobile ? 48 : 96;
				coordsSize = isMobile ? 14 : 20;
			}
			overlay.style.padding = `${pad}px`;
			displayCity.style.fontSize = `${citySize}px`;
			displayCoords.style.fontSize = `${coordsSize}px`;

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
	if (divider) divider.style.backgroundColor = activeTheme.text || activeTheme.textColor;

	if (sizeChanged) {
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
