/**
 * 工时分析看板 — 模拟数据（对齐原型图一）
 */
import { YUNNAN_CITIES } from "./workHourAnalysisData";

export const DEFAULT_DASHBOARD_QUERY = {
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

const CUMULATIVE_SPEC_DIMS = ["发电", "输电", "营销", "配电", "调度"];

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

export function buildHourAnalysisKpi(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const avg = 191.3 * factor;
  const median = 185.5 * factor;
  const std = 18.7 * factor;
  return {
    avgHours: avg.toFixed(1),
    medianHours: median.toFixed(1),
    stdDev: std.toFixed(1),
    rangeMin: Math.round(160 * factor),
    rangeMax: Math.round(245 * factor),
  };
}

/** 各地市平均工时 + 全省均线 */
export function buildCityAvgHoursChart(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const categories = YUNNAN_CITIES.map((c) => c.short);
  const values = YUNNAN_CITIES.map((city, i) => {
    const seed = hashSeed(`${city.key}-${query.startDate}-${i}`);
    return Math.round((148 + (seed % 45) + Math.sin(i * 0.6) * 18) * factor);
  });
  const provincialAvg = Math.round(
    (values.reduce((s, v) => s + v, 0) / values.length) * 10
  ) / 10;
  return { categories, values, provincialAvg };
}

/** 全省人均工时分布 — 累计面积 + 人均柱 + 均线 */
export function buildProvinceHourDistChart(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const categories = YUNNAN_CITIES.map((c) => c.short);
  const perCapita = categories.map((_, i) => {
    const seed = hashSeed(`pc-${query.startDate}-${i}`);
    return Math.round((7.2 + (seed % 18) / 10) * factor * 10) / 10;
  });
  const cumulative = perCapita.map((v, i) =>
    Math.round((v * (18 + (i % 5))) * 10) / 10
  );
  const provincialAvg =
    Math.round((perCapita.reduce((s, v) => s + v, 0) / perCapita.length) * 100) / 100;
  return { categories, perCapita, cumulative, provincialAvg };
}

/** 累计工时与专业相关性 — 雷达 */
export function buildCumulativeSpecialtyRadar(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const seed = hashSeed(`${query.startDate}-${query.endDate}-cum`);
  const values = CUMULATIVE_SPEC_DIMS.map((_, i) =>
    Math.round((62 + ((seed + i * 13) % 32)) * factor)
  );
  return { dims: CUMULATIVE_SPEC_DIMS, values };
}

/** 岗位分类与工时相关性 — 分组柱 */
export function buildPostCategoryBarChart(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const categories = YUNNAN_CITIES.map((c) => c.short);
  const management = [];
  const professional = [];
  const skill = [];
  categories.forEach((_, i) => {
    const seed = hashSeed(`post-${query.startDate}-${i}`);
    management.push(Math.round((155 + (seed % 35)) * factor));
    professional.push(Math.round((168 + ((seed >> 3) % 40)) * factor));
    skill.push(Math.round((142 + ((seed >> 5) % 38)) * factor));
  });
  return { categories, management, professional, skill };
}

/** 岗位分类工时趋势 — 三组折线 */
export function buildPostCategoryTrendCharts(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const categories = YUNNAN_CITIES.map((c) => c.short);
  const buildPair = (prefix, baseA, baseB) => {
    const seriesA = [];
    const seriesB = [];
    categories.forEach((_, i) => {
      const seed = hashSeed(`${prefix}-${query.startDate}-${i}`);
      seriesA.push(Math.round((baseA + Math.sin(i * 0.5) * 22 + (seed % 20)) * factor));
      seriesB.push(Math.round((baseB + Math.cos(i * 0.45) * 18 + ((seed >> 4) % 18)) * factor));
    });
    return { seriesA, seriesB };
  };
  return {
    categories,
    skill: buildPair("skill", 175, 160),
    professional: buildPair("prof", 188, 172),
    management: buildPair("mgmt", 165, 158),
  };
}
