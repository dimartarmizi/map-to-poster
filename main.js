import './style.css';

import { subscribe, state, getSelectedTheme } from './src/core/state.js';
import { initMap, updateMapTheme, invalidateMapSize, waitForTilesLoad, waitForArtisticIdle, updateMarkerStyles, updateRouteStyles } from './src/map/map-init.js';
import { setupControls, updatePreviewStyles } from './src/ui/form.js';
import { exportToPNG } from './src/core/export.js';

const initialTheme = getSelectedTheme();
initMap('map-preview', [state.lat, state.lon], state.zoom, initialTheme.tileUrl);

const syncUI = setupControls();

const exportBtn = document.getElementById('export-btn');
const mobileExportBtn = document.getElementById('mobile-export-btn');
const posterContainer = document.getElementById('poster-container');

let _exportCheckInProgress = false;
const originalExportInner = exportBtn ? exportBtn.innerHTML : '';
let exportLoadingMode = null;

subscribe((currentState) => {
	if (currentState.renderMode === 'tile') {
		const theme = getSelectedTheme();
		const tileUrl = currentState.showLabels ? theme.tileUrl : theme.tileUrlNoLabels;
		updateMapTheme(tileUrl);
	}

	updatePreviewStyles(currentState);

	updateMarkerStyles(currentState);
	updateRouteStyles(currentState);

	syncUI(currentState);
	ensurePreviewReady();
});

function setExportButtonLoading(loading, mode = 'loading') {
	const buttons = [exportBtn, mobileExportBtn].filter(Boolean);
	if (loading && mode === 'loading' && exportLoadingMode === 'processing') return;

	if (loading) exportLoadingMode = mode; else exportLoadingMode = null;

	buttons.forEach(btn => {
		btn.disabled = !!loading;
		btn.setAttribute('aria-busy', loading ? 'true' : 'false');
		btn.classList.toggle('opacity-60', !!loading);
		btn.classList.toggle('cursor-not-allowed', !!loading);
	});

	if (exportBtn) {
		if (loading) {
			exportBtn.innerHTML = `
				<div class="flex items-center justify-center space-x-3">
					<div class="flex items-center space-x-1">
						<div class="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style="animation-delay: 0s"></div>
						<div class="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
						<div class="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
					</div>
					<span>${mode === 'processing' ? 'Processing...' : 'Loading...'}</span>
				</div>
			`;
		} else {
			exportBtn.innerHTML = originalExportInner;
		}
	}

	if (mobileExportBtn) {
		if (loading) {
			mobileExportBtn.innerHTML = `<svg class="w-6 h-6 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
		} else {
			mobileExportBtn.innerHTML = `<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>`;
		}
	}
}

async function ensurePreviewReady() {
	if (_exportCheckInProgress) return;
	if (exportLoadingMode === 'processing') return;
	_exportCheckInProgress = true;
	try {
		setExportButtonLoading(true, 'loading');
		if (state.renderMode === 'artistic') {
			await waitForArtisticIdle(3000);
		} else {
			await waitForTilesLoad(5000);
		}
	} finally {
		setExportButtonLoading(false);
		_exportCheckInProgress = false;
	}
}

exportBtn.addEventListener('click', async () => {
	const filename = `MapToPoster-${state.city.replace(/\s+/g, '-')}-${Date.now()}.png`;
	setExportButtonLoading(true, 'processing');
	try {
		await exportToPNG(posterContainer, filename, null);
	} finally {
		setExportButtonLoading(false);
	}
});

mobileExportBtn?.addEventListener('click', async () => {
	const filename = `MapToPoster-${state.city.replace(/\s+/g, '-')}-${Date.now()}.png`;
	setExportButtonLoading(true, 'processing');
	try {
		await exportToPNG(posterContainer, filename, null);
	} finally {
		setExportButtonLoading(false);
	}
});

ensurePreviewReady();

window.addEventListener('resize', () => {
	updatePreviewStyles(state);
});

setTimeout(invalidateMapSize, 500);
