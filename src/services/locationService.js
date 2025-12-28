/**
 * Utility to resolve addresses in Addis Ababa to geographic coordinates (lat, lng).
 * Uses a combination of static mapping for neighborhoods and external geocoding as fallback.
 */

const NEIGHBORHOOD_COORDS = {
    'kality': { lat: 8.917, lng: 38.761 },
    'akaki': { lat: 8.895, lng: 38.784 },
    'bole': { lat: 9.000, lng: 38.785 },
    'piazza': { lat: 9.035, lng: 38.752 },
    'hayahulet': { lat: 9.015, lng: 38.765 },
    'saris': { lat: 8.966, lng: 38.755 },
    'ayat': { lat: 9.020, lng: 38.860 },
    'gerji': { lat: 8.995, lng: 38.810 },
    'mexico': { lat: 9.010, lng: 38.745 },
    'kazanchis': { lat: 9.020, lng: 38.768 },
    'megenagna': { lat: 9.018, lng: 38.801 },
    'lebu': { lat: 8.955, lng: 38.718 },
    'cmc': { lat: 9.025, lng: 38.825 },
    'jackros': { lat: 9.005, lng: 38.835 },
    'summit': { lat: 9.012, lng: 38.882 },
    'viva': { lat: 9.028, lng: 38.742 },
    'shola': { lat: 9.025, lng: 38.788 },
    'arat kilo': { lat: 9.033, lng: 38.763 },
    'sidist kilo': { lat: 9.048, lng: 38.762 },
};

const COMMON_LOCATIONS = [
    "Atobis Tera",
    "Bole Medhanialem",
    "Piazza Churchill Avenue",
    "Mexico Square",
    "Kazanchis",
    "Megenagna Roundabout",
    "Sarbet",
    "Kality Customs",
    "Akaki Kaliti",
    "Saris Abo",
    "Gerji",
    "Ayat Zone 2",
    "CMC Michael",
    "Lebu Mebrat Hail",
    "Gotera Condominium",
    "Stadium",
    "4 Kilo (Arat Kilo)",
    "6 Kilo (Sidist Kilo)",
    "Piassa (Piazza)",
    "Old Airport",
    "Summit Safar",
    "Jackros",
    "Vera Tower"
];

const DEFAULT_COORDS = { lat: 9.0192, lng: 38.7525 }; // Addis Ababa Center

export const locationService = {
    /**
     * Resolves a text address string to {lat, lng} coordinates.
     * @param {string} address The address to resolve.
     * @returns {Promise<{lat: number, lng: number}>}
     */
    resolveCoordinates: async (address) => {
        if (!address) return DEFAULT_COORDS;

        const normalized = address.toLowerCase();

        // 1. Check for specific lat/lng pattern in string (e.g. "9.03, 38.74")
        const coordMatch = normalized.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
            return {
                lat: parseFloat(coordMatch[1]),
                lng: parseFloat(coordMatch[2])
            };
        }

        // 2. Check static neighborhood mapping
        for (const [neighborhood, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
            if (normalized.includes(neighborhood)) {
                return coords;
            }
        }

        // 3. Optional: Fallback to Nominatim API if online
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Addis Ababa, Ethiopia')}&limit=1`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
            }
        } catch (error) {
            console.warn('Geocoding API failed, using default coords', error);
        }

        return DEFAULT_COORDS;
    },

    /**
     * Returns a list of address suggestions based on the query.
     * @param {string} query The user input.
     * @returns {string[]}
     */
    getSuggestions: (query) => {
        if (!query || query.length < 2) return [];
        const normalized = query.toLowerCase();
        return COMMON_LOCATIONS.filter(loc =>
            loc.toLowerCase().includes(normalized)
        ).slice(0, 5); // Return top 5 matches
    },

    /**
     * Gets a readable address from coordinates.
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<string>}
     */
    getAddressFromCoords: async (lat, lng) => {
        // 1. Check local neighborhood mapping first for speed/accuracy in Addis
        for (const [neighborhood, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
            const distance = Math.sqrt(
                Math.pow(coords.lat - lat, 2) + Math.pow(coords.lng - lng, 2)
            );
            if (distance < 0.005) { // Very close to a known center
                return neighborhood.charAt(0).toUpperCase() + neighborhood.slice(1);
            }
        }

        // 2. Fallback to OpenStreetMap Reverse Geocoding
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await response.json();
            if (data && data.display_name) {
                // Shorten the address for mobile/UI
                return data.display_name.split(',').slice(0, 3).join(',');
            }
        } catch (error) {
            console.warn('Reverse geocoding failed', error);
        }

        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
};
