'use strict';

/**
 * CSV export utilities.
 */

/**
 * Convert an array of objects to a CSV string.
 * - Headers are derived from the keys of the first object (or supplied explicitly).
 * - Values containing commas, quotes, or newlines are quoted.
 *
 * @param {Object[]} rows
 * @param {string[]} [columns] - ordered list of keys to include; defaults to all keys
 * @param {Object.<string, string>} [headers] - optional map of key → display name
 * @returns {string} CSV text (UTF-8, with BOM for Excel compatibility)
 */
function toCsv(rows, columns = null, headers = {}) {
  if (!rows || rows.length === 0) return '\uFEFF'; // BOM only

  const cols = columns || Object.keys(rows[0]);
  const headerRow = cols.map((c) => escapeCell(headers[c] || c)).join(',');

  const dataRows = rows.map((row) =>
    cols.map((c) => escapeCell(row[c] !== undefined && row[c] !== null ? String(row[c]) : '')).join(',')
  );

  // UTF-8 BOM so Excel opens it correctly
  return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
}

/**
 * Escape a single CSV cell value.
 * @param {string} value
 * @returns {string}
 */
function escapeCell(value) {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Send a CSV download response.
 * @param {import('express').Response} res
 * @param {string} filename - e.g. "orders-2024-11-16.csv"
 * @param {string} csvContent
 */
function sendCsv(res, filename, csvContent) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
}

module.exports = { toCsv, escapeCell, sendCsv };
