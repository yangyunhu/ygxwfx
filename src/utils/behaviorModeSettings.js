/**
 * 行为模式设置信息 — 考勤规则配置中心
 * 关联员工出勤的行为模式：工时统计、休假安排、评估标准等
 */
const STORAGE_KEY = "ygxwfx_behavior_mode_settings";

export const DEFAULT_WORK_CONFIG = {
  arrivalTime: "08:30",
  departureTime: "17:30",
  overtimeStartTime: "17:30",
  loginLateConsecutiveDays: 3,
};

export const RULE_CATALOG = [
  {
    id: "attendance",
    name: "无感考勤表生成规则",
    levels: 9,
    desc: "培训→商旅→休假→闸机(出勤/迟到/早退)→登录→旷工；1-6层输出无感考勤表，7-9层输出异常校验表",
    enabled: true,
  },
  {
    id: "abnormal",
    name: "异常考勤校验表生成规则",
    levels: 6,
    desc: "逐层校验：证据冲突→闸机迟到/早退→登录连续迟到→证据不足→旷工；命中即停止",
    enabled: true,
  },
  {
    id: "hours_mgmt",
    name: "工时计算规则-管理类、专业技术类",
    levels: 4,
    desc: "基于无感考勤表考勤类型，按培训→出差→闸机→登录四层逐层计算工时",
    enabled: true,
  },
  {
    id: "hours_skill",
    name: "工时计算规则-技能类",
    levels: 5,
    desc: "基于无感考勤表考勤类型，按培训→工作票→出差→闸机→登录五层逐层计算工时",
    enabled: true,
  },
];

export const LEAVE_TYPE_NAMES = [
  "年休假",
  "事假",
  "病假",
  "探亲假",
  "婚假",
  "丧假",
  "流产假",
  "产假",
  "哺乳假",
  "陪护假",
  "节育假",
  "育儿假",
  "父母护理假",
  "其他",
];

const LEAVE_CODE_MAP = {
  年休假: "annual",
  事假: "personal",
  病假: "sick",
  探亲假: "home",
  婚假: "marriage",
  丧假: "bereavement",
  流产假: "miscarriage",
  产假: "maternity",
  哺乳假: "breastfeeding",
  陪护假: "nursing",
  节育假: "contraception",
  育儿假: "childcare",
  父母护理假: "parent_care",
  其他: "other",
};

/** 计入评估台账「请假天数」的类型 */
const LEAVE_COUNTS_FOR_ASSESSMENT = new Set(["年休假", "事假", "病假", "探亲假", "其他"]);

export const DEFAULT_LEAVE_TYPES = LEAVE_TYPE_NAMES.map((name) => ({
  code: LEAVE_CODE_MAP[name],
  name,
  countsForAssessment: LEAVE_COUNTS_FOR_ASSESSMENT.has(name),
  priority: 3,
  enabled: true,
}));

export const POST_CATEGORY_OPTIONS = ["管理类", "专业技术类", "技能类"];

export const DEFAULT_POST_CATEGORY_RULES = {
  管理类: "hours_mgmt",
  专业技术类: "hours_mgmt",
  技能类: "hours_skill",
};

export const DEFAULT_ASSESSMENT = {
  absentFailMin: 1,
  excellentMaxLeave: 2,
  goodMaxLeave: 4,
};

export const RULE_CHAIN_DETAILS = [
  {
    catalogId: "attendance",
    catalogName: "无感考勤表",
    layers: [
      {
        level: 1,
        name: "培训判定",
        source: "南网智学",
        output: "培训",
        targetTable: "无感考勤表",
        logic: "以培训时间和参加培训人员名单为评判依据，有记录则判定为培训",
      },
      {
        level: 2,
        name: "商旅判定",
        source: "南网商旅通",
        output: "出差",
        targetTable: "无感考勤表",
        logic: "以出差开始/结束日期和出行人信息为评判依据，有记录则判定为出差",
      },
      {
        level: 3,
        name: "休假判定",
        source: "人资域休假台账",
        output: "休假类型",
        targetTable: "无感考勤表",
        logic: "以姓名、员工编号、休假类型及起止时间为依据，考勤类型与休假类型一致",
      },
      {
        level: 4,
        name: "闸机出勤",
        source: "闸机/门禁",
        output: "出勤",
        targetTable: "无感考勤表",
        logic: "最早进入时间≤上岗时间，且最晚离开时间≥离岗时间",
      },
      {
        level: 5,
        name: "闸机迟到",
        source: "闸机/门禁",
        output: "迟到",
        targetTable: "无感考勤表",
        logic: "最早进入时间晚于上岗时间",
      },
      {
        level: 6,
        name: "闸机早退",
        source: "闸机/门禁",
        output: "早退",
        targetTable: "无感考勤表",
        logic: "最晚离开时间早于离岗时间",
      },
      {
        level: 7,
        name: "登录佐证",
        source: "数认平台/elink",
        output: "出勤",
        targetTable: "异常考勤校验表",
        logic: "最早登录≤上岗时间且最晚登录≥离岗时间，且有 elink 记录",
      },
      {
        level: 8,
        name: "登录迟到",
        source: "数认平台/elink",
        output: "迟到",
        targetTable: "异常考勤校验表",
        logic: "X 个工作日内最早登录均晚于上岗时间（X 可配置）",
      },
      {
        level: 9,
        name: "旷工判定",
        source: "全源汇总",
        output: "旷工",
        targetTable: "异常考勤校验表",
        logic: "各系统均无该人员当日记录",
      },
    ],
  },
  {
    catalogId: "abnormal",
    catalogName: "异常考勤校验表",
    layers: [
      {
        level: 1,
        name: "证据冲突",
        source: "南网智学/商旅通/人资休假",
        output: "在岗证据冲突",
        targetTable: "异常考勤校验表",
        logic: "同日存在出差与休假，或培训与休假记录重叠",
      },
      {
        level: 2,
        name: "闸机迟到",
        source: "闸机/门禁",
        output: "迟到",
        targetTable: "异常考勤校验表",
        logic: "最早进入时间晚于上岗时间",
      },
      {
        level: 3,
        name: "闸机早退",
        source: "闸机/门禁",
        output: "早退",
        targetTable: "异常考勤校验表",
        logic: "最晚离开时间早于离岗时间",
      },
      {
        level: 4,
        name: "登录迟到",
        source: "数认平台/elink",
        output: "迟到",
        targetTable: "异常考勤校验表",
        logic: "X 个工作日内数认与 elink 最早登录均晚于上岗时间",
      },
      {
        level: 5,
        name: "证据不足",
        source: "全源汇总",
        output: "在岗证据不足",
        targetTable: "异常考勤校验表",
        logic: "有辅助数据但无法判定考勤类型，连续 X 个工作日",
      },
      {
        level: 6,
        name: "旷工判定",
        source: "全源汇总",
        output: "旷工",
        targetTable: "异常考勤校验表",
        logic: "各系统均无该人员当日记录",
      },
    ],
  },
  {
    catalogId: "hours_mgmt",
    catalogName: "工时-管理/专业技术类",
    layers: [
      {
        level: 1,
        name: "培训工时",
        source: "无感考勤表/南网智学",
        output: "培训工时",
        targetTable: "工时统计表",
        logic: "考勤类型为培训且存在培训数据，按课表起止时间计算培训工时",
      },
      {
        level: 2,
        name: "出差工时",
        source: "无感考勤表/南网商旅通",
        output: "出差工时",
        targetTable: "工时统计表",
        logic: "考勤类型为出差且存在商旅数据，按天计固定工时",
      },
      {
        level: 3,
        name: "闸机工时",
        source: "无感考勤表/闸机门禁",
        output: "出勤工时",
        targetTable: "工时统计表",
        logic: "考勤类型为出勤且有闸机记录，按最早进入至最晚离开时长计算",
      },
      {
        level: 4,
        name: "登录工时",
        source: "无感考勤表/数认平台/elink",
        output: "出勤工时",
        targetTable: "工时统计表",
        logic: "考勤类型为出勤且有登录记录，按08:00后最早登录至18:00-22:00间最晚登录计算",
      },
    ],
  },
  {
    catalogId: "hours_skill",
    catalogName: "工时-技能类",
    layers: [
      {
        level: 1,
        name: "培训工时",
        source: "无感考勤表/南网智学",
        output: "培训工时",
        targetTable: "工时统计表",
        logic: "考勤类型为培训且存在培训数据，按课表起止时间计算培训工时",
      },
      {
        level: 2,
        name: "工作票工时",
        source: "无感考勤表/工作票系统",
        output: "工作票工时",
        targetTable: "工时统计表",
        logic: "存在工作票数据，按负责人/成员及实际起止时间计算（现场作业可为出勤）",
      },
      {
        level: 3,
        name: "出差工时",
        source: "无感考勤表/南网商旅通",
        output: "出差工时",
        targetTable: "工时统计表",
        logic: "考勤类型为出差且存在商旅数据，按天计固定工时",
      },
      {
        level: 4,
        name: "闸机工时",
        source: "无感考勤表/闸机门禁",
        output: "出勤工时",
        targetTable: "工时统计表",
        logic: "考勤类型为出勤且有闸机记录，按最早进入至最晚离开时长计算",
      },
      {
        level: 5,
        name: "登录工时",
        source: "无感考勤表/数认平台/elink",
        output: "出勤工时",
        targetTable: "工时统计表",
        logic: "考勤类型为出勤且有登录记录，按08:00后最早登录至18:00-22:00间最晚登录计算",
      },
    ],
  },
];

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function buildDefaultBehaviorModeSettings() {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    global: {
      workConfig: { ...DEFAULT_WORK_CONFIG },
      leaveTypes: cloneDeep(DEFAULT_LEAVE_TYPES),
      postCategoryRules: { ...DEFAULT_POST_CATEGORY_RULES },
      assessment: { ...DEFAULT_ASSESSMENT },
      ruleCatalog: cloneDeep(RULE_CATALOG),
    },
    orgOverrides: {},
  };
}

let memoryCache = null;

function mergeLeaveTypes(saved) {
  const defaults = cloneDeep(DEFAULT_LEAVE_TYPES);
  if (!Array.isArray(saved) || !saved.length) return defaults;

  const byKey = new Map(
    saved.map((item) => [item.code || item.name, item])
  );

  const merged = defaults.map((def) => {
    const existing = byKey.get(def.code) || byKey.get(def.name);
    return existing ? { ...def, ...existing, name: def.name, code: def.code } : def;
  });

  saved.forEach((item) => {
    if (!merged.some((m) => m.code === item.code || m.name === item.name)) {
      merged.push(item);
    }
  });

  return merged;
}

function normalizeSettings(raw) {
  const base = buildDefaultBehaviorModeSettings();
  if (!raw || typeof raw !== "object") return base;

  const global = raw.global || {};
  return {
    version: raw.version || 2,
    updatedAt: raw.updatedAt || base.updatedAt,
    global: {
      workConfig: { ...base.global.workConfig, ...(global.workConfig || {}) },
      leaveTypes: mergeLeaveTypes(global.leaveTypes),
      postCategoryRules: {
        ...base.global.postCategoryRules,
        ...(global.postCategoryRules || {}),
      },
      assessment: { ...base.global.assessment, ...(global.assessment || {}) },
      ruleCatalog: Array.isArray(global.ruleCatalog) && global.ruleCatalog.length
        ? global.ruleCatalog
        : base.global.ruleCatalog,
    },
    orgOverrides: raw.orgOverrides && typeof raw.orgOverrides === "object" ? raw.orgOverrides : {},
  };
}

export function loadBehaviorModeSettings() {
  if (memoryCache) return cloneDeep(memoryCache);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = normalizeSettings(JSON.parse(raw));
      return cloneDeep(memoryCache);
    }
  } catch (e) {
    console.warn("loadBehaviorModeSettings failed", e);
  }
  memoryCache = buildDefaultBehaviorModeSettings();
  return cloneDeep(memoryCache);
}

export function saveBehaviorModeSettings(settings) {
  const normalized = normalizeSettings(settings);
  normalized.updatedAt = new Date().toISOString();
  memoryCache = normalized;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.warn("saveBehaviorModeSettings failed", e);
  }
  return cloneDeep(normalized);
}

export function resetBehaviorModeSettings() {
  memoryCache = buildDefaultBehaviorModeSettings();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  return cloneDeep(memoryCache);
}

function mergeWorkConfig(globalConfig, override) {
  return {
    ...globalConfig,
    ...(override && override.workConfig ? override.workConfig : {}),
  };
}

function mergeAssessment(globalAssessment, override) {
  return {
    ...globalAssessment,
    ...(override && override.assessment ? override.assessment : {}),
  };
}

/** 获取全局工时/考勤参数（供规则引擎使用） */
export function getGlobalWorkConfig() {
  const settings = loadBehaviorModeSettings();
  const wc = settings.global.workConfig;
  return {
    arrivalTime: wc.arrivalTime || DEFAULT_WORK_CONFIG.arrivalTime,
    departureTime: wc.departureTime || DEFAULT_WORK_CONFIG.departureTime,
    overtimeStartTime: wc.overtimeStartTime || wc.departureTime || DEFAULT_WORK_CONFIG.overtimeStartTime,
    loginLateConsecutiveDays:
      wc.loginLateConsecutiveDays ?? DEFAULT_WORK_CONFIG.loginLateConsecutiveDays,
  };
}

/** 按组织获取生效配置（支持组织级覆盖） */
export function getEffectiveConfig({ orgId } = {}) {
  const settings = loadBehaviorModeSettings();
  const override = orgId ? settings.orgOverrides[String(orgId)] : null;
  return {
    workConfig: mergeWorkConfig(settings.global.workConfig, override),
    leaveTypes: settings.global.leaveTypes,
    postCategoryRules: settings.global.postCategoryRules,
    assessment: mergeAssessment(settings.global.assessment, override),
    ruleCatalog: settings.global.ruleCatalog,
    scope: orgId && override ? "org" : "global",
    orgId: orgId || null,
  };
}

export function getRuleCatalog() {
  return loadBehaviorModeSettings().global.ruleCatalog;
}

export function getLeaveTypes() {
  return loadBehaviorModeSettings().global.leaveTypes.filter((t) => t.enabled !== false);
}

/** 启用中的休假类型名称（供台账分类等使用） */
export function getLeaveTypeNames() {
  const names = getLeaveTypes().map((t) => t.name);
  if (!names.includes("休假")) names.push("休假");
  if (!names.includes("请假")) names.push("请假");
  return names;
}

/** 是否计入评估台账请假天数 */
export function shouldCountLeaveForAssessment(attendanceType) {
  if (!attendanceType) return false;
  const types = loadBehaviorModeSettings().global.leaveTypes.filter((t) => t.enabled !== false);
  const matched = types.find(
    (t) => attendanceType === t.name || String(attendanceType).includes(t.name)
  );
  if (matched) return matched.countsForAssessment !== false;
  if (attendanceType === "休假" || attendanceType === "请假") return true;
  return false;
}

export function getAssessmentConfig() {
  return loadBehaviorModeSettings().global.assessment;
}

export function getAssessmentRules(assessment = getAssessmentConfig()) {
  const { absentFailMin, excellentMaxLeave, goodMaxLeave } = assessment;
  return [
    { result: "不合格", desc: `旷工 ≥ ${absentFailMin} 次` },
    { result: "良好", desc: `请假 ≤ ${goodMaxLeave} 天且旷工为 0` },
    { result: "优秀", desc: `请假 ≤ ${excellentMaxLeave} 天且旷工为 0` },
  ];
}

/** 评估规则：先判不合格，再判优秀/良好 */
export function computeEvaluationResult(absentCount, leaveDays, assessment = getAssessmentConfig()) {
  const { absentFailMin, excellentMaxLeave, goodMaxLeave } = assessment;

  if (absentCount >= absentFailMin) {
    return {
      result: "不合格",
      content: `统计周期内旷工 ${absentCount} 次，按规则判定为不合格`,
    };
  }
  if (leaveDays <= excellentMaxLeave) {
    return {
      result: "优秀",
      content: `请假 ${leaveDays} 天，无旷工，符合优秀标准（请假≤${excellentMaxLeave}天且旷工为0）`,
    };
  }
  if (leaveDays <= goodMaxLeave) {
    return {
      result: "良好",
      content: `请假 ${leaveDays} 天，无旷工，符合良好标准（请假≤${goodMaxLeave}天且旷工为0）`,
    };
  }
  return {
    result: "不合格",
    content: `请假 ${leaveDays} 天超过 ${goodMaxLeave} 天上限，判定为不合格`,
  };
}

export function getRuleChainRows() {
  const catalog = getRuleCatalog();
  const enabledIds = new Set(catalog.filter((c) => c.enabled !== false).map((c) => c.id));
  return RULE_CHAIN_DETAILS.filter((d) => enabledIds.has(d.catalogId)).flatMap((group) =>
    group.layers.map((layer) => ({
      catalogId: group.catalogId,
      catalogName: group.catalogName,
      level: layer.level,
      layerName: layer.name,
      dataSource: layer.source,
      output: layer.output,
    }))
  );
}

export function hasOrgOverride(orgId) {
  if (!orgId) return false;
  const settings = loadBehaviorModeSettings();
  return Boolean(settings.orgOverrides[String(orgId)]);
}

export function listOrgOverrides() {
  const settings = loadBehaviorModeSettings();
  return Object.keys(settings.orgOverrides || {});
}
