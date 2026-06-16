/**
 * 工时分析 — 模拟数据
 */

import { UNIT_OPTIONS } from "./behaviorOverviewData";

export const SPECIALTY_OPTIONS = [
  { label: "变电", value: "substation" },
  { label: "配电", value: "distribution" },
  { label: "发电", value: "generation" },
  { label: "营配", value: "marketing_dist" },
  { label: "调度", value: "dispatch" },
  { label: "安监", value: "safety" },
];

export const YUNNAN_CITIES = UNIT_OPTIONS.filter((u) => u.value !== "all").map((u) => ({
  key: u.value,
  short: u.label.replace("供电局", "").replace("西双版纳", "西双版纳"),
  full: u.label,
}));

export const SPECIALTY_LABELS = [
  "配电专业",
  "发电专业",
  "营配专业",
  "调度专业",
  "安监",
  "变电专业",
  "营销专业",
  "信息专业",
];

export const DEPARTMENT_LABELS = [
  "人力资源部",
  "市场营销部",
  "生产技术部",
  "数字化部",
  "安监部",
  "财务部",
  "综合管理部",
  "物资供应部",
];

export const DEFAULT_HOUR_ANALYSIS_QUERY = {
  specialty: "substation",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

export const DEFAULT_UNIT_DEPT_QUERY = {
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  dimension: "department",
};

export const DEFAULT_UNIT_HOURS_DIST_QUERY = {
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

export const DEFAULT_DISTRIBUTION_QUERY = {
  unit: "all",
  specialty: "all",
};

/** 工时与专业统计 — 专业列表 */
export const STATS_SPECIALTY_LIST = [
  "输电专业",
  "配电专业",
  "变电专业",
  "营销专业",
  "信息专业",
  "安监专业",
  "发电专业",
  "营配专业",
  "调度专业",
  "基建专业",
  "物资专业",
  "财务专业",
  "人资专业",
  "综合专业",
  "检修专业",
  "运维专业",
  "试验专业",
  "保护专业",
  "通信专业",
  "自动化专业",
  "计量专业",
];

export const DIST_STATS_UNIT_OPTIONS = [
  { label: "全部单位", value: "all" },
  ...UNIT_OPTIONS.filter((u) => u.value !== "all"),
];

export const DIST_STATS_SPECIALTY_OPTIONS = [
  { label: "全部专业", value: "all" },
  ...STATS_SPECIALTY_LIST.map((name) => ({ label: name, value: name })),
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function dateFactor(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return Math.min(1.2, Math.max(0.35, days / 180));
}

function specialtyBias(specialty) {
  return hashSeed(specialty || "substation") % 20;
}

/** 按工时类型 — 各地市折线数据 */
export function buildHourTypeByCity(query = {}) {
  const { specialty = "substation", startDate, endDate } = query;
  const factor = dateFactor(startDate, endDate);
  const bias = specialtyBias(specialty);

  const businessTrip = [];
  const training = [];
  const attendance = [];

  YUNNAN_CITIES.forEach((city, i) => {
    const seed = hashSeed(`${specialty}-${city.key}-${startDate}`);
    const wave = Math.sin((i + bias) * 0.55) * 28;
    businessTrip.push(Math.round((95 + wave + (seed % 35) + bias * 1.2) * factor));
    training.push(Math.round((72 + Math.cos(i * 0.45) * 22 + (seed % 28)) * factor));
    attendance.push(Math.round((165 + Math.sin(i * 0.35) * 38 + (seed % 40) + bias) * factor));
  });

  return {
    categories: YUNNAN_CITIES.map((c) => c.short),
    businessTrip,
    training,
    attendance,
  };
}

/** 按单位/部门 — 专业工时差异折线 */
export function buildSpecialtyHourDiff(query = {}) {
  const { dimension = "department", startDate, endDate } = query;
  const factor = dateFactor(startDate, endDate);
  const dimBias = dimension === "unit" ? 4 : 0;

  const values = SPECIALTY_LABELS.map((name, i) => {
    const seed = hashSeed(`${dimension}-${name}-${startDate}`);
    const base = 42 + (seed % 38) + dimBias * 2;
    const wave = Math.sin((i + dimBias) * 0.7) * 12;
    return Math.min(96, Math.max(18, Math.round((base + wave) * factor)));
  });

  return {
    categories: SPECIALTY_LABELS,
    values,
  };
}

/** 工时与专业统计分布 — 汇总行 */
function buildStatsRow(id, unitKey, specialty, seed) {
  const totalHours = Math.round(18 + (seed % 285) + (hashSeed(unitKey) % 35));
  const avgHours = Math.round((1 + (seed % 5) + ((seed >> 3) % 10) / 10) * 10) / 10;
  const medianHours = Math.round((avgHours + ((seed % 3) - 1) * 0.2) * 10) / 10;
  const stdDev = Math.round((0.4 + (seed % 9) / 10) * 10) / 10;
  const dispersion = Math.round((1 + (seed % 5) + (seed % 3) / 10) * 10) / 10;

  return {
    id,
    unitKey,
    unit: unitLabel(unitKey),
    specialty,
    totalHours,
    avgHours,
    medianHours,
    stdDev,
    dispersion,
  };
}

/** 生成 168 条模拟统计记录 */
export function generateSpecialtyStatsRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const rows = [];
  for (let i = 0; i < 168; i += 1) {
    const unit = units[i % units.length];
    const specialty = STATS_SPECIALTY_LIST[i % STATS_SPECIALTY_LIST.length];
    const seed = hashSeed(`${unit.value}-${specialty}-${i}`);
    rows.push(buildStatsRow(i + 1, unit.value, specialty, seed));
  }
  return rows;
}

/** 按单位、专业筛选 */
export function filterSpecialtyStatsRows(rows, query = {}) {
  const { unit = "all", specialty = "all" } = query;
  let result = rows;
  if (unit && unit !== "all") {
    result = result.filter((row) => row.unitKey === unit);
  }
  if (specialty && specialty !== "all") {
    result = result.filter((row) => row.specialty === specialty);
  }
  return result;
}

export function unitLabel(value) {
  if (value === "all") return "全部单位";
  const opt = UNIT_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value;
}

export function specialtyLabel(value) {
  if (value === "all") return "全部专业";
  const opt = SPECIALTY_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value;
}
