/**
 * 各单位考勤数据对比 — 模拟数据
 */
import { UNIT_OPTIONS } from "./behaviorOverviewData";
import { formatProfessionalPath } from "./professionalClassification";
import {
  getLeaveByUnitChartData,
  DEFAULT_UNIT_LEAVE_TYPE,
  LEAVE_TYPE_FILTER_OPTIONS,
} from "./leaveBehaviorAnalysisData";

export { UNIT_OPTIONS };
export { LEAVE_TYPE_FILTER_OPTIONS, DEFAULT_UNIT_LEAVE_TYPE };

/** 图表1：出勤天数筛选类型 */
export const ATTENDANCE_DAY_TYPE_FILTER_OPTIONS = [
  { label: "全部类型", value: "all" },
  { label: "培训", value: "training" },
  { label: "出差", value: "businessTrip" },
  { label: "正常出勤", value: "normal" },
];

const UNIT_SHORT_NAMES = [
  "昆明", "曲靖", "玉溪", "保山", "昭通", "丽江", "普洱", "临沧",
  "楚雄", "红河", "文山", "西双版纳", "大理", "德宏", "怒江", "迪庆",
];

const DEPARTMENTS = [
  "安监部", "办公室", "政企业务部", "党建部", "变电管理部",
  "人力资源部", "市场营销部", "财务部", "A部", "B部",
];

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function filterSeed(query = {}) {
  let seed = 1;
  if (query.startDate) seed += query.startDate.length * 3;
  if (query.endDate) seed += query.endDate.length * 5;
  if (query.positionCategory) seed += query.positionCategory.length * 7;
  if (query.positionSequence) seed += query.positionSequence.length * 11;
  if (query.professionalPathKey) seed += query.professionalPathKey.length * 13;
  if (query.attendanceDayTypeFilter) seed += query.attendanceDayTypeFilter.length * 19;
  return seed;
}

/** 图表1：各单位出勤天数横向对比（培训 / 出差 / 正常出勤） */
function buildAttendanceDaysByUnit(seed, filterType = "all") {
  const typeSeed = filterType === "all" ? 0 : filterType.length * 23;
  return UNIT_SHORT_NAMES.map((name, idx) => {
    const r = seededRandom(seed + idx + 100 + typeSeed);
    const training = Math.round(3 + seededRandom(seed + idx + 110 + typeSeed) * 12);
    const businessTrip = Math.round(2 + seededRandom(seed + idx + 120 + typeSeed) * 10);
    const normal = Math.round(18 + r * 8);
    return { name, training, businessTrip, normal };
  });
}

/** 图表2：累计工时 & 培训工时（按专业分类路径） */
function buildWorkHoursByUnit(seed, professionalPath = []) {
  const pathKey = Array.isArray(professionalPath) ? professionalPath.join("/") : String(professionalPath || "");
  const typeSeed = pathKey ? pathKey.length * 17 + pathKey.split("/").length * 31 : 0;
  return UNIT_SHORT_NAMES.map((name, idx) => {
    const r = seededRandom(seed + idx + 300 + typeSeed);
    const workHours = Math.round(120 + r * 180);
    const trainingHours = Math.round(20 + seededRandom(seed + idx + 400 + typeSeed) * 80);
    return { name, workHours, trainingHours };
  });
}

/** 图表3：迟到早退 — 按单位 */
function buildLateEarlyByUnit(seed) {
  return UNIT_SHORT_NAMES.map((name, idx) => {
    const r = seededRandom(seed + idx + 500);
    const attendanceDays = Math.round(18 + r * 8);
    const lateCount = Math.round(1 + seededRandom(seed + idx + 600) * 6);
    const earlyCount = Math.round(seededRandom(seed + idx + 700) * 4);
    return { name, attendanceDays, lateCount, earlyCount };
  });
}

/** 图表3：迟到早退 — 按部门 */
function buildLateEarlyByDept(seed) {
  return DEPARTMENTS.map((name, idx) => {
    const r = seededRandom(seed + idx + 800);
    const attendanceDays = Math.round(15 + r * 10);
    const lateCount = Math.round(1 + seededRandom(seed + idx + 900) * 8);
    const earlyCount = Math.round(seededRandom(seed + idx + 1000) * 5);
    return { name, attendanceDays, lateCount, earlyCount };
  });
}

export function buildComparisonDashboard(queryParams = {}, options = {}) {
  const professionalPath = options.professionalPath || [];
  const pathKey = Array.isArray(professionalPath) ? professionalPath.join("/") : "";
  const seed = filterSeed({
    ...queryParams,
    attendanceDayTypeFilter: options.attendanceDayTypeFilter,
    professionalPathKey: pathKey,
  });
  const lateEarlyDimension = options.lateEarlyDimension || "department";
  const attendanceDayTypeFilter = options.attendanceDayTypeFilter || "all";
  const unitLeaveTypeFilter = options.unitLeaveTypeFilter || DEFAULT_UNIT_LEAVE_TYPE;

  const attendanceDays = buildAttendanceDaysByUnit(seed, attendanceDayTypeFilter);
  const workHours = buildWorkHoursByUnit(seed, professionalPath);
  const lateEarly = lateEarlyDimension === "unit"
    ? buildLateEarlyByUnit(seed)
    : buildLateEarlyByDept(seed);
  const leaveByUnit = getLeaveByUnitChartData(queryParams, unitLeaveTypeFilter);

  return {
    attendanceDays: {
      filterType: attendanceDayTypeFilter,
      categories: attendanceDays.map((d) => d.name),
      training: attendanceDays.map((d) => d.training),
      businessTrip: attendanceDays.map((d) => d.businessTrip),
      normal: attendanceDays.map((d) => d.normal),
    },
    workHours: {
      professionalPath: Array.isArray(professionalPath) ? [...professionalPath] : [],
      professionalPathText: formatProfessionalPath(professionalPath),
      categories: workHours.map((d) => d.name),
      workHours: workHours.map((d) => d.workHours),
      trainingHours: workHours.map((d) => d.trainingHours),
    },
    lateEarly: {
      dimension: lateEarlyDimension,
      categories: lateEarly.map((d) => d.name),
      attendanceDays: lateEarly.map((d) => d.attendanceDays),
      lateCount: lateEarly.map((d) => d.lateCount),
      earlyCount: lateEarly.map((d) => d.earlyCount),
    },
    leaveByUnit: {
      selectedLeaveType: leaveByUnit.selectedLeaveType,
      categories: leaveByUnit.categories,
      totalDays: leaveByUnit.totalDays,
      typeDays: leaveByUnit.typeDays,
    },
  };
}

export const DEFAULT_COMPARISON_QUERY = {
  startDate: "",
  endDate: "",
  positionCategory: "",
  positionSequence: "",
};

export function getExportRows(snapshot) {
  const rows = [];
  const filterLabel = ATTENDANCE_DAY_TYPE_FILTER_OPTIONS.find(
    (o) => o.value === snapshot.attendanceDays.filterType
  )?.label || "全部类型";
  snapshot.attendanceDays.categories.forEach((unit, i) => {
    rows.push([
      "各单位出勤天数横向对比", unit,
      snapshot.attendanceDays.training[i],
      snapshot.attendanceDays.businessTrip[i],
      snapshot.attendanceDays.normal[i],
      filterLabel,
    ]);
  });
  snapshot.workHours.categories.forEach((unit, i) => {
    rows.push([
      "累计工时与培训工时", unit,
      snapshot.workHours.workHours[i],
      snapshot.workHours.trainingHours[i],
      snapshot.workHours.professionalPathText, "",
    ]);
  });
  const dimLabel = snapshot.lateEarly.dimension === "unit" ? "按单位" : "按部门";
  snapshot.lateEarly.categories.forEach((name, i) => {
    rows.push([
      `部门迟到早退(${dimLabel})`, name,
      snapshot.lateEarly.attendanceDays[i],
      snapshot.lateEarly.lateCount[i],
      snapshot.lateEarly.earlyCount[i], "",
    ]);
  });
  snapshot.leaveByUnit.categories.forEach((unit, i) => {
    rows.push([
      "各单位请假情况", unit,
      snapshot.leaveByUnit.totalDays[i],
      snapshot.leaveByUnit.typeDays[i],
      snapshot.leaveByUnit.selectedLeaveType, "",
    ]);
  });
  return rows;
}
