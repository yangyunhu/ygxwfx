/**
 * 工时分析看板 — 模拟数据（对齐原型图一）
 */
import { YUNNAN_CITIES } from "./workHourAnalysisData";
import { HR_CATEGORY_SEQUENCE_MAP } from "./positionRelation";

export const DEFAULT_DASHBOARD_QUERY = {
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

/** 技能类全量岗位序列（与人资对照表图二一致） */
export const SKILL_JOB_SEQUENCES =
  HR_CATEGORY_SEQUENCE_MAP.find((m) => m.category === "技能类")?.sequences || [];

function shortSkillSequenceLabel(name) {
  return name.replace(/技能序列$/, "");
}

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

function countWorkDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekDay = cursor.getDay();
    if (weekDay !== 0 && weekDay !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(1, days);
}

/** 顶部 KPI：出勤工时、出勤总工时、饱和工时 */
export function buildHourAnalysisKpi(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const workDays = countWorkDays(query.startDate, query.endDate);
  const onDutyCount = 18600;
  const attendanceHours = Number((7.65 + 0.15 * (factor - 1)).toFixed(1));
  const totalAttendanceHours = Math.round(onDutyCount * attendanceHours * workDays * factor);
  const saturationHours = Math.round(onDutyCount * 10 * workDays * factor);
  return {
    attendanceHours,
    totalAttendanceHours,
    saturationHours,
    totalAttendanceHoursDisplay: formatWanHours(totalAttendanceHours),
    saturationHoursDisplay: formatWanHours(saturationHours),
  };
}

function formatWanHours(hours) {
  if (hours >= 10000) {
    return `${(hours / 10000).toFixed(1)}万`;
  }
  return String(hours);
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

/** 技能类全量岗位序列 — 累计工时雷达 */
export function buildCumulativeSpecialtyRadar(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const dims = SKILL_JOB_SEQUENCES;
  const seed = hashSeed(`${query.startDate}-${query.endDate}-skill-seq`);
  const values = dims.map((_, i) =>
    Math.round((52 + ((seed + i * 11) % 42) + Math.sin(i * 0.85) * 8) * factor)
  );
  const labels = dims.map(shortSkillSequenceLabel);
  return { dims, labels, values };
}

/** 岗位分类平均工时 — 各地市分组柱 */
export function buildPostCategoryBarChart(query = {}) {
  const factor = dateFactor(query.startDate, query.endDate);
  const workDays = countWorkDays(query.startDate, query.endDate);
  const categories = YUNNAN_CITIES.map((c) => c.short);
  const management = [];
  const professional = [];
  const skill = [];

  // 岗位类别人均日出勤基准（h），再折算为统计区间平均工时
  const dailyBase = { management: 7.52, professional: 7.86, skill: 7.38 };

  categories.forEach((_, i) => {
    const seed = hashSeed(`post-avg-${query.startDate}-${i}`);
    const mgmtDaily = dailyBase.management + ((seed % 14) - 7) / 100;
    const profDaily = dailyBase.professional + (((seed >> 3) % 16) - 8) / 100;
    const skillDaily = dailyBase.skill + (((seed >> 5) % 14) - 7) / 100;
    management.push(roundAvgHours(mgmtDaily, workDays, factor));
    professional.push(roundAvgHours(profDaily, workDays, factor));
    skill.push(roundAvgHours(skillDaily, workDays, factor));
  });

  const all = [...management, ...professional, ...skill];
  const provincialAvg = roundAvgHours(
    (dailyBase.management + dailyBase.professional + dailyBase.skill) / 3,
    workDays,
    factor
  );

  return { categories, management, professional, skill, provincialAvg, workDays };
}

/** 统计区间人均平均工时(h)，随时间筛选缩放 */
function roundAvgHours(dailyHours, workDays, factor) {
  const refDays = 26;
  const timeScale = Math.min(1.2, Math.max(0.35, workDays / 180)) * factor;
  return Number((dailyHours * refDays * timeScale).toFixed(1));
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
  };
}
