/**
 * 业务规则设置（无感考勤 / 异常考勤 / 工时计算）
 * 与数据清洗规则分离，在「规则设置」页统一维护
 */

import {
  RULE_CHAIN_DETAILS,
  RULE_CATALOG,
  DEFAULT_WORK_CONFIG,
  loadBehaviorModeSettings,
  saveBehaviorModeSettings,
} from "./behaviorModeSettings";

const STORAGE_KEY = "ygxwfx_business_rule_settings";

/** 各规则层级关联的标准宽表关键字段（展示用） */
export const LAYER_KEY_FIELDS = {
  attendance: {
    1: ["培训时间", "培训结束时间", "参加培训人员"],
    2: ["出差开始日期", "出差结束日期", "出行人"],
    3: ["姓名", "员工编号", "休假类型", "休假详情起始时间", "休假详情结束时间"],
    4: ["到岗时间", "离岗时间"],
    5: ["到岗时间"],
    6: ["离岗时间"],
    7: ["最早登录时间", "最晚登录时间", "elink记录"],
    8: ["最早登录时间"],
    9: ["人员ID", "记录日期"],
  },
  abnormal: {
    1: ["出差日期", "出行人", "培训时间", "参加培训人员", "姓名", "员工编号", "休假类型", "休假起止时间"],
    2: ["人员信息", "通过时间", "进出方向", "到岗时间"],
    3: ["人员信息", "通过时间", "进出方向", "离岗时间"],
    4: ["人员信息", "登录时间", "最早登录时间", "elink记录"],
    5: ["早餐用餐时间", "午餐用餐时间", "工作票时间"],
    6: ["人员ID", "记录日期"],
  },
  hours_mgmt: {
    1: ["考勤类型", "课表时间", "参加培训人员", "培训时间", "培训结束时间"],
    2: ["考勤类型", "出差日期", "出行人", "出差开始日期", "出差结束日期"],
    3: ["考勤类型", "人员信息", "通过时间", "进出方向", "到岗时间", "离岗时间"],
    4: ["考勤类型", "人员信息", "登录时间", "最早登录时间", "最晚登录时间"],
  },
  hours_skill: {
    1: ["考勤类型", "课表时间", "参加培训人员", "培训时间", "培训结束时间"],
    2: ["负责人", "工作成员", "实际开始时间", "实际结束时间"],
    3: ["考勤类型", "出差日期", "出行人", "出差开始日期", "出差结束日期"],
    4: ["考勤类型", "人员信息", "通过时间", "进出方向", "到岗时间", "离岗时间"],
    5: ["考勤类型", "人员信息", "登录时间", "最早登录时间", "最晚登录时间"],
  },
};

export const BUSINESS_RULE_TABS = [
  {
    id: "attendance",
    catalogId: "attendance",
    name: "无感考勤表生成规则",
    shortName: "无感考勤表生成规则",
    levels: 9,
    outputTable: "无感考勤表",
    desc: "按优先级逐层判定：培训/商旅/休假→闸机(出勤/迟到/早退)→登录→旷工；第1-6层输出无感考勤表，第7-9层输出异常校验表",
  },
  {
    id: "abnormal",
    catalogId: "abnormal",
    name: "异常考勤校验表生成规则",
    shortName: "异常考勤校验表生成规则",
    levels: 6,
    outputTable: "异常考勤校验表",
    desc: "逐层校验在岗证据：冲突→闸机迟到/早退→登录连续迟到→证据不足→旷工，命中即停止",
  },
  {
    id: "hours_mgmt",
    catalogId: "hours_mgmt",
    name: "工时计算规则-管理类、专业技术类",
    shortName: "工时计算规则-管理类、专业技术类",
    levels: 4,
    outputTable: "工时统计表（管理类/专业技术类）",
    desc: "基于无感考勤表考勤类型，按培训→出差→闸机→登录四层逐层计算工时",
  },
  {
    id: "hours_skill",
    catalogId: "hours_skill",
    name: "工时计算规则-技能类",
    shortName: "工时计算规则-技能类",
    levels: 5,
    outputTable: "工时统计表（技能类）",
    desc: "基于无感考勤表考勤类型，按培训→工作票→出差→闸机→登录五层逐层计算工时",
  },
];

const DEFAULT_HOURS_PARAMS = {
  hours_mgmt: {
    trainingHoursDefault: 6,
    travelHoursPerDay: 8,
    loginHoursPerDay: 7.5,
    loginEarliestAfter: "08:00",
    loginLatestFrom: "18:00",
    loginLatestTo: "22:00",
  },
  hours_skill: {
    trainingHoursDefault: 6,
    travelHoursPerDay: 8,
    workTicketHoursDefault: 8,
    loginHoursPerDay: 7.5,
    loginEarliestAfter: "08:00",
    loginLatestFrom: "18:00",
    loginLatestTo: "22:00",
  },
};

function chainForCatalog(catalogId) {
  return RULE_CHAIN_DETAILS.find((c) => c.catalogId === catalogId);
}

export function buildDefaultBusinessRuleConfig(catalogId) {
  const chain = chainForCatalog(catalogId);
  const meta = RULE_CATALOG.find((r) => r.id === catalogId);
  const fieldMap = LAYER_KEY_FIELDS[catalogId] || {};
  return {
    catalogId,
    name: meta ? meta.name : catalogId,
    enabled: true,
    layers: (chain ? chain.layers : []).map((layer) => ({
      ...layer,
      enabled: true,
      keyFields: fieldMap[layer.level] || [],
      remark: "",
    })),
    workConfig:
      catalogId === "attendance" || catalogId === "abnormal"
        ? { 
            ...DEFAULT_WORK_CONFIG,
            timeOverrides: [] // 时间优先级配置数组
          }
        : null,
    hoursParams: DEFAULT_HOURS_PARAMS[catalogId]
      ? { ...DEFAULT_HOURS_PARAMS[catalogId] }
      : null,
    updateTime: "",
    operator: "系统默认",
  };
}

function normalizeConfig(raw) {
  if (!raw || !raw.catalogId) return null;
  const base = buildDefaultBusinessRuleConfig(raw.catalogId);
  const layerMap = {};
  (raw.layers || []).forEach((l) => {
    layerMap[l.level] = l;
  });
  return {
    ...base,
    ...raw,
    layers: base.layers.map((layer) => {
      const saved = layerMap[layer.level] || {};
      const merged = {
        ...layer,
        ...saved,
        logic: saved.logic || layer.logic || "",
        targetTable: saved.targetTable || layer.targetTable || "",
        keyFields: saved.keyFields || layer.keyFields,
      };
      if (raw.catalogId === "attendance" && layer.level === 1 && merged.output === "出差") {
        merged.output = layer.output;
        merged.logic = layer.logic;
      }
      if (
        raw.catalogId === "attendance" &&
        (layer.level === 7 || layer.level === 8) &&
        merged.source &&
        merged.source.includes("数讯")
      ) {
        merged.source = layer.source;
      }
      if (raw.catalogId === "abnormal") {
        if (layer.level === 4 && merged.source && merged.source === "数认平台") {
          merged.source = layer.source;
        }
        if (!merged.logic && layer.logic) merged.logic = layer.logic;
        if (!merged.targetTable && layer.targetTable) merged.targetTable = layer.targetTable;
      }
      if (raw.catalogId === "hours_mgmt" || raw.catalogId === "hours_skill") {
        if (!merged.logic && layer.logic) merged.logic = layer.logic;
        if (!merged.targetTable && layer.targetTable) merged.targetTable = layer.targetTable;
        if (merged.source === "培训平台" || merged.source === "闸机门禁") {
          merged.source = layer.source;
        }
      }
      return merged;
    }),
    workConfig: raw.workConfig ? { 
      ...base.workConfig, 
      ...raw.workConfig,
      timeOverrides: raw.workConfig.timeOverrides || base.workConfig.timeOverrides
    } : base.workConfig,
    hoursParams: raw.hoursParams
      ? { ...base.hoursParams, ...raw.hoursParams }
      : base.hoursParams,
  };
}

export function loadAllBusinessRuleConfigs() {
  const defaults = {};
  BUSINESS_RULE_TABS.forEach((tab) => {
    defaults[tab.catalogId] = buildDefaultBusinessRuleConfig(tab.catalogId);
  });
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return defaults;
    Object.keys(saved).forEach((catalogId) => {
      if (defaults[catalogId]) {
        defaults[catalogId] = normalizeConfig({ catalogId, ...saved[catalogId] });
      }
    });
  } catch {
    /* use defaults */
  }
  const wc = loadBehaviorModeSettings().global.workConfig;
  ["attendance", "abnormal"].forEach((id) => {
    if (defaults[id]) {
      defaults[id].workConfig = {
        arrivalTime: wc.arrivalTime,
        departureTime: wc.departureTime,
        overtimeStartTime: wc.overtimeStartTime,
        loginLateConsecutiveDays: wc.loginLateConsecutiveDays,
      };
    }
  });
  return defaults;
}

export function getBusinessRuleConfig(catalogId, allConfigs) {
  const map = allConfigs || loadAllBusinessRuleConfigs();
  return map[catalogId] || buildDefaultBusinessRuleConfig(catalogId);
}

export function saveBusinessRuleConfig(catalogId, config, operator = "当前用户") {
  const all = loadAllBusinessRuleConfigs();
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  all[catalogId] = {
    ...normalizeConfig({ catalogId, ...config }),
    updateTime: now,
    operator,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  if (catalogId === "attendance" || catalogId === "abnormal") {
    const settings = loadBehaviorModeSettings();
    if (config.workConfig) {
      settings.global.workConfig = {
        ...settings.global.workConfig,
        ...config.workConfig,
      };
    }
    const catalog = settings.global.ruleCatalog.find((r) => r.id === catalogId);
    if (catalog) catalog.enabled = config.enabled !== false;
    saveBehaviorModeSettings(settings);
  }
  if (catalogId === "hours_mgmt" || catalogId === "hours_skill") {
    const settings = loadBehaviorModeSettings();
    const catalog = settings.global.ruleCatalog.find((r) => r.id === catalogId);
    if (catalog) catalog.enabled = config.enabled !== false;
    saveBehaviorModeSettings(settings);
  }
  return all[catalogId];
}

export const SENSING_WORKFLOW_STEPS = [
  {
    step: 1,
    title: "数据清洗",
    desc: "按清洗规则识别缺失、重复、错误数据，人工修复",
    tab: "clean",
  },
  {
    step: 2,
    title: "数据整理",
    desc: "字段映射与多源整合，生成业务标准宽表",
    tab: "organize",
  },
  {
    step: 3,
    title: "规则计算",
    desc: "依据标准表应用考勤/异常/工时规则",
    tab: "output",
  },
  {
    step: 4,
    title: "结果输出",
    desc: "无感考勤表、异常校验表、工时统计表（两类）",
    tab: "output",
  },
];
