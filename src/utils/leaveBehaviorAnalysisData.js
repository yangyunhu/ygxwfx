/**
 * 请假行为分析 — 模拟数据（云南电网供电局场景）
 */
import {
  UNITS,
  DEPARTMENTS,
  UNIT_OPTIONS,
  DEPARTMENT_OPTIONS,
} from "./attendanceStabilityData";

export { UNIT_OPTIONS, DEPARTMENT_OPTIONS };

export const LEAVE_TYPES = ["事假", "病假", "年休假"];

export const LEAVE_TYPE_COLORS = {
  事假: "#1890FF",
  病假: "#33C3A1",
  年休假: "#1A558E",
};

export const YEAR_OPTIONS = [
  { label: "2024年", value: "2024" },
  { label: "2025年", value: "2025" },
  { label: "2026年", value: "2026" },
];

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const QUARTER_LABELS = ["1季度", "2季度", "3季度", "4季度"];

const SURNAMES = [
  "张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴",
  "徐", "孙", "马", "朱", "胡", "郭", "何", "林", "罗", "高",
  "梁", "郑", "谢", "韩", "唐", "冯", "于", "董", "萧", "程",
];

const GIVEN_NAMES = [
  "伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "勇", "艳",
  "杰", "涛", "明", "华", "丽", "超", "娟", "军", "琳", "斌",
  "婷", "鹏", "雪", "龙", "慧", "峰", "倩", "博", "璐", "凯",
  "欣", "俊", "蕾", "浩", "萍", "帆", "莹", "旭", "佳", "宁",
  "晨", "悦", "翔", "薇", "刚", "丹", "昊", "思", "洁", "朗",
  "云", "梅", "建", "红", "平", "文", "波", "玲", "飞", "青",
];

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function formatHours(hours) {
  return Number(hours.toFixed(1));
}

function buildEmployeeName(index) {
  const surname = SURNAMES[index % SURNAMES.length];
  const given = GIVEN_NAMES[Math.floor(index / SURNAMES.length) % GIVEN_NAMES.length];
  return surname + given;
}

function filterSeed(filter = {}) {
  let seed = 0;
  if (filter.unit) seed += filter.unit.length * 7;
  if (filter.department) seed += filter.department.length * 13;
  if (filter.granularity) seed += filter.granularity === "quarter" ? 31 : 17;
  if (filter.year) seed += Number(filter.year) * 3;
  return seed;
}

function pickLeaveType(index) {
  const r = seededRandom(index + 5100);
  if (r < 0.48) return "事假";
  if (r < 0.78) return "年休假";
  return "病假";
}

function buildLeaveDurations(index, leaveType) {
  const base = leaveType === "病假" ? 6 : leaveType === "年休假" ? 16 : 4;
  const spread = leaveType === "年休假" ? 24 : leaveType === "病假" ? 12 : 8;

  const avgHours = base + seededRandom(index + 5200) * spread;
  const longestHours = avgHours + 2 + seededRandom(index + 5210) * (leaveType === "年休假" ? 32 : 16);
  const shortestHours = Math.max(1, avgHours - (1 + seededRandom(index + 5220) * 3));

  return {
    avgDuration: formatHours(avgHours),
    maxDuration: formatHours(longestHours),
    minDuration: formatHours(shortestHours),
  };
}

/** Tab2：请假时长分析表格 */
export function generateLeaveDurationRows(count = 168, year = "2025") {
  const yearSeed = Number(year) || 2025;
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const leaveType = pickLeaveType(i + yearSeed);
    const durations = buildLeaveDurations(i + yearSeed * 10, leaveType);
    rows.push({
      id: i + 1,
      unit: UNITS[i % UNITS.length],
      department: DEPARTMENTS[Math.floor(i / UNITS.length) % DEPARTMENTS.length],
      name: buildEmployeeName(i),
      leaveType,
      year,
      ...durations,
    });
  }
  return rows;
}

/** 月度请假次数趋势（原型：4月、9月高峰，5月低谷） */
function buildMonthlyTrend(seed) {
  const pattern = [5, 4, 6, 9, 1, 5, 6, 7, 8, 5, 4, 3];
  return MONTH_LABELS.map((month, idx) => {
    const jitter = Math.floor(seededRandom(seed + idx + 100) * 3) - 1;
    return {
      label: month,
      value: Math.max(0, Math.min(10, pattern[idx] + jitter)),
    };
  });
}

/** 季度请假次数趋势 */
function buildQuarterlyTrend(seed) {
  const pattern = [15, 12, 22, 14];
  return QUARTER_LABELS.map((label, idx) => {
    const jitter = Math.floor(seededRandom(seed + idx + 200) * 5) - 2;
    return {
      label,
      value: Math.max(0, pattern[idx] + jitter),
    };
  });
}

/** 请假类型分布 */
function buildLeaveTypeDistribution(seed) {
  const base = [
    { name: "事假", value: 10 + Math.floor(seededRandom(seed + 301) * 6) },
    { name: "年休假", value: 5 + Math.floor(seededRandom(seed + 302) * 4) },
    { name: "病假", value: 1 + Math.floor(seededRandom(seed + 303) * 4) },
  ];
  const total = base.reduce((sum, item) => sum + item.value, 0);
  return base.map((item) => ({
    ...item,
    percent: total ? Math.round((item.value / total) * 100) : 0,
    color: LEAVE_TYPE_COLORS[item.name],
  }));
}

/** Tab1：图表数据 */
export function getLeaveDistributionChartData(filter = {}) {
  const seed = filterSeed(filter);
  const isQuarter = filter.granularity === "quarter";
  const trend = isQuarter ? buildQuarterlyTrend(seed) : buildMonthlyTrend(seed);
  const typeDistribution = buildLeaveTypeDistribution(seed);
  return { trend, typeDistribution, isQuarter };
}

export function getDefaultDistQuery() {
  return {
    unit: "",
    department: "",
    granularity: "month",
  };
}

export function getDefaultDurationQuery() {
  return {
    unit: "",
    department: "",
    year: "2025",
  };
}
