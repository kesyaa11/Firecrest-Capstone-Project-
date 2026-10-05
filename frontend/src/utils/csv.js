// Build CSV text from rows of cell values (RFC 4180).
// Cells containing commas, quotes or line breaks are wrapped in quotes with inner quotes doubled.
export function toCsv(rows) {
  return rows.map((row) => row.map(formatCell).join(",")).join("\r\n");
}

function formatCell(value) {
  if (value === null || value === undefined) return "";

  const text = String(value);

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
