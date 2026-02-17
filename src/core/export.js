import html2canvas from 'html2canvas';
import { getMapInstance, getArtisticMapInstance } from '../map/map-init.js';
import { state } from './state.js';

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

export async function exportToPNG(element, filename, statusElement) {
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

		const canvas = await html2canvas(element, {
			useCORS: true,
			scale: 1,
			logging: false,
			backgroundColor: '#ffffff',
			width: targetWidth,
			height: targetHeight,
			windowWidth: targetWidth,
			windowHeight: targetHeight,
			imageTimeout: 0,
			ignoreElements: (el) => {
				return el.id === 'map-preview' || el.id === 'artistic-map' || el.classList.contains('leaflet-control-container');
			},
			onclone: (clonedDoc) => {
				const clonedScaler = clonedDoc.querySelector('#poster-scaler');
				const clonedContainer = clonedDoc.querySelector('#poster-container');
				const clonedMain = clonedDoc.querySelector('main');

				clonedDoc.body.style.width = `${targetWidth}px`;
				clonedDoc.body.style.height = `${targetHeight}px`;
				clonedDoc.body.style.overflow = 'visible';

				if (clonedMain) {
					clonedMain.style.display = 'block';
					clonedMain.style.padding = '0';
					clonedMain.style.margin = '0';
					clonedMain.style.width = `${targetWidth}px`;
					clonedMain.style.height = `${targetHeight}px`;
					clonedMain.style.transform = 'none';
				}

				if (clonedScaler) {
					clonedScaler.style.transform = 'none';
					clonedScaler.style.width = `${targetWidth}px`;
					clonedScaler.style.height = `${targetHeight}px`;
					clonedScaler.style.margin = '0';
					clonedScaler.style.padding = '0';
				}

				if (clonedContainer) {
					clonedContainer.style.transform = 'none';
					clonedContainer.style.width = `${targetWidth}px`;
					clonedContainer.style.height = `${targetHeight}px`;
					clonedContainer.style.position = 'relative';
					clonedContainer.style.margin = '0';
					clonedContainer.style.boxShadow = 'none';
					clonedContainer.style.overflow = 'hidden';

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
					overlay.style.bottom = '0';
					overlay.style.left = '0';
					overlay.style.right = '0';
					overlay.style.padding = '120px 80px';
				}

				const city = clonedDoc.querySelector('#display-city');
				if (city) {
					city.style.fontSize = '120px';
					city.style.marginBottom = '40px';
				}

				const coords = clonedDoc.querySelector('#display-coords');
				if (coords) {
					coords.style.fontSize = '24px';
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
