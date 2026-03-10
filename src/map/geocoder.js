const APP_USER_AGENT = 'map-to-poster/1.0 (https://github.com/dimartarmizi/map-to-poster)';

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

async function rateLimit() {
	const now = Date.now();
	const elapsed = now - lastRequestTime;
	if (elapsed < MIN_INTERVAL_MS) {
		await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
	}
	lastRequestTime = Date.now();
}

export async function searchLocation(query, opts = {}) {
	if (!query || query.length < 2) return [];

	const { limit = 15, signal } = opts;

	try {
		await rateLimit();
		const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`;
		const response = await fetch(url, {
			signal,
			headers: {
				'Accept': 'application/json',
				'User-Agent': APP_USER_AGENT
			}
		});
		const data = await response.json();

		return data.map(item => ({
			name: item.display_name,
			lat: parseFloat(item.lat),
			lon: parseFloat(item.lon),
			shortName: item.name || (item.display_name && item.display_name.split(',')[0]) || item.display_name,
			country: item.address ? item.address.country : ''
		}));
	} catch (error) {
		if (error && error.name === 'AbortError') {
			return [];
		}
		console.error("Geocoding error:", error);
		return [];
	}
}

export function formatCoords(lat, lon) {
	const latDir = lat >= 0 ? 'N' : 'S';
	const lonDir = lon >= 0 ? 'E' : 'W';

	return `${Math.abs(lat).toFixed(4)}\u00B0 ${latDir}, ${Math.abs(lon).toFixed(4)}\u00B0 ${lonDir}`;
}
