/**
 * 异常数据修复 — 结合无感数据源与校验规则
 */

import {
  generateGateRows,
  generateCanteenRows,
  generateOnlineRows,
  buildMissingRows,
  buildDuplicateRows,
  buildErrorRows,
  isMissing,
  SENSING_SOURCES,
} from "./sensingRecords";
import {
  buildPersonDayContexts,
  generateAbnormalAttendanceTable,
} from "./sensingBusinessRules";
import { DEFAULT_WORK_CONFIG, RULE_CATALOG } from "./behaviorModeSettings";
import { downloadCsvWithLog } from "./exportLogger";
import { SENSING_ACCESS_SOURCES } from "./sensingAccessSchemas";

/** 业务规则类异常（非八类无感源表，单独展示） */
export const BUSINESS_RULE_SOURCE = {
  code: "business_rule",
  name: "异常考勤校验表",
  shortName: "业务规则",
  category: "rule",
  categoryLabel: "规则",
};

/** 异常数据处理 — 左侧类型导航（八类无感数据 + 业务规则） */
export function getAbnormalDataSourceTypes() {
  return [
    ...SENSING_ACCESS_SOURCES.map((s) => ({
      code: s.code,
      name: s.name,
      shortName: s.shortName || s.name,
      category: s.category,
      categoryLabel: s.category === "offline" ? "线下" : "线上",
    })),
    { ...BUSINESS_RULE_SOURCE },
  ];
}

export function countIssuesBySourceType(issues, statusFilter = null) {
  const counts = {};
  (issues || []).forEach((issue) => {
    if (statusFilter && issue.status !== statusFilter) return;
    const code = issue.sourceCode || "unknown";
    counts[code] = (counts[code] || 0) + 1;
  });
  return counts;
}

/** 异常数据类型（校验结果分类） */
export const ABNORMAL_ISSUE_TYPES = [
  { value: "all", label: "全部" },
  { value: "missing", label: "字段缺失" },
  { value: "format", label: "格式错误" },
  { value: "duplicate", label: "重复记录" },
  { value: "time_logic", label: "时间逻辑异常" },
  { value: "abnormal", label: "业务异常" },
];

export function countIssuesByIssueType(issues) {
  const counts = {};
  (issues || []).forEach((issue) => {
    const key = issue.issueType || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

export function buildIssueTypeTabs(issues) {
  const counts = countIssuesByIssueType(issues);
  const total = (issues || []).length;
  return ABNORMAL_ISSUE_TYPES.map((t) => ({
    ...t,
    count: t.value === "all" ? total : counts[t.value] || 0,
  })).filter((t) => t.value === "all" || t.count > 0);
}

const DATA_KEY = "ygxwfx_sensing_repair_data";
const ISSUE_KEY = "ygxwfx_quality_issues";
const REPAIR_KEY = "ygxwfx_repair_records";
const VERSION_KEY = "ygxwfx_data_versions";

/** 数据质量校验规则（结合无感数据源字段） */
export const DATA_QUALITY_RULES = [
  {
    id: "qr-missing",
    name: "必填字段缺失检查",
    category: "完整性",
    source: "无感数据清洗",
    desc: "检查闸机、食堂、线上源中人员ID、电话、时间等必填项是否缺失",
    relatedRules: ["attendance"],
  },
  {
    id: "qr-format",
    name: "字段格式校验",
    category: "规范性",
    source: "无感数据清洗",
    desc: "电话11位、日期时间格式等字段规范性校验",
    relatedRules: ["attendance"],
  },
  {
    id: "qr-duplicate",
    name: "重复记录检测",
    category: "唯一性",
    source: "无感数据整理",
    desc: "同一人员同一日期出现多条闸机/食堂记录",
    relatedRules: ["attendance"],
  },
  {
    id: "qr-abnormal",
    name: "异常考勤校验规则",
    category: "业务规则",
    source: "异常考勤校验表",
    desc: "依据6层异常校验规则：冲突、迟到、早退、证据不足、旷工等",
    relatedRules: ["abnormal"],
  },
  {
    id: "qr-time-logic",
    name: "时间逻辑校验",
    category: "逻辑性",
    source: "无感基础数据",
    desc: "闸机进入时间不得晚于出去时间，离岗不得早于到岗",
    relatedRules: ["attendance", "abnormal"],
  },
];

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function formatNow() {
  const d = new Date();
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

let dataCache = null;

export function loadSensingData() {
  if (dataCache) return cloneDeep(dataCache);
  const stored = loadJson(DATA_KEY, null);
  if (stored) {
    dataCache = stored;
  } else {
    dataCache = {
      gateRows: generateGateRows(),
      canteenRows: generateCanteenRows(),
      onlineRows: generateOnlineRows(),
    };
  }
  return cloneDeep(dataCache);
}

export function saveSensingData(data) {
  dataCache = cloneDeep(data);
  saveJson(DATA_KEY, dataCache);
  return cloneDeep(dataCache);
}

export function resetSensingData() {
  localStorage.removeItem(DATA_KEY);
  localStorage.removeItem(ISSUE_KEY);
  localStorage.removeItem(REPAIR_KEY);
  localStorage.removeItem(VERSION_KEY);
  dataCache = null;
  return loadSensingData();
}

function findRecord(sourceCode, recordId, data) {
  if (sourceCode === "offline_gate") return data.gateRows.find((r) => r.id === recordId);
  if (sourceCode === "offline_canteen") return data.canteenRows.find((r) => r.id === recordId);
  return data.onlineRows.find((r) => r.id === recordId);
}

function getSourceCodeByRecordId(recordId, data) {
  if (recordId.startsWith("gate-")) return "offline_gate";
  if (recordId.startsWith("canteen-")) return "offline_canteen";
  const online = data.onlineRows.find((r) => r.id === recordId);
  return online ? online.sourceCode : "offline_gate";
}

function buildTimeLogicIssues(gateRows) {
  const rows = [];
  gateRows.forEach((r) => {
    if (isMissing(r.entryTime) || isMissing(r.exitTime)) return;
    const entry = new Date(String(r.entryTime).replace(/-/g, "/"));
    const exit = new Date(String(r.exitTime).replace(/-/g, "/"));
    if (!isNaN(entry.getTime()) && !isNaN(exit.getTime()) && exit <= entry) {
      rows.push({
        id: `tl-${r.id}`,
        issueType: "time_logic",
        issueTypeLabel: "时间逻辑异常",
        ruleId: "qr-time-logic",
        ruleName: "时间逻辑校验",
        ruleLevel: "逻辑性",
        recordId: r.id,
        sourceCode: "offline_gate",
        sourceName: r.sourceName,
        name: r.name,
        personId: r.personId,
        orgName: r.orgName,
        recordDate: r.recordDate,
        fieldKey: "exitTime",
        fieldLabel: "闸机出去时间记录",
        currentValue: r.exitTime,
        detail: "闸机出去时间早于或等于进入时间",
        severity: "高",
        status: "open",
      });
    }
  });
  return rows;
}

function mapMissingToIssue(row) {
  const data = loadSensingData();
  const sourceCode = getSourceCodeByRecordId(row.recordId, data);
  const record = findRecord(sourceCode, row.recordId, data);
  return {
    id: row.id,
    issueType: "missing",
    issueTypeLabel: "字段缺失",
    ruleId: "qr-missing",
    ruleName: "必填字段缺失检查",
    ruleLevel: "完整性",
    recordId: row.recordId,
    sourceCode,
    sourceName: row.sourceName,
    name: row.name,
    personId: row.personId,
    orgName: row.orgName,
    recordDate: (record && record.recordDate) || row.recordDate || "—",
    fieldKey: row.fieldKey,
    fieldLabel: row.fieldLabel,
    currentValue: row.fieldValue,
    detail: `${row.fieldLabel}为空或缺失`,
    severity: "中",
    status: "open",
  };
}

function mapErrorToIssue(row) {
  const data = loadSensingData();
  const sourceCode = getSourceCodeByRecordId(row.recordId, data);
  const record = findRecord(sourceCode, row.recordId, data);
  return {
    id: row.id,
    issueType: "format",
    issueTypeLabel: "格式错误",
    ruleId: "qr-format",
    ruleName: "字段格式校验",
    ruleLevel: "规范性",
    recordId: row.recordId,
    sourceCode,
    sourceName: row.sourceName,
    name: row.name,
    personId: row.personId,
    orgName: row.orgName,
    recordDate: (record && record.recordDate) || "—",
    fieldKey: row.fieldKey,
    fieldLabel: row.fieldLabel,
    currentValue: row.fieldValue,
    detail: row.errorReason,
    severity: "中",
    status: "open",
  };
}

function mapDuplicateToIssue(row) {
  return {
    id: row.id,
    issueType: "duplicate",
    issueTypeLabel: "重复记录",
    ruleId: "qr-duplicate",
    ruleName: "重复记录检测",
    ruleLevel: "唯一性",
    recordId: row.id.replace(/^dup-/, ""),
    sourceCode: getSourceCodeByRecordId(row.id.replace(/^dup-/, ""), loadSensingData()),
    sourceName: row.sourceName,
    name: row.name,
    personId: row.personId,
    orgName: row.orgName,
    recordDate: row.recordDate,
    fieldKey: "dupGroup",
    fieldLabel: "重复组",
    currentValue: row.dupGroup,
    detail: `同人员同日存在 ${row.dupCount} 条记录（第 ${row.dupIndex} 条）`,
    severity: "高",
    status: "open",
  };
}

function mapAbnormalToIssue(row) {
  return {
    id: `abn-issue-${row.id}`,
    issueType: "abnormal",
    issueTypeLabel: "业务异常",
    ruleId: "qr-abnormal",
    ruleName: "异常考勤校验规则",
    ruleLevel: row.ruleLevel,
    recordId: row.personId,
    sourceCode: "business_rule",
    sourceName: "异常考勤校验表",
    name: row.name,
    personId: row.personId,
    orgName: row.orgName,
    recordDate: row.recordDate,
    fieldKey: "abnormalType",
    fieldLabel: "异常类型",
    currentValue: row.abnormalType,
    detail: row.detail,
    dataSources: row.dataSources,
    severity: row.abnormalType === "旷工" ? "高" : "中",
    status: "open",
  };
}

export function runQualityInspection() {
  const data = loadSensingData();
  const contexts = buildPersonDayContexts(data.gateRows, data.canteenRows, data.onlineRows);
  const abnormalRows = generateAbnormalAttendanceTable(contexts, DEFAULT_WORK_CONFIG);

  const issues = [
    ...buildMissingRows(data.gateRows, data.canteenRows, data.onlineRows).map(mapMissingToIssue),
    ...buildErrorRows(data.gateRows, data.canteenRows, data.onlineRows).map(mapErrorToIssue),
    ...buildDuplicateRows(data.gateRows, data.canteenRows, data.onlineRows).map(mapDuplicateToIssue),
    ...buildTimeLogicIssues(data.gateRows),
    ...abnormalRows.map(mapAbnormalToIssue),
  ];

  const storedIssues = loadJson(ISSUE_KEY, {});
  issues.forEach((issue) => {
    const prev = storedIssues[issue.id];
    if (prev && (prev.status === "fixed" || prev.status === "ignored")) {
      issue.status = prev.status;
    }
  });

  saveJson(ISSUE_KEY, Object.fromEntries(issues.map((i) => [i.id, i])));
  return issues;
}

export function getQualityIssues() {
  const list = Object.values(loadJson(ISSUE_KEY, {}));
  if (!list.length) return runQualityInspection();
  return list.sort((a, b) => (a.severity === "高" ? -1 : 1));
}

export function getIssueById(id) {
  return getQualityIssues().find((i) => i.id === id) || null;
}

export function updateIssueStatus(issueId, status) {
  const map = loadJson(ISSUE_KEY, {});
  if (map[issueId]) {
    map[issueId].status = status;
    saveJson(ISSUE_KEY, map);
  }
}

export function getDataVersions(recordId) {
  const all = loadJson(VERSION_KEY, []);
  return all.filter((v) => v.recordId === recordId).sort((a, b) => b.version - a.version);
}

export function getRepairRecords() {
  return loadJson(REPAIR_KEY, []).sort((a, b) => b.applyTimeTs - a.applyTimeTs);
}

export function submitDataRepair(payload) {
  const data = loadSensingData();
  const sourceCode = payload.sourceCode || getSourceCodeByRecordId(payload.recordId, data);
  const record = findRecord(sourceCode, payload.recordId, data);
  if (!record) throw new Error("未找到原始数据记录");

  const fieldKey = payload.fieldKey;
  const beforeValue = record[fieldKey];
  const afterValue = payload.afterValue;

  if (String(beforeValue) === String(afterValue)) {
    throw new Error("修改值与原值相同");
  }

  const versions = loadJson(VERSION_KEY, []);
  const versionNo = versions.filter((v) => v.recordId === payload.recordId).length + 1;
  const versionRecord = {
    id: `ver-${Date.now()}`,
    recordId: payload.recordId,
    sourceCode,
    fieldKey,
    fieldLabel: payload.fieldLabel,
    beforeValue,
    afterValue,
    reason: payload.reason,
    operator: payload.operator || "当前用户",
    operatedAt: formatNow(),
    version: versionNo,
  };
  versions.unshift(versionRecord);
  saveJson(VERSION_KEY, versions);

  const repairs = loadJson(REPAIR_KEY, []);
  const repairRecord = {
    id: `repair-${Date.now()}`,
    issueId: payload.issueId,
    recordId: payload.recordId,
    sourceCode,
    sourceName: record.sourceName || payload.sourceName,
    name: record.name || payload.name,
    personId: record.personId || payload.personId,
    fieldKey,
    fieldLabel: payload.fieldLabel,
    beforeValue,
    afterValue,
    applyReason: payload.reason,
    applicant: payload.operator || "当前用户",
    applyTime: formatNow(),
    applyTimeTs: Date.now(),
    approver: "",
    approveTime: "",
    approveRemark: "",
    status: "pending",
    versionId: versionRecord.id,
    ruleName: payload.ruleName || "—",
  };
  repairs.unshift(repairRecord);
  saveJson(REPAIR_KEY, repairs);

  if (payload.issueId) updateIssueStatus(payload.issueId, "processing");

  return repairRecord;
}

export function approveRepair(repairId, approver, remark = "") {
  const repairs = loadJson(REPAIR_KEY, []);
  const repair = repairs.find((r) => r.id === repairId);
  if (!repair) throw new Error("修复记录不存在");
  if (repair.status !== "pending") throw new Error("该记录已审批");

  const data = loadSensingData();
  const record = findRecord(repair.sourceCode, repair.recordId, data);
  if (record) {
    record[repair.fieldKey] = repair.afterValue;
    saveSensingData(data);
  }

  repair.status = "approved";
  repair.approver = approver || "系统管理员";
  repair.approveTime = formatNow();
  repair.approveRemark = remark;
  saveJson(REPAIR_KEY, repairs);

  if (repair.issueId) updateIssueStatus(repair.issueId, "fixed");
  return repair;
}

export function rejectRepair(repairId, approver, remark = "") {
  const repairs = loadJson(REPAIR_KEY, []);
  const repair = repairs.find((r) => r.id === repairId);
  if (!repair) throw new Error("修复记录不存在");
  if (repair.status !== "pending") throw new Error("该记录已审批");

  repair.status = "rejected";
  repair.approver = approver || "系统管理员";
  repair.approveTime = formatNow();
  repair.approveRemark = remark;
  saveJson(REPAIR_KEY, repairs);

  if (repair.issueId) updateIssueStatus(repair.issueId, "open");
  return repair;
}

export function countRepairStats() {
  const issues = getQualityIssues();
  const repairs = getRepairRecords();
  return {
    issues: issues.length,
    openIssues: issues.filter((i) => i.status === "open").length,
    fixedIssues: issues.filter((i) => i.status === "fixed").length,
    repairs: repairs.length,
    pendingRepairs: repairs.filter((r) => r.status === "pending").length,
    approvedRepairs: repairs.filter((r) => r.status === "approved").length,
  };
}

export function getRuleCatalog() {
  return RULE_CATALOG;
}

export function getSensingSources() {
  return SENSING_SOURCES;
}

export function exportRepairCsv(rows, filename) {
  const headers = ["申请人", "申请时间", "数据源", "姓名", "字段", "修改前", "修改后", "状态", "审批人", "审批时间"];
  const statusMap = { pending: "待审批", approved: "已通过", rejected: "已驳回" };
  const lines = rows.map((r) =>
    [
      r.applicant,
      r.applyTime,
      r.sourceName,
      r.name,
      r.fieldLabel,
      r.beforeValue,
      r.afterValue,
      statusMap[r.status] || r.status,
      r.approver,
      r.approveTime,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: "data-repair",
    moduleName: "数据修复记录",
    moduleGroup: "日志管理",
    rowCount: rows.length,
    searchCriteria: "修复记录查询结果",
  });
}

export function getEditableFields(sourceCode) {
  const source = SENSING_SOURCES.find((s) => s.code === sourceCode);
  if (!source) {
    return [
      { key: "phone", label: "电话" },
      { key: "personId", label: "人员ID" },
      { key: "entryTime", label: "闸机进入时间" },
      { key: "exitTime", label: "闸机出去时间" },
    ];
  }
  return source.fields.map((f) => ({
    key: f === "姓名" ? "name" : f === "电话" ? "phone" : f === "人员ID" ? "personId" : f,
    label: f,
  }));
}
