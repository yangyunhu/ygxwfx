/**
 * 接口配置 — 服务器端口与请求/响应数据格式
 */

const SERVER_CONFIG_KEY = "ygxwfx_interface_server_config";
const FORMAT_CONFIG_KEY = "ygxwfx_interface_format_config";

export const HOST_TYPE_OPTIONS = [
  { value: "domain", label: "域名" },
  { value: "ip", label: "IP 地址" },
];

export const PROTOCOL_OPTIONS = [
  { value: "https", label: "HTTPS" },
  { value: "http", label: "HTTP" },
];

export const REQUEST_FORMAT_OPTIONS = [
  { value: "json", label: "JSON", contentType: "application/json" },
  { value: "xml", label: "XML", contentType: "application/xml" },
  { value: "form", label: "Form 表单", contentType: "application/x-www-form-urlencoded" },
];

export const RESPONSE_FORMAT_OPTIONS = [
  { value: "json", label: "JSON", contentType: "application/json" },
  { value: "xml", label: "XML", contentType: "application/xml" },
];

const DEFAULT_SERVER_CONFIG = {
  hostType: "domain",
  serverHost: "api.ygxwfx.csg.cn",
  port: 8443,
  protocol: "https",
  apiBasePath: "/api/v1/external",
  enabled: true,
  timeout: 30,
  maxConnections: 200,
  remark: "外部输入 API 接口服务地址",
  updatedAt: "",
};

/** 请求格式 → 响应格式默认规则 */
const DEFAULT_FORMAT_RULES = [
  {
    id: "fmt-json-json",
    requestFormat: "json",
    responseFormat: "json",
    requestContentType: "application/json",
    responseContentType: "application/json;charset=UTF-8",
    charset: "UTF-8",
    enabled: true,
    desc: "JSON 请求统一返回 JSON 结构（code/message/data）",
  },
  {
    id: "fmt-xml-xml",
    requestFormat: "xml",
    responseFormat: "xml",
    requestContentType: "application/xml",
    responseContentType: "application/xml;charset=UTF-8",
    charset: "UTF-8",
    enabled: true,
    desc: "XML 请求返回 XML 响应体",
  },
  {
    id: "fmt-form-json",
    requestFormat: "form",
    responseFormat: "json",
    requestContentType: "application/x-www-form-urlencoded",
    responseContentType: "application/json;charset=UTF-8",
    charset: "UTF-8",
    enabled: true,
    desc: "表单提交请求，响应为 JSON 便于前端/系统解析",
  },
];

const DEFAULT_FORMAT_CONFIG = {
  defaultResponseFormat: "json",
  autoMatch: true,
  rules: DEFAULT_FORMAT_RULES,
  updatedAt: "",
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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

export function loadServerConfig() {
  return { ...DEFAULT_SERVER_CONFIG, ...loadJson(SERVER_CONFIG_KEY, {}) };
}

export function saveServerConfig(config) {
  const next = { ...config, updatedAt: formatNow() };
  saveJson(SERVER_CONFIG_KEY, next);
  return next;
}

export function resetServerConfig() {
  const next = { ...DEFAULT_SERVER_CONFIG, updatedAt: formatNow() };
  saveJson(SERVER_CONFIG_KEY, next);
  return next;
}

export function validateServerConfig(config) {
  const errors = [];
  if (!config.serverHost || !String(config.serverHost).trim()) {
    errors.push("请填写服务器 IP 或域名");
  }
  if (config.hostType === "ip") {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(config.serverHost.trim())) {
      errors.push("IP 地址格式不正确");
    }
  }
  const port = Number(config.port);
  if (!port || port < 1 || port > 65535) {
    errors.push("端口号须在 1-65535 之间");
  }
  if (!config.apiBasePath || !String(config.apiBasePath).startsWith("/")) {
    errors.push("API 基础路径须以 / 开头");
  }
  return errors;
}

export function buildServerEndpoint(config = loadServerConfig(), path = "") {
  const cfg = config;
  const base = `${cfg.protocol}://${cfg.serverHost}:${cfg.port}${cfg.apiBasePath}`;
  return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
}

export function loadFormatConfig() {
  const stored = loadJson(FORMAT_CONFIG_KEY, null);
  if (stored) return stored;
  return { ...DEFAULT_FORMAT_CONFIG, updatedAt: formatNow() };
}

export function saveFormatConfig(config) {
  const next = { ...config, updatedAt: formatNow() };
  saveJson(FORMAT_CONFIG_KEY, next);
  return next;
}

export function resetFormatConfig() {
  const next = { ...DEFAULT_FORMAT_CONFIG, updatedAt: formatNow() };
  saveJson(FORMAT_CONFIG_KEY, next);
  return next;
}

export function getFormatRuleByRequest(requestFormat, config = loadFormatConfig()) {
  if (config.autoMatch) {
    const rule = (config.rules || []).find((r) => r.enabled && r.requestFormat === requestFormat);
    if (rule) return rule;
  }
  const resp = config.defaultResponseFormat || "json";
  const respOpt = RESPONSE_FORMAT_OPTIONS.find((o) => o.value === resp);
  const reqOpt = REQUEST_FORMAT_OPTIONS.find((o) => o.value === requestFormat);
  return {
    requestFormat,
    responseFormat: resp,
    requestContentType: reqOpt ? reqOpt.contentType : "application/json",
    responseContentType: respOpt ? `${respOpt.contentType};charset=UTF-8` : "application/json;charset=UTF-8",
    charset: "UTF-8",
  };
}

export function updateFormatRule(ruleId, payload, config = loadFormatConfig()) {
  const rules = (config.rules || []).map((r) => (r.id === ruleId ? { ...r, ...payload, id: ruleId } : r));
  return saveFormatConfig({ ...config, rules });
}

export function buildSampleResponse(requestFormat, success = true) {
  const rule = getFormatRuleByRequest(requestFormat);
  const body = success
    ? { code: 200, message: "success", data: { batchId: "BATCH-DEMO", recordCount: 2 } }
    : { code: 400, message: "validation failed", data: null };

  if (rule.responseFormat === "xml") {
    const status = success ? "success" : "failed";
    return {
      contentType: rule.responseContentType,
      body: `<?xml version="1.0" encoding="UTF-8"?>\n<response><code>${body.code}</code><message>${body.message}</message><status>${status}</status></response>`,
    };
  }
  return {
    contentType: rule.responseContentType,
    body: JSON.stringify(body, null, 2),
  };
}

export function getInterfaceConfigSummary() {
  const server = loadServerConfig();
  const format = loadFormatConfig();
  return {
    endpoint: buildServerEndpoint(server),
    serverEnabled: server.enabled,
    ruleCount: (format.rules || []).filter((r) => r.enabled).length,
    autoMatch: format.autoMatch,
    updatedAt: server.updatedAt || format.updatedAt || "—",
  };
}

export function getApiEndpointList(config = loadServerConfig()) {
  return [
    { path: "/receive", method: "POST", name: "数据接收", desc: "接收外部推送的考勤数据" },
    { path: "/auth/verify", method: "POST", name: "密钥验证", desc: "API Key 认证" },
    { path: "/transform", method: "POST", name: "数据转换", desc: "转换为标准表格式" },
    { path: "/health", method: "GET", name: "健康检查", desc: "服务状态探测" },
  ].map((item) => ({
    ...item,
    fullUrl: buildServerEndpoint(config, item.path),
  }));
}
