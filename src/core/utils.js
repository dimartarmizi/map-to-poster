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
