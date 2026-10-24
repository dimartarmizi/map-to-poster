export function hexToRgba(color, alpha = 1) {
	if (!color || typeof color !== 'string') return `rgba(255, 255, 255, ${alpha})`;

	if (color.startsWith('rgb')) {
		const matches = color.match(/\d+(\.\d+)?/g);
		if (matches && matches.length >= 3) {
			return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${alpha})`;
		}
	}

	let h = color.replace('#', '');
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];

	if (!/^[0-9A-Fa-f]{6}$/.test(h)) return `rgba(255, 255, 255, ${alpha})`;

	const r = parseInt(h.substring(0, 2), 16);
	const g = parseInt(h.substring(2, 4), 16);
	const b = parseInt(h.substring(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getTextShadowCSS(type, textColor, scale = 1) {
	if (!type || type === 'none') return 'none';

	let luminance = 0;
	let h = (textColor || '').replace('#', '');
	if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
	if (/^[0-9A-Fa-f]{6}$/.test(h)) {
		const r = parseInt(h.substring(0, 2), 16);
		const g = parseInt(h.substring(2, 4), 16);
		const b = parseInt(h.substring(4, 6), 16);
		luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	}

	const c = luminance > 0.5 ? '15, 23, 42' : '248, 250, 252';
	const s = (v) => Math.max(1, Math.round(v * scale));

	if (type === 'soft') return `0 ${s(1)}px ${s(3)}px rgba(${c}, 0.55), 0 ${s(2)}px ${s(10)}px rgba(${c}, 0.35)`;
	if (type === 'strong') return `0 ${s(2)}px ${s(4)}px rgba(${c}, 0.9), 0 ${s(4)}px ${s(16)}px rgba(${c}, 0.6)`;
	if (type === 'halo') return `0 0 ${s(2)}px rgba(${c}, 0.95), 0 0 ${s(6)}px rgba(${c}, 0.8), 0 0 ${s(14)}px rgba(${c}, 0.6)`;
	return 'none';
}

export function findBestInsertIndex(lat, lon, routePoints) {
	if (routePoints.length < 2) return 0;

	let bestIndex = 0;
	let minDistance = Infinity;

	for (let i = 0; i < routePoints.length - 1; i++) {
		const p1 = routePoints[i];
		const p2 = routePoints[i + 1];

		const dist = getSqSegDist(lat, lon, p1.lat, p1.lon, p2.lat, p2.lon);

		if (dist < minDistance) {
			minDistance = dist;
			bestIndex = i;
		}
	}

	return bestIndex;
}

export function getSqSegDist(px, py, x1, y1, x2, y2) {
	let dx = x2 - x1;
	let dy = y2 - y1;
	if (dx !== 0 || dy !== 0) {
		let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
		if (t > 1) {
			x1 = x2;
			y1 = y2;
		} else if (t > 0) {
			x1 += dx * t;
			y1 += dy * t;
		}
	}
	dx = px - x1;
	dy = py - y1;
	return dx * dx + dy * dy;
}
