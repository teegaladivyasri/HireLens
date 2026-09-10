/**
 * HireLens Date & Time Timezone Handling Utility
 *
 * All dates persisted in the database and returned by the API represent UTC.
 * This utility safely parses UTC timestamps (including legacy naive strings)
 * and formats them into the user's local browser timezone.
 */

/**
 * Safely parses any date input as a UTC Date instance.
 * Handles:
 * - ISO strings with 'Z' (e.g. '2026-09-10T02:17:43Z')
 * - ISO strings with timezone offset (e.g. '2026-09-10T02:17:43+00:00')
 * - Naive ISO strings (e.g. '2026-09-10T02:17:43.057451') -> treated as UTC
 * - Naive SQL format (e.g. '2026-09-10 02:17:43') -> treated as UTC
 * - Date instances or Unix millisecond timestamps
 *
 * @param {string|number|Date} input
 * @returns {Date|null}
 */
export function parseUtcDate(input) {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;

  let str = String(input).trim();
  if (!str) return null;

  // If formatted as "YYYY-MM-DD HH:MM:SS", convert space to 'T'
  if (str.length >= 19 && str[10] === ' ') {
    str = str.substring(0, 10) + 'T' + str.substring(11);
  }

  // Check if string contains a timezone indicator ('Z' or '+/-HH:MM' or '+/-HHMM')
  const hasZ = str.endsWith('Z') || str.endsWith('z');
  const hasOffset = /[+-]\d{2}(:?\d{2})?$/.test(str);

  if (!hasZ && !hasOffset) {
    // Canonical persistence is UTC; append 'Z' so browser parses as UTC
    str += 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a UTC timestamp into the user's local date and time string.
 * Uses the browser's configured timezone dynamically (no hardcoded offsets).
 *
 * Example in Asia/Kolkata (UTC+5:30):
 * "2026-09-10T02:17:43Z" -> "9/10/2026 at 7:47:43 AM"
 *
 * @param {string|number|Date} input
 * @param {Object} options
 * @returns {string}
 */
export function formatLocalDateTime(input, options = {}) {
  const date = parseUtcDate(input);
  if (!date) return '';

  const dateOptions = {
    year: 'numeric',
    month: options.month || 'numeric',
    day: 'numeric',
    ...options.dateOptions,
  };

  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: options.includeSeconds !== false ? '2-digit' : undefined,
    hour12: options.hour12 !== false,
    ...options.timeOptions,
  };

  const datePart = date.toLocaleDateString(undefined, dateOptions);
  const timePart = date.toLocaleTimeString(undefined, timeOptions);

  return `${datePart} at ${timePart}`;
}

/**
 * Formats a UTC timestamp into the user's local date string.
 *
 * Example:
 * "2026-09-10T02:17:43Z" -> "9/10/2026"
 *
 * @param {string|number|Date} input
 * @param {Object} options
 * @returns {string}
 */
export function formatLocalDate(input, options = {}) {
  const date = parseUtcDate(input);
  if (!date) return '';

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: options.month || 'numeric',
    day: 'numeric',
    ...options,
  });
}

/**
 * Formats a UTC timestamp into the user's local time string.
 *
 * Example:
 * "2026-09-10T02:17:43Z" -> "7:47:43 AM"
 *
 * @param {string|number|Date} input
 * @param {Object} options
 * @returns {string}
 */
export function formatLocalTime(input, options = {}) {
  const date = parseUtcDate(input);
  if (!date) return '';

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: options.includeSeconds !== false ? '2-digit' : undefined,
    hour12: options.hour12 !== false,
    ...options,
  });
}
