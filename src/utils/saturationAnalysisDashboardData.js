/**
 * 饱和度分析看板 — 模拟数据（对齐原型）
 */
import { YUNNAN_CITIES } from "./workHourAnalysisData";

export const DEFAULT_SATURATION_DASHBOARD_QUERY = {
  unit: "kunming",
};

const SPECIALTY_DIMS = ["安监", "物流", "变电", "信息", "电网建设", "调度", "营配", "配电"];
const POST_CATEGORIES = ["管理类", "专业技术类", "技能类"];

const PIE_COLORS = [
  "#1890FF",
  "#52C41A",
  "#FAAD14",
  "#FA8C16",
  "#13C2C2",
  "#597EF7",
  "#9254DE",
  "#EB2F96",
  "#2FC25B",
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function unitFactor(unit = "all") {
  if (!unit || unit === "all") return 1;
  return 0.94 + (hashSeed(unit) % 12) / 100;
}

/** 饱和度分析看板 — 汇总各图表数据 */
export function buildSaturationAnalysisDashboard(query = {}) {
  const uf = unitFactor(query.unit);
  const categories = YUNNAN_CITIES.map((c) => c.short);

  const provinceValues = categories.map((_, i) => {
    const seed = hashSeed(`${query.unit}-prov-${i}`);
    return Number((0.78 + (seed % 38) / 100).toFixed(2));
  });
  const provincialAvg = Number((1.0 * uf).toFixed(2));

  const specialtyValues = SPECIALTY_DIMS.map((name, i) => {
    const seed = hashSeed(`${query.unit}-spec-${name}-${i}`);
    const base = name === "信息" ? 1.08 : 0.52 + (seed % 42) / 100;
    return Number(Math.min(1.15, base * uf).toFixed(2));
  });

  const highSatPie = [
    { name: "营销", value: 49 },
    { name: "输电", value: 47 },
    { name: "电网建设", value: 47 },
    { name: "营配", value: 37 },
    { name: "信息", value: 19 },
    { name: "变电", value: 16 },
    { name: "物流", value: 17 },
    { name: "调度", value: 12 },
    { name: "配电", value: 14 },
  ].map((d) => ({ ...d, value: Math.max(8, Math.round(d.value * uf)) }));

  const categoryBase = [1.1, 0.9, 1.1];
  const categoryValues = POST_CATEGORIES.map((_, i) => {
    const seed = hashSeed(`${query.unit}-cat-${i}`);
    return Number((categoryBase[i] * (0.97 + (seed % 6) / 100)).toFixed(1));
  });

  const management = [];
  const professional = [];
  const skill = [];
  categories.forEach((_, i) => {
    const seed = hashSeed(`${query.unit}-stack-${i}`);
    management.push(Math.round((300 + (seed % 140)) * uf));
    professional.push(Math.round((260 + ((seed >> 3) % 120)) * uf));
    skill.push(Math.round((340 + ((seed >> 5) % 150)) * uf));
  });

  return {
    province: { categories, values: provinceValues, provincialAvg },
    specialty: { names: SPECIALTY_DIMS, values: specialtyValues },
    highSatPie,
    category: { names: POST_CATEGORIES, values: categoryValues },
    regionStack: { categories, management, professional, skill },
    pieColors: PIE_COLORS,
  };
}
