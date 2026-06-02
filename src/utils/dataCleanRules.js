/**
 * 无感数据清洗规则配置（按数据源分别维护缺失 / 重复 / 错误规则）
 * 字段选项与 sensingAccessSchemas 全量字典对齐
 * 注：无感考勤/异常考勤/工时等业务规则另行配置，不在此模块
 */

import { getAccessSourceByCode } from "./sensingAccessSchemas";

const STORAGE_KEY = "ygxwfx_data_clean_rules";

/** 数据清洗模块允许的错误规则类型 */
const CLEAN_ERROR_RULE_TYPES = new Set([
  "phone",
  "datetime",
  "positive_number",
  "time_order",
  "same_calendar_day",
]);

/** 演示数据中与字典中文名不一致的兼容字段 */
const RUNTIME_RECORD_FIELDS = {
  online_travel: [
    { key: "出行人", label: "出行人", en: "TRAVELER_NAME" },
    { key: "单位名称", label: "单位名称", en: "CID" },
    { key: "出差类别", label: "出差类别", en: "TRAVEL_TYPE" },
    { key: "出差开始日期", label: "出差开始日期", en: "START_DATE" },
    { key: "出差结束日期", label: "出差结束日期", en: "END_DATE" },
    { key: "审批结果状态", label: "审批结果状态", en: "STATE" },
    { key: "出差天数", label: "出差天数", en: "TOTAL_DATE" },
  ],
  online_login: [
    { key: "单位名称", label: "单位名称", en: "SCOPE" },
    { key: "用户ID", label: "用户ID", en: "USER_ID" },
    { key: "姓名", label: "姓名", en: "FULL_NAME" },
    { key: "创建时间", label: "创建时间", en: "CREATE_TIME" },
  ],
  online_learn: [
    { key: "姓名", label: "姓名", en: "EMPLOYEE_NAME" },
    { key: "单位", label: "单位", en: "REGION_ORG_NAME" },
    { key: "培训类型", label: "培训类型", en: "METHOD_NAME" },
    { key: "培训时间", label: "培训时间", en: "START_TIME" },
    { key: "培训结束时间", label: "培训结束时间", en: "END_TIME" },
  ],
  online_workticket: [
    { key: "单位", label: "单位", en: "ORG_NAME" },
    { key: "部门（供电所）组织名称", label: "部门（供电所）组织名称", en: "DEPT_NAME" },
    { key: "工作班组", label: "工作班组", en: "WORK_TEAM_ORG_NAME" },
    { key: "负责人", label: "负责人", en: "WORK_MASTER_UID" },
    { key: "工作成员", label: "工作成员", en: "WORK_MEMBER_UNAMES" },
    { key: "实际开始时间", label: "实际开始时间", en: "REAL_BEGIN_TIME" },
    { key: "实际结束时间", label: "实际结束时间", en: "REAL_END_TIME" },
  ],
  online_leave: [
    { key: "姓名", label: "姓名", en: "EMPLOYEE_NAME" },
    { key: "员工编号", label: "员工编号", en: "BASEINFO_ID" },
    { key: "所属单位", label: "所属单位", en: "UNIT_NAME" },
    { key: "所属部门", label: "所属部门", en: "DEPT_NAME" },
    { key: "所属班组", label: "所属班组", en: "TEAM_NAME" },
    { key: "休假类型", label: "休假类型", en: "VACATION_TYPE" },
    { key: "休假天数", label: "休假天数", en: "ALL_DATE_QTY" },
    { key: "休假详情起始时间", label: "休假详情起始时间", en: "START_DATE" },
    { key: "休假详情结束时间", label: "休假详情结束时间", en: "END_DATE" },
    { key: "审批状态", label: "审批状态", en: "FLOW_STATE" },
  ],
  online_car: [
    { key: "申请单编号", label: "申请单编号", en: "SQID" },
    { key: "申请日期", label: "申请日期", en: "SQRQ" },
    { key: "用车类型", label: "用车类型", en: "APPLYTYPE" },
    { key: "用车理由", label: "用车理由", en: "LY" },
    { key: "申请人联系电话", label: "申请人联系电话", en: "YCRLXDH" },
    { key: "出发地", label: "出发地", en: "CFD" },
    { key: "目的地", label: "目的地", en: "MDD" },
    { key: "出发时间", label: "出发时间", en: "KSSJ" },
    { key: "回场时间", label: "回场时间", en: "JSSJ" },
  ],
};

export const SOURCE_META = [
  { code: "offline_gate", name: "闸机门禁数据" },
  { code: "offline_canteen", name: "食堂用餐记录" },
  { code: "online_travel", name: "南网商旅通" },
  { code: "online_login", name: "数认平台登录记录" },
  { code: "online_leave", name: "人资休假台账" },
  { code: "online_learn", name: "南网智学" },
  { code: "online_workticket", name: "电网管理平台资产域（工作票）" },
  { code: "online_car", name: "用车管理系统" },
];

export const ERROR_RULE_TYPE_GROUPS = [
  {
    label: "基础格式",
    options: [
      { value: "phone", label: "手机号（11位）" },
      { value: "datetime", label: "日期时间格式" },
      { value: "positive_number", label: "正数/天数字段" },
    ],
  },
  {
    label: "时间逻辑",
    options: [
      { value: "time_order", label: "结束时间不早于开始时间", needsRefField: true },
      { value: "same_calendar_day", label: "与参照字段同一天", needsRefField: true },
    ],
  },
];

/** 扁平列表（兼容旧引用） */
export const ERROR_RULE_TYPES = ERROR_RULE_TYPE_GROUPS.flatMap((g) =>
  g.options.map((o) => ({ ...o, group: g.label }))
);

export function getErrorRuleTypeMeta(type) {
  return ERROR_RULE_TYPES.find((t) => t.value === type) || null;
}

export function errorRuleNeedsRefField(type) {
  const meta = getErrorRuleTypeMeta(type);
  return !!(meta && meta.needsRefField);
}

export function errorRuleNeedsParam() {
  return false;
}

function ruleKey(r) {
  return `${r.key}::${r.type}`;
}

function addErrorRuleItem(rules, sourceCode, key, type, extra = {}) {
  const opt = getFieldOptionByKey(sourceCode, key);
  if (!opt || !CLEAN_ERROR_RULE_TYPES.has(type)) return;
  rules.push({
    key: opt.key,
    label: opt.label,
    type,
    enabled: true,
    ...extra,
  });
}

function schemaFieldOptions(sourceCode) {
  const source = getAccessSourceByCode(sourceCode);
  if (!source) return [];
  const seen = new Set();
  const list = [];
  (source.fields || []).forEach((field) => {
    if (!field.en || seen.has(field.en)) return;
    seen.add(field.en);
    list.push({
      key: field.en,
      label: field.zh,
      en: field.en,
      zh: field.zh,
      fieldType: field.type,
      fromSchema: true,
    });
  });
  return list;
}

/** 字段下拉展示：中文名 + 英文字段名 */
export function formatFieldOptionLabel(opt) {
  if (!opt) return "";
  if (opt.en && opt.en !== opt.key && opt.en !== opt.label) {
    return `${opt.label}（${opt.en}）`;
  }
  return opt.label;
}

/** 某数据源全部可选字段（与数据接入管理源表字典一致，仅全量 schema 字段） */
export function getFieldOptionsForSource(sourceCode) {
  return schemaFieldOptions(sourceCode);
}

export function getFieldOptionByKey(sourceCode, key) {
  if (!key) return null;
  return getFieldOptionsForSource(sourceCode).find(
    (o) => o.key === key || o.en === key || o.label === key || o.zh === key
  ) || null;
}

/** 按 schema 字段读取记录值（兼容演示数据中文字段名） */
export function getRecordFieldValue(record, fieldKey, sourceCode) {
  if (!record) return undefined;
  if (!isMissingValue(record[fieldKey])) return record[fieldKey];
  const opt = getFieldOptionByKey(sourceCode, fieldKey);
  const aliases = [];
  if (opt) {
    aliases.push(opt.label, opt.zh, opt.en, opt.key);
  }
  const runtimeList = RUNTIME_RECORD_FIELDS[sourceCode] || [];
  const runtime = runtimeList.find(
    (r) => r.key === fieldKey || r.en === fieldKey || r.label === fieldKey
  );
  if (runtime) {
    aliases.push(runtime.key, runtime.label, runtime.en);
  }
  for (let i = 0; i < aliases.length; i++) {
    const val = record[aliases[i]];
    if (!isMissingValue(val)) return val;
  }
  return record[fieldKey];
}

export function filterFieldOption(query, item) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;
  const label = String((item && (item.currentLabel || item.label)) || "").toLowerCase();
  const value = String((item && item.value) || "").toLowerCase();
  return label.includes(q) || value.includes(q);
}

export function getDuplicateFieldOptionsForSource(sourceCode) {
  return getFieldOptionsForSource(sourceCode);
}

function fieldDefsFromKeys(sourceCode, keys) {
  return (keys || [])
    .map((k) => {
      const found = getFieldOptionByKey(sourceCode, k);
      return found ? { key: found.key, label: found.label } : null;
    })
    .filter(Boolean);
}

function defaultMissingFieldKeys(sourceCode) {
  const defaults = {
    offline_gate: ["phone", "personId", "entryTime"],
    offline_canteen: ["phone", "breakfast", "lunch"],
    online_travel: ["START_DATE", "END_DATE", "STATE"],
    online_login: ["CREATE_TIME"],
    online_leave: ["BASEINFO_ID", "VACATION_TYPE", "START_DATE", "END_DATE", "FLOW_STATE"],
    online_learn: ["START_TIME", "END_TIME"],
    online_workticket: ["REAL_BEGIN_TIME", "REAL_END_TIME", "WORK_MEMBER_UNAMES"],
    online_car: ["SQID", "YCRLXDH", "KSSJ", "JSSJ"],
  };
  return defaults[sourceCode] || [];
}

function defaultErrorRules(sourceCode) {
  const rules = [];

  if (sourceCode === "offline_gate" || sourceCode === "offline_canteen") {
    addErrorRuleItem(rules, sourceCode, "phone", "phone");
  }
  if (sourceCode === "online_car") {
    addErrorRuleItem(rules, sourceCode, "YCRLXDH", "phone");
  }
  if (sourceCode === "online_travel") {
    addErrorRuleItem(rules, sourceCode, "TRAVELER_MOBILE_PHONE", "phone");
    addErrorRuleItem(rules, sourceCode, "TOTAL_DATE", "positive_number");
  }
  if (sourceCode === "online_leave") {
    addErrorRuleItem(rules, sourceCode, "ALL_DATE_QTY", "positive_number");
  }

  const dateKeys = {
    offline_gate: ["entryTime", "exitTime"],
    offline_canteen: ["breakfast", "lunch", "dinner"],
    online_travel: ["START_DATE", "END_DATE", "CREATE_DATE"],
    online_login: ["CREATE_TIME"],
    online_leave: ["START_DATE", "END_DATE"],
    online_learn: ["START_TIME", "END_TIME"],
    online_workticket: ["REAL_BEGIN_TIME", "REAL_END_TIME"],
    online_car: ["SQRQ", "KSSJ", "JSSJ"],
  };
  (dateKeys[sourceCode] || []).forEach((key) => addErrorRuleItem(rules, sourceCode, key, "datetime"));

  const timeOrderPairs = {
    offline_gate: ["entryTime", "exitTime"],
    online_travel: ["START_DATE", "END_DATE"],
    online_leave: ["START_DATE", "END_DATE"],
    online_learn: ["START_TIME", "END_TIME"],
    online_workticket: ["REAL_BEGIN_TIME", "REAL_END_TIME"],
    online_car: ["KSSJ", "JSSJ"],
  };
  const pair = timeOrderPairs[sourceCode];
  if (pair) {
    const endOpt = getFieldOptionByKey(sourceCode, pair[1]);
    const startOpt = getFieldOptionByKey(sourceCode, pair[0]);
    if (endOpt && startOpt) {
      rules.push({
        key: endOpt.key,
        label: endOpt.label,
        type: "time_order",
        enabled: true,
        startKey: startOpt.key,
        startLabel: startOpt.label,
      });
    }
  }

  return rules;
}

function defaultDuplicateKeys(sourceCode) {
  if (sourceCode === "online_login") return ["USER_ID", "CREATE_TIME"];
  if (sourceCode === "online_travel") return ["TRAVELER_NAME", "START_DATE"];
  if (sourceCode === "online_car") return ["SQID"];
  if (sourceCode === "offline_gate") return ["personId", "entryTime"];
  if (sourceCode === "offline_canteen") return ["personId", "breakfast"];
  return ["personId"];
}

function reconcileFieldDefs(sourceCode, defs) {
  return fieldDefsFromKeys(
    sourceCode,
    (defs || []).map((d) => d.key || d.label)
  );
}

function reconcileErrorRules(sourceCode, rules) {
  return (rules || [])
    .filter((r) => r && CLEAN_ERROR_RULE_TYPES.has(r.type))
    .map((r) => {
      const opt = getFieldOptionByKey(sourceCode, r.key);
      const startOpt = r.startKey ? getFieldOptionByKey(sourceCode, r.startKey) : null;
      const { catalog, param, ...rest } = r;
      return {
        ...rest,
        key: opt ? opt.key : r.key,
        label: opt ? opt.label : r.label,
        startKey: startOpt ? startOpt.key : r.startKey,
        startLabel: startOpt ? startOpt.label : r.startLabel,
      };
    });
}

function mergeErrorRulesWithDefaults(sourceCode, savedRules) {
  const defaults = defaultErrorRules(sourceCode);
  const merged = reconcileErrorRules(sourceCode, savedRules || []);
  const seen = new Set(merged.map(ruleKey));
  defaults.forEach((d) => {
    if (!seen.has(ruleKey(d))) {
      merged.push(d);
      seen.add(ruleKey(d));
    }
  });
  return merged;
}

export function buildDefaultRule(sourceCode) {
  const meta = SOURCE_META.find((s) => s.code === sourceCode);
  return {
    sourceCode,
    sourceName: meta ? meta.name : sourceCode,
    enabled: true,
    missing: {
      enabled: true,
      fields: fieldDefsFromKeys(sourceCode, defaultMissingFieldKeys(sourceCode)),
    },
    duplicate: {
      enabled: true,
      keyFields: fieldDefsFromKeys(sourceCode, defaultDuplicateKeys(sourceCode)),
    },
    error: {
      enabled: true,
      rules: defaultErrorRules(sourceCode),
    },
    updateTime: "",
    operator: "系统默认",
  };
}

export function buildDefaultCleanRules() {
  return SOURCE_META.map((s) => buildDefaultRule(s.code));
}

function normalizeRule(raw) {
  const base = buildDefaultRule(raw.sourceCode);
  const merged = {
    ...base,
    ...raw,
    missing: { ...base.missing, ...(raw.missing || {}) },
    duplicate: { ...base.duplicate, ...(raw.duplicate || {}) },
    error: { ...base.error, ...(raw.error || {}) },
  };
  merged.missing.fields = reconcileFieldDefs(raw.sourceCode, merged.missing.fields);
  merged.duplicate.keyFields = reconcileFieldDefs(raw.sourceCode, merged.duplicate.keyFields);
  merged.error.rules = mergeErrorRulesWithDefaults(raw.sourceCode, merged.error.rules);
  return merged;
}

export function loadCleanRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultCleanRules();
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return buildDefaultCleanRules();
    const map = {};
    saved.forEach((r) => {
      if (r && r.sourceCode) map[r.sourceCode] = normalizeRule(r);
    });
    return SOURCE_META.map((s) => map[s.code] || buildDefaultRule(s.code));
  } catch {
    return buildDefaultCleanRules();
  }
}

export function saveCleanRules(rules, operator = "当前用户") {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const payload = rules.map((r) => ({
    ...r,
    updateTime: now,
    operator,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function getCleanRuleBySource(sourceCode, rules) {
  const list = rules || loadCleanRules();
  return list.find((r) => r.sourceCode === sourceCode) || buildDefaultRule(sourceCode);
}

export function getSchemaFieldCount(sourceCode) {
  return schemaFieldOptions(sourceCode).length;
}

export function rulesToMap(rules) {
  const map = {};
  (rules || loadCleanRules()).forEach((r) => {
    map[r.sourceCode] = r;
  });
  return map;
}

export function isMissingValue(val) {
  if (val === null || val === undefined) return true;
  const s = String(val).trim();
  return s === "" || s === "—" || s === "-";
}

export function applyErrorRule(rule, value, record) {
  if (!rule.enabled) return null;
  if (!CLEAN_ERROR_RULE_TYPES.has(rule.type)) return null;
  if (isMissingValue(value)) return null;
  const str = String(value).replace(/\s/g, "");

  if (rule.type === "phone") {
    if (!/^1\d{10}$/.test(str)) {
      return "电话格式不符合规则（应为11位手机号）";
    }
  }
  if (rule.type === "datetime") {
    if (!/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
      return "日期时间格式错误";
    }
  }
  if (rule.type === "positive_number") {
    const n = parseFloat(String(value).replace(/[^\d.]/g, ""));
    if (Number.isNaN(n) || n <= 0) {
      return "应为大于0的数字（天数等）";
    }
  }
  if (rule.type === "time_order" && rule.startKey && record) {
    const startVal = getRecordFieldValue(record, rule.startKey, record.sourceCode);
    if (!isMissingValue(startVal) && !isMissingValue(value)) {
      const start = new Date(String(startVal).replace(/-/g, "/"));
      const end = new Date(String(value).replace(/-/g, "/"));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
        return `${rule.label}不能早于${rule.startLabel || "开始时间"}`;
      }
    }
  }
  if (rule.type === "same_calendar_day" && rule.startKey && record) {
    const startVal = getRecordFieldValue(record, rule.startKey, record.sourceCode);
    if (!isMissingValue(startVal) && !isMissingValue(value)) {
      const d1 = String(startVal).slice(0, 10);
      const d2 = String(value).slice(0, 10);
      if (d1 !== d2) {
        return `与${rule.startLabel || "参照字段"}不在同一自然日`;
      }
    }
  }
  return null;
}

export function getMissingFieldDefs(rule) {
  if (!rule || !rule.missing?.enabled) return [];
  return rule.missing.fields || [];
}

export function buildDuplicateGroupKey(record, rule) {
  if (!rule?.duplicate?.enabled) return null;
  const fields = rule.duplicate.keyFields || [];
  if (!fields.length) return null;
  const parts = fields.map((f) => {
    const val = getRecordFieldValue(record, f.key, record.sourceCode);
    if (isMissingValue(val)) return "";
    return String(val).trim();
  });
  if (parts.some((p) => !p)) return null;
  return `${record.sourceCode}::${parts.join("::")}`;
}

const DATETIME_TYPE_RE = /timestamp|日期时间|datetime|time zone|time\(6\)/i;
const DATE_ONLY_TYPE_RE = /^date$|^DATE$/i;
const DATETIME_LABEL_RE = /时间|日期|timestamp/i;
const PHONE_LABEL_RE = /电话|手机|联系电话|phone/i;
const NUMBER_LABEL_RE = /天数|学时|数量|numeric|NUMERIC/i;

/** 数据修复弹窗 — 旧值展示 */
export function formatRepairOldValue(value) {
  if (isMissingValue(value)) return "（空）";
  return String(value);
}

/** 数据修复弹窗 — 按字段推断输入控件类型 */
export function getRepairFieldInputMeta(sourceCode, fieldKey, fieldLabel = "", errorRuleType = "") {
  const opt = getFieldOptionByKey(sourceCode, fieldKey);
  const label = fieldLabel || (opt && opt.label) || fieldKey || "";
  const schemaType = (opt && opt.fieldType) || "";

  if (errorRuleType === "phone" || fieldKey === "phone" || PHONE_LABEL_RE.test(label)) {
    return {
      inputType: "phone",
      placeholder: "请输入11位手机号",
      maxlength: 11,
    };
  }

  const isDatetimeField =
    errorRuleType === "datetime" ||
    errorRuleType === "time_order" ||
    errorRuleType === "same_calendar_day" ||
    DATETIME_TYPE_RE.test(schemaType) ||
    (DATETIME_LABEL_RE.test(label) && !NUMBER_LABEL_RE.test(label)) ||
    /Time|TIME|时间|日期/.test(String(fieldKey));

  if (isDatetimeField) {
    const dateOnly =
      errorRuleType === "date" ||
      DATE_ONLY_TYPE_RE.test(schemaType) ||
      (label.includes("日期") && !label.includes("时间"));
    if (dateOnly) {
      return {
        inputType: "date",
        placeholder: "请选择日期",
        format: "yyyy-MM-dd",
        valueFormat: "yyyy-MM-dd",
      };
    }
    return {
      inputType: "datetime",
      placeholder: "请选择日期时间",
      format: "yyyy-MM-dd HH:mm:ss",
      valueFormat: "yyyy-MM-dd HH:mm:ss",
    };
  }

  if (errorRuleType === "positive_number" || NUMBER_LABEL_RE.test(label) || NUMBER_LABEL_RE.test(schemaType)) {
    return {
      inputType: "number",
      placeholder: "请输入数值",
    };
  }

  return {
    inputType: "text",
    placeholder: "请输入修正后的值",
  };
}
