import { state, updateState, getSelectedArtisticTheme } from '../core/state.js';
import { artisticThemes } from '../core/artistic-themes.js';
import { themes } from '../core/themes.js';
import { loadCustomThemes, saveCustomTheme, deleteCustomTheme, newCustomThemeKey, exportCustomThemes, importCustomThemesFromJSON, clearCustomThemes } from '../core/custom-themes.js';
import { updateArtisticStyle, updateMapTheme, invalidateMapSize, updateMarkerStyles, updateRouteStyles } from '../map/map-init.js';
import { getSelectedTheme } from '../core/state.js';

const paletteFor = (t) => {
	const candidates = [t.road_motorway, t.road_primary, t.road_secondary, t.road_tertiary, t.text, t.bg];
	return candidates.map(c => c || '#cccccc').slice(0, 4);
};

const CT_FIELDS = [
	{ id: 'ct-bg', key: 'bg' },
	{ id: 'ct-text', key: 'text' },
	{ id: 'ct-water', key: 'water' },
	{ id: 'ct-parks', key: 'parks' },
	{ id: 'ct-road-motorway', key: 'road_motorway' },
	{ id: 'ct-road-primary', key: 'road_primary' },
	{ id: 'ct-road-secondary', key: 'road_secondary' },
	{ id: 'ct-road-tertiary', key: 'road_tertiary' },
	{ id: 'ct-road-residential', key: 'road_residential' },
	{ id: 'ct-road-default', key: 'road_default' },
	{ id: 'ct-route', key: 'route' },
];

export function setupThemePicker() {
	const artisticMainGrid = document.getElementById('artistic-main-grid');
	const artisticDesc = document.getElementById('artistic-desc');
	const themeSelect = document.getElementById('theme-select');
	const modeTile = document.getElementById('mode-tile');
	const modeArtistic = document.getElementById('mode-artistic');
	const standardThemeConfig = document.getElementById('standard-theme-config');
	const artisticThemeConfig = document.getElementById('artistic-theme-config');
	const labelsControl = document.getElementById('labels-control');
	const labelsToggle = document.getElementById('show-labels-toggle');
	const exportBtn = document.getElementById('export-btn');

	const artisticModal = document.getElementById('artistic-modal');
	const artisticModalContent = document.getElementById('artistic-modal-content');
	const closeArtisticModal = document.getElementById('close-artistic-modal');
	const closeArtisticModalBtn = document.getElementById('close-artistic-modal-btn');
	const artisticModalOverlay = document.getElementById('artistic-modal-overlay');

	const ctModal = document.getElementById('custom-theme-modal');
	const ctModalTitle = document.getElementById('custom-theme-modal-title');
	const ctSaveBtn = document.getElementById('custom-theme-save-btn');
	const ctDeleteBtn = document.getElementById('custom-theme-delete-btn');
	const ctCancelBtn = document.getElementById('custom-theme-cancel-btn');
	const ctCloseBtn = document.getElementById('close-custom-theme-modal');
	const ctOverlay = document.getElementById('custom-theme-modal-overlay');

	let _editingCustomKey = null;

	if (artisticMainGrid) {
		const mainKeys = ['cyber_noir', 'golden_era', 'mangrove_maze'];

		const makeCard = (key, theme, isOther = false) => {
			const p = paletteFor(theme);
			const label = theme && theme.name ? theme.name : (isOther ? 'Other Theme' : key);
			const el = document.createElement('button');
			el.type = 'button';
			el.dataset.key = key;
			el.className = 'art-card group p-3 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col items-center text-center hover:shadow-xl transition-all';
			const swatchDiv = document.createElement('div');
			swatchDiv.className = 'flex items-center justify-center -space-x-2';
			p.forEach(color => {
				const span = document.createElement('span');
				span.className = 'w-6 h-6 rounded-full ring-1 ring-white';
				span.style.background = color;
				swatchDiv.appendChild(span);
			});
			el.appendChild(swatchDiv);
			const labelDiv = document.createElement('div');
			labelDiv.className = 'mt-3 text-[11px] font-semibold text-slate-900';
			labelDiv.textContent = label;
			el.appendChild(labelDiv);
			return el;
		};

		artisticMainGrid.textContent = '';
		mainKeys.forEach(k => artisticMainGrid.appendChild(makeCard(k, artisticThemes[k] || {})));
		artisticMainGrid.appendChild(makeCard('other', { name: 'Other Theme' }, true));

		artisticMainGrid.querySelectorAll('.art-card').forEach(btn => {
			btn.addEventListener('click', () => {
				const k = btn.dataset.key;
				if (k === 'other') {
					if (artisticModal) {
						artisticModal.classList.add('show');
						populateArtisticModal();
					}
					return;
				}
				updateState({ artisticTheme: k });
				if (state.renderMode === 'artistic') {
					const theme = getSelectedArtisticTheme();
					updateArtisticStyle(theme);
					updateRouteStyles(state);
				}
			});
		});
	}

	if (themeSelect) {
		themeSelect.textContent = '';
		Object.keys(themes)
			.sort((a, b) => (themes[a].name || a).localeCompare(themes[b].name || b))
			.forEach(key => {
				const opt = document.createElement('option');
				opt.value = key;
				opt.textContent = themes[key].name || key;
				themeSelect.appendChild(opt);
			});

		let _themeChangeTimer = null;
		const onThemeInput = (e) => {
			const v = e.target.value;
			clearTimeout(_themeChangeTimer);
			_themeChangeTimer = setTimeout(() => {
				updateState({ theme: v });
				if (state.renderMode === 'tile') {
					const t = getSelectedTheme();
					if (t && t.tileUrl) updateMapTheme(t.tileUrl);
					invalidateMapSize();
					updateRouteStyles(state);
					updateMarkerStyles(state);
				}
			}, 120);
		};
		themeSelect.addEventListener('change', onThemeInput);
		themeSelect.addEventListener('input', onThemeInput);
	}

	modeTile.addEventListener('click', () => {
		updateState({ renderMode: 'tile' });
		updateRouteStyles(state);
	});
	modeArtistic.addEventListener('click', () => {
		updateState({ renderMode: 'artistic' });
		updateRouteStyles(state);
	});

	if (labelsToggle) {
		labelsToggle.addEventListener('change', (e) => {
			updateState({ showLabels: e.target.checked });
		});
	}

	[closeArtisticModal, closeArtisticModalBtn, artisticModalOverlay].forEach(el => {
		if (el) el.addEventListener('click', () => { if (artisticModal) artisticModal.classList.remove('show'); });
	});

	CT_FIELDS.forEach(({ id }) => {
		const picker = document.getElementById(id);
		const hex = document.getElementById(id + '-hex');
		if (!picker || !hex) return;
		picker.addEventListener('input', () => { hex.value = picker.value; });
		hex.addEventListener('input', () => {
			if (/^#[0-9a-fA-F]{6}$/.test(hex.value.trim())) picker.value = hex.value.trim();
		});
	});

	function openCustomThemeEditor(key = null) {
		_editingCustomKey = key;
		ctModalTitle.textContent = key ? 'Edit Custom Theme' : 'Create Custom Theme';
		ctDeleteBtn.classList.toggle('hidden', !key);
		const existing = key ? (loadCustomThemes()[key] || {}) : {};
		document.getElementById('ct-name').value = existing.name || '';
		document.getElementById('ct-desc').value = existing.description || '';
		CT_FIELDS.forEach(({ id, key: fieldKey }) => {
			const picker = document.getElementById(id);
			const hexEl = document.getElementById(id + '-hex');
			const val = existing[fieldKey] || picker.defaultValue || '#000000';
			if (picker) picker.value = val;
			if (hexEl) hexEl.value = val;
		});
		ctModal.classList.add('show');
	}

	function closeCustomThemeEditor() {
		ctModal.classList.remove('show');
		_editingCustomKey = null;
		populateArtisticModal();
		artisticModal?.classList.add('show');
	}

	[ctCancelBtn, ctCloseBtn, ctOverlay].forEach(el => {
		if (el) el.addEventListener('click', closeCustomThemeEditor);
	});

	if (ctSaveBtn) {
		ctSaveBtn.addEventListener('click', () => {
			const name = (document.getElementById('ct-name').value || '').trim();
			if (!name) { document.getElementById('ct-name').focus(); return; }
			const theme = { name, description: (document.getElementById('ct-desc').value || '').trim() };
			CT_FIELDS.forEach(({ id, key: fieldKey }) => {
				theme[fieldKey] = document.getElementById(id)?.value || '#000000';
			});
			const key = _editingCustomKey || newCustomThemeKey();
			saveCustomTheme(key, theme);
			updateState({ artisticTheme: key });
			if (state.renderMode === 'artistic') updateArtisticStyle(getSelectedArtisticTheme());
			closeCustomThemeEditor();
		});
	}

	if (ctDeleteBtn) {
		ctDeleteBtn.addEventListener('click', () => {
			if (!_editingCustomKey) return;
			const name = document.getElementById('ct-name').value || _editingCustomKey;
			if (!confirm(`Delete "${name}"?`)) return;
			deleteCustomTheme(_editingCustomKey);
			if (state.artisticTheme === _editingCustomKey) {
				updateState({ artisticTheme: 'cyber_noir' });
				if (state.renderMode === 'artistic') updateArtisticStyle(getSelectedArtisticTheme());
			}
			closeCustomThemeEditor();
		});
	}

	function populateArtisticModal() {
		if (!artisticModalContent) return;
		const customThemes = loadCustomThemes();
		const customKeys = Object.keys(customThemes);
		const mainKeys = new Set(['cyber_noir', 'golden_era', 'mangrove_maze']);

		const container = document.createDocumentFragment();

		// Create/Import buttons
		const btnRow = document.createElement('div');
		btnRow.className = 'flex gap-2';
		const createBtn = document.createElement('button');
		createBtn.id = 'create-custom-theme-btn';
		createBtn.className = 'flex-1 flex items-center gap-2 p-3.5 border-2 border-dashed border-slate-200 rounded-2xl hover:border-accent hover:bg-accent/5 transition-all text-slate-400 hover:text-accent';
		createBtn.textContent = 'Create Theme';
		const importBtn = document.createElement('button');
		importBtn.id = 'import-custom-themes-btn';
		importBtn.className = 'flex items-center gap-2 px-4 py-3.5 border-2 border-dashed border-slate-200 rounded-2xl hover:border-accent hover:bg-accent/5 transition-all text-slate-400 hover:text-accent';
		importBtn.textContent = 'Import';
		btnRow.appendChild(createBtn);
		btnRow.appendChild(importBtn);
		container.appendChild(btnRow);

		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.id = 'import-custom-themes-file';
		fileInput.accept = '.json,application/json';
		fileInput.className = 'hidden';
		container.appendChild(fileInput);

		// Custom themes section
		if (customKeys.length) {
			const section = document.createElement('div');
			section.className = 'space-y-2 pb-4 border-b border-slate-100';
			const header = document.createElement('div');
			header.className = 'flex items-center justify-between';
			const title = document.createElement('p');
			title.className = 'text-[10px] font-black text-slate-400 uppercase tracking-widest';
			title.textContent = 'My Themes';
			header.appendChild(title);

			const actions = document.createElement('div');
			actions.className = 'flex items-center gap-2';
			const exportBtn2 = document.createElement('button');
			exportBtn2.id = 'export-custom-themes-btn';
			exportBtn2.className = 'text-[10px] font-bold text-slate-400 hover:text-accent transition-colors';
			exportBtn2.textContent = 'Export';
			const deleteAllBtn = document.createElement('button');
			deleteAllBtn.id = 'delete-all-custom-themes-btn';
			deleteAllBtn.className = 'text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors';
			deleteAllBtn.textContent = 'Delete All';
			actions.appendChild(exportBtn2);
			actions.appendChild(deleteAllBtn);
			header.appendChild(actions);
			section.appendChild(header);

			customKeys.forEach(key => {
				const t = customThemes[key];
				const row = document.createElement('div');
				row.className = 'flex items-center gap-2 p-3 border border-slate-100 rounded-2xl hover:shadow-md transition-all';
				row.setAttribute('data-search-row', '');

				const selectBtn = document.createElement('button');
				selectBtn.className = 'artistic-modal-item flex-1 flex items-center gap-3 text-left';
				selectBtn.dataset.key = key;
				const nameDiv = document.createElement('div');
				const nameText = document.createElement('div');
				nameText.className = 'text-sm font-semibold text-slate-900';
				nameText.textContent = t.name || key;
				const descText = document.createElement('div');
				descText.className = 'text-[10px] text-slate-400 mt-0.5';
				descText.textContent = t.description || 'Custom theme';
				nameDiv.appendChild(nameText);
				nameDiv.appendChild(descText);
				selectBtn.appendChild(nameDiv);

				const editBtn = document.createElement('button');
				editBtn.className = 'edit-custom-btn shrink-0 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors';
				editBtn.dataset.key = key;
				editBtn.title = 'Edit';
				editBtn.textContent = 'Edit';

				row.appendChild(selectBtn);
				row.appendChild(editBtn);
				section.appendChild(row);
			});
			container.appendChild(section);
		}

		// Search
		const searchDiv = document.createElement('div');
		searchDiv.className = 'mb-2';
		const searchInput = document.createElement('input');
		searchInput.id = 'artistic-search';
		searchInput.type = 'search';
		searchInput.placeholder = 'Search themes...';
		searchInput.className = 'w-full input-field';
		searchDiv.appendChild(searchInput);
		container.appendChild(searchDiv);

		// Built-in themes
		const builtinDiv = document.createElement('div');
		builtinDiv.className = 'space-y-2';
		Object.entries(artisticThemes)
			.filter(([k]) => !mainKeys.has(k))
			.forEach(([key, t]) => {
				const btn = document.createElement('button');
				btn.className = 'artistic-modal-item group w-full flex items-center p-4 border border-slate-100 rounded-2xl hover:shadow-xl transition-all';
				btn.dataset.key = key;
				btn.setAttribute('data-search-row', '');
				const nameDiv = document.createElement('div');
				nameDiv.className = 'text-left';
				const nameText = document.createElement('div');
				nameText.className = 'text-sm font-semibold text-slate-900';
				nameText.textContent = t.name || key;
				const descText = document.createElement('div');
				descText.className = 'text-[10px] text-slate-400 mt-1';
				descText.textContent = t.description || '';
				nameDiv.appendChild(nameText);
				nameDiv.appendChild(descText);
				btn.appendChild(nameDiv);
				builtinDiv.appendChild(btn);
			});
		container.appendChild(builtinDiv);

		artisticModalContent.textContent = '';
		artisticModalContent.appendChild(container);

		// Wire events
		createBtn.addEventListener('click', () => {
			if (artisticModal) artisticModal.classList.remove('show');
			openCustomThemeEditor(null);
		});
		importBtn.addEventListener('click', () => fileInput.click());
		fileInput.addEventListener('change', (e) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (ev) => {
				try {
					const { imported, skipped } = importCustomThemesFromJSON(ev.target.result);
					populateArtisticModal();
					alert(`Imported ${imported} theme${imported !== 1 ? 's' : ''}${skipped ? ` (${skipped} skipped — invalid)` : ''}.`);
				} catch {
					alert('Could not read file. Make sure it is a valid JSON export from this app.');
				}
				e.target.value = '';
			};
			reader.readAsText(file);
		});

		document.getElementById('export-custom-themes-btn')?.addEventListener('click', exportCustomThemes);
		document.getElementById('delete-all-custom-themes-btn')?.addEventListener('click', () => {
			if (!confirm(`Delete all ${customKeys.length} custom theme${customKeys.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
			clearCustomThemes();
			if (customKeys.includes(state.artisticTheme)) updateState({ artisticTheme: 'cyber_noir' });
			populateArtisticModal();
		});

		artisticModalContent.querySelectorAll('.edit-custom-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (artisticModal) artisticModal.classList.remove('show');
				openCustomThemeEditor(btn.dataset.key);
			});
		});

		artisticModalContent.querySelectorAll('.artistic-modal-item').forEach(btn => {
			btn.addEventListener('click', () => {
				const k = btn.dataset.key;
				updateState({ artisticTheme: k });
				if (state.renderMode === 'artistic') {
					updateArtisticStyle(getSelectedArtisticTheme());
					updateRouteStyles(state);
				}
				if (artisticModal) artisticModal.classList.remove('show');
			});
		});

		let artSearchTimeout = null;
		searchInput.addEventListener('input', (e) => {
			clearTimeout(artSearchTimeout);
			const q = (e.target.value || '').trim().toLowerCase();
			artSearchTimeout = setTimeout(() => {
				artisticModalContent.querySelectorAll('[data-search-row]').forEach(it => {
					const txt = (it.innerText || '').toLowerCase();
					it.style.display = q ? (txt.includes(q) ? '' : 'none') : '';
				});
			}, 120);
		});
	}

	return {
		syncThemeUI(currentState) {
			if (labelsToggle) labelsToggle.checked = !!currentState.showLabels;

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
					let active = k === 'other' ? !!(selectedKey && !mainKeys.has(selectedKey)) : k === selectedKey;
					btn.classList.toggle('border-accent', active);
					btn.classList.toggle('bg-accent-light', active);
					if (active) btn.classList.add('ring-accent'); else btn.classList.remove('ring-accent');

					if (k === 'other') {
						const spans = btn.querySelectorAll('span.w-6.h-6');
						const activeThemeObj = artisticThemes[selectedKey]
							|| (selectedKey?.startsWith('custom_') ? loadCustomThemes()[selectedKey] : null);
						if (selectedKey && activeThemeObj && !mainKeys.has(selectedKey)) {
							const p = paletteFor(activeThemeObj);
							spans.forEach((s, i) => { s.style.background = p[i] || '#cccccc'; });
						} else {
							spans.forEach((s) => { s.style.background = '#cccccc'; });
						}
					}
				});
			}

			const artisticTheme = getSelectedArtisticTheme();
			artisticDesc.textContent = artisticTheme.description;

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
		}
	};
}
