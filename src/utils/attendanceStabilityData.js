/**
 * 出勤稳定性分析 — 模拟数据（云南电网供电局场景）
 */

export const UNITS = [
  "昆明供电局",
  "曲靖供电局",
  "玉溪供电局",
  "红河供电局",
  "大理供电局",
  "楚雄供电局",
  "昭通供电局",
  "丽江供电局",
];

export const DEPARTMENTS = [
  "人力资源部",
  "数字化部",
  "市场营销部",
  "生产技术部",
  "系统运行部",
  "安全监管部",
  "计划与财务部",
  "基建部",
];

export const UNIT_OPTIONS = [
  { label: "全部单位", value: "" },
  ...UNITS.map((u) => ({ label: u, value: u })),
];

export const DEPARTMENT_OPTIONS = [
  { label: "全部部门", value: "" },
  ...DEPARTMENTS.map((d) => ({ label: d, value: d })),
];

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

/** 生产运行类部门加班相对更多 */
const OVERTIME_HEAVY_DEPTS = new Set(["生产技术部", "系统运行部", "安全监管部", "基建部"]);

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function buildEmployeeName(index) {
  const surname = SURNAMES[index % SURNAMES.length];
  const given = GIVEN_NAMES[Math.floor(index / SURNAMES.length) % GIVEN_NAMES.length];
  return surname + given;
}

/** 按月应出勤 22 个工作日推算，保证出勤率与天数一致 */
function buildAttendanceMetrics(index, department) {
  const r = seededRandom(index + 1);
  const shouldDays = 22;

  let absentDays = 0;
  if (r >= 0.52 && r < 0.72) absentDays = 1;
  else if (r >= 0.72 && r < 0.86) absentDays = 2;
  else if (r >= 0.86 && r < 0.94) absentDays = 3;
  else if (r >= 0.94) absentDays = 4;

  const actualDays = shouldDays - absentDays;
  const attendanceRate = Math.round((actualDays / shouldDays) * 100);

  let overtimeDays = 0;
  const otRand = seededRandom(index + 100);
  if (OVERTIME_HEAVY_DEPTS.has(department)) {
    if (otRand >= 0.35) overtimeDays = 1;
    if (otRand >= 0.55) overtimeDays = 2;
    if (otRand >= 0.72) overtimeDays = 3;
    if (otRand >= 0.88) overtimeDays = 4;
    if (otRand >= 0.96) overtimeDays = 5;
  } else if (otRand >= 0.6) {
    overtimeDays = 1;
  } else if (otRand >= 0.82) {
    overtimeDays = 2;
  }

  return { actualDays, absentDays, attendanceRate, overtimeDays };
}

function buildBaseEmployeeRow(index) {
  return {
    id: index + 1,
    unit: UNITS[index % UNITS.length],
    department: DEPARTMENTS[Math.floor(index / UNITS.length) % DEPARTMENTS.length],
    name: buildEmployeeName(index),
  };
}

function buildLateEarlyMetrics(index) {
  const lateRand = seededRandom(index + 300);
  const earlyRand = seededRandom(index + 400);

  let lateCount = 0;
  if (lateRand >= 0.42) lateCount = 1;
  if (lateRand >= 0.58) lateCount = 2;
  if (lateRand >= 0.72) lateCount = 3;
  if (lateRand >= 0.84) lateCount = 4;
  if (lateRand >= 0.94) lateCount = 5;

  let earlyCount = 0;
  if (earlyRand >= 0.5) earlyCount = 1;
  if (earlyRand >= 0.66) earlyCount = 2;
  if (earlyRand >= 0.8) earlyCount = 3;
  if (earlyRand >= 0.91) earlyCount = 4;

  return { lateCount, earlyCount };
}

function formatClock(hour, minute) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** 生成迟到打卡时间列表（多次以顿号分隔） */
function buildLateTimes(index, count) {
  if (!count) return "—";
  const times = [];
  for (let i = 0; i < count; i += 1) {
    const hour = 8 + Math.floor(seededRandom(index + 700 + i * 3) * 2);
    const minute = 5 + Math.floor(seededRandom(index + 800 + i * 5) * 55);
    times.push(formatClock(hour, minute));
  }
  return times.join("、");
}

/** 生成早退打卡时间列表（多次以顿号分隔） */
function buildEarlyTimes(index, count) {
  if (!count) return "—";
  const times = [];
  for (let i = 0; i < count; i += 1) {
    const hour = 16 + Math.floor(seededRandom(index + 900 + i * 3) * 2);
    const minute = 5 + Math.floor(seededRandom(index + 1000 + i * 5) * 55);
    times.push(formatClock(hour, minute));
  }
  return times.join("、");
}

export function generateMonthlyAttendanceRows(count = 168) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const base = buildBaseEmployeeRow(i);
    const department = base.department;
    rows.push({
      ...base,
      ...buildAttendanceMetrics(i, department),
    });
  }
  return rows;
}

export function generateLateEarlyRows(count = 168) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const metrics = buildLateEarlyMetrics(i);
    rows.push({
      ...buildBaseEmployeeRow(i),
      ...metrics,
      lateTimes: buildLateTimes(i, metrics.lateCount),
      earlyTimes: buildEarlyTimes(i, metrics.earlyCount),
    });
  }
  return rows;
}

export const ABSENCE_REASON_ITEMS = [
  { reason: "外出培训", color: "#722ed1", weight: 15 },
  { reason: "病假", color: "#1890ff", weight: 13 },
  { reason: "事假", color: "#13c2c2", weight: 11 },
  { reason: "年假", color: "#52c41a", weight: 10 },
  { reason: "因公出差", color: "#a0d911", weight: 9 },
  { reason: "出国", color: "#faad14", weight: 8 },
  { reason: "挂职", color: "#fa8c16", weight: 5 },
  { reason: "其他", color: "#eb2f96", weight: 5 },
];

/** 按筛选条件生成缺勤原因汇总（占比合计 100%） */
export function generateAbsenceReasonStats(filter = {}) {
  const { unit, department } = filter;
  let factor = 1;
  if (unit) factor *= 0.38;
  if (department) factor *= 0.28;

  const items = ABSENCE_REASON_ITEMS.map((item, i) => ({
    reason: item.reason,
    color: item.color,
    count: Math.max(
      1,
      Math.round(item.weight * factor * (0.88 + seededRandom(i + 500 + (unit ? 11 : 0) + (department ? 23 : 0)) * 0.24))
    ),
  }));

  const total = items.reduce((sum, item) => sum + item.count, 0);
  let ratioSum = 0;
  return items.map((item, index) => {
    let ratio;
    if (index === items.length - 1) {
      ratio = Number((100 - ratioSum).toFixed(2));
    } else {
      ratio = Number(((item.count / total) * 100).toFixed(2));
      ratioSum += ratio;
    }
    return { ...item, ratio };
  });
}

export function getDefaultDateRange() {
  return ["2025-01-01", "2025-12-31"];
}

export function getDefaultQuery() {
  return {
    unit: "",
    department: "",
    dateRange: getDefaultDateRange(),
  };
}
