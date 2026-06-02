/**
 * 数据导出记录 — 全系统业务模块导出日志
 */

const STORAGE_KEY = "ygxwfx_export_records";

export const EXPORT_RETENTION_YEARS = 3;

export const EXPORT_RETENTION_NOTICE = "导出记录仅保留三年，超出保留期限的记录系统将自动清除。";

export const FILE_FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "txt", label: "TXT" },
];

/** 已接入导出记录的业务模块 */
export const EXPORT_MODULE_REGISTRY = [
  { code: "data-access", name: "数据接入管理", group: "无感数据管理" },
  { code: "data-config", name: "无感数据配置", group: "无感数据管理" },
  { code: "data-custom", name: "无感数据自定义", group: "无感数据管理" },
  { code: "sensing-basic", name: "无感基础数据管理", group: "无感数据管理" },
  { code: "staff-basic", name: "员工基本信息台账", group: "人员信息台账" },
  { code: "staff-attendance", name: "考勤管理台账", group: "人员信息台账" },
  { code: "staff-assessment", name: "考勤评估台账", group: "人员信息台账" },
  { code: "major-category", name: "专业分类", group: "人员信息台账" },
  { code: "org-management", name: "组织机构管理", group: "组织机构台账" },
  { code: "staff-post", name: "人员与岗位关联配置", group: "组织机构台账" },
  { code: "role-management", name: "角色管理", group: "权限管理" },
  { code: "role-user", name: "角色与用户关联", group: "权限管理" },
  { code: "module-permission", name: "功能模块权限分配", group: "权限管理" },
  { code: "login-log", name: "登录日志查询", group: "日志管理" },
  { code: "data-repair", name: "数据修复记录", group: "日志管理" },
  { code: "export-record-query", name: "导出记录查询", group: "日志管理" },
  { code: "multi-source-aggregation", name: "多源数据汇总", group: "无感数据管理" },
];

const OPERATORS = ["管理员", "张三", "李四", "王五", "当前用户"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toTimestamp(str) {
  return new Date(String(str).replace(/-/g, "/")).getTime();
}

function getRetentionCutoffTs() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - EXPORT_RETENTION_YEARS);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function applyRetention(records) {
  const cutoff = getRetentionCutoffTs();
  return records.filter((r) => r.exportTimeTs >= cutoff);
}

function generateDefaultRecords() {
  const formats = ["csv", "excel", "txt"];
  const modules = EXPORT_MODULE_REGISTRY;
  const now = Date.now();
  const records = [];

  for (let i = 0; i < 48; i++) {
    const mod = modules[i % modules.length];
    const fmt = formats[i % formats.length];
    const dayOffset = i % 60;
    const exportDate = new Date(now - dayOffset * 86400000 - (i % 6) * 3600000);
    const rowCount = 10 + (i % 200);
    records.push({
      id: `export-${i + 1}`,
      moduleCode: mod.code,
      moduleName: mod.name,
      moduleGroup: mod.group,
      fileFormat: fmt,
      fileFormatLabel: FILE_FORMAT_OPTIONS.find((f) => f.value === fmt)?.label || fmt,
      fileName: `${mod.name}_${formatDateTime(exportDate).slice(0, 10).replace(/-/g, "")}.${fmt === "excel" ? "xlsx" : fmt}`,
      rowCount,
      operator: OPERATORS[i % OPERATORS.length],
      exportTime: formatDateTime(exportDate),
      exportTimeTs: exportDate.getTime(),
      searchCriteria: i % 3 === 0 ? "全部数据" : i % 3 === 1 ? "按时间段筛选" : "按组织机构筛选",
      status: "success",
      fileSize: `${Math.max(1, Math.round(rowCount * 0.12))} KB`,
    });
  }

  return records.sort((a, b) => b.exportTimeTs - a.exportTimeTs);
}

let cache = null;

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadExportRecords() {
  if (!cache) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cache = raw ? JSON.parse(raw) : generateDefaultRecords();
    } catch (e) {
      cache = generateDefaultRecords();
    }
  }
  const retained = applyRetention(cache);
  if (retained.length !== cache.length) {
    cache = retained;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
  return cloneDeep(cache);
}

function saveRecords(records) {
  cache = applyRetention(cloneDeep(records));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  return cloneDeep(cache);
}

export function getExportRetentionInfo() {
  const cutoff = formatDateTime(new Date(getRetentionCutoffTs())).slice(0, 10);
  return {
    years: EXPORT_RETENTION_YEARS,
    notice: EXPORT_RETENTION_NOTICE,
    cutoffDate: cutoff,
    description: `当前可查范围为 ${cutoff} 至今，早于该日期的导出记录到期后将自动清除。`,
  };
}

export function logExportRecord(payload) {
  const records = loadExportRecords();
  const fmt = payload.fileFormat || "csv";
  const record = {
    id: `export-${Date.now()}`,
    moduleCode: payload.moduleCode || "unknown",
    moduleName: payload.moduleName || "未知模块",
    moduleGroup: payload.moduleGroup || findModuleGroup(payload.moduleCode),
    fileFormat: fmt,
    fileFormatLabel: FILE_FORMAT_OPTIONS.find((f) => f.value === fmt)?.label || fmt,
    fileName: payload.fileName || `export.${fmt}`,
    rowCount: payload.rowCount || 0,
    operator: payload.operator || "当前用户",
    exportTime: formatDateTime(new Date()),
    exportTimeTs: Date.now(),
    searchCriteria: payload.searchCriteria || "—",
    status: payload.status || "success",
    fileSize: payload.fileSize || estimateSize(payload.rowCount),
  };
  records.unshift(record);
  saveRecords(records.slice(0, 500));
  return record;
}

function findModuleGroup(code) {
  const mod = EXPORT_MODULE_REGISTRY.find((m) => m.code === code);
  return mod ? mod.group : "其他";
}

function estimateSize(rowCount) {
  const kb = Math.max(1, Math.round((rowCount || 0) * 0.12));
  return `${kb} KB`;
}

export function filterExportRecords(records, criteria = {}) {
  const { dateRange, moduleCode, fileFormat, operator, keyword } = criteria;
  return records.filter((r) => {
    if (moduleCode && r.moduleCode !== moduleCode) return false;
    if (fileFormat && r.fileFormat !== fileFormat) return false;
    if (operator && !r.operator.includes(operator.trim())) return false;
    if (keyword) {
      const kw = keyword.trim().toLowerCase();
      const hay = `${r.moduleName}${r.fileName}${r.searchCriteria}${r.operator}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    if (dateRange && dateRange.length === 2) {
      const start = toTimestamp(`${dateRange[0]} 00:00:00`);
      const end = toTimestamp(`${dateRange[1]} 23:59:59`);
      if (r.exportTimeTs < start || r.exportTimeTs > end) return false;
    }
    return true;
  });
}

export function countExportStats(records) {
  const byModule = {};
  const byFormat = {};
  records.forEach((r) => {
    byModule[r.moduleName] = (byModule[r.moduleName] || 0) + 1;
    byFormat[r.fileFormat] = (byFormat[r.fileFormat] || 0) + 1;
  });
  return {
    total: records.length,
    modules: Object.keys(byModule).length,
    today: records.filter((r) => {
      const d = new Date(r.exportTimeTs);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    byModule,
    byFormat,
  };
}

export function resetExportRecords() {
  localStorage.removeItem(STORAGE_KEY);
  cache = null;
  return loadExportRecords();
}

export function exportRecordsCsv(records, filename) {
  const headers = ["导出时间", "业务模块", "模块分组", "文件格式", "文件名", "记录数", "操作人", "查询条件", "文件大小"];
  const lines = records.map((r) =>
    [
      r.exportTime,
      r.moduleName,
      r.moduleGroup,
      r.fileFormatLabel,
      r.fileName,
      r.rowCount,
      r.operator,
      r.searchCriteria,
      r.fileSize,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function paginateExportRecords(records, page, pageSize) {
  const start = (page - 1) * pageSize;
  return { list: records.slice(start, start + pageSize), total: records.length };
}

export function getModuleByCode(code) {
  return EXPORT_MODULE_REGISTRY.find((m) => m.code === code) || null;
}
