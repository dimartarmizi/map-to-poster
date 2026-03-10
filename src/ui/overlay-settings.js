import { state, updateState, defaultState } from '../core/state.js';
import { outputPresets } from '../core/output-presets.js';

export function setupOverlaySettings() {
	const overlayBgButtons = document.querySelectorAll('.overlay-bg-btn');
	const overlaySizeButtons = document.querySelectorAll('.overlay-size-btn');
	const overlaySizeGroup = document.getElementById('overlay-size-group');
	const customW = document.getElementById('custom-w');
	const customH = document.getElementById('custom-h');
	const presetBtns = document.querySelectorAll('.preset-btn');

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

	const overlayPosBtns = document.querySelectorAll('.overlay-pos-btn');
	const overlayPositionGroup = document.getElementById('overlay-position-group');

	const otherPresetsBtn = document.getElementById('other-presets-btn');
	const presetsModal = document.getElementById('presets-modal');
	const closeModal = document.getElementById('close-modal');
	const closeModalBtn = document.getElementById('close-modal-btn');
	const modalContent = document.getElementById('modal-content');
	const modalOverlay = document.getElementById('modal-overlay');

	// Credits modal
	const logoBtn = document.getElementById('logo-btn');
	const creditsModal = document.getElementById('credits-modal');
	const closeCredits = document.getElementById('close-credits');
	const creditsOverlay = document.getElementById('credits-overlay');

	if (logoBtn) {
		logoBtn.addEventListener('click', () => { if (creditsModal) creditsModal.classList.add('show'); });
	}
	[closeCredits, creditsOverlay].forEach(el => {
		if (el) el.addEventListener('click', () => { if (creditsModal) creditsModal.classList.remove('show'); });
	});

	// Presets modal
	if (otherPresetsBtn) {
		otherPresetsBtn.addEventListener('click', () => {
			presetsModal.classList.add('show');
			populateModal();
		});
	}
	[closeModal, closeModalBtn, modalOverlay].forEach(el => {
		if (el) el.addEventListener('click', () => { if (presetsModal) presetsModal.classList.remove('show'); });
	});

	// Mat controls
	if (matToggle) matToggle.addEventListener('change', (e) => updateState({ matEnabled: e.target.checked }));
	if (matWidthSlider) matWidthSlider.addEventListener('input', (e) => updateState({ matWidth: parseInt(e.target.value) }));
	if (matBorderToggle) matBorderToggle.addEventListener('change', (e) => updateState({ matShowBorder: e.target.checked }));
	if (matBorderWidthSlider) matBorderWidthSlider.addEventListener('input', (e) => updateState({ matBorderWidth: parseInt(e.target.value) }));
	if (matBorderOpacitySlider) matBorderOpacitySlider.addEventListener('input', (e) => updateState({ matBorderOpacity: parseFloat(e.target.value) }));

	// Overlay bg/size
	if (overlayBgButtons) {
		overlayBgButtons.forEach(btn => {
			btn.addEventListener('click', () => updateState({ overlayBgType: btn.dataset.bg }));
		});
	}
	if (overlaySizeGroup && overlaySizeButtons) {
		overlaySizeButtons.forEach(btn => {
			btn.addEventListener('click', () => updateState({ overlaySize: btn.dataset.size }));
		});
	}

	// Preset size buttons
	presetBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			updateState({ width: parseInt(btn.dataset.width), height: parseInt(btn.dataset.height) });
		});
	});

	// Custom size
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

	// Reset
	const resetSettingsBtn = document.getElementById('reset-settings-btn');
	function doResetSettings() {
		if (confirm('Are you sure you want to reset all settings?')) updateState(defaultState);
	}
	if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', doResetSettings);
	['mobile-reset-a-btn', 'mobile-reset-b-btn', 'mobile-reset-c-btn'].forEach(id => {
		document.getElementById(id)?.addEventListener('click', doResetSettings);
	});

	// Overlay position
	overlayPosBtns.forEach(btn => {
		btn.addEventListener('click', () => {
			updateState({ overlayX: parseFloat(btn.dataset.overlayX), overlayY: parseFloat(btn.dataset.overlayY) });
		});
	});

	const resetOverlayPosBtn = document.getElementById('reset-overlay-pos-btn');
	if (resetOverlayPosBtn) {
		resetOverlayPosBtn.addEventListener('click', () => updateState({ overlayX: 0.5, overlayY: 0.85 }));
	}

	// Overlay drag
	const draggableOverlay = document.getElementById('poster-overlay');
	const posterContainerForDrag = document.getElementById('poster-container');

	if (draggableOverlay && posterContainerForDrag) {
		let isDragging = false;
		let dragStartClientX = 0, dragStartClientY = 0;
		let dragStartOverlayX = 0.5, dragStartOverlayY = 0.85;

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
			updateState({
				overlayX: Math.max(minX, Math.min(maxX, dragStartOverlayX + dx)),
				overlayY: Math.max(minY, Math.min(maxY, dragStartOverlayY + dy))
			});
		};

		const endDrag = () => {
			if (!isDragging) return;
			isDragging = false;
			draggableOverlay.style.cursor = '';
			document.body.style.userSelect = '';
		};

		draggableOverlay.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); });
		document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
		document.addEventListener('mouseup', endDrag);
		draggableOverlay.addEventListener('touchstart', (e) => {
			if (e.touches.length === 1) { startDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
		}, { passive: false });
		document.addEventListener('touchmove', (e) => {
			if (isDragging && e.touches.length === 1) { doDrag(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
		}, { passive: false });
		document.addEventListener('touchend', endDrag);
	}

	function populateModal() {
		if (!modalContent) return;
		modalContent.textContent = '';

		const searchDiv = document.createElement('div');
		searchDiv.className = 'mb-4';
		const searchInput = document.createElement('input');
		searchInput.id = 'preset-search';
		searchInput.type = 'search';
		searchInput.placeholder = 'Search sizes or preset names...';
		searchInput.className = 'w-full input-field';
		searchDiv.appendChild(searchInput);
		modalContent.appendChild(searchDiv);

		const groupsContainer = document.createElement('div');
		groupsContainer.className = 'space-y-6';

		Object.entries(outputPresets)
			.filter(([, presets]) => Array.isArray(presets) && presets.length > 0)
			.forEach(([key, presets]) => {
				const group = document.createElement('div');
				group.className = 'space-y-4 preset-group';

				const header = document.createElement('div');
				header.className = 'flex items-center space-x-3';
				const bar = document.createElement('div');
				bar.className = 'w-1 h-5 bg-accent rounded-full';
				header.appendChild(bar);
				const title = document.createElement('h3');
				title.className = 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]';
				title.textContent = key.replace('_', ' ');
				header.appendChild(title);
				group.appendChild(header);

				const grid = document.createElement('div');
				grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3';

				presets.forEach(p => {
					const isActive = state.width === p.width && state.height === p.height;
					const btn = document.createElement('button');
					btn.className = `modal-preset-btn group flex flex-col items-start p-4 border ${isActive ? 'border-accent bg-accent-light' : 'border-slate-100 bg-slate-50/50'} rounded-2xl hover:border-accent hover:bg-white hover:shadow-xl transition-all text-left`;
					btn.dataset.width = p.width;
					btn.dataset.height = p.height;
					const nameSpan = document.createElement('span');
					nameSpan.className = `text-[11px] font-bold ${isActive ? 'text-accent' : 'text-slate-800'} group-hover:text-accent transition-colors`;
					nameSpan.textContent = p.name;
					const dimSpan = document.createElement('span');
					dimSpan.className = `text-[9px] ${isActive ? 'text-accent/60' : 'text-slate-400'} font-bold mt-1 uppercase tracking-tight`;
					dimSpan.textContent = `${p.width} \u00D7 ${p.height} px`;
					btn.appendChild(nameSpan);
					btn.appendChild(dimSpan);
					grid.appendChild(btn);
				});

				group.appendChild(grid);
				groupsContainer.appendChild(group);
			});

		modalContent.appendChild(groupsContainer);

		modalContent.querySelectorAll('.modal-preset-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				updateState({ width: parseInt(btn.dataset.width), height: parseInt(btn.dataset.height) });
				presetsModal.classList.remove('show');
			});
		});

		let presetSearchTimeout = null;
		searchInput.addEventListener('input', (e) => {
			clearTimeout(presetSearchTimeout);
			const q = (e.target.value || '').trim().toLowerCase();
			presetSearchTimeout = setTimeout(() => {
				modalContent.querySelectorAll('.modal-preset-btn').forEach(btn => {
					const txt = (btn.innerText || '').toLowerCase();
					const dims = `${btn.dataset.width} ${btn.dataset.height}`;
					btn.style.display = q ? ((txt.indexOf(q) !== -1 || dims.indexOf(q) !== -1) ? '' : 'none') : '';
				});
				modalContent.querySelectorAll('.preset-group').forEach(group => {
					const anyVisible = Array.from(group.querySelectorAll('.modal-preset-btn')).some(b => b.style.display !== 'none');
					group.style.display = anyVisible ? '' : 'none';
				});
			}, 120);
		});
	}

	return {
		syncOverlayUI(currentState) {
			const curX = currentState.overlayX !== undefined ? currentState.overlayX : 0.5;
			const curY = currentState.overlayY !== undefined ? currentState.overlayY : 0.85;

			if (overlayPositionGroup) {
				overlayPositionGroup.classList.toggle('hidden', (currentState.overlaySize || 'medium') === 'none');
			}
			const TOLERANCE = 0.02;
			overlayPosBtns.forEach(btn => {
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
		}
	};
}
