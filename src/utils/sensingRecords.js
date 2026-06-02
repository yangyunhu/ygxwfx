/**
 * 无感数据源元信息（与 DataCustom 模式维护一致）
 */
import { getEffectiveRecordOrg, loadOrgAssociations } from "./sensingOrgAssociation";
import { getStandardTargetFieldOptions, REMOVED_STANDARD_FIELD_PROPS } from "./standardTableFields";
export const SENSING_SOURCES = [
  {
    code: "offline_gate",
    name: "闸机门禁数据",
    fields: ["姓名", "电话", "人员ID", "所属组织机构", "组织机构ID", "闸机进入时间记录", "闸机出去时间记录"],
  },
  {
    code: "offline_canteen",
    name: "食堂用餐记录",
    fields: ["姓名", "电话", "人员ID", "所属组织机构", "组织机构ID", "食堂早餐用餐记录", "食堂午餐用餐记录", "食堂晚餐用餐记录"],
  },
  {
    code: "online_travel",
    name: "南网商旅通",
    fields: ["单位名称", "出行人", "出差类别", "出差开始日期", "出差结束日期", "出差天数", "审批结果状态"],
  },
  {
    code: "online_login",
    name: "数认平台登录记录",
    fields: ["单位名称", "用户ID", "姓名", "创建时间"],
  },
  {
    code: "online_leave",
    name: "人资休假台账",
    fields: [
      "姓名",
      "员工编号",
      "所属单位",
      "所属部门",
      "所属班组",
      "休假类型",
      "休假天数",
      "休假详情起始时间",
      "休假详情结束时间",
      "审批状态",
    ],
  },
  {
    code: "online_learn",
    name: "南网智学",
    fields: ["姓名", "单位", "培训类型", "培训时间", "培训结束时间"],
  },
  {
    code: "online_workticket",
    name: "电网管理平台资产域（工作票）",
    fields: ["单位", "部门（供电所）组织名称", "工作班组", "负责人", "工作成员", "实际开始时间", "实际结束时间"],
  },
  {
    code: "online_car",
    name: "用车管理系统",
    fields: ["申请单编号", "申请日期", "用车类型", "用车理由", "申请人联系电话", "出发地", "目的地", "出发时间", "回场时间"],
  },
];

const ORGS = [
  { name: "办公室（党委办公室、董事会办公室、总经理办公室）", id: "ORG-108" },
  { name: "人力资源部", id: "ORG-110" },
  { name: "数字化部", id: "ORG-115" },
  { name: "生产技术部", id: "ORG-119" },
];

const NAMES = ["张伟", "李娜", "王强", "刘洋", "陈静", "赵敏", "孙浩", "周婷", "张明", "李华"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function mealTime(i, offset, baseHour) {
  const slot = (i + offset) % 3;
  if (slot !== 0) return "—";
  const day = pad((i % 28) + 1);
  const hour = baseHour + (i % 2);
  const minute = pad((i * 7 + offset * 11) % 60);
  return `2026-05-${day} ${pad(hour)}:${minute}:00`;
}

/** 闸机 / 食堂线下导入结构 */
export function generateGateRows() {
  const list = [];
  for (let i = 0; i < 36; i++) {
    const org = ORGS[i % ORGS.length];
    const day = pad((i % 28) + 1);
    const phone =
      i === 3 || i === 17 ? "" : i === 8 ? "138000" : `138${String(10000000 + i).slice(-8)}`;
    list.push({
      id: `gate-${i + 1}`,
      sourceCode: "offline_gate",
      sourceName: "闸机门禁数据",
      name: NAMES[i % NAMES.length],
      phone,
      personId: i === 12 ? "" : `P${10001 + i}`,
      orgName: org.name,
      orgId: org.id,
      postCategory: i % 6 === 0 || i % 11 === 0 ? "" : ["管理类", "专业技术类", "技能类", "辅助类"][i % 4],
      postName: i % 8 === 0 ? "" : ["中级值班员", "高级专责", "专责", "业务员"][i % 4],
      entryTime: i === 5 ? "" : `2026-05-${day} 08:${pad((i % 50) + 10)}:00`,
      exitTime: `2026-05-${day} 18:${pad((i % 50) + 10)}:00`,
      recordDate: `2026-05-${day}`,
    });
  }
  // 重复：同人员同日两条
  list.push({
    id: "gate-dup-1",
    sourceCode: "offline_gate",
    sourceName: "闸机门禁数据",
    name: "张伟",
    phone: "13810000000",
    personId: "P10001",
    orgName: ORGS[0].name,
    orgId: ORGS[0].id,
    entryTime: "2026-05-01 08:10:00",
    exitTime: "2026-05-01 18:10:00",
    recordDate: "2026-05-01",
    dupGroup: "dup-g-P10001-2026-05-01",
  });
  list.push({
    id: "gate-dup-2",
    sourceCode: "offline_gate",
    sourceName: "闸机门禁数据",
    name: "张伟",
    phone: "13810000000",
    personId: "P10001",
    orgName: ORGS[0].name,
    orgId: ORGS[0].id,
    entryTime: "2026-05-01 08:12:00",
    exitTime: "2026-05-01 18:05:00",
    recordDate: "2026-05-01",
    dupGroup: "dup-g-P10001-2026-05-01",
  });
  return list;
}

export function generateCanteenRows() {
  const list = [];
  for (let i = 0; i < 30; i++) {
    const org = ORGS[i % ORGS.length];
    const day = pad((i % 28) + 1);
    list.push({
      id: `canteen-${i + 1}`,
      sourceCode: "offline_canteen",
      sourceName: "食堂用餐记录",
      name: NAMES[(i + 2) % NAMES.length],
      phone: i === 6 ? "—" : `139${String(20000000 + i).slice(-8)}`,
      personId: `C${20001 + i}`,
      orgName: org.name,
      orgId: org.id,
      breakfast: mealTime(i, 0, 7),
      lunch: mealTime(i, 1, 12),
      dinner: mealTime(i, 2, 18),
      recordDate: `2026-05-${day}`,
    });
  }
  return list;
}

export function generateOnlineRows() {
  const rows = [];
  const push = (code, name, data, idx) => {
    rows.push({
      id: `${code}-${idx}`,
      sourceCode: code,
      sourceName: name,
      recordDate: "2026-05-15",
      ...data,
    });
  };
  for (let i = 0; i < 4; i++) {
    push("online_travel", "南网商旅通", {
      单位名称: "云南电网有限责任公司",
      出行人: NAMES[i],
      出差类别: "公务出差",
      出差开始日期: i === 1 ? "" : "2026-05-10",
      出差结束日期: i === 2 ? "20261399" : "2026-05-12",
      出差天数: "3",
      审批结果状态: i === 3 ? "" : "已通过",
      name: NAMES[i],
      personId: `T${1000 + i}`,
      dupGroup: i === 0 ? "dup-t-T1000-2026-05-15" : undefined,
    }, i);
  }
  // 商旅通重复组
  push("online_travel", "南网商旅通", {
    单位名称: "云南电网有限责任公司",
    出行人: NAMES[0],
    出差类别: "公务出差",
    出差开始日期: "2026-05-11",
    出差结束日期: "2026-05-13",
    出差天数: "3",
    审批结果状态: "已通过",
    name: NAMES[0],
    personId: "T1000",
    recordDate: "2026-05-15",
    dupGroup: "dup-t-T1000-2026-05-15",
  }, "dup");
  for (let i = 0; i < 4; i++) {
    push("online_login", "数认平台登录记录", {
      单位名称: "云南电网有限责任公司",
      用户ID: `U${2000 + i}`,
      姓名: NAMES[i + 1],
      创建时间: i === 2 ? "" : `2026-05-15 09:${pad(10 + i)}:00`,
      POST_NAME: i === 0 || i === 2 ? "" : ["中级值班员", "高级专责", "专责", "业务员"][i],
      POST_ID: i === 0 ? "" : `POST-${3000 + i}`,
      岗位类别: i === 1 ? "" : ["管理类", "专业技术类", "技能类", "辅助类"][i],
      岗位序列: i === 3 ? "" : ["信息技能序列", "生产技术业务序列", "决策管理序列", "生产辅助序列"][i],
      name: NAMES[i + 1],
      personId: `U${2000 + i}`,
    }, i);
  }
  for (let i = 0; i < 3; i++) {
    push("online_leave", "人资休假台账", {
      姓名: NAMES[i + 3],
      员工编号: i === 1 ? "" : `E${3000 + i}`,
      所属单位: "云南电网有限责任公司",
      所属班组: "运行班",
      休假类型: "年休假",
      休假天数: "2",
      休假详情起始时间: i === 2 ? "" : "2026-05-20 00:00:00",
      休假详情结束时间: i === 1 ? "" : "2026-05-22 23:59:59",
      审批状态: i === 0 ? "" : "已批准",
      name: NAMES[i + 3],
      personId: `E${3000 + i}`,
      recordDate: "2026-05-20",
    }, i);
  }
  for (let i = 0; i < 4; i++) {
    push("online_learn", "南网智学", {
      姓名: NAMES[i],
      单位: "云南电网有限责任公司",
      培训类型: "线上培训",
      培训时间: i === 1 ? "" : `2026-05-${pad(12 + i)} 09:00:00`,
      培训结束时间: i === 1 ? "" : `2026-05-${pad(12 + i)} 17:00:00`,
      name: NAMES[i],
      personId: `L${4000 + i}`,
      recordDate: `2026-05-${pad(12 + i)}`,
    }, i);
  }
  for (let i = 0; i < 4; i++) {
    const day = pad(14 + i);
    push("online_workticket", "电网管理平台资产域（工作票）", {
      单位: "云南电网有限责任公司",
      工作班组: "运维班",
      负责人: NAMES[i + 2],
      工作成员: i === 3 ? "" : `${NAMES[i + 2]}、${NAMES[i + 3]}`,
      实际开始时间: i === 1 ? "" : `2026-05-${day} 08:00:00`,
      实际结束时间: i === 2 ? "" : `2026-05-${day} 17:30:00`,
      name: NAMES[i + 2],
      personId: `W${5000 + i}`,
      recordDate: `2026-05-${day}`,
    }, i);
  }
  return rows;
}

/** 出勤标准字段选项（用于映射配置，多源整合后形成业务标准宽表） */
export const STANDARD_TARGET_FIELDS = getStandardTargetFieldOptions();

/** 宽表固定列已展示的 prop，整合表动态列中不再重复 */
const MERGE_TABLE_BASE_PROPS = new Set([
  "name",
  "personId",
  "orgName",
  "orgId",
  "recordDate",
]);

/** 字段映射：各源 -> 出勤标准字段 */
export const FIELD_MAPPINGS = [
  { source: "闸机门禁数据", sourceField: "姓名", targetField: "姓名", prop: "name", status: "已映射" },
  { source: "闸机门禁数据", sourceField: "人员ID", targetField: "人员ID", prop: "personId", status: "已映射" },
  { source: "闸机门禁数据", sourceField: "所属组织机构", targetField: "组织机构", prop: "orgName", status: "已映射" },
  { source: "闸机门禁数据", sourceField: "组织机构ID", targetField: "组织机构ID", prop: "orgId", status: "已映射" },
  { source: "闸机门禁数据", sourceField: "闸机进入时间记录", targetField: "到岗时间", prop: "arrivalTime", status: "已映射" },
  { source: "闸机门禁数据", sourceField: "闸机出去时间记录", targetField: "离岗时间", prop: "departureTime", status: "已映射" },
  { source: "食堂用餐记录", sourceField: "食堂早餐用餐记录", targetField: "早餐用餐时间", prop: "breakfastTime", status: "已映射" },
  { source: "食堂用餐记录", sourceField: "食堂午餐用餐记录", targetField: "午餐用餐时间", prop: "lunchTime", status: "已映射" },
  { source: "食堂用餐记录", sourceField: "食堂晚餐用餐记录", targetField: "晚餐用餐时间", prop: "dinnerTime", status: "已映射" },
  { source: "数认平台登录记录", sourceField: "创建时间", targetField: "系统登录时间", prop: "loginTime", status: "已映射" },
  { source: "数认平台登录记录", sourceField: "登录记录(聚合最早)", targetField: "最早登录时间", prop: "loginEarliestTime", status: "已映射" },
  { source: "数认平台登录记录", sourceField: "登录记录(聚合最晚)", targetField: "最晚登录时间", prop: "loginLatestTime", status: "已映射" },
  { source: "数认平台登录记录", sourceField: "elink登录记录", targetField: "elink登录时间", prop: "elinkLoginTime", status: "已映射" },
  { source: "人资休假台账", sourceField: "休假类型", targetField: "休假类型", prop: "leaveType", status: "已映射" },
  { source: "人资休假台账", sourceField: "休假详情起始时间", targetField: "休假开始时间", prop: "leaveStartTime", status: "已映射" },
  { source: "人资休假台账", sourceField: "休假详情结束时间", targetField: "休假结束时间", prop: "leaveEndTime", status: "已映射" },
  { source: "南网商旅通", sourceField: "出差开始日期", targetField: "出差开始时间", prop: "businessTripStartTime", status: "已映射" },
  { source: "南网商旅通", sourceField: "出差结束日期", targetField: "出差结束时间", prop: "businessTripEndTime", status: "已映射" },
  { source: "南网智学", sourceField: "培训时间", targetField: "培训开始时间", prop: "trainingStartTime", status: "已映射" },
  { source: "南网智学", sourceField: "培训结束时间", targetField: "培训结束时间", prop: "trainingEndTime", status: "已映射" },
  { source: "电网管理平台资产域（工作票）", sourceField: "实际开始时间", targetField: "工作票开始时间", prop: "workTicketStartTime", status: "已映射" },
  { source: "电网管理平台资产域（工作票）", sourceField: "实际结束时间", targetField: "工作票结束时间", prop: "workTicketEndTime", status: "已映射" },
  { source: "电网管理平台资产域（工作票）", sourceField: "负责人", targetField: "工作票负责人", prop: "workTicketLeader", status: "已映射" },
  { source: "电网管理平台资产域（工作票）", sourceField: "工作成员", targetField: "工作成员", prop: "workTicketMembers", status: "已映射" },
  { source: "电网管理平台资产域（工作票）", sourceField: "实际开始/结束时间", targetField: "作业起止时间", prop: "workTicketRange", status: "已映射" },
];

/** 多元整合表列（与已确认映射一致） */
export const STANDARD_MERGE_COLUMNS = FIELD_MAPPINGS.map((m) => ({
  prop: m.prop,
  label: m.targetField,
}));

export function getStandardMergeColumns(mappings = FIELD_MAPPINGS) {
  const seen = new Set();
  const cols = [];
  mappings.forEach((m) => {
    if (m.status !== "已映射" || !m.prop || REMOVED_STANDARD_FIELD_PROPS.has(m.prop)) return;
    if (MERGE_TABLE_BASE_PROPS.has(m.prop)) return;
    if (seen.has(m.prop)) return;
    seen.add(m.prop);
    cols.push({ prop: m.prop, label: m.targetField });
  });
  return cols;
}

export function resolveMappingProp(targetField, mappings = []) {
  const label = String(targetField || "").trim();
  const known = STANDARD_TARGET_FIELDS.find((t) => t.label === label);
  if (known) return known.prop;
  const base =
    "custom_" +
    label
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "") ||
    "field";
  let prop = base;
  let n = 1;
  while (mappings.some((m) => m.prop === prop)) {
    prop = `${base}_${n++}`;
  }
  return prop;
}

export function createFieldMapping(payload, mappings = []) {
  const source = String(payload.source || "").trim();
  const sourceField = String(payload.sourceField || "").trim();
  const targetField = String(payload.targetField || "").trim();
  if (!source || !sourceField || !targetField) {
    return { ok: false, message: "请完整填写数据源、源字段和标准字段" };
  }
  const dup = mappings.some(
    (m) =>
      m.id !== payload.id &&
      m.source === source &&
      m.sourceField === sourceField
  );
  if (dup) {
    return { ok: false, message: "该数据源下已存在相同源字段的映射" };
  }
  const prop = payload.prop || resolveMappingProp(targetField, mappings);
  if (REMOVED_STANDARD_FIELD_PROPS.has(prop)) {
    return { ok: false, message: "该标准字段已停用，请重新选择" };
  }
  return {
    ok: true,
    mapping: {
      id: payload.id || `map-${Date.now()}`,
      source,
      sourceField,
      targetField,
      prop,
      status: payload.status || "已映射",
      isManual: payload.isManual !== false,
    },
  };
}

export function isMissing(val) {
  if (val === null || val === undefined) return true;
  const s = String(val).trim();
  return s === "" || s === "—" || s === "-";
}

export function detectError(field, value) {
  if (isMissing(value)) return null;
  if (field === "电话" || field === "phone") {
    if (!/^1\d{10}$/.test(String(value).replace(/\s/g, ""))) {
      return "电话格式不符合规则（应为11位手机号）";
    }
  }
  if (String(field).includes("时间") || String(field).includes("日期")) {
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
      return "日期时间格式错误";
    }
  }
  return null;
}

import {
  loadCleanRules,
  rulesToMap,
  getMissingFieldDefs,
  buildDuplicateGroupKey,
  applyErrorRule,
  getRecordFieldValue,
} from "./dataCleanRules";

function recordDisplayName(rec) {
  return rec.name || rec.姓名 || rec.出行人 || rec.负责人 || "—";
}

function recordDisplayPersonId(rec) {
  return rec.personId || rec.员工编号 || rec.用户ID || "—";
}

function recordDisplayOrg(rec) {
  const effective = getEffectiveRecordOrg(rec, loadOrgAssociations());
  if (effective.orgName) return effective.orgName;
  const raw =
    rec.orgName || rec.所属组织机构 || rec.单位名称 || rec.单位 || rec.所属单位 || "";
  return raw || "—";
}

/** 展开为「缺失值」行（按数据源清洗规则） */
export function buildMissingRows(gateRows, canteenRows, onlineRows, cleanRules) {
  const ruleMap = rulesToMap(cleanRules || loadCleanRules());
  const rows = [];
  const addRecord = (rec, fieldDefs) => {
    fieldDefs.forEach(({ key, label }) => {
      const val = getRecordFieldValue(rec, key, rec.sourceCode);
      if (isMissing(val)) {
        rows.push({
          id: `${rec.id}-${key}`,
          recordId: rec.id,
          sourceCode: rec.sourceCode,
          sourceName: rec.sourceName,
          name: recordDisplayName(rec),
          personId: recordDisplayPersonId(rec),
          fieldLabel: label,
          fieldKey: key,
          fieldValue: val === undefined || val === null ? "" : String(val),
          orgName: recordDisplayOrg(rec),
        });
      }
    });
  };
  const allRecords = [...gateRows, ...canteenRows, ...(onlineRows || [])];
  allRecords.forEach((rec) => {
    const rule = ruleMap[rec.sourceCode];
    if (!rule?.enabled) return;
    const defs = getMissingFieldDefs(rule);
    if (defs.length) addRecord(rec, defs);
  });
  return rows;
}

export function buildDuplicateRows(gateRows, canteenRows, onlineRows, cleanRules) {
  const ruleMap = rulesToMap(cleanRules || loadCleanRules());
  const map = {};
  const all = [...gateRows, ...canteenRows, ...(onlineRows || [])];
  all.forEach((r) => {
    const rule = ruleMap[r.sourceCode];
    if (!rule?.enabled) return;
    const key = r.dupGroup || buildDuplicateGroupKey(r, rule);
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(r);
  });
  const rows = [];
  Object.keys(map).forEach((key) => {
    const group = map[key];
    if (group.length < 2) return;
    group.forEach((r, idx) => {
      rows.push({
        id: `dup-${r.id}`,
        dupGroup: key,
        dupCount: group.length,
        dupIndex: idx + 1,
        sourceCode: r.sourceCode,
        sourceName: r.sourceName,
        name: recordDisplayName(r),
        personId: r.personId,
        orgName: recordDisplayOrg(r),
        recordDate: r.recordDate,
        summary:
          r.entryTime ||
          r.出差开始日期 ||
          r.培训时间 ||
          r.实际开始时间 ||
          [r.breakfast, r.lunch, r.dinner].filter((t) => !isMissing(t)).join(" / ") ||
          "—",
      });
    });
  });
  return rows;
}

export function buildErrorRows(gateRows, canteenRows, onlineRows, cleanRules) {
  const ruleMap = rulesToMap(cleanRules || loadCleanRules());
  const rows = [];
  const scan = (rec, errorRules) => {
    (errorRules || []).forEach((rule) => {
      if (!rule.enabled) return;
      const val = getRecordFieldValue(rec, rule.key, rec.sourceCode);
      const err = applyErrorRule(rule, val, rec);
      if (err) {
        rows.push({
          id: `err-${rec.id}-${rule.key}`,
          recordId: rec.id,
          sourceCode: rec.sourceCode,
          sourceName: rec.sourceName,
          name: recordDisplayName(rec),
          personId: recordDisplayPersonId(rec),
          fieldLabel: rule.label,
          fieldKey: rule.key,
          fieldValue: String(val),
          errorReason: err,
          orgName: recordDisplayOrg(rec),
        });
      }
    });
  };
  const all = [...gateRows, ...canteenRows, ...(onlineRows || [])];
  all.forEach((r) => {
    const rule = ruleMap[r.sourceCode];
    if (!rule?.enabled || !rule.error?.enabled) return;
    scan(r, rule.error.rules);
  });
  return rows;
}

function parseTimeToMinutes(str) {
  if (isMissing(str)) return null;
  const m = String(str).match(/(\d{2}):(\d{2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const d = new Date(String(str).replace(/-/g, "/"));
  if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  return null;
}

function pickEarlierTime(a, b) {
  if (isMissing(a)) return b;
  if (isMissing(b)) return a;
  const am = parseTimeToMinutes(a);
  const bm = parseTimeToMinutes(b);
  if (am == null) return b;
  if (bm == null) return a;
  return am <= bm ? a : b;
}

function pickLaterTime(a, b) {
  if (isMissing(a)) return b;
  if (isMissing(b)) return a;
  const am = parseTimeToMinutes(a);
  const bm = parseTimeToMinutes(b);
  if (am == null) return b;
  if (bm == null) return a;
  return am >= bm ? a : b;
}

function mergeTrainingParticipants(current, next) {
  if (isMissing(next)) return current;
  if (isMissing(current)) return next;
  const parts = `${current}、${next}`.split("、").map((s) => s.trim()).filter(Boolean);
  return [...new Set(parts)].join("、");
}

function isElinkLoginRecord(r) {
  return (
    !isMissing(r.elink消息ID) ||
    !isMissing(r.ELINK_MSG_ID) ||
    String(r.作用域 || r.SCOPE || "").toLowerCase().includes("elink")
  );
}

function mergeLoginFields(row, r) {
  const loginTime = r.创建时间;
  if (!isMissing(loginTime)) {
    row.loginTime = pickEarlierTime(row.loginTime, loginTime);
    row.loginEarliestTime = pickEarlierTime(row.loginEarliestTime, loginTime);
    row.loginLatestTime = pickLaterTime(row.loginLatestTime, loginTime);
  }
  if (isElinkLoginRecord(r) || !isMissing(loginTime)) {
    row.elinkLoginTime = pickEarlierTime(row.elinkLoginTime, loginTime);
  }
}

function emptyStandardRow(personId, recordDate) {
  return {
    id: `${personId}-${recordDate}`,
    personId,
    recordDate,
    name: "",
    orgName: "",
    orgId: "",
    postCategory: "—",
    arrivalTime: "—",
    departureTime: "—",
    breakfastTime: "—",
    lunchTime: "—",
    dinnerTime: "—",
    loginTime: "—",
    loginEarliestTime: "—",
    loginLatestTime: "—",
    elinkLoginTime: "—",
    leaveStartTime: "—",
    leaveEndTime: "—",
    leaveType: "—",
    businessTripStartTime: "—",
    businessTripEndTime: "—",
    travelStartTime: "—",
    travelEndTime: "—",
    trainingStartTime: "—",
    trainingEndTime: "—",
    trainingParticipants: "—",
    workTicketStartTime: "—",
    workTicketEndTime: "—",
    workTicketLeader: "—",
    workTicketMembers: "—",
    workTicketRange: "—",
    dataSources: "—",
    sources: [],
    cleanStatus: "已清洗",
    status: "待判定",
  };
}

/** 多源整合 -> 出勤宽表（含一致性处理全部标准字段） */
export function buildAttendanceResults(gateRows, canteenRows, onlineRows = []) {
  const byPersonDate = {};
  const touch = (personId, recordDate, patch) => {
    const key = `${personId}-${recordDate}`;
    if (!byPersonDate[key]) {
      byPersonDate[key] = emptyStandardRow(personId, recordDate);
    }
    Object.assign(byPersonDate[key], patch);
    return byPersonDate[key];
  };

  gateRows.forEach((r) => {
    if (!r.personId) return;
    const row = touch(r.personId, r.recordDate, {
      name: r.name,
      orgName: r.orgName,
      orgId: r.orgId,
    });
    if (!isMissing(r.entryTime)) {
      row.arrivalTime = pickEarlierTime(row.arrivalTime, r.entryTime);
    }
    if (!isMissing(r.exitTime)) {
      row.departureTime = pickLaterTime(row.departureTime, r.exitTime);
    }
    if (!row.sources.includes("闸机门禁")) row.sources.push("闸机门禁");
  });

  canteenRows.forEach((r) => {
    if (!r.personId) return;
    const row = touch(r.personId, r.recordDate, {
      name: r.name,
      orgName: r.orgName,
      orgId: r.orgId,
      breakfastTime: r.breakfast,
      lunchTime: r.lunch,
      dinnerTime: r.dinner,
    });
    if (!row.sources.includes("食堂用餐")) row.sources.push("食堂用餐");
  });

  onlineRows.forEach((r) => {
    const personId = r.personId || r.用户ID || r.员工编号;
    const recordDate =
      r.recordDate ||
      String(r.出差开始日期 || r.培训时间 || r.创建时间 || r.实际开始时间 || "").slice(0, 10) ||
      "2026-05-15";
    if (!personId) return;
    const effective = getEffectiveRecordOrg(r, loadOrgAssociations());
    const patch = {
      name: r.name || r.姓名 || r.出行人 || r.负责人 || "",
      orgName:
        effective.orgName || r.orgName || r.单位名称 || r.所属单位 || r.单位 || "—",
      orgId: effective.orgId || r.orgId || "",
    };
    if (r.岗位类别 || r.岗位序列) {
      patch.postCategory = r.岗位类别 || r.岗位序列;
    }
    const row = touch(personId, recordDate, patch);

    if (r.sourceCode === "online_login") {
      mergeLoginFields(row, r);
    } else if (r.sourceCode === "online_leave") {
      if (!isMissing(r.休假类型)) row.leaveType = r.休假类型;
      if (!isMissing(r.休假详情起始时间)) row.leaveStartTime = r.休假详情起始时间;
      if (!isMissing(r.休假详情结束时间)) row.leaveEndTime = r.休假详情结束时间;
    } else if (r.sourceCode === "online_travel") {
      if (!isMissing(r.出差开始日期)) {
        row.businessTripStartTime = r.出差开始日期;
        row.travelStartTime = r.出差开始日期;
      }
      if (!isMissing(r.出差结束日期)) {
        row.businessTripEndTime = r.出差结束日期;
        row.travelEndTime = r.出差结束日期;
      }
    } else if (r.sourceCode === "online_learn") {
      if (!isMissing(r.培训时间)) row.trainingStartTime = r.培训时间;
      if (!isMissing(r.培训结束时间)) row.trainingEndTime = r.培训结束时间;
      const trainee = r.姓名 || r.name;
      if (!isMissing(trainee)) {
        row.trainingParticipants = mergeTrainingParticipants(row.trainingParticipants, trainee);
      }
    } else if (r.sourceCode === "online_workticket") {
      if (!isMissing(r.实际开始时间)) row.workTicketStartTime = r.实际开始时间;
      if (!isMissing(r.实际结束时间)) row.workTicketEndTime = r.实际结束时间;
      if (!isMissing(r.负责人)) row.workTicketLeader = r.负责人;
      if (!isMissing(r.工作成员)) row.workTicketMembers = r.工作成员;
      row.workTicketRange = `${row.workTicketStartTime || "—"} ~ ${row.workTicketEndTime || "—"}`;
    }

    const labelMap = {
      online_login: "数认平台",
      online_leave: "人资休假",
      online_travel: "南网商旅通",
      online_learn: "南网智学",
      online_workticket: "工作票",
    };
    const label = labelMap[r.sourceCode];
    if (label && !row.sources.includes(label)) row.sources.push(label);
  });

  Object.values(byPersonDate).forEach((row) => {
    const hasArrival = !isMissing(row.arrivalTime);
    const hasMeal =
      !isMissing(row.breakfastTime) || !isMissing(row.lunchTime) || !isMissing(row.dinnerTime);
    if (hasArrival && hasMeal) row.status = "正常出勤";
    else if (hasArrival) row.status = "到岗（无用餐记录）";
    else if (hasMeal) row.status = "仅用餐记录";
    else row.status = "数据不足";
    row.dataSources = row.sources.join("、") || "—";
    row.sourceCount = row.sources.length;
  });

  return Object.values(byPersonDate).sort((a, b) =>
    a.recordDate === b.recordDate
      ? a.personId.localeCompare(b.personId)
      : b.recordDate.localeCompare(a.recordDate)
  );
}

export function buildMergedPreviewRows(
  gateRows,
  canteenRows,
  onlineRows = [],
  mappings = FIELD_MAPPINGS
) {
  const attendance = buildAttendanceResults(gateRows, canteenRows, onlineRows);
  return buildMergedPreviewFromStandardRows(attendance, mappings);
}

/** 由已整合的标准宽表行生成多源整合预览 */
export function buildMergedPreviewFromStandardRows(attendanceRows, mappings = FIELD_MAPPINGS) {
  const columns = getStandardMergeColumns(mappings);
  return attendanceRows.map((r) => {
    const standard = {};
    columns.forEach((col) => {
      standard[col.prop] = r[col.prop] || "—";
    });
    return {
      id: `merge-${r.id}`,
      name: r.name,
      personId: r.personId,
      orgName: r.orgName,
      orgId: r.orgId,
      recordDate: r.recordDate,
      ...standard,
      mergeStatus: (r.sources || []).length >= 2 ? "已整合" : "单源",
      sourceCount: r.sourceCount,
      cleanStatus: r.cleanStatus,
      dataSources: r.dataSources,
    };
  });
}

/** 七源原始记录条数统计 */
export function countSourceStats(gateRows, canteenRows, onlineRows) {
  const stats = SENSING_SOURCES.map((s) => ({ ...s, count: 0 }));
  const add = (code) => {
    const item = stats.find((x) => x.code === code);
    if (item) item.count += 1;
  };
  gateRows.forEach(() => add("offline_gate"));
  canteenRows.forEach(() => add("offline_canteen"));
  onlineRows.forEach((r) => add(r.sourceCode));
  return stats;
}

/** 各数据源异常条数（缺失 + 重复 + 错误） */
export function countAbnormalStatsBySource(missingRows, duplicateRows, errorRows) {
  const stats = SENSING_SOURCES.map((s) => ({ ...s, count: 0 }));
  const bump = (row) => {
    if (!row) return;
    const item = stats.find((x) => x.code === row.sourceCode);
    if (item) item.count += 1;
  };
  (missingRows || []).forEach(bump);
  (duplicateRows || []).forEach(bump);
  (errorRows || []).forEach(bump);
  return stats;
}
