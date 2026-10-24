const cartoKey = import.meta.env.VITE_CARTO_API_KEY ? `?key=${import.meta.env.VITE_CARTO_API_KEY}` : "";
const cartoUrl = (path) => `https://{s}.basemaps.cartocdn.com/${path}${cartoKey}`;

export const themes = {
	standard: {
		name: "Classic Street",
		tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		tileUrlNoLabels: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		background: "#ffffff",
		textColor: "#000000",
		accent: "#3b82f6",
		overlayBg: "rgba(255, 255, 255, 0.8)",
		route: "#EF4444",
		description: "The classic OpenStreetMap look that everyone knows.",
		attribution: "© OpenStreetMap contributors"
	},
	dark: {
		name: "Midnight Dark",
		tileUrl: cartoUrl("dark_all/{z}/{x}/{y}{r}.png"),
		tileUrlNoLabels: cartoUrl("dark_nolabels/{z}/{x}/{y}{r}.png"),
		background: "#111111",
		textColor: "#ffffff",
		accent: "#818cf8",
		overlayBg: "rgba(17, 17, 17, 0.85)",
		route: "#F97316",
		description: "Sleek and professional dark map for a premium feel.",
		attribution: "© OpenStreetMap contributors, © CARTO"
	},
	minimal: {
		name: "Minimal White",
		tileUrl: cartoUrl("light_all/{z}/{x}/{y}{r}.png"),
		tileUrlNoLabels: cartoUrl("light_nolabels/{z}/{x}/{y}{r}.png"),
		background: "#ffffff",
		textColor: "#000000",
		accent: "#6366f1",
		overlayBg: "rgba(255, 255, 255, 0.8)",
		route: "#3B82F6",
		description: "Clean, elegant, and light. Perfect for modern spaces.",
		attribution: "© OpenStreetMap contributors, © CARTO"
	},
	voyager: {
		name: "Modern Voyager",
		tileUrl: cartoUrl("rastertiles/voyager/{z}/{x}/{y}{r}.png"),
		tileUrlNoLabels: cartoUrl("rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"),
		background: "#ffffff",
		textColor: "#1e293b",
		accent: "#6366f1",
		overlayBg: "rgba(255, 255, 255, 0.85)",
		route: "#EF4444",
		description: "Beautifully colored map with clear terrain and roads.",
		attribution: "© OpenStreetMap contributors, © CARTO"
	},
	satellite: {
		name: "Satellite View",
		tileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		tileUrlNoLabels: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		background: "#000000",
		textColor: "#ffffff",
		accent: "#10b981",
		overlayBg: "rgba(0, 0, 0, 0.6)",
		route: "#EAB308",
		description: "High-resolution satellite imagery from above.",
		attribution: "© Esri, © OpenStreetMap contributors"
	}
};
