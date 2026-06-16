/**
 * 员工行为总览 — 模拟数据与查询联动聚合
 */

export const UNIT_OPTIONS = [
  { label: "全部单位", value: "all" },
  { label: "昆明供电局", value: "kunming" },
  { label: "曲靖供电局", value: "qujing" },
  { label: "玉溪供电局", value: "yuxi" },
  { label: "保山供电局", value: "baoshan" },
  { label: "昭通供电局", value: "zhaotong" },
  { label: "丽江供电局", value: "lijiang" },
  { label: "普洱供电局", value: "puer" },
  { label: "临沧供电局", value: "lincang" },
  { label: "楚雄供电局", value: "chuxiong" },
  { label: "红河供电局", value: "honghe" },
  { label: "文山供电局", value: "wenshan" },
  { label: "西双版纳供电局", value: "xishuangbanna" },
  { label: "大理供电局", value: "dali" },
  { label: "德宏供电局", value: "dehong" },
  { label: "怒江供电局", value: "nujiang" },
  { label: "迪庆供电局", value: "diqing" },
];

const UNIT_META = UNIT_OPTIONS.filter((u) => u.value !== "all").map((u) => ({
  key: u.value,
  name: u.label.replace("供电局", ""),
  fullName: u.label,
}));

const DEPARTMENTS = ["安监部", "财务部", "人力资源部", "市场营销部", "生产技术部", "数字化部"];

/** 极值分析 — 考勤类别（不含正常出勤/出勤） */
export const EXTREME_ATTENDANCE_CATEGORIES = [
  { key: "training", label: "培训", color: "#722ED1" },
  { key: "businessTrip", label: "出差", color: "#FA8C16" },
  { key: "late", label: "迟到", color: "#FAAD14" },
  { key: "early", label: "早退", color: "#FF7875" },
  { key: "absent", label: "旷工", color: "#F5222D" },
  { key: "overtime", label: "加班", color: "#13C2C2" },
  { key: "leave", label: "请假", color: "#1890FF" },
  { key: "evidenceConflict", label: "在岗证据冲突", color: "#EB2F96" },
  { key: "evidenceLack", label: "在岗证据不足", color: "#8C8C8C" },
];

export const EXTREME_CATEGORY_FILTER_OPTIONS = [
  { label: "全部类别", value: "all" },
  ...EXTREME_ATTENDANCE_CATEGORIES.map((c) => ({ label: c.label, value: c.key })),
];

const UNIT_BASE = {
  should: [3000, 2800, 2500, 2600, 1500, 1800, 2200, 2000, 2400, 2700, 2300, 2100, 2800, 2500, 2200, 2000],
  actual: [2800, 2600, 2300, 2400, 1400, 1700, 2100, 1900, 2300, 2600, 2200, 2000, 2700, 2400, 2100, 1900],
  rate: [93, 93, 92, 92, 93, 94, 95, 95, 96, 96, 96, 95, 96, 96, 95, 95],
  onTimeRate: [90, 90, 90, 90, 89, 86, 87, 87, 88, 93, 90, 94, 89, 90, 90, 89],
  lateRate: [2, 2, 1, 6, 8, 4, 4, 5, 1, 4, 5, 2, 6, 5, 5, 5],
  earlyRate: [2, 2, 2, 3, 1, 3, 2, 2, 5, 0, 0, 1, 0, 0, 0, 0],
  lateCount: [2, 6, 10, 7, 8, 9, 13, 10, 6, 4, 5, 9, 14, 15, 14, 11],
  earlyCount: [1, 0, 0, 3, 0, 0, 0, 4, 0, 3, 1, 3, 0, 0, 0, 0],
  leavePersonal: [3, 2, 1, 1, 3, 2, 4, 2, 2, 3, 1, 2, 1, 1, 1, 1],
  leaveSick: [12, 10, 15, 8, 18, 15, 20, 12, 10, 15, 12, 10, 15, 12, 10, 8],
  leaveAnnual: [25, 20, 18, 12, 22, 32, 8, 18, 16, 10, 15, 16, 12, 7, 7, 6],
  leaveHours: [10.5, 9.8, 11.2, 8.6, 12.1, 14.3, 7.5, 9.1, 10.0, 11.5, 9.3, 8.8, 10.2, 9.0, 8.5, 7.9],
  noRecord: [12, 10, 9, 11, 6, 7, 8, 7, 9, 10, 8, 7, 10, 9, 8, 7],
};

function scaleNum(n, factor) {
  return Math.round(n * factor);
}

function scaleRate(n, factor) {
  const delta = (factor - 1) * 2;
  return Math.min(100, Math.max(80, Math.round((n + delta) * 10) / 10));
}

/** 迟到/早退等低占比率 — 不做 80% 下限钳制 */
function scaleLowRate(n, factor) {
  const delta = (factor - 1) * 0.3;
  return Math.min(20, Math.max(0, Math.round((n + delta) * 10) / 10));
}

function getDateFactor(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return Math.min(1.2, Math.max(0.15, days / 30));
}

function buildCategoryCounts(row, idx, factor) {
  return {
    training: scaleNum(4 + (idx % 7), factor),
    businessTrip: scaleNum(2 + (idx % 5), factor),
    late: row.lateCount || 0,
    early: row.earlyCount || 0,
    absent: scaleNum(1 + (idx % 3), factor),
    overtime: scaleNum(6 + (idx % 9), factor),
    leave: (row.leavePersonal || 0) + (row.leaveSick || 0) + (row.leaveAnnual || 0),
    evidenceConflict: scaleNum(idx % 3, factor),
    evidenceLack: scaleNum((idx + 1) % 2, factor),
  };
}

function buildExtremeAttendanceAnalysis(rows) {
  return EXTREME_ATTENDANCE_CATEGORIES.map((cat) => {
    const values = rows.map((r) => (r.categoryCounts && r.categoryCounts[cat.key]) || 0);
    const max = values.length ? Math.max(...values) : 0;
    const min = values.length ? Math.min(...values) : 0;
    const avg = values.length
      ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
      : 0;
    const maxIdx = values.indexOf(max);
    const minIdx = values.indexOf(min);
    return {
      ...cat,
      max,
      min,
      avg,
      maxOrg: rows[maxIdx]?.name || "—",
      minOrg: rows[minIdx]?.name || "—",
      orgValues: rows.map((r, i) => ({
        name: r.name,
        fullName: r.fullName || r.name,
        value: values[i],
      })),
    };
  });
}

function pickUnits(unitFilter) {
  if (unitFilter === "all") return UNIT_META;
  return UNIT_META.filter((u) => u.key === unitFilter);
}

function buildUnitRows(units, factor) {
  return units.map((u, idx) => {
    const uIdx = UNIT_META.findIndex((m) => m.key === u.key);
    const row = {
      key: u.key,
      name: u.name,
      fullName: u.fullName,
      should: scaleNum(UNIT_BASE.should[uIdx], factor),
      actual: scaleNum(UNIT_BASE.actual[uIdx], factor),
      rate: scaleRate(UNIT_BASE.rate[uIdx], factor),
      onTimeRate: scaleRate(UNIT_BASE.onTimeRate[uIdx], factor),
      lateRate: scaleLowRate(UNIT_BASE.lateRate[uIdx], factor),
      earlyRate: scaleLowRate(UNIT_BASE.earlyRate[uIdx], factor),
      lateCount: scaleNum(UNIT_BASE.lateCount[uIdx], factor),
      earlyCount: scaleNum(UNIT_BASE.earlyCount[uIdx], factor),
      leavePersonal: scaleNum(UNIT_BASE.leavePersonal[uIdx], factor),
      leaveSick: scaleNum(UNIT_BASE.leaveSick[uIdx], factor),
      leaveAnnual: scaleNum(UNIT_BASE.leaveAnnual[uIdx], factor),
      leaveHours: Math.round(UNIT_BASE.leaveHours[uIdx] * factor * 10) / 10,
      noRecordCount: scaleNum(UNIT_BASE.noRecord[uIdx], factor),
    };
    return { ...row, categoryCounts: buildCategoryCounts(row, uIdx, factor) };
  });
}

function buildDepartmentRows(unitFilter, factor) {
  if (unitFilter === "all") {
    return DEPARTMENTS.map((dept, dIdx) => {
      let should = 0;
      let actual = 0;
      let onTimeSum = 0;
      let lateSum = 0;
      let earlySum = 0;
      let lateCount = 0;
      let earlyCount = 0;
      let leavePersonal = 0;
      let leaveSick = 0;
      let leaveAnnual = 0;
      let leaveHours = 0;
      let noRecordCount = 0;
      UNIT_META.forEach((u, uIdx) => {
        const seed = (uIdx + 1) * (dIdx + 3);
        const unitScale = UNIT_BASE.should[uIdx] / 3000;
        const rowShould = scaleNum(180 + seed * 12, factor * unitScale);
        const rowActual = scaleNum(rowShould * (0.92 + (seed % 5) * 0.015), 1);
        should += rowShould;
        actual += rowActual;
        onTimeSum += scaleRate(88 + (seed % 6), factor);
        lateSum += scaleLowRate(2 + (seed % 3), factor);
        earlySum += scaleLowRate(1 + (seed % 2), factor);
        lateCount += scaleNum(1 + (seed % 8), factor);
        earlyCount += scaleNum(seed % 4, factor);
        leavePersonal += scaleNum(1 + (seed % 3), factor);
        leaveSick += scaleNum(2 + (seed % 5), factor);
        leaveAnnual += scaleNum(3 + (seed % 6), factor);
        leaveHours += Math.round((4 + (seed % 6)) * factor * 10) / 10;
        noRecordCount += scaleNum(2 + (seed % 4), factor);
      });
      const count = UNIT_META.length;
      const row = {
        key: `dept-${dIdx}`,
        name: dept,
        fullName: dept,
        should,
        actual,
        rate: should ? scaleRate((actual / should) * 100, factor) : 0,
        onTimeRate: Math.round((onTimeSum / count) * 10) / 10,
        lateRate: Math.round((lateSum / count) * 10) / 10,
        earlyRate: Math.round((earlySum / count) * 10) / 10,
        lateCount,
        earlyCount,
        leavePersonal,
        leaveSick,
        leaveAnnual,
        leaveHours: Math.round(leaveHours * 10) / 10,
        noRecordCount,
      };
      return { ...row, categoryCounts: buildCategoryCounts(row, dIdx, factor) };
    });
  }

  const units = pickUnits(unitFilter);
  const rows = [];
  units.forEach((u) => {
    const uIdx = UNIT_META.findIndex((m) => m.key === u.key);
    const unitScale = UNIT_BASE.should[uIdx] / 3000;
    DEPARTMENTS.forEach((dept, dIdx) => {
      const seed = (uIdx + 1) * (dIdx + 3);
      const should = scaleNum(180 + seed * 12, factor * unitScale);
      const actual = scaleNum(should * (0.92 + (seed % 5) * 0.015), 1);
      const row = {
        key: `${u.key}-${dIdx}`,
        name: dept,
        fullName: `${u.fullName}/${dept}`,
        should,
        actual,
        rate: scaleRate(90 + (seed % 8), factor),
        onTimeRate: scaleRate(88 + (seed % 6), factor),
        lateRate: scaleLowRate(2 + (seed % 3), factor),
        earlyRate: scaleLowRate(1 + (seed % 2), factor),
        lateCount: scaleNum(1 + (seed % 8), factor),
        earlyCount: scaleNum(seed % 4, factor),
        leavePersonal: scaleNum(1 + (seed % 3), factor),
        leaveSick: scaleNum(2 + (seed % 5), factor),
        leaveAnnual: scaleNum(3 + (seed % 6), factor),
        leaveHours: Math.round((4 + (seed % 6)) * factor * 10) / 10,
        noRecordCount: scaleNum(2 + (seed % 4), factor),
      };
      rows.push({ ...row, categoryCounts: buildCategoryCounts(row, seed, factor) });
    });
  });
  return rows;
}

function sumField(rows, field) {
  return rows.reduce((s, r) => s + (r[field] || 0), 0);
}

function buildStats(rows) {
  const totalShould = sumField(rows, "should");
  const totalActual = sumField(rows, "actual");
  const rate = totalShould ? ((totalActual / totalShould) * 100).toFixed(1) : "0.0";
  return {
    totalShouldAttendance: totalShould,
    actualAttendance: totalActual,
    overallRate: `${rate}%`,
    noAttendancePersonnel: sumField(rows, "noRecordCount"),
  };
}

function buildLeavePie(rows) {
  return [
    { name: "事假", value: sumField(rows, "leavePersonal") },
    { name: "病假", value: sumField(rows, "leaveSick") },
    { name: "年休假", value: sumField(rows, "leaveAnnual") },
  ];
}

const ANNUAL_LEAVE_MONTHLY_BASE = {
  2023: [12, 14, 10, 11, 9, 10, 12, 11, 10, 9, 8, 10],
  2024: [18, 28, 15, 32, 20, 16, 22, 38, 18, 14, 12, 16],
  2025: [24, 52, 28, 30, 35, 40, 45, 68, 42, 38, 30, 28],
};

export const ANNUAL_LEAVE_YEAR_COLORS = {
  2023: "#1890FF",
  2024: "#FA8C16",
  2025: "#FAAD14",
};

const ANNUAL_LEAVE_YEARS = [2023, 2024, 2025];

function unitSeed(unit) {
  if (!unit || unit === "all") return 0;
  let h = 0;
  for (let i = 0; i < unit.length; i += 1) {
    h = (h * 31 + unit.charCodeAt(i)) >>> 0;
  }
  return h;
}

function filterLeaveMonthsByRange(startDate, endDate) {
  const all = Array.from({ length: 12 }, (_, i) => i);
  if (!startDate || !endDate) return all;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return all;
  const refYear = end.getFullYear() || 2025;
  return all.filter((i) => {
    const mid = new Date(`${refYear}-${String(i + 1).padStart(2, "0")}-15`);
    return mid >= start && mid <= end;
  });
}

/** 年休假请假分布时段 — 按年度折线 + 透视表 */
export function buildAnnualLeaveDistribution(leaveQueryParams = {}) {
  const { startDate, endDate, unit = "all" } = leaveQueryParams;
  const factor = getDateFactor(startDate, endDate);
  const monthIndices = filterLeaveMonthsByRange(startDate, endDate);
  const categories = monthIndices.map((i) => `${i + 1}月`);
  const unitBias = unit === "all" ? 0 : (unitSeed(unit) % 7) - 3;
  const unitScale = unit === "all" ? 1 : 0.82 + (unitSeed(unit) % 12) / 100;

  const series = ANNUAL_LEAVE_YEARS.map((year) => {
    const base = ANNUAL_LEAVE_MONTHLY_BASE[year] || ANNUAL_LEAVE_MONTHLY_BASE[2025];
    const data = monthIndices.map((i) =>
      Math.max(0, scaleNum(base[i] + unitBias, factor * unitScale))
    );
    return {
      year,
      label: `${year}年`,
      color: ANNUAL_LEAVE_YEAR_COLORS[year] || "#1890FF",
      data,
    };
  });

  const tableRows = series.map((s) => ({
    year: s.label,
    values: s.data,
    total: s.data.reduce((sum, v) => sum + v, 0),
  }));

  return { categories, series, tableRows };
}

function buildScatterFactor(factor, unitFilter) {
  const base = unitFilter === "all" ? 1 : 0.85;
  return Math.max(0.6, factor * base);
}

const BUSINESS_HOURS_MONTHLY = [25, 5, 12, 12, 13, 5, 16, 24, 5, 17, 22, 3];
const TRAINING_HOURS_MONTHLY = [1, 11, 5, 3, 5, 15, 8, 0, 11, 5, 1, 10];
const TREND_YEARS = [2021, 2022, 2023, 2024, 2025];
const TREND_YEAR_MULT = [0.72, 0.85, 0.92, 0.98, 1];

function filterMonthsByDateRange(startDate, endDate, refYear = 2025) {
  const all = BUSINESS_HOURS_MONTHLY.map((_, i) => ({
    monthIndex: i,
    label: `${i + 1}月`,
    timeKey: `${refYear}-${String(i + 1).padStart(2, "0")}`,
  }));
  if (!startDate || !endDate) return all;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return all;
  return all.filter((m) => {
    const mid = new Date(`${refYear}-${String(m.monthIndex + 1).padStart(2, "0")}-15`);
    return mid >= start && mid <= end;
  });
}

function filterYearsByDateRange(startDate, endDate) {
  if (!startDate || !endDate) return TREND_YEARS;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return TREND_YEARS;
  const sy = start.getFullYear();
  const ey = end.getFullYear();
  return TREND_YEARS.filter((y) => y >= sy && y <= ey);
}

/** 出差 / 培训工时 — 按时间维度聚合（月 / 年） */
export function buildBusinessTrainingTrend(queryParams, factor) {
  const scaleF = buildScatterFactor(factor, queryParams.unit);
  const months = filterMonthsByDateRange(queryParams.startDate, queryParams.endDate);
  const years = filterYearsByDateRange(queryParams.startDate, queryParams.endDate);
  const annualBusiness = BUSINESS_HOURS_MONTHLY.reduce((sum, v) => sum + v, 0);
  const annualTraining = TRAINING_HOURS_MONTHLY.reduce((sum, v) => sum + v, 0);

  return {
    month: {
      categories: months.map((m) => m.label),
      timeKeys: months.map((m) => m.timeKey),
      business: months.map((m) => scaleNum(BUSINESS_HOURS_MONTHLY[m.monthIndex], scaleF)),
      training: months.map((m) => scaleNum(TRAINING_HOURS_MONTHLY[m.monthIndex], scaleF)),
    },
    year: {
      categories: years.map((y) => `${y}年`),
      timeKeys: years.map((y) => String(y)),
      business: years.map((y) => {
        const yi = TREND_YEARS.indexOf(y);
        const mult = yi >= 0 ? TREND_YEAR_MULT[yi] : 1;
        return scaleNum(annualBusiness * mult, scaleF);
      }),
      training: years.map((y) => {
        const yi = TREND_YEARS.indexOf(y);
        const mult = yi >= 0 ? TREND_YEAR_MULT[yi] : 1;
        return scaleNum(annualTraining * mult, scaleF);
      }),
    },
  };
}

export function buildOverviewSnapshot(queryParams, leaveQueryParams = {}, activeMetric = "total") {
  const factor = getDateFactor(queryParams.startDate, queryParams.endDate);
  const leaveFactor = getDateFactor(
    leaveQueryParams.startDate || queryParams.startDate,
    leaveQueryParams.endDate || queryParams.endDate
  );
  const isDepartment = queryParams.dimension === "department";
  const rows = isDepartment
    ? buildDepartmentRows(queryParams.unit, factor)
    : buildUnitRows(pickUnits(queryParams.unit), factor);

  const categories = rows.map((r) => r.name);
  const stats = buildStats(rows);
  const scatterF = buildScatterFactor(factor, queryParams.unit);

  return {
    factor,
    leaveFactor,
    activeMetric,
    dimension: queryParams.dimension,
    unitFilter: queryParams.unit,
    dimensionLabel: isDepartment ? "部门" : "单位",
    mainChartTitle: activeMetric === "noRecord"
      ? (isDepartment
        ? (queryParams.unit === "all" ? "各部门无考勤记录人员分布" : "所选单位各部门无考勤记录人员分布")
        : (queryParams.unit === "all" ? "各单位无考勤记录人员分布" : "所选单位无考勤记录人员分布"))
      : (isDepartment
        ? (queryParams.unit === "all" ? "各部门出勤概况" : "所选单位各部门出勤概况")
        : (queryParams.unit === "all" ? "各单位出勤概况" : "所选单位出勤概况")),
    categories,
    rows,
    stats,
    main: {
      should: rows.map((r) => r.should),
      actual: rows.map((r) => r.actual),
      rate: rows.map((r) => r.rate),
      noRecord: rows.map((r) => r.noRecordCount),
    },
    punctuality: {
      onTime: rows.map((r) => r.onTimeRate),
      late: rows.map((r) => r.lateRate),
      early: rows.map((r) => r.earlyRate),
    },
    lateEarly: {
      late: rows.map((r) => r.lateCount),
      early: rows.map((r) => r.earlyCount),
    },
    leaveTrend: {
      personal: rows.map((r) => r.leavePersonal),
      sick: rows.map((r) => r.leaveSick),
      annual: rows.map((r) => r.leaveAnnual),
    },
    extremeAttendance: buildExtremeAttendanceAnalysis(rows),
    leavePie: buildLeavePie(rows),
    annualLeaveDistribution: buildAnnualLeaveDistribution(leaveQueryParams),
    businessTrainingTrend: buildBusinessTrainingTrend(queryParams, factor),
    yMax: Math.max(7000, ...rows.map((r) => r.should)) + 500,
  };
}

export function getMainChartSeriesMode(activeMetric) {
  const modes = {
    total: { showShould: true, showActual: true, showRate: true, emphasis: "should" },
    actual: { showShould: true, showActual: true, showRate: true, emphasis: "actual" },
    rate: { showShould: false, showActual: false, showRate: true, emphasis: "rate" },
    noRecord: { showShould: false, showActual: false, showRate: false, showNoRecord: true, emphasis: "noRecord" },
    leave: { showShould: true, showActual: true, showRate: false, emphasis: "should" },
  };
  return modes[activeMetric] || modes.total;
}

export const DEFAULT_QUERY = {
  dimension: "unit",
  startDate: "",
  endDate: "",
  unit: "all",
};

export const DEFAULT_LEAVE_QUERY = {
  startDate: "",
  endDate: "",
  unit: "all",
};
