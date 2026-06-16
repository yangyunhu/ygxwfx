/**
 * 请假行为分析 — 模拟数据（云南电网供电局场景）
 */
import {
  UNITS,
  DEPARTMENTS,
  UNIT_OPTIONS,
  DEPARTMENT_OPTIONS,
} from "./attendanceStabilityData";
import { LEAVE_TYPE_NAMES } from "./behaviorModeSettings";

export { UNIT_OPTIONS, DEPARTMENT_OPTIONS };

/** 休假类型（与人资休假台账一致） */
export const LEAVE_TYPES = [...LEAVE_TYPE_NAMES];

export const LEAVE_TYPE_FILTER_OPTIONS = LEAVE_TYPES.map((name) => ({
  label: name,
  value: name,
}));

/** 各单位请假对比图默认筛选类型 */
export const DEFAULT_UNIT_LEAVE_TYPE = "年休假";

const UNIT_SHORT_NAMES = [
  "昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧",
  "楚雄", "红河", "文山", "西双版纳", "大理", "德宏", "怒江", "迪庆",
];

export const LEAVE_TYPE_COLORS = {
  事假: "#1890FF",
  病假: "#33C3A1",
  年休假: "#1A558E",
  探亲假: "#722ED1",
  婚假: "#EB2F96",
  丧假: "#595959",
  流产假: "#FA541C",
  产假: "#13C2C2",
  哺乳假: "#FAAD14",
  陪护假: "#2F54EB",
  节育假: "#A0D911",
  育儿假: "#F759AB",
  父母护理假: "#597EF7",
  其他: "#8C8C8C",
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
  if (filter.startDate) seed += filter.startDate.length * 3;
  if (filter.endDate) seed += filter.endDate.length * 5;
  if (filter.positionCategory) seed += filter.positionCategory.length * 7;
  if (filter.positionSequence) seed += filter.positionSequence.length * 11;
  if (filter.unit) seed += filter.unit.length * 7;
  if (filter.department) seed += filter.department.length * 13;
  if (filter.granularity) seed += filter.granularity === "quarter" ? 31 : 17;
  if (filter.year) seed += Number(filter.year) * 3;
  return seed;
}

function pickLeaveType(index) {
  const r = seededRandom(index + 5100);
  let acc = 0;
  const weights = [0.22, 0.18, 0.12, 0.08, 0.06, 0.04, 0.03, 0.05, 0.04, 0.04, 0.02, 0.05, 0.04, 0.03];
  for (let i = 0; i < LEAVE_TYPES.length; i += 1) {
    acc += weights[i] || 0.03;
    if (r < acc) return LEAVE_TYPES[i];
  }
  return LEAVE_TYPES[LEAVE_TYPES.length - 1];
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
  const base = LEAVE_TYPES.map((name, idx) => ({
    name,
    value: 1 + Math.floor(seededRandom(seed + 301 + idx * 11) * (name === "年休假" ? 10 : name === "事假" ? 8 : 5)),
  }));
  const total = base.reduce((sum, item) => sum + item.value, 0);
  return base
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
      color: LEAVE_TYPE_COLORS[item.name] || "#1890FF",
    }));
}

/** 各单位请假天数（总天数 + 分类型天数） */
function buildLeaveDaysByUnit(seed, selectedLeaveType = DEFAULT_UNIT_LEAVE_TYPE) {
  return UNIT_SHORT_NAMES.map((name, idx) => {
    const byType = {};
    LEAVE_TYPES.forEach((type, typeIdx) => {
      const base = type === "年休假" ? 8 : type === "事假" ? 5 : type === "病假" ? 4 : 2;
      const spread = type === "年休假" ? 12 : type === "产假" ? 10 : 6;
      byType[type] = Math.round(base + seededRandom(seed + idx * 97 + typeIdx * 23) * spread);
    });
    const total = LEAVE_TYPES.reduce((sum, type) => sum + byType[type], 0);
    return {
      name,
      total,
      selected: byType[selectedLeaveType] || 0,
      selectedType: selectedLeaveType,
    };
  });
}

/** Tab1：各单位请假对比图 */
export function getLeaveByUnitChartData(filter = {}, selectedLeaveType = DEFAULT_UNIT_LEAVE_TYPE) {
  const seed = filterSeed(filter) + (selectedLeaveType ? selectedLeaveType.length * 29 : 0);
  const rows = buildLeaveDaysByUnit(seed, selectedLeaveType);
  return {
    selectedLeaveType,
    categories: rows.map((r) => r.name),
    totalDays: rows.map((r) => r.total),
    typeDays: rows.map((r) => r.selected),
  };
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
