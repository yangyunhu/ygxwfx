/**
 * 工作饱和度分析（四页签）— 模拟数据
 */

import { UNIT_OPTIONS } from "./behaviorOverviewData";

export const MODULE_UNIT_OPTIONS = [
  { label: "全部单位", value: "all" },
  ...UNIT_OPTIONS.filter((u) => u.value !== "all"),
];

export const MODULE_DEPARTMENT_OPTIONS = [
  { label: "全部部门", value: "all" },
  { label: "人力资源部", value: "人力资源部" },
  { label: "市场营销部", value: "营销业务部" },
  { label: "安监部", value: "安监部" },
  { label: "生产技术部", value: "生产技术部" },
  { label: "线路班", value: "线路班" },
  { label: "财务部", value: "财务部" },
  { label: "数字化部", value: "数字化部" },
  { label: "综合管理部", value: "综合管理部" },
];

export const SATURATION_LEVEL_OPTIONS = [
  { label: "全部层级", value: "all" },
  { label: "高", value: "高" },
  { label: "中", value: "中" },
  { label: "低", value: "低" },
];

export const ATTENDANCE_MODE_OPTIONS = [
  { label: "全部模式", value: "all" },
  { label: "固定出勤", value: "固定出勤" },
  { label: "轮班", value: "轮班" },
  { label: "不定时出勤", value: "不定时出勤" },
];

export const EFFECT_SCOPE_OPTIONS = ["全体员工", "特定范围", "特定员工", "特定岗位"];

export const DEFAULT_CALC_QUERY = {
  unit: "kunming",
  department: "人力资源部",
  granularity: "day",
};

export const DEFAULT_RULE_QUERY = {
  unit: "all",
  level: "all",
};

export const DEFAULT_POSITION_QUERY = {
  unit: "all",
  attendanceMode: "all",
};

export const DEFAULT_GRADING_QUERY = {
  startDate: "2023-01-01",
  endDate: "2023-12-31",
};

export const DEFAULT_WARNING_QUERY = {
  unit: "all",
  highThreshold: 95,
  lowThreshold: 10,
};

export const DEFAULT_COMPARE_QUERY = {
  unit: "all",
  department: "all",
};

export const DEFAULT_CORRELATION_QUERY = {
  unit: "all",
};

const SURNAMES = ["张", "李", "王", "赵", "钱", "孙", "周", "吴", "郑", "冯", "陈", "褚", "卫", "蒋", "沈", "韩"];
const GIVEN_NAMES = ["伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "艳", "军", "杰", "婷", "超", "秀英", "霞", "鹏"];

const EMPLOYEE_NAMES = [
  "张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十",
  "郑一", "冯二", "陈敏", "褚强", "卫芳", "蒋磊", "沈静", "韩洋",
];

const POSITIONS = [
  "培训专责", "线路检修工", "营销专责", "安监专责", "数据分析师",
  "调度员", "运维工程师", "客户经理", "财务核算", "综合管理员",
];

const RULE_NAME_TEMPLATES = [
  "{unit}饱和度规则",
  "{dept}饱和度规则",
  "{unit}{dept}饱和度规则",
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function unitLabel(value) {
  if (value === "all") return "全部单位";
  const opt = UNIT_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value;
}

function shortUnitLabel(value) {
  return unitLabel(value).replace("供电局", "");
}

function granularityFactor(granularity) {
  if (granularity === "week") return 1.06;
  if (granularity === "month") return 1.12;
  return 1;
}

function saturationLevel(val) {
  if (val >= 90) return "高";
  if (val >= 70) return "中";
  return "低";
}

function pickEmployeeName(unitKey, dept, index) {
  const seed = hashSeed(`${unitKey}-${dept}-${index}-emp`);
  const si = seed % SURNAMES.length;
  const gi = (seed >> 4) % GIVEN_NAMES.length;
  return `${SURNAMES[si]}${GIVEN_NAMES[gi]}`;
}

function buildCalcMetrics(index, unitKey, dept) {
  const seed = hashSeed(`${unitKey}-${dept}-${index}-sat`);
  const taskHours = 8;
  // 17% ~ 99% 分散分布，避免大量顶格 99%
  const spread = (seed % 83) + (index % 5) * 2;
  const jitter = (seed >> 3) % 7;
  const saturation = Math.min(99, Math.max(17, 17 + (spread + jitter) % 83));
  const actualHours = Math.round((taskHours * saturation) / 100 * 10) / 10;
  return { taskHours, actualHours, saturation };
}

/** ========== 工作饱和度计算 ========== */
export function generateSaturationCalcRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const departments = MODULE_DEPARTMENT_OPTIONS.filter((d) => d.value !== "all");
  const rows = [];

  for (let i = 0; i < 168; i += 1) {
    const unit = units[i % units.length];
    const dept = departments[i % departments.length];
    const { taskHours, actualHours, saturation } = buildCalcMetrics(i, unit.value, dept.value);

    rows.push({
      id: i + 1,
      unitKey: unit.value,
      unit: unit.label,
      department: dept.value,
      employeeName: pickEmployeeName(unit.value, dept.value, i),
      taskHours,
      actualHours,
      saturation,
    });
  }
  return rows;
}

export function filterSaturationCalcRows(rows, query = {}) {
  const { unit = "all", department = "all", granularity = "day" } = query;
  const factor = granularityFactor(granularity);
  let result = rows;

  if (unit !== "all") result = result.filter((r) => r.unitKey === unit);
  if (department !== "all") result = result.filter((r) => r.department === department);

  result = result.map((row) => {
    const actualHours = Math.round(row.actualHours * factor * 10) / 10;
    const saturation = Math.min(99, Math.max(17, Math.round((actualHours / row.taskHours) * 100)));
    return { ...row, actualHours, saturation };
  });

  return result
    .sort((a, b) => b.saturation - a.saturation)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));
}

/** ========== 饱和度规则设定 ========== */
export function generateSaturationRuleRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const departments = MODULE_DEPARTMENT_OPTIONS.filter((d) => d.value !== "all");
  const levels = ["高", "中", "低"];
  const thresholds = ["100% ~ 90%", "90% ~ 80%", "80% ~ 70%", "70% ~ 60%"];
  const rows = [];

  for (let i = 0; i < 168; i += 1) {
    const unit = units[i % units.length];
    const dept = departments[i % departments.length];
    const level = levels[i % 3];
    const tpl = RULE_NAME_TEMPLATES[i % 3];
    const ruleName = tpl
      .replace("{unit}", shortUnitLabel(unit.value))
      .replace("{dept}", dept.value.replace(/部$|班$/, ""));

    const changeTime = i % 4 === 0 ? "2023-11-26 11:59" : "";
    const prevThreshold = thresholds[(i + 1) % thresholds.length];
    const prevScope = EFFECT_SCOPE_OPTIONS[i % EFFECT_SCOPE_OPTIONS.length];

    rows.push({
      id: i + 1,
      unitKey: unit.value,
      unit: unit.label,
      ruleName,
      level,
      threshold: thresholds[i % thresholds.length],
      effectScope: EFFECT_SCOPE_OPTIONS[(i + 1) % EFFECT_SCOPE_OPTIONS.length],
      changeTime,
      changeUser: "张三",
      prevRule: `阈值: ${prevThreshold}; 生效范围: ${prevScope}`,
    });
  }
  return rows;
}

export function filterSaturationRuleRows(rows, query = {}) {
  const { unit = "all", level = "all" } = query;
  let result = rows;
  if (unit !== "all") result = result.filter((r) => r.unitKey === unit);
  if (level !== "all") result = result.filter((r) => r.level === level);
  return result;
}

/** ========== 饱和度关联岗位配置 ========== */
export function generatePositionLinkRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const departments = MODULE_DEPARTMENT_OPTIONS.filter((d) => d.value !== "all");
  const modes = ["固定出勤", "轮班", "不定时出勤"];
  const results = ["高", "中", "低"];
  const rows = [];

  for (let i = 0; i < 168; i += 1) {
    const unit = units[i % units.length];
    const dept = departments[i % departments.length];
    const seed = hashSeed(`link-${i}`);
    const linkedName =
      i % 2 === 0
        ? `${dept.value.replace(/部$|班$/, "")}饱和度规则`
        : `${shortUnitLabel(unit.value)}饱和度规则`;

    rows.push({
      id: i + 1,
      unitKey: unit.value,
      unit: unit.label,
      employeeName: pickEmployeeName(unit.value, dept.value, i),
      department: dept.value,
      position: POSITIONS[i % POSITIONS.length],
      attendanceMode: modes[i % modes.length],
      linkedRuleName: linkedName,
      judgeResult: results[seed % 3],
    });
  }
  return rows;
}

export function filterPositionLinkRows(rows, query = {}) {
  const { unit = "all", attendanceMode = "all" } = query;
  let result = rows;
  if (unit !== "all") result = result.filter((r) => r.unitKey === unit);
  if (attendanceMode !== "all") result = result.filter((r) => r.attendanceMode === attendanceMode);
  return result;
}

/** ========== 饱和度分析 ========== */

/** 饱和度分级 — 按日分级折线 */
export function buildGradingChartData(query = {}) {
  const { startDate, endDate } = query;
  const days = [];
  const levels = [];
  const levelMap = { 高: 2, 中: 1, 低: 0 };
  const levelLabels = ["低", "中", "高"];

  for (let i = 1; i <= 31; i += 1) {
    days.push(`${i}日`);
    const seed = hashSeed(`${startDate}-${endDate}-${i}`);
    const lvl = seed % 5 === 0 ? "高" : seed % 3 === 0 ? "低" : "中";
    levels.push({ value: levelMap[lvl], label: lvl });
  }

  return { days, levels, levelLabels };
}

/** 饱和度预警 — 188 条 */
export function generateWarningRows() {
  const departments = MODULE_DEPARTMENT_OPTIONS.filter((d) => d.value !== "all");
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const rows = [];

  for (let i = 0; i < 188; i += 1) {
    const unit = units[i % units.length];
    const dept = departments[i % departments.length];
    const seed = hashSeed(`warn-${i}`);
    const saturation = i < 30 ? 96 + (seed % 4) : 60 + (seed % 35);
    const isAbnormal = saturation >= 95 || saturation <= 10;
    rows.push({
      id: i + 1,
      unitKey: unit.value,
      employeeName: pickEmployeeName(unit.value, dept.value, i + 1000),
      department: dept.value,
      position: POSITIONS[i % POSITIONS.length],
      saturation,
      isAbnormal,
      abnormalRate: isAbnormal ? `${1 + (seed % 5)}%` : "",
    });
  }
  return rows;
}

export function filterWarningRows(rows, query = {}) {
  const { unit = "all", highThreshold = 95, lowThreshold = 10 } = query;
  let result = rows;
  if (unit !== "all") result = result.filter((r) => r.unitKey === unit);
  return result.filter(
    (r) => r.saturation >= highThreshold || r.saturation <= lowThreshold
  ).map((r) => ({
    ...r,
    isAbnormal: true,
    abnormalRate: r.abnormalRate || `${Math.abs(r.saturation - 80) % 5 + 1}%`,
  }));
}

/** 饱和度对比分析 */
export function buildCompareChartData(query = {}) {
  const { unit = "all", department = "all" } = query;
  const deptNames =
    department !== "all"
      ? [department]
      : ["人力资源部", "营销业务部", "安监部", "其他部门"];

  const deptSaturation = deptNames.map((name, i) => {
    const seed = hashSeed(`${unit}-${name}-${i}`);
    return Math.min(95, 52 + (seed % 38));
  });

  const positionNames = ["培训专责", "分析员", "开发岗", "运营岗", "检修工", "调度员"];
  const positionSaturation = positionNames.map((name, i) => {
    const seed = hashSeed(`${unit}-${name}-${i}-pos`);
    return Math.min(92, 48 + (seed % 40));
  });

  return { deptNames, deptSaturation, positionNames, positionSaturation };
}

/** 饱和度相关性 — 雷达图 */
export function buildCorrelationRadarData(query = {}) {
  const { unit = "all" } = query;
  const seed = hashSeed(`radar-${unit}`);
  const dims = [
    "业务用时长与员工绩效结果",
    "业务用时长与岗位人员匹配情况",
    "员工绩效结果与岗位人员匹配情况",
  ];

  const seriesA = dims.map((_, i) => Math.min(95, 55 + ((seed + i * 17) % 35)));
  const seriesB = dims.map((_, i) => Math.min(90, 50 + ((seed + i * 23) % 32)));

  return { dims, seriesA, seriesB };
}

/** ========== 饱和度预警规则配置（加班时长维度） ========== */

export const OVERTIME_WARNING_LEVEL_OPTIONS = [
  { label: "全部级别", value: "all" },
  { label: "高", value: "高" },
  { label: "中", value: "中" },
  { label: "低", value: "低" },
];

export const DEFAULT_OVERTIME_WARN_RULE_QUERY = {
  unit: "all",
  level: "all",
};

export const DEFAULT_OVERTIME_WARN_ANALYSIS_QUERY = {
  unit: "kunming",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  minConsecutiveDays: 5,
};

const OVERTIME_END_TIMES = ["23:30", "00:15", "00:45", "01:20", "02:10", "00:05", "01:05"];

/** 预警规则列表 */
export function generateOvertimeWarningRuleRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const levels = ["高", "中", "低"];
  const scopes = EFFECT_SCOPE_OPTIONS;
  const rows = [
    {
      id: 1,
      unitKey: "all",
      unit: "全部单位",
      ruleName: "连续加班超时预警",
      dimension: "加班时长",
      endTimeThreshold: "00:00",
      consecutiveDays: 5,
      level: "高",
      effectScope: "全体员工",
      enabled: true,
      changeTime: "2025-01-01 09:00",
      changeUser: "系统管理员",
      prevRule: "结束时间 ≥ 00:00；连续天数 ≥ 5",
    },
  ];

  for (let i = 0; i < 24; i += 1) {
    const unit = units[i % units.length];
    const days = 3 + (i % 5);
    rows.push({
      id: i + 2,
      unitKey: unit.value,
      unit: unit.label,
      ruleName: `${shortUnitLabel(unit.value)}加班时长预警-${i + 1}`,
      dimension: "加班时长",
      endTimeThreshold: i % 3 === 0 ? "00:00" : "23:30",
      consecutiveDays: days,
      level: levels[i % 3],
      effectScope: scopes[i % scopes.length],
      enabled: i % 7 !== 0,
      changeTime: i % 4 === 0 ? "2025-03-15 14:20" : "",
      changeUser: "张三",
      prevRule: `连续天数 ≥ ${Math.max(1, days - 1)}；结束时间 ≥ 23:30`,
    });
  }
  return rows;
}

export function filterOvertimeWarningRuleRows(rows, query = {}) {
  const { unit = "all", level = "all" } = query;
  let result = rows;
  if (unit !== "all") {
    result = result.filter((r) => r.unitKey === unit || r.unitKey === "all");
  }
  if (level !== "all") result = result.filter((r) => r.level === level);
  return result;
}

/** 预警分析 — 近30日趋势 */
export function buildOvertimeWarningAnalysisChart(query = {}) {
  const { unit = "kunming", startDate, endDate, minConsecutiveDays = 5 } = query;
  const dates = [];
  const overtimePersonCount = [];
  const warningPersonCount = [];
  const overtimeHours = [];

  for (let i = 1; i <= 30; i += 1) {
    dates.push(`${i}日`);
    const seed = hashSeed(`${unit}-${startDate}-${endDate}-${i}-ot`);
    const base = 2 + (seed % 8);
    const otCount = base + (seed % 4);
    const warnCount = otCount >= minConsecutiveDays
      ? Math.max(0, Math.floor(otCount * 0.35) + (seed % 3))
      : Math.max(0, (seed % 2));
    overtimePersonCount.push(otCount);
    warningPersonCount.push(warnCount);
    overtimeHours.push(Math.round((3.5 + (seed % 6) + warnCount * 0.8) * 10) / 10);
  }

  const deptNames = ["人力资源部", "营销业务部", "安监部", "生产技术部", "数字化部", "线路班"];
  const deptWarningCount = deptNames.map((name, idx) => {
    const seed = hashSeed(`${unit}-${name}-${minConsecutiveDays}-${idx}`);
    return 1 + (seed % 9);
  });

  return {
    dates,
    overtimePersonCount,
    warningPersonCount,
    overtimeHours,
    deptNames,
    deptWarningCount,
    summary: {
      totalWarning: warningPersonCount.reduce((s, v) => s + v, 0),
      maxConsecutiveDays: minConsecutiveDays + 3,
      avgOvertimeHours: Math.round(
        (overtimeHours.reduce((s, v) => s + v, 0) / overtimeHours.length) * 10
      ) / 10,
    },
  };
}

/** 触发预警人员明细 */
export function generateOvertimeWarningAlertRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const departments = MODULE_DEPARTMENT_OPTIONS.filter((d) => d.value !== "all");
  const rows = [];

  for (let i = 0; i < 86; i += 1) {
    const unit = units[i % units.length];
    const dept = departments[i % departments.length];
    const seed = hashSeed(`ot-warn-${i}`);
    const consecutiveDays = 5 + (seed % 6);
    const lastEndTime = OVERTIME_END_TIMES[seed % OVERTIME_END_TIMES.length];
    const totalOvertimeHours = Math.round((12 + (seed % 28) + consecutiveDays * 1.2) * 10) / 10;
    const triggered = consecutiveDays >= 5;

    rows.push({
      id: i + 1,
      unitKey: unit.value,
      unit: unit.label,
      employeeName: pickEmployeeName(unit.value, dept.value, i + 2000),
      department: dept.value,
      position: POSITIONS[i % POSITIONS.length],
      lastEndTime,
      consecutiveDays,
      totalOvertimeHours,
      warningLevel: consecutiveDays >= 8 ? "高" : consecutiveDays >= 6 ? "中" : "高",
      warningStatus: triggered ? "已触发" : "观察中",
      triggered,
    });
  }
  return rows;
}

export function filterOvertimeWarningAlertRows(rows, query = {}) {
  const { unit = "all", minConsecutiveDays = 5, onlyTriggered = true } = query;
  let result = rows;
  if (unit !== "all") result = result.filter((r) => r.unitKey === unit);
  result = result.filter((r) => r.consecutiveDays >= minConsecutiveDays);
  if (onlyTriggered) result = result.filter((r) => r.triggered);
  return result.sort((a, b) => b.consecutiveDays - a.consecutiveDays);
}
