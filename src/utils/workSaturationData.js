/**
 * 员工工作饱和度分析 — 模拟数据
 */

import { UNIT_OPTIONS } from "./behaviorOverviewData";

export { UNIT_OPTIONS };

export const DEFAULT_SATURATION_QUERY = {
  unit: "kunming",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

const DEPARTMENTS = [
  "人力资源部",
  "市场营销部",
  "安监部",
  "生产技术部",
  "财务部",
  "数字化部",
  "综合管理部",
  "物资供应部",
];

const EMPLOYEES = [
  { name: "张三", department: "人力资源部", position: "人资专责" },
  { name: "李四", department: "市场营销部", position: "营销专责" },
  { name: "王五", department: "安监部", position: "安监专责" },
  { name: "赵六", department: "生产技术部", position: "检修班长" },
  { name: "钱七", department: "财务部", position: "财务核算" },
  { name: "孙八", department: "数字化部", position: "数据分析师" },
  { name: "周九", department: "综合管理部", position: "综合管理员" },
  { name: "吴十", department: "物资供应部", position: "物资专责" },
  { name: "郑一", department: "人力资源部", position: "培训专责" },
  { name: "王二", department: "市场营销部", position: "客户经理" },
];


function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function unitFactor(unit) {
  const idx = UNIT_OPTIONS.findIndex((u) => u.value === unit);
  if (idx <= 0) return 1;
  return 0.72 + idx * 0.022;
}

function unitBias(unit) {
  return hashSeed(unit || "all") % 16;
}

function dateFactor(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return Math.min(1.15, Math.max(0.35, days / 180));
}

function unitLabel(unit) {
  const opt = UNIT_OPTIONS.find((o) => o.value === unit);
  return opt ? opt.label : "全部单位";
}

function buildDeptRow(name, seed, factor, unitKey) {
  const bias = unitBias(unitKey);
  const avgDays = Math.round((120 + (seed % 90) + bias * 3) * factor);
  const lateRate = Math.round((1.5 + (seed % 14) * 0.55 + (bias % 5) * 0.3) * 10) / 10;
  const earlyRate = Math.round((0.8 + (seed % 10) * 0.45 + (bias % 4) * 0.25) * 10) / 10;
  const saturation = Math.min(98, Math.round(62 + avgDays * 0.12 + (seed % 10)));
  return {
    name,
    avgDays,
    lateRate,
    earlyRate,
    saturation,
    workloadIndex: Math.round(saturation * 0.92 + (seed % 8)),
    overtimeHours: Math.round(8 + (seed % 40) * factor),
  };
}

function buildEmployeeRow(emp, seed, factor, unitKey) {
  const bias = unitBias(unitKey);
  const avgDays = Math.round((100 + (seed % 120) + bias * 2) * factor);
  const lateRate = Math.round((1 + (seed % 16) * 0.5 + (bias % 6) * 0.2) * 10) / 10;
  const earlyRate = Math.round((0.5 + (seed % 12) * 0.4 + (bias % 3) * 0.3) * 10) / 10;
  const saturation = Math.min(99, Math.round(58 + avgDays * 0.14 + (seed % 12)));
  return {
    ...emp,
    avgDays,
    lateRate,
    earlyRate,
    saturation,
    workloadIndex: Math.round(saturation * 0.9 + (seed % 6)),
    overtimeHours: Math.round(6 + (seed % 35) * factor),
  };
}

function roundProb(val) {
  return Math.round(val * 10) / 10;
}

/** 基于历史异常率推算未来概率，控制在合理区间 */
function buildLateProb(lateRate, seed) {
  const wave = Math.sin((seed % 8) * 0.75) * 0.8;
  const val = lateRate * 1.2 + 1.5 + wave + (seed % 5) * 0.25;
  return roundProb(Math.min(18, Math.max(1.2, val)));
}

function buildEarlyProb(earlyRate, seed) {
  const wave = Math.sin((seed % 7) * 0.8) * 0.6;
  const val = earlyRate * 1.15 + 0.8 + wave + (seed % 4) * 0.2;
  return roundProb(Math.min(12, Math.max(0.6, val)));
}

function buildAbsenteeProb(mix, seed) {
  const wave = Math.sin((seed % 6) * 0.9) * 0.3;
  const val = mix * 0.25 + 0.35 + wave + (seed % 3) * 0.12;
  return roundProb(Math.min(6, Math.max(0.2, val)));
}

function buildDimensionProbItems(stats, isDept, seedBase) {
  return stats.map((item, i) => {
    const seed = seedBase + i * 13;
    const name = isDept ? item.name : item.name;
    const shortName = isDept ? item.name.replace(/部$/, "") : item.name;
    const mix = item.lateRate * 0.55 + item.earlyRate * 0.45;
    return {
      name,
      shortName,
      department: isDept ? name : item.department,
      lateProb: buildLateProb(item.lateRate, seed),
      earlyProb: buildEarlyProb(item.earlyRate, seed + 3),
      absenteeProb: buildAbsenteeProb(mix, seed + 7),
    };
  });
}

function buildPrediction(query, deptStats, empStats) {
  const factor = unitFactor(query.unit) * dateFactor(query.startDate, query.endDate);
  const seed = hashSeed(`${query.unit}-${query.startDate}-${query.endDate}`);

  const byDepartment = buildDimensionProbItems(deptStats, true, seed);
  const byEmployee = buildDimensionProbItems(empStats, false, seed + 500);

  const avg = (items, key) =>
    items.length
      ? Math.round(items.reduce((s, r) => s + r[key], 0) / items.length)
      : 0;

  return {
    byDepartment: {
      dimensionLabel: "部门",
      items: byDepartment,
      categories: byDepartment.map((d) => d.shortName),
      lateProb: byDepartment.map((d) => d.lateProb),
      earlyProb: byDepartment.map((d) => d.earlyProb),
      absenteeProb: byDepartment.map((d) => d.absenteeProb),
    },
    byEmployee: {
      dimensionLabel: "员工",
      items: byEmployee,
      categories: byEmployee.map((d) => d.shortName),
      lateProb: byEmployee.map((d) => d.lateProb),
      earlyProb: byEmployee.map((d) => d.earlyProb),
      absenteeProb: byEmployee.map((d) => d.absenteeProb),
    },
    modelAccuracy: Math.round(88 + (seed % 8) + factor * 2),
    avgLateProb: avg(byDepartment, "lateProb"),
    avgEarlyProb: avg(byDepartment, "earlyProb"),
    avgAbsenteeProb: avg(byDepartment, "absenteeProb"),
  };
}

export function getPredictionDimensionData(prediction, dimension = "department") {
  if (!prediction) {
    return {
      dimensionLabel: dimension === "employee" ? "员工" : "部门",
      categories: [],
      items: [],
      lateProb: [],
      earlyProb: [],
      absenteeProb: [],
    };
  }
  return dimension === "employee" ? prediction.byEmployee : prediction.byDepartment;
}

export function buildWorkSaturationSnapshot(query = DEFAULT_SATURATION_QUERY) {
  const factor = unitFactor(query.unit) * dateFactor(query.startDate, query.endDate);
  const seedBase = hashSeed(`${query.unit}-${query.startDate}-${query.endDate}`);

  const departmentStats = DEPARTMENTS.map((name, i) =>
    buildDeptRow(name, seedBase + i * 17, factor, query.unit)
  );

  const employeeStats = EMPLOYEES.map((emp, i) =>
    buildEmployeeRow(emp, seedBase + i * 23, factor, query.unit)
  );

  const prediction = buildPrediction(query, departmentStats, employeeStats);

  return {
    query,
    unitLabel: unitLabel(query.unit),
    periodLabel:
      query.startDate && query.endDate ? `${query.startDate} ~ ${query.endDate}` : "全部日期",
    departmentStats,
    employeeStats,
    prediction,
    summary: {
      avgDays: Math.round(
        departmentStats.reduce((s, d) => s + d.avgDays, 0) / departmentStats.length
      ),
      avgLateRate:
        Math.round(
          (departmentStats.reduce((s, d) => s + d.lateRate, 0) / departmentStats.length) * 10
        ) / 10,
      avgEarlyRate:
        Math.round(
          (departmentStats.reduce((s, d) => s + d.earlyRate, 0) / departmentStats.length) * 10
        ) / 10,
      avgSaturation: Math.round(
        departmentStats.reduce((s, d) => s + d.saturation, 0) / departmentStats.length
      ),
    },
  };
}
