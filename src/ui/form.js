import { setupThemePicker } from './theme-picker.js';
import { setupLocationSearch } from './location-search.js';
import { setupMarkerRouteControls } from './marker-route-controls.js';
import { setupOverlaySettings } from './overlay-settings.js';
export { updatePreviewStyles } from './preview-styles.js';

export function setupControls() {
	const { syncThemeUI } = setupThemePicker();
	const { syncLocationUI, selectLocation } = setupLocationSearch();
	const { syncMarkerRouteUI } = setupMarkerRouteControls();
	const { syncOverlayUI } = setupOverlaySettings();

	return (currentState) => {
		syncLocationUI(currentState);
		syncThemeUI(currentState);
		syncMarkerRouteUI(currentState);
		syncOverlayUI(currentState);
	};
}

export { setupLocationSearch } from './location-search.js';
