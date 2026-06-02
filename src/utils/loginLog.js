/**
 * 登录日志 — 数据生成、查询、删除与备份
 */

import { getUsers } from "./permissionManagement";
import { downloadCsvWithLog } from "./exportLogger";

const STORAGE_KEY = "ygxwfx_login_logs";
const BACKUP_KEY = "ygxwfx_login_log_backups";
const SCHEMA_VERSION = 5;

export const TERMINAL_OPTIONS = ["PC-Web", "PC-客户端", "移动端-Android", "移动端-iOS"];

/** 日志保留年限 */
export const LOG_RETENTION_YEARS = 3;

export const LOG_RETENTION_NOTICE = "登录日志仅保留三年，超出保留期限的日志系统将自动清除。";

const IP_POOL = [
  "192.168.241.20",
  "192.168.241.35",
  "192.168.242.102",
  "10.12.8.21",
  "10.12.8.35",
  "10.12.9.102",
  "10.12.10.56",
  "10.12.11.18",
  "172.16.3.88",
];

const DEPT_NAMES = [
  "薪酬福利科",
  "干部管理科",
  "干部监督科",
  "市场营销部",
  "数字化部",
  "计划与财务部",
  "生产技术部",
  "安全监管部",
  "人力资源部",
  "培训管理科",
  "综合管理科",
  "系统运行部",
  "供应链管理部",
  "审计部",
  "法规部",
];

const BROWSER_POOL = [
  "Chrome/122.0.6261.95",
  "Chrome/122.0.6261.106",
  "Chrome/122.0.6261.128",
  "Edge",
  "Firefox",
  "无法识别浏览器版本",
  "Apache-HttpClient/4.5.8 (Java/1.8.0_201)",
  "Apache-HttpClient/4.5.8 (Java/1.8.0_281)",
];

const OS_POOL = [
  "Windows 10",
  "Windows 11",
  "Windows Server 2016",
  "Windows Server 2019",
  "Apache-HttpClient/4.5.8 (Java/1.8.0_201)",
  "Android 12",
  "iOS 16.5",
];

const RESOLUTION_POOL = ["1920*1080", "1080*1920", "864*1536", "1366*768", "2560*1440", "1440*900"];

const ACCOUNT_PREFIX = ["fu", "hu", "li", "wang", "zhao", "chen", "liu", "zhou", "wu", "zheng", "sun", "ma", "lin", "he", "yang"];
const ACCOUNT_CITY = ["km", "qj", "yx", "bs", "zt", "pe", "lc", "hh", "cx", "ws"];

const EXTRA_NAMES = [
  "付小英", "胡霞", "张明", "王丽", "赵强", "陈静", "刘洋", "周敏", "吴刚", "郑琳",
  "孙浩", "马丽", "林峰", "何娟", "杨帆", "黄磊", "徐婷", "朱军", "秦芳", "许伟",
  "邓华", "冯磊", "曹雪", "彭涛", "曾敏", "萧强", "田甜", "董鹏", "袁莉", "蒋勇",
];

const DEFAULT_LOG_COUNT = 820;

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function toTimestamp(str) {
  return new Date(String(str).replace(/-/g, "/")).getTime();
}

export function maskChineseName(name) {
  if (!name) return "—";
  const text = String(name).trim();
  if (text.length <= 1) return text;
  if (text.length === 2) return `${text[0]}*`;
  return `${text[0]}**`;
}

function buildAccount(index, username) {
  if (username === "admin") return "admin@yn.csg.cn";
  const prefix = ACCOUNT_PREFIX[index % ACCOUNT_PREFIX.length];
  const city = ACCOUNT_CITY[index % ACCOUNT_CITY.length];
  return `${prefix}${String(index % 100).padStart(2, "0")}@${city}.yn.csg.cn`;
}

function buildPersonas() {
  const users = getUsers();
  const personas = users.map((u, i) => ({
    username: u.username,
    displayName: u.name,
    deptName: u.orgName && u.orgName.length > 12 ? DEPT_NAMES[i % DEPT_NAMES.length] : (u.orgName || DEPT_NAMES[i % DEPT_NAMES.length]),
    account: buildAccount(i, u.username),
  }));
  EXTRA_NAMES.forEach((name, i) => {
    const idx = users.length + i;
    personas.push({
      username: `staff${String(idx).padStart(3, "0")}`,
      displayName: name,
      deptName: DEPT_NAMES[idx % DEPT_NAMES.length],
      account: buildAccount(idx, `staff${idx}`),
    });
  });
  return personas;
}

function hasText(value) {
  return value != null && String(value).trim() !== "";
}

function isMobileTerminal(terminal) {
  return String(terminal || "").includes("移动端");
}

/** 移动端设备型号 / 联网方式：当前系统未采集，统一留空 */
export function resolveDeviceModel() {
  return "";
}

export function resolveNetworkType() {
  return "";
}

export function formatMobileOnlyField(value) {
  return hasText(value) ? value : "—";
}

function hasMobileFieldData(log) {
  return hasText(log.deviceModel) || hasText(log.networkType);
}

function enrichLog(log, index) {
  const terminal = log.terminal || TERMINAL_OPTIONS[index % TERMINAL_OPTIONS.length];
  const isMobile = isMobileTerminal(terminal);
  const browser = log.browser || BROWSER_POOL[index % BROWSER_POOL.length];
  const os = log.os || (isMobile ? (terminal.includes("iOS") ? "iOS 16.5" : "Android 12") : OS_POOL[index % 5]);
  const base = {
    ...log,
    terminal,
    maskedName: log.maskedName || maskChineseName(log.displayName),
    deptName: log.deptName || "—",
    account: log.account || buildAccount(index, log.username),
    browser,
    os,
  };

  return {
    ...base,
    deviceModel: "",
    networkType: "",
    resolution: hasText(log.resolution) ? log.resolution : RESOLUTION_POOL[index % RESOLUTION_POOL.length],
  };
}

function generateDefaultLogs() {
  const personas = buildPersonas();
  const logs = [];
  const now = Date.now();
  const retentionMs = LOG_RETENTION_YEARS * 365 * 86400000;

  for (let i = 0; i < DEFAULT_LOG_COUNT; i++) {
    const person = personas[i % personas.length];
    const dayOffset = Math.floor(i / 12) % (LOG_RETENTION_YEARS * 365 - 1);
    const hourOffset = (i % 12) * 2 + (i % 5);
    const loginDate = new Date(now - dayOffset * 86400000 - hourOffset * 3600000 - (i % 60) * 60000);
    if (now - loginDate.getTime() > retentionMs) continue;

    const sessionMinutes = 15 + (i % 240);
    const logoutDate = new Date(loginDate.getTime() + sessionMinutes * 60000);
    const isOnline = i === 0;

    logs.push(enrichLog({
      id: `log-${i + 1}`,
      username: person.username,
      displayName: person.displayName,
      deptName: person.deptName,
      account: person.account,
      loginTime: formatDateTime(loginDate),
      logoutTime: isOnline ? "" : formatDateTime(logoutDate),
      terminal: TERMINAL_OPTIONS[i % TERMINAL_OPTIONS.length],
      ip: IP_POOL[i % IP_POOL.length],
      status: isOnline ? "online" : "offline",
      loginTs: loginDate.getTime(),
      logoutTs: isOnline ? null : logoutDate.getTime(),
    }, i));
  }

  return logs.sort((a, b) => b.loginTs - a.loginTs);
}

function applyLogRetentionPolicy(logs) {
  const cutoff = getLogRetentionCutoffTs();
  return logs.filter((l) => l.loginTs >= cutoff);
}

export function getLogRetentionCutoffTs() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - LOG_RETENTION_YEARS);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getLogRetentionInfo() {
  const cutoffDate = formatDateTime(new Date(getLogRetentionCutoffTs())).slice(0, 10);
  return {
    years: LOG_RETENTION_YEARS,
    notice: LOG_RETENTION_NOTICE,
    cutoffDate,
    description: `当前可见范围为 ${cutoffDate} 至今，早于该日期的日志超期后将自动清除。`,
  };
}

let cache = null;

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeStoredLogs(logs) {
  return logs.map((log, index) => enrichLog(log, index));
}

function needsRegenerate(raw) {
  if (!raw || !Array.isArray(raw)) return true;
  if (raw.length < 100) return true;
  if (!raw[0] || !raw[0].deptName) return true;
  if (raw.some(hasMobileFieldData)) return true;
  return false;
}

export function loadLoginLogs() {
  try {
    const metaRaw = localStorage.getItem(`${STORAGE_KEY}_meta`);
    const meta = metaRaw ? JSON.parse(metaRaw) : null;
    if (cache && meta?.version !== SCHEMA_VERSION) {
      cache = null;
    }
  } catch (e) {
    cache = null;
  }

  if (!cache) {
    try {
      const metaRaw = localStorage.getItem(`${STORAGE_KEY}_meta`);
      const meta = metaRaw ? JSON.parse(metaRaw) : null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && meta && meta.version === SCHEMA_VERSION && !needsRegenerate(JSON.parse(raw))) {
        cache = normalizeStoredLogs(JSON.parse(raw));
      } else {
        cache = generateDefaultLogs();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify({ version: SCHEMA_VERSION }));
      }
    } catch (e) {
      console.warn("loadLoginLogs failed", e);
      cache = generateDefaultLogs();
    }
  }

  const normalized = cache.map((log, index) => enrichLog(log, index));
  const needsPersist = normalized.some((log, i) =>
    hasMobileFieldData(cache[i]) ||
    cache[i].deviceModel !== log.deviceModel ||
    cache[i].networkType !== log.networkType
  );
  if (needsPersist) {
    cache = cloneDeep(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify({ version: SCHEMA_VERSION }));
  } else {
    cache = cloneDeep(normalized);
  }

  const retained = applyLogRetentionPolicy(cache);
  if (retained.length !== cache.length) {
    cache = cloneDeep(retained);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
  return cloneDeep(cache);
}

function saveLoginLogs(logs) {
  cache = cloneDeep(logs.map((log, index) => enrichLog(log, index)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify({ version: SCHEMA_VERSION }));
  return cloneDeep(cache);
}

export function resetLoginLogs() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}_meta`);
  cache = null;
  return loadLoginLogs();
}

export function getDefaultLogQueryRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return [`${y}-${m}-01`, `${y}-${m}-${String(lastDay).padStart(2, "0")}`];
}

export function createEmptyLogQuery() {
  return {
    dateRange: getDefaultLogQueryRange(),
    username: "",
    terminal: "",
    ip: "",
    account: "",
    deptName: "",
  };
}

export function filterLoginLogs(logs, criteria = {}) {
  const {
    dateRange,
    username,
    ip,
    terminal,
    keyword,
    deptName,
    account,
  } = criteria;

  return logs.filter((log) => {
    if (deptName && !(log.deptName || "").includes(deptName.trim())) return false;
    if (account && !(log.account || "").toLowerCase().includes(account.trim().toLowerCase())) return false;
    if (terminal && log.terminal !== terminal) return false;
    if (username) {
      const kw = username.trim().toLowerCase();
      const hit =
        (log.username || "").toLowerCase().includes(kw) ||
        (log.displayName || "").includes(username.trim()) ||
        (log.maskedName || "").includes(username.trim());
      if (!hit) return false;
    }
    if (ip && !(log.ip || "").includes(ip.trim())) return false;
    if (keyword) {
      const kw = keyword.trim().toLowerCase();
      const hay = [
        log.deptName,
        log.account,
        log.username,
        log.displayName,
        log.maskedName,
        log.ip,
        log.terminal,
      ]
        .filter(Boolean)
        .join("")
        .toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    if (dateRange && dateRange.length === 2) {
      const start = toTimestamp(`${dateRange[0]} 00:00:00`);
      const end = toTimestamp(`${dateRange[1]} 23:59:59`);
      if (log.loginTs < start || log.loginTs > end) return false;
    }
    return true;
  });
}

export function countLoginLogStats(logs) {
  const online = logs.filter((l) => l.status === "online").length;
  const terminals = {};
  logs.forEach((l) => {
    terminals[l.terminal] = (terminals[l.terminal] || 0) + 1;
  });
  const depts = {};
  logs.forEach((l) => {
    depts[l.deptName] = (depts[l.deptName] || 0) + 1;
  });
  return {
    total: logs.length,
    online,
    offline: logs.length - online,
    terminals,
    depts,
  };
}

export function deleteLoginLogs(ids) {
  const logs = loadLoginLogs();
  const idSet = new Set(ids);
  const next = logs.filter((l) => !idSet.has(l.id));
  saveLoginLogs(next);
  return next;
}

export function deleteLoginLogsBefore(beforeDate) {
  const logs = loadLoginLogs();
  const ts = toTimestamp(`${beforeDate} 23:59:59`);
  const next = logs.filter((l) => l.loginTs > ts);
  const removed = logs.length - next.length;
  saveLoginLogs(next);
  return { logs: next, removed };
}

export function deleteLoginLogsByRange(dateRange) {
  if (!dateRange || dateRange.length !== 2) throw new Error("请选择日期范围");
  const logs = loadLoginLogs();
  const start = toTimestamp(`${dateRange[0]} 00:00:00`);
  const end = toTimestamp(`${dateRange[1]} 23:59:59`);
  const next = logs.filter((l) => l.loginTs < start || l.loginTs > end);
  const removed = logs.length - next.length;
  saveLoginLogs(next);
  return { logs: next, removed };
}

export function purgeExpiredLoginLogs() {
  const logs = loadLoginLogs();
  const retained = applyLogRetentionPolicy(logs);
  const removed = logs.length - retained.length;
  if (removed > 0) saveLoginLogs(retained);
  return { logs: retained, removed };
}

function loadBackups() {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return [];
}

function saveBackups(list) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
}

export function getLoginLogBackups() {
  return loadBackups().sort((a, b) => b.createdAt - a.createdAt);
}

/** 备份方式（仅本地 CSV） */
export const BACKUP_METHODS = [
  {
    value: "local_csv",
    label: "本地 CSV 备份",
    desc: "导出 CSV 文件并在本系统保留备份记录，支持下载与恢复。",
  },
];

export const LOGIN_LOG_CSV_HEADERS = [
  "部门名称",
  "用户账号",
  "用户名",
  "姓名",
  "用户IP",
  "进入时间",
  "退出时间",
  "浏览器",
  "移动端设备型号",
  "操作系统",
  "分辨率",
  "移动端联网方式",
];

export function logToCsvRow(log, index = 0) {
  return [
    log.deptName || "",
    log.account || "",
    log.maskedName || maskChineseName(log.displayName),
    log.displayName || "",
    log.ip || "",
    log.loginTime || "",
    log.logoutTime || "",
    log.browser || "",
    resolveDeviceModel(log, index),
    log.os || "",
    log.resolution || RESOLUTION_POOL[index % RESOLUTION_POOL.length],
    resolveNetworkType(log, index),
  ];
}

export function exportLoginLogsCsv(logs, filename, meta = {}) {
  const lines = logs.map((l, i) =>
    logToCsvRow(l, i)
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [LOGIN_LOG_CSV_HEADERS.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: meta.moduleCode || "login-log",
    moduleName: meta.moduleName || "登录日志查询",
    moduleGroup: "日志管理",
    rowCount: logs.length,
    searchCriteria: meta.searchCriteria || "—",
  });
}

export function backupLoginLogs(logs, remark = "") {
  const filename = `登录日志备份_${formatDateTime(new Date()).replace(/[: ]/g, "")}.csv`;
  const record = createBackupRecord(logs, {
    method: "local_csv",
    methodLabel: "本地 CSV 备份",
    filename,
    remark,
    status: "success",
  });
  exportLoginLogsCsv(logs, filename);
  return record;
}

function createBackupRecord(logs, payload) {
  const backups = loadBackups();
  const record = {
    id: `backup-${Date.now()}`,
    count: logs.length,
    createdAt: Date.now(),
    createdTime: formatDateTime(new Date()),
    data: cloneDeep(logs),
    ...payload,
  };
  backups.unshift(record);
  saveBackups(backups.slice(0, 20));
  return record;
}

export function restoreLoginLogBackup(backupId) {
  const backups = loadBackups();
  const record = backups.find((b) => b.id === backupId);
  if (!record) throw new Error("备份记录不存在");
  if (record.method === "nw_damp") {
    throw new Error("历史平台归档备份不支持在本系统恢复，请下载后自行留存");
  }
  saveLoginLogs(record.data);
  return loadLoginLogs();
}

export function deleteLoginLogBackup(backupId) {
  const backups = loadBackups().filter((b) => b.id !== backupId);
  saveBackups(backups);
  return backups;
}

export function downloadBackupRecord(record) {
  exportLoginLogsCsv(record.data, record.filename);
}

export function paginateLogs(logs, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    list: logs.slice(start, start + pageSize),
    total: logs.length,
    totalPages: Math.max(1, Math.ceil(logs.length / pageSize)),
  };
}

export function formatSearchCriteria(query = {}) {
  const parts = [];
  if (query.dateRange && query.dateRange.length === 2) {
    parts.push(`时间段:${query.dateRange[0]}~${query.dateRange[1]}`);
  }
  if (query.username) parts.push(`用户名:${query.username}`);
  if (query.terminal) parts.push(`登录终端:${query.terminal}`);
  if (query.ip) parts.push(`登录IP:${query.ip}`);
  if (query.account) parts.push(`用户账号:${query.account}`);
  if (query.deptName) parts.push(`部门:${query.deptName}`);
  if (query.keyword) parts.push(`关键词:${query.keyword}`);
  return parts.length ? parts.join("；") : "全部";
}
