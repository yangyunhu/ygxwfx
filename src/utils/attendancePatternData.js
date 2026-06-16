/**
 * 出勤时间规律分析 — 模拟数据
 */
import {
  UNITS,
  DEPARTMENTS,
  UNIT_OPTIONS,
  DEPARTMENT_OPTIONS,
  getDefaultQuery,
} from "./attendanceStabilityData";

export { UNIT_OPTIONS, DEPARTMENT_OPTIONS, getDefaultQuery };

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

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const FIELD_DEPTS = new Set(["生产技术部", "系统运行部", "安全监管部", "基建部"]);

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatTime(h, m, s) {
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function buildEmployeeName(index) {
  const surname = SURNAMES[index % SURNAMES.length];
  const given = GIVEN_NAMES[Math.floor(index / SURNAMES.length) % GIVEN_NAMES.length];
  return surname + given;
}

function buildBaseRow(index) {
  return {
    id: index + 1,
    unit: UNITS[index % UNITS.length],
    department: DEPARTMENTS[Math.floor(index / UNITS.length) % DEPARTMENTS.length],
    name: buildEmployeeName(index),
  };
}

function filterSeed(filter = {}) {
  let seed = 0;
  if (filter.unit) seed += filter.unit.length * 7;
  if (filter.department) seed += filter.department.length * 13;
  return seed;
}

function buildAvgTimes(index, department) {
  const r1 = seededRandom(index + 2000);
  const r2 = seededRandom(index + 2100);
  const r3 = seededRandom(index + 2200);
  const r4 = seededRandom(index + 2300);

  const arrivalMinute = 35 + Math.floor(r1 * 30);
  const arrivalSecond = Math.floor(r2 * 60);
  const isField = FIELD_DEPTS.has(department);
  const leaveHour = isField ? 18 : 17;
  const leaveMinute = 30 + Math.floor(r3 * 35);
  const leaveSecond = Math.floor(r4 * 60);

  return {
    avgArrivalTime: formatTime(8, arrivalMinute, arrivalSecond),
    avgDepartureTime: formatTime(leaveHour, leaveMinute, leaveSecond),
  };
}

/** Tab1：出勤时间分布 */
export function generateTimeDistributionRows(count = 168) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const base = buildBaseRow(i);
    rows.push({
      ...base,
      ...buildAvgTimes(i, base.department),
    });
  }
  return rows;
}

function judgeResult(diff) {
  if (diff < -2) return "缺勤";
  if (diff > 15) return "过度加班";
  return "正常";
}

/** Tab3：应出勤与实际出勤对比 */
export function generateRequiredActualRows(count = 168) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const base = buildBaseRow(i);
    const r = seededRandom(i + 3000);
    const requiredHours = 40;
    let delta = 0;
    if (r >= 0.35 && r < 0.55) delta = 8 + Math.floor(seededRandom(i + 3010) * 8);
    else if (r >= 0.55 && r < 0.7) delta = -(1 + Math.floor(seededRandom(i + 3020) * 3));
    else if (r >= 0.7 && r < 0.82) delta = 18 + Math.floor(seededRandom(i + 3030) * 12);
    else if (r >= 0.82 && r < 0.92) delta = 2 + Math.floor(seededRandom(i + 3040) * 6);
    else if (r >= 0.92) delta = 10 + Math.floor(seededRandom(i + 3050) * 5);

    const actualHours = Number((requiredHours + delta).toFixed(1));
    const diff = Number((actualHours - requiredHours).toFixed(1));

    rows.push({
      ...base,
      requiredHours,
      actualHours,
      diff,
      judgment: judgeResult(diff),
    });
  }
  return rows;
}

/** Tab2：图表数据 */
export function getPatternChartData(filter = {}) {
  const seed = filterSeed(filter);
  const factor = filter.unit ? 0.92 : 1;

  const rateTrend = MONTH_LABELS.map((month, i) => {
    const base = 88 + Math.sin((i + seed) * 0.55) * 6 + seededRandom(i + 4000 + seed) * 4;
    return {
      month,
      rate: Number(Math.min(99.5, Math.max(82, base * factor)).toFixed(1)),
    };
  });

  const late = Math.max(4, Math.round(10 * factor * (0.85 + seededRandom(4100 + seed) * 0.3)));
  const early = Math.max(2, Math.round(5 * factor * (0.8 + seededRandom(4200 + seed) * 0.35)));
  const absent = Math.max(1, Math.round(2 * factor * (0.5 + seededRandom(4300 + seed) * 0.5)));
  const abnormalTotal = late + early + absent;
  const abnormal = [
    { name: "迟到", value: late, color: "#1890ff" },
    { name: "早退", value: early, color: "#69c0ff" },
    { name: "旷工", value: absent, color: "#52c41a" },
  ].map((item) => ({
    ...item,
    percent: Number(((item.value / abnormalTotal) * 100).toFixed(1)),
  }));

  const yearCompare = MONTH_LABELS.map((month, i) => {
    const v2024 = Math.round(95 + seededRandom(i + 5000 + seed) * 45);
    const v2025 = Math.round(92 + seededRandom(i + 5100 + seed) * 50);
    return { month, year2024: v2024, year2025: v2025 };
  });

  const distribution = MONTH_LABELS.map((month, i) => ({
    month,
    value: Math.round((185 - i * 8) * factor * (0.92 + seededRandom(i + 6000 + seed) * 0.12)),
  }));

  return { rateTrend, abnormal, abnormalTotal, yearCompare, distribution };
}
