import html2canvas from 'html2canvas';
import { getMapInstance, getArtisticMapInstance } from '../map/map-init.js';
import { state, getSelectedTheme, getSelectedArtisticTheme } from './state.js';
import { hexToRgba } from './utils.js';

async function captureMapSnapshot() {
	const artisticContainer = document.getElementById('artistic-map');
	const mapPreviewContainer = document.getElementById('map-preview');
	const posterContainer = document.getElementById('poster-container');

	if (!posterContainer) return null;

	const isArtistic = state.renderMode === 'artistic';

	const canvas = document.createElement('canvas');
	canvas.width = state.width;
	canvas.height = state.height;
	const ctx = canvas.getContext('2d');

	if (isArtistic) {
		const artisticMap = getArtisticMapInstance();
		if (artisticMap && artisticContainer) {
			try {
				const originalWidth = artisticContainer.style.width;
				const originalHeight = artisticContainer.style.height;

				artisticContainer.style.width = `${state.width}px`;
				artisticContainer.style.height = `${state.height}px`;
				artisticMap.resize();

				await new Promise(resolve => {
					const timer = setTimeout(resolve, 1500);
					artisticMap.once('idle', () => {
						clearTimeout(timer);
						resolve();
					});
				});

				const mapCanvas = artisticMap.getCanvas();
				ctx.drawImage(mapCanvas, 0, 0, canvas.width, canvas.height);
				const data = canvas.toDataURL('image/png');

				artisticContainer.style.width = originalWidth;
				artisticContainer.style.height = originalHeight;
				artisticMap.resize();

				return data;
			} catch (e) {
				console.error('Gagal capture Artistic Map:', e);
			}
		}
	} else if (mapPreviewContainer) {
		try {
			const tiles = Array.from(mapPreviewContainer.querySelectorAll('.leaflet-tile'));

			const containerRect = mapPreviewContainer.getBoundingClientRect();

			const scaleFactor = state.width / containerRect.width;

			tiles.forEach(tile => {
				if (tile.complete && tile.naturalWidth > 0) {
					const tileRect = tile.getBoundingClientRect();

					const x = (tileRect.left - containerRect.left) * scaleFactor;
					const y = (tileRect.top - containerRect.top) * scaleFactor;
					const w = tileRect.width * scaleFactor;
					const h = tileRect.height * scaleFactor;

					ctx.drawImage(tile, x, y, w, h);
				}
			});

			return canvas.toDataURL('image/png');
		} catch (e) {
			console.error('Gagal capture Leaflet Map:', e);
		}
	}
	return null;
}

export async function exportToPNG(element, filename, statusElement, options = {}) {
	if (statusElement) statusElement.classList.remove('hidden');

	const originalTransform = element.style.transform;
	const originalTransition = element.style.transition;

	try {
		const snapshot = await captureMapSnapshot();
		const targetWidth = state.width;
		const targetHeight = state.height;

		if (document.fonts && document.fonts.ready) {
			try { await document.fonts.ready; } catch (e) { }
		}

		const posterScalerEl = document.getElementById('poster-scaler');
		const posterContainerEl = document.getElementById('poster-container');
		const logicalContainerWidth = posterContainerEl ? (posterContainerEl.offsetWidth || targetWidth) : targetWidth;
		const logicalContainerHeight = posterContainerEl ? (posterContainerEl.offsetHeight || targetHeight) : targetHeight;
		const scale = logicalContainerWidth > 0 ? (targetWidth / logicalContainerWidth) : 1;

		const canvas = await html2canvas(element, {
			useCORS: true,
			scale: scale,
			logging: false,
			backgroundColor: '#ffffff',
			width: Math.round(logicalContainerWidth),
			height: Math.round(logicalContainerHeight),
			windowWidth: Math.round(logicalContainerWidth),
			windowHeight: Math.round(logicalContainerHeight),
			imageTimeout: 0,
			ignoreElements: (el) => {
				return el.id === 'map-preview' || el.id === 'artistic-map' || el.classList.contains('leaflet-control-container');
			},
			onclone: (clonedDoc) => {
				const isArtistic = state.renderMode === 'artistic';
				const theme = getSelectedTheme();
				const artisticTheme = getSelectedArtisticTheme();
				const activeTheme = isArtistic ? artisticTheme : theme;
				const themeColor = activeTheme.background || activeTheme.bg || activeTheme.overlayBg || '#ffffff';
				const textColor = activeTheme.text || activeTheme.textColor || '#000000';

				const clonedScaler = clonedDoc.querySelector('#poster-scaler');
				const clonedContainer = clonedDoc.querySelector('#poster-container');
				const clonedMain = clonedDoc.querySelector('main');

				clonedDoc.body.style.width = `${Math.round(logicalContainerWidth)}px`;
				clonedDoc.body.style.height = `${Math.round(logicalContainerHeight)}px`;
				clonedDoc.body.style.overflow = 'visible';

				if (clonedMain) {
					clonedMain.style.display = 'block';
					clonedMain.style.padding = '0';
					clonedMain.style.margin = '0';
					clonedMain.style.width = `${Math.round(logicalContainerWidth)}px`;
					clonedMain.style.height = `${Math.round(logicalContainerHeight)}px`;
					clonedMain.style.transform = 'none';
				}

				if (clonedScaler) {
					clonedScaler.style.transform = 'none';
					clonedScaler.style.width = `${Math.round(logicalContainerWidth)}px`;
					clonedScaler.style.height = `${Math.round(logicalContainerHeight)}px`;
					clonedScaler.style.margin = '0';
					clonedScaler.style.padding = '0';
				}

				if (clonedContainer) {
					clonedContainer.style.transform = 'none';
					clonedContainer.style.width = `${Math.round(logicalContainerWidth)}px`;
					clonedContainer.style.height = `${Math.round(logicalContainerHeight)}px`;
					clonedContainer.style.position = 'relative';
					clonedContainer.style.margin = '0';
					clonedContainer.style.boxShadow = 'none';
					clonedContainer.style.overflow = 'hidden';
					clonedContainer.style.backgroundColor = activeTheme.background || activeTheme.bg || '#ffffff';

					const cMap = clonedDoc.querySelector('#map-preview');
					const cArt = clonedDoc.querySelector('#artistic-map');
					if (cMap) cMap.style.visibility = 'hidden';
					if (cArt) cArt.style.visibility = 'hidden';

					if (snapshot) {
						const img = clonedDoc.createElement('img');
						img.src = snapshot;
						img.style.position = 'absolute';
						img.style.top = '0';
						img.style.left = '0';
						img.style.width = '100%';
						img.style.height = '100%';
						img.style.objectFit = 'cover';
						img.style.zIndex = '0';
						img.style.display = 'block';
						clonedContainer.prepend(img);
					}
				}

				const overlay = clonedDoc.querySelector('#poster-overlay');
				if (overlay) {
					overlay.style.transform = 'none';
					overlay.style.position = 'absolute';
					overlay.style.left = '0';
					overlay.style.right = '0';
					overlay.style.bottom = '0';
					overlay.style.zIndex = '4';

					const clonedOverlayBg = clonedDoc.querySelector('.overlay-bg');
					if (clonedOverlayBg && clonedContainer) {
						clonedContainer.appendChild(clonedOverlayBg);
						clonedOverlayBg.style.position = 'absolute';
						clonedOverlayBg.style.top = '0';
						clonedOverlayBg.style.left = '0';
						clonedOverlayBg.style.right = '0';
						clonedOverlayBg.style.bottom = '0';
						clonedOverlayBg.style.width = '100%';
						clonedOverlayBg.style.height = '100%';
						clonedOverlayBg.style.pointerEvents = 'none';
						clonedOverlayBg.style.zIndex = '1';
						clonedOverlayBg.style.display = 'none';
					}
				}

				const clonedVignette = clonedDoc.querySelector('#vignette-overlay');
				if (clonedVignette && clonedContainer) {
					clonedVignette.style.position = 'absolute';
					clonedVignette.style.top = '0';
					clonedVignette.style.left = '0';
					clonedVignette.style.right = '0';
					clonedVignette.style.bottom = '0';
					clonedVignette.style.width = '100%';
					clonedVignette.style.height = '100%';
					clonedVignette.style.pointerEvents = 'none';
					clonedVignette.style.zIndex = '2';

					if (state.overlayBgType === 'vignette') {
						clonedVignette.style.display = 'block';
						clonedVignette.style.opacity = '1';
						const colorSolid = hexToRgba(themeColor, 1);
						const colorTrans = hexToRgba(themeColor, 0);
						clonedVignette.style.background = `linear-gradient(to bottom, ${colorSolid} 0%, ${colorSolid} 3%, ${colorTrans} 20%, ${colorTrans} 80%, ${colorSolid} 97%, ${colorSolid} 100%)`;
					} else {
						clonedVignette.style.display = 'none';
					}
				}

				const city = clonedDoc.querySelector('#display-city');
				if (city) {
					city.style.transform = 'none';
					city.style.color = textColor;
				}

				const coords = clonedDoc.querySelector('#display-coords');
				if (coords) {
					coords.style.transform = 'none';
					coords.style.color = textColor;
				}

				const clonedDivider = clonedDoc.querySelector('#poster-divider');
				if (clonedDivider) {
					clonedDivider.style.transform = 'none';
					clonedDivider.style.backgroundColor = textColor;

					const opts = Object.assign({ dividerOffset: 72 }, options || {});
					const dividerOffset = typeof opts.dividerOffset === 'number' ? opts.dividerOffset : 0;

					if (dividerOffset && city) {
						if (dividerOffset > 0) {
							city.style.marginBottom = (parseFloat(city.style.marginBottom || '0') + dividerOffset) + 'px';
						} else {
							clonedDivider.style.marginTop = (parseFloat(clonedDivider.style.marginTop || '0') + dividerOffset) + 'px';
						}
					}
				}
			}
		});

		const link = document.createElement('a');
		link.download = filename;
		link.href = canvas.toDataURL('image/png', 1.0);
		link.click();
	} catch (error) {
		console.error('Export failed:', error);
		alert('Export failed. Please check internet connection or try again.');
	} finally {
		if (statusElement) statusElement.classList.add('hidden');
	}
}
