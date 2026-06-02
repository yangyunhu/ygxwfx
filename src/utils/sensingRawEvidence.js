/**
 * 按人员、日期、考勤状态检索无感数据原始记录（供判定依据弹窗展示）
 */
import { getFieldOptionByKey } from "./dataCleanRules";

const META_KEYS = new Set([
  "id",
  "sourceCode",
  "sourceName",
  "recordDate",
  "name",
  "personId",
  "orgName",
  "orgId",
  "phone",
  "dupGroup",
]);

const STATUS_SOURCE_CODES = {
  travel: ["online_travel"],
  training: ["online_learn"],
  leave: ["online_leave"],
  ok: ["offline_gate", "online_login", "offline_canteen"],
  late: ["offline_gate", "online_login"],
  early: ["offline_gate", "online_login"],
  absent: [
    "offline_gate",
    "offline_canteen",
    "online_travel",
    "online_login",
    "online_leave",
    "online_learn",
    "online_workticket",
    "online_car",
  ],
};

function resolvePersonId(record) {
  return record.personId || record.用户ID || record.员工编号 || "";
}

function parseDatePart(val) {
  if (!val || val === "—") return "";
  return String(val).slice(0, 10);
}

function dateInRange(dateStr, start, end) {
  if (!dateStr || !start || !end) return false;
  return dateStr >= start && dateStr <= end;
}

function recordDateMatches(record, dateStr) {
  if (record.sourceCode === "online_travel") {
    const start = parseDatePart(record.出差开始日期);
    const end = parseDatePart(record.出差结束日期);
    if (start && end && dateInRange(dateStr, start, end)) return true;
    return record.recordDate === dateStr;
  }
  if (record.sourceCode === "online_leave") {
    const start = parseDatePart(record.休假详情起始时间);
    const end = parseDatePart(record.休假详情结束时间);
    if (start && end && dateInRange(dateStr, start, end)) return true;
    return record.recordDate === dateStr;
  }
  const rd =
    record.recordDate ||
    parseDatePart(record.创建时间 || record.培训时间 || record.实际开始时间 || record.出差开始日期);
  return rd === dateStr;
}

function personMatches(record, personId) {
  return resolvePersonId(record) === personId;
}

function hasChinese(str) {
  return /[\u4e00-\u9fff]/.test(String(str || ""));
}

/** 英文字段 key → 中文展示名（与 sensingAccessSchemas / dataCleanRules 字典对齐） */
function resolveFieldLabel(sourceCode, key) {
  if (hasChinese(key)) return key;
  const opt = getFieldOptionByKey(sourceCode, key);
  if (opt?.label) return opt.label;
  return key;
}

export function flattenRawRecordFields(record) {
  const sourceCode = record.sourceCode;
  return Object.entries(record)
    .filter(([k, v]) => !META_KEYS.has(k) && v != null && String(v).trim() !== "" && v !== "—")
    .map(([key, value]) => ({
      key,
      label: resolveFieldLabel(sourceCode, key),
      value: String(value),
    }));
}

function formatRecord(record) {
  return {
    id: record.id,
    sourceCode: record.sourceCode,
    sourceName: record.sourceName || record.sourceCode,
    fields: flattenRawRecordFields(record),
  };
}

function buildStandardFallback(personId, dateStr, statusType, standardRows = []) {
  const row = (standardRows || []).find((r) => r.personId === personId && r.recordDate === dateStr);
  if (!row) return null;

  const fieldMap = {
    travel: [
      ["出差开始时间", row.businessTripStartTime],
      ["出差结束时间", row.businessTripEndTime],
      ["外出开始时间", row.travelStartTime],
      ["外出结束时间", row.travelEndTime],
      ["数据来源", row.dataSources],
    ],
    training: [
      ["培训开始时间", row.trainingStartTime],
      ["培训结束时间", row.trainingEndTime],
    ],
    leave: [
      ["休假类型", row.leaveType],
      ["休假开始时间", row.leaveStartTime],
      ["休假结束时间", row.leaveEndTime],
    ],
    ok: [
      ["到岗时间", row.arrivalTime],
      ["离岗时间", row.departureTime],
      ["最早登录时间", row.loginEarliestTime],
    ],
    late: [
      ["到岗时间", row.arrivalTime],
      ["最早登录时间", row.loginEarliestTime],
    ],
    early: [
      ["离岗时间", row.departureTime],
      ["最晚登录时间", row.loginLatestTime],
    ],
    absent: [["数据来源", row.dataSources]],
  };

  const pairs = fieldMap[statusType] || fieldMap.ok;
  const fields = pairs
    .filter(([, v]) => v && v !== "—")
    .map(([label, value]) => ({ label, value: String(value) }));

  if (!fields.length) return null;

  return {
    id: `std-${personId}-${dateStr}`,
    sourceCode: "standard_merge",
    sourceName: "业务标准宽表（整合后）",
    fields,
    isFallback: true,
  };
}

/** 检索与判定状态相关的无感原始记录 */
export function collectRawEvidenceRecords({
  personId,
  dateStr,
  statusType,
  gateRows = [],
  canteenRows = [],
  onlineRows = [],
  standardRows = [],
}) {
  if (!personId || !dateStr || statusType === "weekend") {
    return { hasRawData: false, totalCount: 0, groups: [] };
  }

  const codes = STATUS_SOURCE_CODES[statusType] || STATUS_SOURCE_CODES.ok;
  const allRows = [
    ...(gateRows || []),
    ...(canteenRows || []),
    ...(onlineRows || []),
  ];

  const matched = allRows.filter(
    (r) => codes.includes(r.sourceCode) && personMatches(r, personId) && recordDateMatches(r, dateStr)
  );

  const groupMap = new Map();
  matched.forEach((record) => {
    const key = record.sourceCode;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        sourceCode: key,
        sourceName: record.sourceName || key,
        records: [],
      });
    }
    groupMap.get(key).records.push(formatRecord(record));
  });

  if (!groupMap.size) {
    const fallback = buildStandardFallback(personId, dateStr, statusType, standardRows);
    if (fallback) {
      groupMap.set("standard_merge", {
        sourceCode: "standard_merge",
        sourceName: fallback.sourceName,
        records: [fallback],
      });
    }
  }

  const groups = Array.from(groupMap.values());
  const totalCount = groups.reduce((sum, g) => sum + g.records.length, 0);

  return {
    hasRawData: totalCount > 0,
    totalCount,
    groups,
  };
}
