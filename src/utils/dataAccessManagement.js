/**
 * 数据接入管理 — 按八类无感数据展示字段结构与接入频率
 */

import { SENSING_ACCESS_SOURCES } from "./sensingAccessSchemas";

export { SENSING_ACCESS_SOURCES } from "./sensingAccessSchemas";
export {
  getAccessSourceByCode,
  getAccessSourceDisplayFields,
  getHighlightedFieldCount,
} from "./sensingAccessSchemas";

const STORAGE_KEY = "ygxwfx_sensing_access_config";

/** 线上接入统一路径 */
export const ACCESS_PATH_ONLINE = "南网数据中心接入";
/** 线下导入统一路径 */
export const ACCESS_PATH_OFFLINE = "单位线下自行导入";

export function getAccessPathForSource(source) {
  if (!source) return ACCESS_PATH_ONLINE;
  return source.category === "offline" ? ACCESS_PATH_OFFLINE : ACCESS_PATH_ONLINE;
}

export const SYNC_FREQ_OPTIONS = [
  "实时同步",
  "每30分钟同步",
  "每1小时同步",
  "每2小时同步",
  "每4小时同步",
  "每6小时同步",
  "每8小时同步",
  "每12小时同步",
  "每24小时同步",
  "每日同步",
];

function formatSyncTime(offsetMin = 0) {
  const d = new Date(Date.now() - offsetMin * 60000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return fallback;
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function buildDefaultConfig() {
  const config = { mobile: {}, web: {} };
  SENSING_ACCESS_SOURCES.forEach((src, i) => {
    const apiPath = getAccessPathForSource(src);
    const base = {
      syncFreq: src.defaultMobile.syncFreq,
      status: src.defaultMobile.status,
      apiPath,
      syncTime: formatSyncTime(i * 17),
    };
    config.mobile[src.code] = { ...base };
    config.web[src.code] = {
      syncFreq: src.defaultWeb.syncFreq,
      status: src.defaultWeb.status,
      apiPath,
      syncTime: formatSyncTime(i * 11 + 5),
    };
  });
  return config;
}

function normalizeConfigApiPaths(config) {
  SENSING_ACCESS_SOURCES.forEach((src) => {
    const apiPath = getAccessPathForSource(src);
    ["mobile", "web"].forEach((ch) => {
      if (config[ch] && config[ch][src.code]) {
        config[ch][src.code].apiPath = apiPath;
      }
    });
  });
  return config;
}

export function loadAccessConfig() {
  const stored = loadJson(STORAGE_KEY, null);
  if (stored && stored.mobile && stored.web) {
    const normalized = normalizeConfigApiPaths(stored);
    saveJson(STORAGE_KEY, normalized);
    return normalized;
  }
  const initial = buildDefaultConfig();
  saveJson(STORAGE_KEY, initial);
  return initial;
}

export function saveAccessConfig(config) {
  saveJson(STORAGE_KEY, config);
}

/** 合并元信息与渠道配置，供页面展示 */
export function buildAccessDisplayList(channel, config, keyword = "", statusFilter = "") {
  const ch = channel === "web" ? "web" : "mobile";
  const chConfig = config[ch] || {};
  let list = SENSING_ACCESS_SOURCES.map((src) => {
    const cfg = chConfig[src.code] || {};
    const fields = src.fields || [];
    return {
      code: src.code,
      name: src.name,
      shortName: src.shortName,
      category: src.category,
      categoryLabel: src.category === "offline" ? "线下导入" : "线上接入",
      sourceTable: src.sourceTable,
      description: src.description,
      fieldCount: fields.length,
      highlightCount: fields.filter((x) => x.highlighted).length,
      fieldSummary: fields
        .filter((x) => x.highlighted)
        .slice(0, 4)
        .map((x) => x.zh)
        .join("、"),
      fields,
      syncFreq: cfg.syncFreq || src.defaultMobile.syncFreq,
      status: cfg.status || "disconnect",
      apiPath: getAccessPathForSource(src),
      syncTime: cfg.syncTime || "—",
    };
  });

  const kw = (keyword || "").trim().toLowerCase();
  if (kw) {
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.sourceTable.toLowerCase().includes(kw) ||
        item.fieldSummary.toLowerCase().includes(kw)
    );
  }
  if (statusFilter) {
    list = list.filter((item) => item.status === statusFilter);
  }
  return list;
}

export function updateAccessChannelConfig(channel, sourceCode, patch) {
  const config = loadAccessConfig();
  const ch = channel === "web" ? "web" : "mobile";
  const src = SENSING_ACCESS_SOURCES.find((x) => x.code === sourceCode);
  if (!config[ch][sourceCode]) {
    config[ch][sourceCode] = {};
  }
  Object.assign(config[ch][sourceCode], patch, { apiPath: getAccessPathForSource(src) });
  if (patch.status === "sync" && !patch.syncTime) {
    config[ch][sourceCode].syncTime = formatSyncTime(0);
  }
  saveAccessConfig(config);
  return config;
}

export function sourceCategoryLabel(category) {
  return category === "offline" ? "线下导入" : "线上接入";
}

export function sourceTagType(category) {
  return category === "offline" ? "warning" : "success";
}

export function sensingSourceName(code) {
  const s = SENSING_ACCESS_SOURCES.find((x) => x.code === code);
  return s ? s.name : code;
}

/** 兼容旧引用 */
export const SENSING_SOURCES = SENSING_ACCESS_SOURCES.map((s) => ({
  code: s.code,
  name: s.name,
  fields: s.fields.map((f) => f.zh),
}));
