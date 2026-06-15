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

export const DEFAULT_DISTRIBUTION_QUERY = {
  unit: "kunming",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

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

/** 工时与专业统计分布 — 堆叠柱 + 占比 */
export function buildSpecialtyDistribution(query = {}) {
  const { unit = "kunming", startDate, endDate } = query;
  const factor = dateFactor(startDate, endDate);
  const unitIdx = Math.max(0, UNIT_OPTIONS.findIndex((u) => u.value === unit));

  const attendance = [];
  const businessTrip = [];
  const training = [];
  const overtime = [];

  SPECIALTY_LABELS.forEach((name, i) => {
    const seed = hashSeed(`${unit}-${name}-${startDate}`);
    attendance.push(Math.round((120 + (seed % 60) + unitIdx * 3 + i * 4) * factor));
    businessTrip.push(Math.round((35 + (seed % 25) + i * 2) * factor));
    training.push(Math.round((28 + (seed % 20) + unitIdx) * factor));
    overtime.push(Math.round((18 + (seed % 22) + i * 1.5) * factor));
  });

  const pieData = SPECIALTY_LABELS.map((name, i) => {
    const total = attendance[i] + businessTrip[i] + training[i] + overtime[i];
    return { name, value: total };
  });

  return {
    categories: SPECIALTY_LABELS,
    attendance,
    businessTrip,
    training,
    overtime,
    pieData,
  };
}

export function specialtyLabel(value) {
  const opt = SPECIALTY_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value;
}

export function unitLabel(value) {
  const opt = UNIT_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value;
}
