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

const UNIT_BASE = {
  should: [3000, 2800, 2500, 2600, 1500, 1800, 2200, 2000, 2400, 2700, 2300, 2100, 2800, 2500, 2200, 2000],
  actual: [2800, 2600, 2300, 2400, 1400, 1700, 2100, 1900, 2300, 2600, 2200, 2000, 2700, 2400, 2100, 1900],
  rate: [93, 93, 92, 92, 93, 94, 95, 95, 96, 96, 96, 95, 96, 96, 95, 95],
  onTimeRate: [90, 90, 90, 90, 89, 86, 87, 87, 88, 93, 90, 94, 89, 90, 90, 89],
  lateRate: [4, 4, 2, 11, 14, 7, 8, 10, 2, 7, 10, 4, 11, 10, 10, 11],
  earlyRate: [6, 6, 8, 3, 1, 7, 5, 3, 10, 0, 0, 2, 0, 0, 0, 0],
  lateCount: [2, 6, 10, 7, 8, 9, 13, 10, 6, 4, 5, 9, 14, 15, 14, 11],
  earlyCount: [1, 0, 0, 3, 0, 0, 0, 4, 0, 3, 1, 3, 0, 0, 0, 0],
  leavePersonal: [3, 2, 1, 1, 3, 2, 4, 2, 2, 3, 1, 2, 1, 1, 1, 1],
  leaveSick: [12, 10, 15, 8, 18, 15, 20, 12, 10, 15, 12, 10, 15, 12, 10, 8],
  leaveAnnual: [25, 20, 18, 12, 22, 32, 8, 18, 16, 10, 15, 16, 12, 7, 7, 6],
  leaveHours: [10.5, 9.8, 11.2, 8.6, 12.1, 14.3, 7.5, 9.1, 10.0, 11.5, 9.3, 8.8, 10.2, 9.0, 8.5, 7.9],
};

function scaleNum(n, factor) {
  return Math.round(n * factor);
}

function scaleRate(n, factor) {
  const delta = (factor - 1) * 2;
  return Math.min(100, Math.max(80, Math.round((n + delta) * 10) / 10));
}

function getDateFactor(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return Math.min(1.2, Math.max(0.15, days / 30));
}

function pickUnits(unitFilter) {
  if (unitFilter === "all") return UNIT_META;
  return UNIT_META.filter((u) => u.key === unitFilter);
}

function buildUnitRows(units, factor) {
  return units.map((u) => {
    const idx = UNIT_META.findIndex((m) => m.key === u.key);
    return {
      key: u.key,
      name: u.name,
      fullName: u.fullName,
      should: scaleNum(UNIT_BASE.should[idx], factor),
      actual: scaleNum(UNIT_BASE.actual[idx], factor),
      rate: scaleRate(UNIT_BASE.rate[idx], factor),
      onTimeRate: scaleRate(UNIT_BASE.onTimeRate[idx], factor),
      lateRate: scaleRate(UNIT_BASE.lateRate[idx], factor),
      earlyRate: scaleRate(UNIT_BASE.earlyRate[idx], factor),
      lateCount: scaleNum(UNIT_BASE.lateCount[idx], factor),
      earlyCount: scaleNum(UNIT_BASE.earlyCount[idx], factor),
      leavePersonal: scaleNum(UNIT_BASE.leavePersonal[idx], factor),
      leaveSick: scaleNum(UNIT_BASE.leaveSick[idx], factor),
      leaveAnnual: scaleNum(UNIT_BASE.leaveAnnual[idx], factor),
      leaveHours: Math.round(UNIT_BASE.leaveHours[idx] * factor * 10) / 10,
    };
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
      UNIT_META.forEach((u, uIdx) => {
        const seed = (uIdx + 1) * (dIdx + 3);
        const unitScale = UNIT_BASE.should[uIdx] / 3000;
        const rowShould = scaleNum(180 + seed * 12, factor * unitScale);
        const rowActual = scaleNum(rowShould * (0.92 + (seed % 5) * 0.015), 1);
        should += rowShould;
        actual += rowActual;
        onTimeSum += scaleRate(88 + (seed % 6), factor);
        lateSum += scaleRate(3 + (seed % 4), factor);
        earlySum += scaleRate(2 + (seed % 3), factor);
        lateCount += scaleNum(1 + (seed % 8), factor);
        earlyCount += scaleNum(seed % 4, factor);
        leavePersonal += scaleNum(1 + (seed % 3), factor);
        leaveSick += scaleNum(2 + (seed % 5), factor);
        leaveAnnual += scaleNum(3 + (seed % 6), factor);
        leaveHours += Math.round((4 + (seed % 6)) * factor * 10) / 10;
      });
      const count = UNIT_META.length;
      return {
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
      };
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
      rows.push({
        key: `${u.key}-${dIdx}`,
        name: dept,
        fullName: `${u.fullName}/${dept}`,
        should,
        actual,
        rate: scaleRate(90 + (seed % 8), factor),
        onTimeRate: scaleRate(88 + (seed % 6), factor),
        lateRate: scaleRate(3 + (seed % 4), factor),
        earlyRate: scaleRate(2 + (seed % 3), factor),
        lateCount: scaleNum(1 + (seed % 8), factor),
        earlyCount: scaleNum(seed % 4, factor),
        leavePersonal: scaleNum(1 + (seed % 3), factor),
        leaveSick: scaleNum(2 + (seed % 5), factor),
        leaveAnnual: scaleNum(3 + (seed % 6), factor),
        leaveHours: Math.round((4 + (seed % 6)) * factor * 10) / 10,
      });
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
  const leaveHours = Math.round(sumField(rows, "leaveHours") * 10) / 10;
  return {
    totalShouldAttendance: totalShould,
    actualAttendance: totalActual,
    overallRate: `${rate}%`,
    leaveDuration: `${leaveHours}h`,
  };
}

function buildLeavePie(rows) {
  return [
    { name: "事假", value: sumField(rows, "leavePersonal") },
    { name: "病假", value: sumField(rows, "leaveSick") },
    { name: "年休假", value: sumField(rows, "leaveAnnual") },
  ];
}

function buildLeaveTable(rows, factor) {
  const specialties = ["技术", "安监", "市场", "人资", "综合"];
  const businessTypes = ["项目实施", "现场检查", "客户拓展", "招聘外勤", "行政办公"];
  return rows.slice(0, 5).map((r, i) => ({
    unit: r.fullName || r.name,
    specialty: specialties[i % specialties.length],
    fieldWorkCount: scaleNum(10 + i * 8, factor),
    totalDuration: `${scaleNum(30 + i * 35, factor)}h`,
    avgDuration: `${(2.5 + (i % 4) * 0.4).toFixed(1)}h`,
    businessType: businessTypes[i % businessTypes.length],
  }));
}

function buildBubbleData(rows, factor) {
  return rows.slice(0, 5).map((r, i) => {
    const freq = scaleNum(10 + i * 9, factor);
    const hours = scaleNum(30 + i * 45, factor);
    return [freq, hours, freq * 2];
  });
}

function buildScatterFactor(factor, unitFilter) {
  const base = unitFilter === "all" ? 1 : 0.85;
  return Math.max(0.6, factor * base);
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
    mainChartTitle: isDepartment
      ? queryParams.unit === "all"
        ? "各部门出勤概况"
        : "所选单位各部门出勤概况"
      : queryParams.unit === "all"
        ? "各单位出勤概况"
        : "所选单位出勤概况",
    categories,
    rows,
    stats,
    main: {
      should: rows.map((r) => r.should),
      actual: rows.map((r) => r.actual),
      rate: rows.map((r) => r.rate),
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
    leavePie: buildLeavePie(rows),
    leaveTable: buildLeaveTable(rows, leaveFactor),
    bubble: buildBubbleData(rows, leaveFactor),
    specialty: {
      work: rows.slice(0, 5).map((r, i) => scaleNum(80 + (i + 1) * 15, scatterF)),
      attend: rows.slice(0, 5).map((r, i) => scaleNum(70 + (i + 1) * 18, scatterF)),
    },
    scatter: {
      business: [
        [1, scaleNum(25, scatterF)],
        [2, scaleNum(5, scatterF)],
        [3, scaleNum(12, scatterF)],
        [4, scaleNum(12, scatterF)],
        [5, scaleNum(13, scatterF)],
        [6, scaleNum(5, scatterF)],
        [7, scaleNum(16, scatterF)],
        [8, scaleNum(24, scatterF)],
        [9, scaleNum(5, scatterF)],
        [10, scaleNum(17, scatterF)],
        [11, scaleNum(22, scatterF)],
        [12, scaleNum(3, scatterF)],
      ],
      training: [
        [1, scaleNum(1, scatterF)],
        [2, scaleNum(11, scatterF)],
        [3, scaleNum(5, scatterF)],
        [4, scaleNum(3, scatterF)],
        [5, scaleNum(5, scatterF)],
        [6, scaleNum(15, scatterF)],
        [7, scaleNum(8, scatterF)],
        [8, scaleNum(0, scatterF)],
        [9, scaleNum(11, scatterF)],
        [10, scaleNum(5, scatterF)],
        [11, scaleNum(1, scatterF)],
        [12, scaleNum(10, scatterF)],
      ],
    },
    yMax: Math.max(7000, ...rows.map((r) => r.should)) + 500,
  };
}

export function getMainChartSeriesMode(activeMetric) {
  const modes = {
    total: { showShould: true, showActual: true, showRate: true, emphasis: "should" },
    actual: { showShould: true, showActual: true, showRate: true, emphasis: "actual" },
    rate: { showShould: false, showActual: false, showRate: true, emphasis: "rate" },
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
};
