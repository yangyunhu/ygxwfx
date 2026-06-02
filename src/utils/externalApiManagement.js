/**
 * 外部输入 API 接口 — 接收解析、认证授权、数据转换
 */

import { isMissing, detectError, SENSING_SOURCES } from "./sensingRecords";
import {
  STANDARD_TABLE_FIELDS,
  REMOVED_STANDARD_FIELD_PROPS,
  getAttendanceTableFields,
  normalizeToStandardRow,
} from "./standardTableFields";

const API_KEY_STORAGE = "ygxwfx_external_api_keys";
const RECEIVE_LOG_STORAGE = "ygxwfx_external_api_receive_logs";
const ATTENDANCE_BUFFER_STORAGE = "ygxwfx_external_api_attendance_buffer";
const MAPPING_STORAGE = "ygxwfx_external_api_field_mapping";

export const API_LOG_RETENTION_YEARS = 3;

/** 标准表字段（映射目标，与无感数据整理标准字段一致） */
export const ATTENDANCE_TABLE_FIELDS = getAttendanceTableFields();

/** 八类无感数据源（字段映射数据源选项） */
export const SENSING_SOURCE_NAMES = SENSING_SOURCES.map((s) => s.name);

const LEGACY_SOURCE_MAP = {
  外部API: "闸机门禁数据",
  外部闸机系统: "闸机门禁数据",
  人资系统: "闸机门禁数据",
  第三方考勤平台: "闸机门禁数据",
};

export function resolveSensingSourceName(source) {
  const name = String(source || "").trim();
  if (!name) return SENSING_SOURCE_NAMES[0] || "闸机门禁数据";
  if (SENSING_SOURCE_NAMES.includes(name)) return name;
  return LEGACY_SOURCE_MAP[name] || name;
}

/** 默认外部字段 → 标准表映射 */
export const DEFAULT_FIELD_MAPPING = [
  { id: "ext-map-1", source: "闸机门禁数据", externalField: "employeeId", targetField: "人员ID", prop: "personId", label: "员工ID → 人员ID", status: "已映射", isManual: false },
  { id: "ext-map-2", source: "闸机门禁数据", externalField: "employeeName", targetField: "姓名", prop: "name", label: "员工姓名 → 姓名", status: "已映射", isManual: false },
  { id: "ext-map-3", source: "闸机门禁数据", externalField: "orgName", targetField: "组织机构", prop: "orgName", label: "机构名称 → 组织机构", status: "已映射", isManual: false },
  { id: "ext-map-4", source: "闸机门禁数据", externalField: "orgCode", targetField: "组织机构ID", prop: "orgId", label: "机构编码 → 组织机构ID", status: "已映射", isManual: false },
  { id: "ext-map-5", source: "闸机门禁数据", externalField: "checkIn", targetField: "到岗时间", prop: "arrivalTime", label: "签到时间 → 到岗时间", status: "已映射", isManual: false },
  { id: "ext-map-6", source: "闸机门禁数据", externalField: "checkOut", targetField: "离岗时间", prop: "departureTime", label: "签退时间 → 离岗时间", status: "已映射", isManual: false },
];

/** 常见外部字段（用于映射配置下拉） */
export const KNOWN_EXTERNAL_FIELDS = [
  ...new Set(DEFAULT_FIELD_MAPPING.map((m) => m.externalField)),
];

export const EXTERNAL_SOURCE_TYPES = [
  { value: "gate_system", label: "外部闸机系统" },
  { value: "hr_system", label: "人资系统" },
  { value: "third_party", label: "第三方考勤平台" },
];

export const SAMPLE_PAYLOAD = {
  source: "external_hr",
  sourceType: "hr_system",
  batchId: "BATCH-20260515-001",
  records: [
    {
      employeeId: "P10001",
      employeeName: "张伟",
      orgCode: "ORG-108",
      orgName: "办公室（党委办公室、董事会办公室、总经理办公室）",
      date: "2026-05-15",
      checkIn: "2026-05-15 08:12:00",
      checkOut: "2026-05-15 18:05:00",
      attendanceStatus: "出勤",
    },
    {
      employeeId: "P10002",
      employeeName: "李娜",
      orgCode: "ORG-110",
      orgName: "人力资源部",
      date: "2026-05-15",
      checkIn: "2026-05-15 08:45:00",
      checkOut: "2026-05-15 17:30:00",
      attendanceStatus: "迟到",
    },
    {
      employeeId: "",
      employeeName: "王强",
      orgCode: "ORG-115",
      orgName: "数字化部",
      date: "2026-05-15",
      checkIn: "invalid-time",
      checkOut: "2026-05-15 18:00:00",
      attendanceStatus: "出勤",
    },
  ],
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatNow() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
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

function getRetentionCutoffTs() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - API_LOG_RETENTION_YEARS);
  return d.getTime();
}

function applyLogRetention(logs) {
  const cutoff = getRetentionCutoffTs();
  return logs.filter((l) => l.createdAtTs >= cutoff);
}

function generateDefaultApiKeys() {
  return [
    {
      id: "key-1",
      name: "人资系统对接",
      apiKey: "sk-ygxwfx-hr-2026-a1b2c3d4",
      appId: "APP-HR-001",
      enabled: true,
      permissions: ["receive", "transform"],
      remark: "云南电网人资系统考勤数据推送",
      createdTime: "2026-01-10 09:00:00",
    },
    {
      id: "key-2",
      name: "外部闸机平台",
      apiKey: "sk-ygxwfx-gate-2026-e5f6g7h8",
      appId: "APP-GATE-002",
      enabled: true,
      permissions: ["receive"],
      remark: "闸机门禁数据实时接入",
      createdTime: "2026-02-15 14:30:00",
    },
    {
      id: "key-3",
      name: "测试密钥（已停用）",
      apiKey: "sk-ygxwfx-test-disabled",
      appId: "APP-TEST-003",
      enabled: false,
      permissions: ["receive"],
      remark: "开发测试用",
      createdTime: "2026-03-01 10:00:00",
    },
  ];
}

export function loadApiKeys() {
  return loadJson(API_KEY_STORAGE, generateDefaultApiKeys());
}

export function saveApiKeys(keys) {
  saveJson(API_KEY_STORAGE, keys);
  return keys;
}

export function createApiKey(payload) {
  const keys = loadApiKeys();
  const key = {
    id: `key-${Date.now()}`,
    name: payload.name,
    apiKey: `sk-ygxwfx-${Date.now().toString(36)}`,
    appId: payload.appId || `APP-${Date.now().toString(36).slice(-6).toUpperCase()}`,
    enabled: payload.enabled !== false,
    permissions: payload.permissions || ["receive"],
    remark: payload.remark || "",
    createdTime: formatNow(),
  };
  keys.push(key);
  saveApiKeys(keys);
  return key;
}

export function updateApiKey(id, payload) {
  const keys = loadApiKeys();
  const idx = keys.findIndex((k) => k.id === id);
  if (idx < 0) throw new Error("密钥不存在");
  keys[idx] = { ...keys[idx], ...payload, id };
  saveApiKeys(keys);
  return keys[idx];
}

export function deleteApiKey(id) {
  const keys = loadApiKeys().filter((k) => k.id !== id);
  saveApiKeys(keys);
  return keys;
}

export function authenticateApiKey(apiKey) {
  if (!apiKey || !String(apiKey).trim()) {
    return { success: false, message: "缺少 API Key" };
  }
  const key = loadApiKeys().find((k) => k.apiKey === apiKey.trim());
  if (!key) return { success: false, message: "API Key 无效" };
  if (!key.enabled) return { success: false, message: "API Key 已停用" };
  return { success: true, key, message: "认证通过" };
}

export function checkApiPermission(key, permission) {
  return (key.permissions || []).includes(permission);
}

export function resolveExternalMappingProp(targetFieldLabel, mappings = []) {
  const label = String(targetFieldLabel || "").trim();
  const known = ATTENDANCE_TABLE_FIELDS.find((f) => f.label === label || f.key === label);
  if (known) return known.key;
  const base =
    "custom_" +
    (label
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") || "field");
  let prop = base;
  let n = 1;
  while (mappings.some((m) => m.prop === prop)) {
    prop = `${base}_${n++}`;
  }
  return prop;
}

function resolveTargetFieldMeta(targetField, prop) {
  const byProp = ATTENDANCE_TABLE_FIELDS.find((f) => f.key === prop);
  if (byProp) return { label: byProp.label, prop: byProp.key };
  const byLabel = ATTENDANCE_TABLE_FIELDS.find((f) => f.label === targetField || f.key === targetField);
  if (byLabel) return { label: byLabel.label, prop: byLabel.key };
  return { label: targetField || prop, prop: prop || targetField };
}

export function normalizeFieldMapping(list) {
  return (list || [])
    .filter((m) => !REMOVED_STANDARD_FIELD_PROPS.has(m.prop))
    .map((m, i) => {
    const meta = resolveTargetFieldMeta(m.targetField, m.prop);
    const prop = meta.prop;
    const targetLabel = meta.label;
    if (REMOVED_STANDARD_FIELD_PROPS.has(prop)) return null;
    return {
      id: m.id || `ext-map-${i}-${prop}`,
      source: resolveSensingSourceName(m.source),
      externalField: m.externalField,
      targetField: targetLabel,
      prop,
      label: m.label || `${m.externalField} → ${targetLabel}`,
      status: m.status || "已映射",
      isManual: m.isManual !== false,
    };
  }).filter(Boolean);
}

export function createExternalFieldMapping(payload, mappings = []) {
  const source = String(payload.source || "").trim();
  const externalField = String(payload.externalField || "").trim();
  const targetFieldLabel = String(payload.targetField || "").trim();
  if (!source || !externalField || !targetFieldLabel) {
    return { ok: false, message: "请完整填写数据源、外部字段和标准字段" };
  }
  const dup = mappings.some(
    (m) => m.id !== payload.id && m.source === source && m.externalField === externalField
  );
  if (dup) {
    return { ok: false, message: "该数据源下已存在相同外部字段的映射" };
  }
  const prop = payload.prop || resolveExternalMappingProp(targetFieldLabel, mappings);
  const resolved = resolveTargetFieldMeta(targetFieldLabel, prop);
  if (REMOVED_STANDARD_FIELD_PROPS.has(resolved.prop)) {
    return { ok: false, message: "该标准字段已停用，请重新选择" };
  }
  return {
    ok: true,
    mapping: {
      id: payload.id || `ext-map-${Date.now()}`,
      source,
      externalField,
      targetField: resolved.label,
      prop: resolved.prop,
      label: `${externalField} → ${resolved.label}`,
      status: payload.status || "已映射",
      isManual: payload.isManual !== false,
    },
  };
}

export function loadFieldMapping() {
  return normalizeFieldMapping(loadJson(MAPPING_STORAGE, DEFAULT_FIELD_MAPPING));
}

export function saveFieldMapping(mapping) {
  saveJson(MAPPING_STORAGE, mapping);
  return mapping;
}

export function resetFieldMapping() {
  const mapping = cloneDeep(DEFAULT_FIELD_MAPPING);
  saveJson(MAPPING_STORAGE, mapping);
  return mapping;
}

function validateRecord(record, index) {
  const errors = [];
  const warnings = [];
  if (isMissing(record.employeeId) && isMissing(record.personId)) {
    errors.push(`第 ${index + 1} 条：人员ID缺失`);
  }
  if (isMissing(record.employeeName) && isMissing(record.name)) {
    errors.push(`第 ${index + 1} 条：姓名缺失`);
  }
  if (isMissing(record.date) && isMissing(record.recordDate)) {
    errors.push(`第 ${index + 1} 条：考勤日期缺失`);
  }
  const checkIn = record.checkIn || record.arrivalTime;
  if (!isMissing(checkIn)) {
    const err = detectError("时间", checkIn);
    if (err) errors.push(`第 ${index + 1} 条：到岗时间${err}`);
  }
  const checkOut = record.checkOut || record.departureTime;
  if (!isMissing(checkOut)) {
    const err = detectError("时间", checkOut);
    if (err) errors.push(`第 ${index + 1} 条：离岗时间${err}`);
  }
  if (isMissing(record.orgName)) warnings.push(`第 ${index + 1} 条：组织机构为空`);
  return { errors, warnings };
}

export function parseExternalPayload(payload) {
  let data;
  try {
    data = typeof payload === "string" ? JSON.parse(payload) : payload;
  } catch (e) {
    return { success: false, message: "JSON 格式解析失败", errors: [e.message] };
  }
  if (!data || typeof data !== "object") {
    return { success: false, message: "数据格式无效", errors: ["根节点必须为对象"] };
  }
  const records = Array.isArray(data.records) ? data.records : Array.isArray(data) ? data : null;
  if (!records) {
    return { success: false, message: "未找到 records 数组", errors: ["请按约定格式提交 { records: [...] }"] };
  }
  const allErrors = [];
  const allWarnings = [];
  records.forEach((rec, i) => {
    const { errors, warnings } = validateRecord(rec, i);
    allErrors.push(...errors);
    allWarnings.push(...warnings);
  });
  return {
    success: allErrors.length === 0,
    message: allErrors.length ? `解析完成，存在 ${allErrors.length} 项校验错误` : "解析与校验通过",
    data,
    records,
    recordCount: records.length,
    errors: allErrors,
    warnings: allWarnings,
    sourceType: data.sourceType || data.source || "unknown",
    batchId: data.batchId || `BATCH-${Date.now()}`,
  };
}

function mapRecordToAttendance(external, mapping, meta = {}) {
  const patch = {};
  mapping.forEach((m) => {
    if (m.status && m.status !== "已映射") return;
    const key = m.prop || m.targetField;
    if (REMOVED_STANDARD_FIELD_PROPS.has(key)) return;
    const val = external[m.externalField];
    if (val != null && val !== "") patch[key] = val;
  });
  if (!patch.personId && external.employeeId) patch.personId = external.employeeId;
  if (!patch.name && external.employeeName) patch.name = external.employeeName;
  if (!patch.arrivalTime && external.checkIn) patch.arrivalTime = external.checkIn;
  if (!patch.departureTime && external.checkOut) patch.departureTime = external.checkOut;
  if (!patch.orgId && external.orgCode) patch.orgId = external.orgCode;
  if (!patch.dataSources) patch.dataSources = meta.sourceName || "外部API接入";
  return normalizeToStandardRow(patch, meta);
}

export function transformToAttendanceTable(records, mapping = loadFieldMapping(), meta = {}) {
  const validRecords = [];
  const failed = [];
  records.forEach((rec, i) => {
    const { errors } = validateRecord(rec, i);
    if (errors.length) {
      failed.push({ index: i + 1, record: rec, errors });
      return;
    }
    validRecords.push(mapRecordToAttendance(rec, mapping, meta));
  });
  return { rows: validRecords, failed, successCount: validRecords.length, failCount: failed.length };
}

export function loadReceiveLogs() {
  const logs = applyLogRetention(loadJson(RECEIVE_LOG_STORAGE, []));
  saveJson(RECEIVE_LOG_STORAGE, logs);
  return logs.sort((a, b) => b.createdAtTs - a.createdAtTs);
}

export function addReceiveLog(entry) {
  const logs = loadReceiveLogs();
  const log = {
    id: `recv-${Date.now()}`,
    createdAt: formatNow(),
    createdAtTs: Date.now(),
    ...entry,
  };
  logs.unshift(log);
  saveJson(RECEIVE_LOG_STORAGE, applyLogRetention(logs).slice(0, 200));
  return log;
}

export function loadAttendanceBuffer() {
  return loadJson(ATTENDANCE_BUFFER_STORAGE, []).map((row) => normalizeToStandardRow(row));
}

export function appendAttendanceBuffer(rows) {
  const buffer = loadAttendanceBuffer();
  const normalized = rows.map((row) => normalizeToStandardRow(row));
  const next = [...normalized, ...buffer].slice(0, 500);
  saveJson(ATTENDANCE_BUFFER_STORAGE, next);
  return next;
}

/** 完整 API 调用流程：认证 → 解析 → 转换 → 入库 */
export function processExternalApiRequest(apiKey, payload, options = {}) {
  const auth = authenticateApiKey(apiKey);
  if (!auth.success) {
    const log = addReceiveLog({
      status: "auth_failed",
      statusLabel: "认证失败",
      message: auth.message,
      recordCount: 0,
      apiKeyName: "—",
    });
    return { success: false, stage: "auth", message: auth.message, log };
  }
  if (options.requireTransform && !checkApiPermission(auth.key, "transform")) {
    const log = addReceiveLog({
      status: "auth_failed",
      statusLabel: "权限不足",
      message: "该密钥无数据转换权限",
      recordCount: 0,
      apiKeyName: auth.key.name,
    });
    return { success: false, stage: "auth", message: "权限不足", log };
  }

  const parsed = parseExternalPayload(payload);
  if (!parsed.success && parsed.errors.length) {
    const log = addReceiveLog({
      status: "parse_failed",
      statusLabel: "解析/校验失败",
      message: parsed.message,
      recordCount: parsed.recordCount || 0,
      errorCount: parsed.errors.length,
      errors: parsed.errors.slice(0, 5),
      apiKeyName: auth.key.name,
      batchId: parsed.batchId,
    });
    return { success: false, stage: "parse", message: parsed.message, parsed, log };
  }

  const mapping = loadFieldMapping();
  const transformed = transformToAttendanceTable(parsed.records, mapping, {
    batchId: parsed.batchId,
    sourceName: EXTERNAL_SOURCE_TYPES.find((s) => s.value === parsed.sourceType)?.label || parsed.sourceType,
  });

  if (options.persist !== false && transformed.successCount) {
    appendAttendanceBuffer(transformed.rows);
  }

  const log = addReceiveLog({
    status: transformed.failCount ? "partial" : "success",
    statusLabel: transformed.failCount ? "部分成功" : "成功",
    message: `接收 ${parsed.recordCount} 条，转换成功 ${transformed.successCount} 条`,
    recordCount: parsed.recordCount,
    successCount: transformed.successCount,
    failCount: transformed.failCount,
    apiKeyName: auth.key.name,
    batchId: parsed.batchId,
    warnings: parsed.warnings,
  });

  return {
    success: transformed.successCount > 0,
    stage: "complete",
    auth,
    parsed,
    transformed,
    log,
  };
}

export function countExternalApiStats() {
  const logs = loadReceiveLogs();
  const keys = loadApiKeys();
  const buffer = loadAttendanceBuffer();
  return {
    apiKeys: keys.length,
    enabledKeys: keys.filter((k) => k.enabled).length,
    receiveLogs: logs.length,
    todayReceive: logs.filter((l) => l.createdAt.startsWith(formatNow().slice(0, 10))).length,
    attendanceRows: buffer.length,
  };
}
