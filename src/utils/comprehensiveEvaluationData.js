/**
 * 员工行为画像综合评估 — 模拟数据
 */
import {
  UNITS,
  DEPARTMENTS,
  UNIT_OPTIONS,
  DEPARTMENT_OPTIONS,
} from "./attendanceStabilityData";

export { UNIT_OPTIONS, DEPARTMENT_OPTIONS };

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const SURNAMES = [
  "张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴",
  "徐", "孙", "马", "朱", "胡", "郭", "何", "林", "罗", "高",
];

const GIVEN_NAMES = [
  "伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "勇", "艳",
  "杰", "涛", "明", "华", "丽", "超", "娟", "军", "琳", "斌",
];

const TITLES = [
  "高级作业员", "中级作业员", "初级作业员", "班组长", "技术员",
  "工程师", "专责", "主管", "副主任", "主任助理",
];

const FIELD_DEPTS = new Set(["生产技术部", "系统运行部", "安全监管部", "基建部"]);

const LEAVE_TYPE_COLORS = {
  事假: "#1890FF",
  年休假: "#52C41A",
  病假: "#13C2C2",
};

const ATTENDANCE_TYPE_COLORS = {
  正常出勤: "#1890FF",
  请假: "#52C41A",
  迟到: "#FAAD14",
  早退: "#FF7875",
};

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}

function buildEmployeeName(index) {
  const surname = SURNAMES[index % SURNAMES.length];
  const given = GIVEN_NAMES[Math.floor(index / SURNAMES.length) % GIVEN_NAMES.length];
  return surname + given;
}

function pickGender(index) {
  return seededRandom(index + 700) > 0.45 ? "男" : "女";
}

function pickAge(index) {
  return 26 + Math.floor(seededRandom(index + 710) * 22);
}

function pickTitle(index, department) {
  if (FIELD_DEPTS.has(department)) {
    const idx = Math.floor(seededRandom(index + 720) * 4);
    return ["高级作业员", "中级作业员", "班组长", "技术员"][idx];
  }
  const idx = Math.floor(seededRandom(index + 730) * TITLES.length);
  return TITLES[idx];
}

function employeeSeed(employee) {
  return hashStr(`${employee.unit}-${employee.department}-${employee.name}`);
}

/** 员工名册 */
export function buildEmployeeRoster(count = 64) {
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const unit = UNITS[i % UNITS.length];
    const department = DEPARTMENTS[Math.floor(i / UNITS.length) % DEPARTMENTS.length];
    const name = buildEmployeeName(i);
    rows.push({
      id: i + 1,
      unit,
      department,
      name,
      gender: pickGender(i),
      age: pickAge(i),
      title: pickTitle(i, department),
    });
  }
  return rows;
}

export function getDefaultQuery() {
  return { unit: "", department: "", name: "" };
}

export function filterEmployees(roster, query = {}) {
  return roster.filter((row) => {
    if (query.unit && row.unit !== query.unit) return false;
    if (query.department && row.department !== query.department) return false;
    if (query.name && !row.name.includes(query.name)) return false;
    return true;
  });
}

export function resolveEmployee(roster, query = {}) {
  const list = filterEmployees(roster, query);
  return list[0] || roster[0] || null;
}

function buildStabilityMetrics(seed) {
  const attendanceRate = Number((94 + seededRandom(seed + 1) * 6).toFixed(1));
  const lateCount = Math.floor(seededRandom(seed + 2) * 8);
  const earlyCount = Math.floor(seededRandom(seed + 3) * 6);
  const lateRate = Number((lateCount / 220 * 100).toFixed(1));
  const earlyRate = Number((earlyCount / 220 * 100).toFixed(1));
  const absenceFreq = Number((seededRandom(seed + 4) * 4).toFixed(1));

  return {
    attendanceRate,
    lateCount,
    earlyCount,
    lateRate,
    earlyRate,
    absenceFreq,
  };
}

function buildLeaveDistribution(seed) {
  const personal = 4 + Math.floor(seededRandom(seed + 10) * 8);
  const annual = 2 + Math.floor(seededRandom(seed + 11) * 5);
  const sick = 1 + Math.floor(seededRandom(seed + 12) * 3);
  const total = personal + annual + sick;
  return [
    { name: "事假", value: personal, percent: Math.round((personal / total) * 100), color: LEAVE_TYPE_COLORS.事假 },
    { name: "年休假", value: annual, percent: Math.round((annual / total) * 100), color: LEAVE_TYPE_COLORS.年休假 },
    { name: "病假", value: sick, percent: Math.round((sick / total) * 100), color: LEAVE_TYPE_COLORS.病假 },
  ];
}

function buildTimePattern(seed, stability, department) {
  const isField = FIELD_DEPTS.has(department);
  const overtimeHours = Number(
    ((isField ? 48 : 24) + seededRandom(seed + 20) * (isField ? 40 : 20)).toFixed(1)
  );
  return {
    attendanceRate: stability.attendanceRate,
    lateCount: stability.lateCount,
    earlyCount: stability.earlyCount,
    overtimeHours,
  };
}

function buildOverallGrade(stability) {
  if (stability.attendanceRate >= 98 && stability.lateCount <= 2 && stability.earlyCount <= 2) {
    return { grade: "优秀", score: 92 + Math.floor(seededRandom(stability.attendanceRate) * 8), color: "#52C41A" };
  }
  if (stability.attendanceRate >= 95 && stability.lateCount <= 5) {
    return { grade: "良好", score: 80 + Math.floor(seededRandom(stability.attendanceRate + 1) * 10), color: "#1890FF" };
  }
  if (stability.attendanceRate >= 90) {
    return { grade: "合格", score: 70 + Math.floor(seededRandom(stability.attendanceRate + 2) * 8), color: "#FAAD14" };
  }
  return { grade: "待改进", score: 55 + Math.floor(seededRandom(stability.attendanceRate + 3) * 12), color: "#FF7875" };
}

/** Tab1：行为画像报告 */
export function getBehaviorReport(employee) {
  if (!employee) return null;
  const seed = employeeSeed(employee);
  const stability = buildStabilityMetrics(seed);
  const leaveTypes = buildLeaveDistribution(seed);
  const timePattern = buildTimePattern(seed, stability, employee.department);
  const overall = buildOverallGrade(stability);

  return {
    employee,
    stability,
    leaveTypes,
    timePattern,
    overall,
    summary: buildReportSummary(employee, stability, overall),
  };
}

function buildReportSummary(employee, stability, overall) {
  const deptHint = FIELD_DEPTS.has(employee.department) ? "现场作业" : "职能管理";
  return `${employee.name}（${employee.title}）本年度出勤表现${overall.grade}，出勤率 ${stability.attendanceRate}%。`
    + `作为${deptHint}岗位，迟到 ${stability.lateCount} 次、早退 ${stability.earlyCount} 次，`
    + `综合得分 ${overall.score} 分，建议结合培训页签制定针对性提升计划。`;
}

/** Tab2：可视化图表数据 */
export function getVisualizationData(employee) {
  if (!employee) return null;
  const seed = employeeSeed(employee);
  const stability = buildStabilityMetrics(seed);
  const isField = FIELD_DEPTS.has(employee.department);

  const attendanceStatus = MONTH_LABELS.map((month, idx) => {
    const base = 20 + Math.floor(seededRandom(seed + idx + 100) * 3);
    const late = Math.floor(seededRandom(seed + idx + 200) * 4);
    const early = Math.floor(seededRandom(seed + idx + 300) * 3);
    return { month, attendanceDays: base, lateCount: late, earlyCount: early };
  });

  const timeTrend = MONTH_LABELS.map((month, idx) => {
    const arrival = Number((8.3 + seededRandom(seed + idx + 400) * 0.5).toFixed(1));
    const departure = Number((17.5 + seededRandom(seed + idx + 500) * (isField ? 2.5 : 1.2)).toFixed(1));
    const workHours = Number((departure - arrival - 1).toFixed(1));
    return { month, arrivalHour: arrival, departureHour: departure, workHours: Math.max(6, workHours) };
  });

  const normal = 180 + Math.floor(seededRandom(seed + 600) * 30);
  const leave = 8 + Math.floor(seededRandom(seed + 601) * 10);
  const late = stability.lateCount + Math.floor(seededRandom(seed + 602) * 3);
  const early = stability.earlyCount + Math.floor(seededRandom(seed + 603) * 2);
  const typeTotal = normal + leave + late + early;
  const attendanceTypes = [
    { name: "正常出勤", value: normal, percent: Math.round((normal / typeTotal) * 100), color: ATTENDANCE_TYPE_COLORS.正常出勤 },
    { name: "请假", value: leave, percent: Math.round((leave / typeTotal) * 100), color: ATTENDANCE_TYPE_COLORS.请假 },
    { name: "迟到", value: late, percent: Math.round((late / typeTotal) * 100), color: ATTENDANCE_TYPE_COLORS.迟到 },
    { name: "早退", value: early, percent: Math.round((early / typeTotal) * 100), color: ATTENDANCE_TYPE_COLORS.早退 },
  ];

  const overtimeHours = buildTimePattern(seed, stability, employee.department).overtimeHours;
  const saturation = Number((72 + seededRandom(seed + 700) * 22).toFixed(0));

  const radar = {
    indicators: [
      { name: "出勤率", max: 100 },
      { name: "加班时长", max: 100 },
      { name: "工作饱和度", max: 100 },
    ],
    values: [
      stability.attendanceRate,
      Math.min(100, Math.round((overtimeHours / 80) * 100)),
      saturation,
    ],
  };

  return { attendanceStatus, timeTrend, attendanceTypes, radar };
}

/** Tab3：培训与辅导建议 */
export function getTrainingAdvice(employee) {
  if (!employee) return null;
  const seed = employeeSeed(employee);
  const isField = FIELD_DEPTS.has(employee.department);
  const stability = buildStabilityMetrics(seed);

  const learningPath = isField
    ? ["初级线路运维知识", "技能操作规范", "安全规程考核", "现场应急处置"]
    : ["业务流程基础", "数字化办公技能", "沟通协作能力", "项目管理入门"];

  const recommendedCourses = isField
    ? ["《线路运维知识》", "《安全规程手册》", "《现场作业标准化》"]
    : ["《办公软件进阶》", "《数据分析基础》", "《团队协作与沟通》"];

  const careerPath = isField
    ? ["初级线路运维工", "中级线路运维工", "高级线路运维工", "班组长"]
    : ["业务专员", "业务主管", "部门副主任", "部门主任"];

  const coachingItems = [];
  if (stability.lateCount >= 4) {
    coachingItems.push({
      type: "warning",
      title: "到岗时间管理",
      content: "近一年迟到次数偏多，建议调整通勤路线或启用弹性打卡提醒，目标将迟到率控制在 1% 以内。",
    });
  }
  if (stability.earlyCount >= 3) {
    coachingItems.push({
      type: "warning",
      title: "离岗规范",
      content: "存在早退记录，建议加强班次交接管理，确保工作交接完成后再离岗。",
    });
  }
  if (stability.attendanceRate >= 98) {
    coachingItems.push({
      type: "success",
      title: "出勤表现突出",
      content: "出勤率稳定在高水平，可作为班组出勤标杆，参与新员工带教。",
    });
  }
  coachingItems.push({
    type: "info",
    title: "职业发展",
    content: `结合${employee.title}岗位，建议沿「${careerPath.slice(0, 3).join(" → ")}」路径规划晋升，`
      + `优先完成 ${recommendedCourses[0]} 学习。`,
  });

  return {
    learningPath,
    recommendedCourses,
    careerPath,
    coachingItems,
    trainingPlan: `本季度重点：${learningPath[1]}、${learningPath[2]}；`
      + `推荐课程 ${recommendedCourses.join("、")}。`,
    developmentAdvice: `中长期目标：${careerPath[careerPath.length - 2]} → ${careerPath[careerPath.length - 1]}，`
      + `同步提升${isField ? "现场安全与标准化作业" : "业务统筹与数字化能力"}。`,
  };
}

export const STABILITY_KPI_META = [
  { key: "attendanceRate", label: "出勤率", suffix: "%", color: "#1890FF" },
  { key: "lateCount", label: "迟到次数", suffix: "次", color: "#FAAD14" },
  { key: "earlyCount", label: "早退次数", suffix: "次", color: "#52C41A" },
  { key: "lateRate", label: "迟到率", suffix: "%", color: "#722ED1" },
  { key: "earlyRate", label: "早退率", suffix: "%", color: "#13C2C2" },
  { key: "absenceFreq", label: "缺勤频率", suffix: "%", color: "#FF7875" },
];

export const TIME_PATTERN_ROWS = [
  { key: "attendanceRate", label: "出勤率", suffix: "%" },
  { key: "lateCount", label: "迟到次数", suffix: "次" },
  { key: "earlyCount", label: "早退次数", suffix: "次" },
  { key: "overtimeHours", label: "加班时长", suffix: "小时" },
];
