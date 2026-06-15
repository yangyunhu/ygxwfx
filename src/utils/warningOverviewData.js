/**
 * 员工行为总览 — 异常预警模拟数据
 */

import { UNIT_OPTIONS } from "./behaviorOverviewData";

const UNIT_META = UNIT_OPTIONS.filter((u) => u.value !== "all").map((u) => ({
  key: u.value,
  name: u.label.replace("供电局", ""),
  fullName: u.label,
}));

const DEPARTMENTS = ["安监部", "财务部", "人力资源部", "市场营销部", "生产技术部", "数字化部"];
const POSITIONS = ["变电检修", "线路运维", "营销专责", "安监专责", "人资专责", "综合管理员"];
const NAMES = ["张三", "李四", "王五", "赵六", "陈静", "刘洋", "杨帆", "周婷", "吴磊", "孙浩"];
const ABNORMAL_TYPES = ["迟到", "早退", "在岗证据不足", "旷工"];
const WARNING_STATUS = ["预警中", "处理中", "已处理", "提醒"];

const ABSENTEE_BASE = [52, 38, 24, 18, 12, 8, 45, 15, 22, 28, 9, 6, 33, 11, 4, 3];
const LATE_TOP_BASE = [28, 24, 21, 19, 17];
const EARLY_TOP_BASE = [22, 19, 16, 14, 12];

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

function scaleCount(n, factor) {
  return Math.max(0, Math.round(n * factor));
}

function buildMapData(factor) {
  return UNIT_META.map((u, idx) => ({
    name: u.name,
    key: u.key,
    fullName: u.fullName,
    value: scaleCount(ABSENTEE_BASE[idx], factor),
  }));
}

function buildTopList(type, units, factor) {
  const base = type === "late" ? LATE_TOP_BASE : EARLY_TOP_BASE;
  const countLabel = type === "late" ? "迟到" : "早退";
    return base.map((cnt, i) => {
    const u = units[i % units.length];
    const seed = i + (type === "late" ? 1 : 5);
    return {
      rank: i + 1,
      unit: u.fullName,
      unitShort: u.name,
      department: DEPARTMENTS[seed % DEPARTMENTS.length],
      count: scaleCount(cnt, factor),
      countLabel,
      status: WARNING_STATUS[seed % WARNING_STATUS.length],
    };
  });
}

function buildAbnormalChangeRows(units, factor, mode) {
  if (mode === "department") {
    return DEPARTMENTS.map((dept, dIdx) => {
      const seed = dIdx + 3;
      return {
        name: dept,
        late: scaleCount(8 + (seed % 12), factor),
        early: scaleCount(5 + (seed % 8), factor),
        evidence: scaleCount(3 + (seed % 10), factor),
        absentee: scaleCount(2 + (seed % 6), factor),
      };
    });
  }
  return units.map((u, idx) => {
    const seed = idx + 1;
    return {
      name: u.name,
      late: scaleCount(10 + (seed * 3) % 18, factor),
      early: scaleCount(6 + (seed * 2) % 12, factor),
      evidence: scaleCount(4 + (seed * 5) % 15, factor),
      absentee: scaleCount(ABSENTEE_BASE[idx] % 12, factor),
    };
  });
}

function buildDetailTable(units, factor, unitFilter) {
  const rows = [];
  let id = 1;
  const targetUnits = unitFilter === "all" ? units : units.slice(0, 1);
  targetUnits.forEach((u, uIdx) => {
    for (let i = 0; i < 12; i++) {
      const seed = uIdx * 20 + i;
      rows.push({
        id: id++,
        unit: u.fullName,
        department: DEPARTMENTS[seed % DEPARTMENTS.length],
        position: POSITIONS[seed % POSITIONS.length],
        name: NAMES[seed % NAMES.length],
        abnormalType: ABNORMAL_TYPES[seed % ABNORMAL_TYPES.length],
        times: scaleCount(1 + (seed % 8), factor),
        status: WARNING_STATUS[seed % 3],
      });
    }
  });
  if (unitFilter !== "all") {
    return rows;
  }
  return rows.concat(
    UNIT_META.slice(0, 8).flatMap((u, uIdx) => {
      const seed = uIdx + 10;
      return Array.from({ length: 3 }, (_, j) => ({
        id: id++,
        unit: u.fullName,
        department: DEPARTMENTS[(seed + j) % DEPARTMENTS.length],
        position: POSITIONS[(seed + j) % POSITIONS.length],
        name: NAMES[(seed + j) % NAMES.length],
        abnormalType: ABNORMAL_TYPES[(seed + j) % ABNORMAL_TYPES.length],
        times: scaleCount(2 + ((seed + j) % 6), factor),
        status: WARNING_STATUS[(seed + j) % WARNING_STATUS.length],
      }));
    })
  );
}

export const DEFAULT_WARNING_QUERY = {
  startDate: "",
  endDate: "",
  unit: "all",
};

export const ABNORMAL_CHANGE_COLORS = {
  迟到: "#1890FF",
  早退: "#FA8C16",
  在岗证据不足: "#FAAD14",
  旷工: "#52C41A",
};

export function buildWarningSnapshot(queryParams, changeMode = "unit") {
  const factor = getDateFactor(queryParams.startDate, queryParams.endDate);
  const units = pickUnits(queryParams.unit);
  const mapData = buildMapData(factor);
  const abnormalRows = buildAbnormalChangeRows(units, factor, changeMode);

  return {
    factor,
    unitFilter: queryParams.unit,
    changeMode,
    mapData,
    lateTop5: buildTopList("late", units, factor),
    earlyTop5: buildTopList("early", units, factor),
    abnormalChange: {
      categories: abnormalRows.map((r) => r.name),
      late: abnormalRows.map((r) => r.late),
      early: abnormalRows.map((r) => r.early),
      evidence: abnormalRows.map((r) => r.evidence),
      absentee: abnormalRows.map((r) => r.absentee),
    },
    detailTable: buildDetailTable(units, factor, queryParams.unit),
  };
}

export function buildWarningDetailExportRows(detailTable) {
  return detailTable.map((row, index) => [
    index + 1,
    row.unit,
    row.department,
    row.position,
    row.name,
    row.abnormalType,
    row.times,
    row.status,
  ]);
}

export const WARNING_DETAIL_EXPORT_HEADERS = [
  "序号",
  "单位",
  "部门",
  "岗位",
  "姓名",
  "异常类型",
  "次数",
  "预警状态",
];
