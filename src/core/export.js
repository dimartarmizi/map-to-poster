import html2canvas from 'html2canvas';
import { getMapInstance, getArtisticMapInstance } from '../map/map-init.js';
import { state, getSelectedTheme, getSelectedArtisticTheme } from './state.js';
import { hexToRgba } from './utils.js';

const MARKER_ICONS_EXPORT = {
	pin: `<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
		</svg>`,
	circle: `<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<path fill-rule="evenodd" clip-rule="evenodd" d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9Z" />
		</svg>`,
	heart: `<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
		</svg>`,
	star: `<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
		</svg>`,
	none: `<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
			<circle cx="12" cy="12" r="2" />
		</svg>`
};

function project(lat, lon, scale) {
	const siny = Math.sin(lat * Math.PI / 180);
	const y = 0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI);
	return {
		x: (lon + 180) / 360 * scale,
		y: y * scale
	};
}

async function captureMapSnapshot() {
	const artisticContainer = document.getElementById('artistic-map');
	const mapPreviewContainer = document.getElementById('map-preview');
	const posterContainer = document.getElementById('poster-container');

	if (!posterContainer) return null;

	const isArtistic = state.renderMode === 'artistic';

	const matWidth = state.matEnabled ? (state.matWidth || 0) : 0;
	const effectiveWidth = state.width - (2 * matWidth);
	const effectiveHeight = state.height - (2 * matWidth);

	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, effectiveWidth);
	canvas.height = Math.max(1, effectiveHeight);
	const ctx = canvas.getContext('2d');

	if (isArtistic) {
		const artisticMap = getArtisticMapInstance();
		if (artisticMap && artisticContainer) {
			try {
				const originalWidth = artisticContainer.style.width;
				const originalHeight = artisticContainer.style.height;

				artisticContainer.style.width = `${effectiveWidth}px`;
				artisticContainer.style.height = `${effectiveHeight}px`;
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

				if (state.showMarker) {
					const zoom = artisticMap.getZoom();
					const center = artisticMap.getCenter();
					const scale = Math.pow(2, zoom) * 512;
					const centerPoint = project(center.lat, center.lng, scale);
					const markerPoint = project(state.markerLat, state.markerLon, scale);

					const x = (canvas.width / 2) + (markerPoint.x - centerPoint.x);
					const y = (canvas.height / 2) + (markerPoint.y - centerPoint.y);

					const theme = getSelectedArtisticTheme();
					const color = theme.road_primary || theme.text || '#0f172a';

					await drawMarkerToCtx(ctx, x, y, color);
				}

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

			const scaleFactor = effectiveWidth / containerRect.width;

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

			if (state.showMarker) {
				const map = getMapInstance();
				const zoom = map.getZoom();
				const center = map.getCenter();
				const scaleMap = Math.pow(2, zoom) * 256;
				const centerPoint = project(center.lat, center.lng, scaleMap);
				const markerPoint = project(state.markerLat, state.markerLon, scaleMap);

				const x = (canvas.width / 2) + (markerPoint.x - centerPoint.x);
				const y = (canvas.height / 2) + (markerPoint.y - centerPoint.y);

				const theme = getSelectedTheme();
				const color = theme.text || theme.textColor || '#0f172a';

				await drawMarkerToCtx(ctx, x, y, color);
			}

			return canvas.toDataURL('image/png');
		} catch (e) {
			console.error('Gagal capture Leaflet Map:', e);
		}
	}
	return null;
}

async function drawMarkerToCtx(ctx, x, y, color) {
	const { state } = await import('./state.js');
	const iconType = state.markerIcon || 'pin';
	const baseSize = 40;
	const size = Math.round(baseSize * (state.markerSize || 1));
	const svgString = MARKER_ICONS_EXPORT[iconType] || MARKER_ICONS_EXPORT.pin;
	const svg = svgString
		.replace('currentColor', color)
		.replace('width="100"', `width="${size}"`)
		.replace('height="100"', `height="${size}"`);

	return new Promise((resolve) => {
		const img = new Image();
		const url = 'data:image/svg+xml;base64,' + btoa(svg);

		img.onload = () => {
			const anchorX = size / 2;
			const anchorY = iconType === 'pin' ? size : size / 2;
			ctx.drawImage(img, x - anchorX, y - anchorY, size, size);
			resolve();
		};
		img.onerror = () => resolve();
		img.src = url;
	});
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
					const cBorder = clonedDoc.querySelector('#mat-border');
					if (cMap) cMap.style.visibility = 'hidden';
					if (cArt) cArt.style.visibility = 'hidden';
					if (cBorder) cBorder.style.visibility = 'hidden';

					const matEnabled = state.matEnabled;
					const matWidthLogical = matEnabled ? (state.matWidth / scale) : 0;

					if (snapshot) {
						const img = clonedDoc.createElement('img');
						img.src = snapshot;
						img.style.position = 'absolute';
						img.style.top = `${matWidthLogical}px`;
						img.style.left = `${matWidthLogical}px`;
						img.style.width = `${logicalContainerWidth - 2 * matWidthLogical}px`;
						img.style.height = `${logicalContainerHeight - 2 * matWidthLogical}px`;
						img.style.objectFit = 'cover';
						img.style.zIndex = '0';
						img.style.display = 'block';

						if (matEnabled && state.matShowBorder) {
							const borderDiv = clonedDoc.createElement('div');
							borderDiv.style.position = 'absolute';
							borderDiv.style.top = `${matWidthLogical}px`;
							borderDiv.style.left = `${matWidthLogical}px`;
							borderDiv.style.width = `${logicalContainerWidth - 2 * matWidthLogical}px`;
							borderDiv.style.height = `${logicalContainerHeight - 2 * matWidthLogical}px`;
							const borderWidth = (state.matBorderWidth || 1) / scale;
							borderDiv.style.border = `${borderWidth}px solid ${textColor}`;
							borderDiv.style.opacity = state.matBorderOpacity || 1;
							borderDiv.style.zIndex = '6';
							borderDiv.style.pointerEvents = 'none';
							borderDiv.style.boxSizing = 'border-box';
							clonedContainer.appendChild(borderDiv);
						}

						clonedContainer.prepend(img);
					}

					const vignette = clonedDoc.querySelector('#vignette-overlay');
					if (vignette) {
						vignette.style.position = 'absolute';
						vignette.style.top = `${matWidthLogical}px`;
						vignette.style.left = `${matWidthLogical}px`;
						vignette.style.width = `${logicalContainerWidth - 2 * matWidthLogical}px`;
						vignette.style.height = `${logicalContainerHeight - 2 * matWidthLogical}px`;
						vignette.style.pointerEvents = 'none';
						vignette.style.zIndex = '5';

						if (state.overlayBgType === 'vignette') {
							vignette.style.display = 'block';
							vignette.style.opacity = '1';
							const colorSolid = hexToRgba(themeColor, 1);
							const colorTrans = hexToRgba(themeColor, 0);
							vignette.style.background = `linear-gradient(to bottom, ${colorSolid} 0%, ${colorSolid} 3%, ${colorTrans} 20%, ${colorTrans} 80%, ${colorSolid} 97%, ${colorSolid} 100%)`;
						} else {
							vignette.style.display = 'none';
						}
					}
				}

				const overlay = clonedDoc.querySelector('#poster-overlay');
				if (overlay) {
					overlay.style.transform = 'none';
					overlay.style.position = 'absolute';

					const matEnabled = state.matEnabled;
					const matWidthLogical = matEnabled ? (state.matWidth / scale) : 0;
					const liftOffset = 20 / scale;

					if (matEnabled) {
						overlay.style.left = `${matWidthLogical}px`;
						overlay.style.right = `${matWidthLogical}px`;
						overlay.style.bottom = `${matWidthLogical + liftOffset}px`;
					} else {
						overlay.style.left = '0';
						overlay.style.right = '0';
						overlay.style.bottom = `${liftOffset}px`;
					}
					overlay.style.zIndex = '10';

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

				const city = clonedDoc.querySelector('#display-city');
				if (city) {
					city.style.transform = 'none';
					city.style.color = textColor;
					city.style.fontFamily = state.cityFont;
				}

				const country = clonedDoc.querySelector('#display-country');
				if (country) {
					country.style.transform = 'none';
					country.style.color = textColor;
					country.style.fontFamily = state.countryFont;
				}

				const coords = clonedDoc.querySelector('#display-coords');
				if (coords) {
					coords.style.transform = 'none';
					coords.style.color = textColor;
					coords.style.fontFamily = state.coordsFont;
				}

				const attr = clonedDoc.querySelector('#poster-attribution');
				if (attr) {
					attr.style.color = textColor;
					const matWidthLogical = state.matEnabled ? (state.matWidth / scale) : 0;
					attr.style.right = `${matWidthLogical + (12 / scale)}px`;
					attr.style.bottom = `${matWidthLogical + (12 / scale)}px`;
					attr.style.fontSize = `${8 / scale}px`;
					attr.style.opacity = '0.35';
				}

				const clonedDivider = clonedDoc.querySelector('#poster-divider');
				if (clonedDivider) {
					clonedDivider.style.transform = 'none';
					clonedDivider.style.backgroundColor = textColor;

					const defaultDividerOffsets = { small: 32, medium: 40, large: 56 };
					const opts = Object.assign({}, options || {});
					let dividerOffset = 0;
					if (typeof opts.dividerOffset === 'number') {
						dividerOffset = opts.dividerOffset;
					} else if (opts.dividerOffsets && typeof opts.dividerOffsets[state.overlaySize || 'medium'] === 'number') {
						dividerOffset = opts.dividerOffsets[state.overlaySize || 'medium'];
					} else {
						const sizeKey = state.overlaySize || 'medium';
						dividerOffset = defaultDividerOffsets[sizeKey] || 0;
					}

					if (dividerOffset && city) {
						if (dividerOffset > 0) {
							city.style.marginBottom = dividerOffset + 'px';
						} else {
							clonedDivider.style.marginTop = dividerOffset + 'px';
						}

						clonedDivider.style.marginBottom = Math.round(dividerOffset * 0.2) + 'px';
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
