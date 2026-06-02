/**
 * 统一导出下载并写入导出记录
 */

import { logExportRecord } from "./exportRecordManagement";

export function triggerFileDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function inferFormat(filename) {
  const lower = String(filename).toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (lower.endsWith(".txt")) return "txt";
  return "csv";
}

/** 下载 CSV 并记录导出日志 */
export function downloadCsvWithLog(csv, filename, meta = {}) {
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  triggerFileDownload(blob, filename);
  const rowCount = meta.rowCount != null ? meta.rowCount : Math.max(0, csv.split("\n").length - 1);
  logExportRecord({
    moduleCode: meta.moduleCode,
    moduleName: meta.moduleName,
    moduleGroup: meta.moduleGroup,
    fileFormat: meta.fileFormat || inferFormat(filename),
    fileName: filename,
    rowCount,
    operator: meta.operator,
    searchCriteria: meta.searchCriteria,
    fileSize: meta.fileSize,
  });
}

/** 下载 Blob 并记录导出日志 */
export function downloadBlobWithLog(blob, filename, meta = {}) {
  triggerFileDownload(blob, filename);
  logExportRecord({
    moduleCode: meta.moduleCode,
    moduleName: meta.moduleName,
    moduleGroup: meta.moduleGroup,
    fileFormat: meta.fileFormat || inferFormat(filename),
    fileName: filename,
    rowCount: meta.rowCount || 0,
    operator: meta.operator,
    searchCriteria: meta.searchCriteria,
    fileSize: meta.fileSize || `${Math.max(1, Math.round(blob.size / 1024))} KB`,
  });
}

function escapeExportCell(value) {
  return String(value == null ? "" : value).replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

function escapeHtmlCell(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTxtContent(headers, rows) {
  const lines = [
    headers.map(escapeExportCell).join("\t"),
    ...rows.map((row) => row.map(escapeExportCell).join("\t")),
  ];
  return `\ufeff${lines.join("\r\n")}`;
}

function buildCsvContent(headers, rows) {
  const escapeCsvCell = (value) => {
    const text = String(value == null ? "" : value);
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  return lines.join("\n");
}

function buildExcelBlob(headers, rows) {
  const headHtml = headers.map((h) => `<th>${escapeHtmlCell(h)}</th>`).join("");
  const bodyHtml = rows
    .map((row) => `<tr>${row.map((c) => `<td>${escapeHtmlCell(c)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body><table border="1"><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;
  return new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
}

/**
 * 按 CSV / Excel / TXT 导出表格并记录日志
 * @param {{ headers: string[], rows: Array<Array<string|number>>, format: 'csv'|'excel'|'txt', baseFilename: string, meta?: object }} options
 */
export function downloadTableWithLog({ headers, rows, format, baseFilename, meta = {} }) {
  const safeBase = String(baseFilename || "导出结果").replace(/[\\/:*?"<>|]/g, "_");
  if (format === "txt") {
    const content = buildTxtContent(headers, rows);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    downloadBlobWithLog(blob, `${safeBase}.txt`, { ...meta, fileFormat: "txt", rowCount: rows.length });
    return;
  }
  if (format === "csv") {
    downloadCsvWithLog(buildCsvContent(headers, rows), `${safeBase}.csv`, {
      ...meta,
      fileFormat: "csv",
      rowCount: rows.length,
    });
    return;
  }
  const blob = buildExcelBlob(headers, rows);
  downloadBlobWithLog(blob, `${safeBase}.xlsx`, { ...meta, fileFormat: "excel", rowCount: rows.length });
}
