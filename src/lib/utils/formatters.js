/**
 * Formats a numeric value to display up to 1 decimal place
 * but removes trailing zeros (e.g., 5.0 → 5, 5.5 → 5.5)
 *
 * @param {number} value - The numeric value to format
 * @returns {string} The formatted value as a string
 */
export function formatDecimal(value) {
	if (value === undefined || value === null) return '0';

	// First round to 1 decimal place
	const rounded = Math.round(value * 10) / 10;

	// If it's a whole number, display without decimal
	if (rounded === Math.floor(rounded)) {
		return rounded.toString();
	}

	// Otherwise, display with 1 decimal place
	return rounded.toFixed(1);
}
