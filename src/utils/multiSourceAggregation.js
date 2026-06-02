/**
 * 多元数据汇总 — 接口数据 + 数据中心无感数据，按人员ID汇集
 */

import {
  generateGateRows,
  generateCanteenRows,
  generateOnlineRows,
  buildAttendanceResults,
  isMissing,
  SENSING_SOURCES,
} from "./sensingRecords";
import { loadAttendanceBuffer } from "./externalApiManagement";
import { loadOrgTree, findOrgManagementNode } from "./orgManagement";
import { downloadCsvWithLog } from "./exportLogger";

const AGGREGATION_STORAGE_KEY = "ygxwfx_multi_source_aggregated";

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return fallback;
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/** 数据中心无感源数据 */
export function loadDataCenterSources() {
  return {
    gateRows: generateGateRows(),
    canteenRows: generateCanteenRows(),
    onlineRows: generateOnlineRows(),
  };
}

/** 将外部 API 出勤缓冲转为宽表补丁行 */
function apiBufferToWideRows(buffer) {
  return buffer.map((r) => ({
    personId: r.personId,
    recordDate: r.recordDate,
    name: r.name,
    orgName: r.orgName,
    orgId: r.orgId || "—",
    arrivalTime: r.arrivalTime || "—",
    departureTime: r.departureTime || "—",
    sources: ["外部API接入"],
    dataSources: "外部API接入",
    sourceCount: 1,
    status: r.attendanceType || "API接入",
    breakfastTime: "—",
    lunchTime: "—",
    dinnerTime: "—",
    loginTime: "—",
    loginEarliestTime: "—",
    loginLatestTime: "—",
    elinkLoginTime: "—",
    leaveStartTime: "—",
    leaveEndTime: "—",
    leaveType: "—",
    travelStartTime: "—",
    travelEndTime: "—",
    businessTripStartTime: "—",
    businessTripEndTime: "—",
    trainingStartTime: "—",
    trainingEndTime: "—",
    trainingParticipants: "—",
    workTicketStartTime: "—",
    workTicketEndTime: "—",
    workTicketLeader: "—",
    workTicketMembers: "—",
    workTicketRange: "—",
    postCategory: "—",
    id: r.id || `api-${r.personId}-${r.recordDate}`,
  }));
}

/** 合并 API 数据到无感宽表（同人同日优先合并来源） */
function mergeApiIntoWide(wideRows, apiRows) {
  const map = {};
  wideRows.forEach((r) => {
    map[`${r.personId}|${r.recordDate}`] = { ...r, sources: [...(r.sources || [])] };
  });
  apiRows.forEach((api) => {
    const key = `${api.personId}|${api.recordDate}`;
    if (map[key]) {
      const row = map[key];
      if (!row.sources.includes("外部API接入")) row.sources.push("外部API接入");
      if (isMissing(row.arrivalTime) && !isMissing(api.arrivalTime)) row.arrivalTime = api.arrivalTime;
      if (isMissing(row.departureTime) && !isMissing(api.departureTime)) row.departureTime = api.departureTime;
      row.dataSources = row.sources.join("、");
      row.sourceCount = row.sources.length;
    } else {
      map[key] = { ...api };
    }
  });
  return Object.values(map);
}

/** 执行多源数据汇集 */
export function runMultiSourceAggregation() {
  const { gateRows, canteenRows, onlineRows } = loadDataCenterSources();
  const apiBuffer = loadAttendanceBuffer();
  const wideFromSensing = buildAttendanceResults(gateRows, canteenRows, onlineRows);
  const apiWide = apiBufferToWideRows(apiBuffer);
  const merged = mergeApiIntoWide(wideFromSensing, apiWide);

  const sorted = merged.sort((a, b) => {
    if (a.personId !== b.personId) return a.personId.localeCompare(b.personId);
    return b.recordDate.localeCompare(a.recordDate);
  });

  const result = {
    rows: sorted,
    aggregatedAt: new Date().toISOString(),
    stats: countAggregationStats(sorted, { gateRows, canteenRows, onlineRows, apiBuffer }),
  };
  saveJson(AGGREGATION_STORAGE_KEY, result);
  return result;
}

export function loadAggregatedData() {
  const stored = loadJson(AGGREGATION_STORAGE_KEY, null);
  if (stored && stored.rows) return stored;
  return runMultiSourceAggregation();
}

function countAggregationStats(rows, sources) {
  const personSet = new Set(rows.map((r) => r.personId));
  const sourceSet = new Set();
  rows.forEach((r) => (r.sources || []).forEach((s) => sourceSet.add(s)));
  return {
    totalRows: rows.length,
    personCount: personSet.size,
    gateCount: sources.gateRows.length,
    canteenCount: sources.canteenRows.length,
    onlineCount: sources.onlineRows.length,
    apiCount: sources.apiBuffer.length,
    sourceTypes: sourceSet.size,
  };
}

/** 按人员ID分组汇总 */
export function groupByPersonId(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.personId]) {
      map[r.personId] = {
        personId: r.personId,
        name: r.name,
        orgName: r.orgName,
        orgId: r.orgId,
        recordCount: 0,
        sources: new Set(),
        dates: [],
        tracks: [],
      };
    }
    const g = map[r.personId];
    g.recordCount += 1;
    (r.sources || []).forEach((s) => g.sources.add(s));
    g.dates.push(r.recordDate);
    g.tracks.push(r);
  });
  return Object.values(map)
    .map((g) => {
      const sortedDates = [...g.dates].filter(Boolean).sort();
      return {
        ...g,
        sources: Array.from(g.sources).join("、"),
        dateRange: sortedDates.length
          ? `${sortedDates[0]} ~ ${sortedDates[sortedDates.length - 1]}`
          : "—",
        tracks: g.tracks.sort((a, b) => b.recordDate.localeCompare(a.recordDate)),
      };
    })
    .sort((a, b) => a.personId.localeCompare(b.personId));
}

/** 按组织机构层级过滤（选中节点及名称匹配） */
export function filterByOrg(rows, orgId) {
  if (!orgId || orgId === 1) return rows;
  const tree = loadOrgTree();
  const ctx = findOrgManagementNode(tree, orgId);
  if (!ctx) return rows;
  const orgName = ctx.node.name;
  return rows.filter((r) => r.orgName && (r.orgName.includes(orgName) || r.orgId === ctx.node.code));
}

export function filterOrgTreeForAggregation(tree, keyword) {
  const kw = (keyword || "").trim().toLowerCase();
  if (!kw) return tree;
  function filterNode(node) {
    const match = node.name && node.name.toLowerCase().includes(kw);
    if (!node.children || !node.children.length) return match ? { ...node } : null;
    const children = node.children.map(filterNode).filter(Boolean);
    if (match || children.length) return { ...node, children: children.length ? children : node.children };
    return null;
  }
  return tree.map(filterNode).filter(Boolean);
}

export function getSensingSourceCatalog() {
  return SENSING_SOURCES;
}

export function exportTrajectoryCsv(rows, filename, searchCriteria = "多源数据汇总") {
  const headers = [
    "人员ID",
    "姓名",
    "所属组织机构",
    "考勤日期",
    "到岗时间",
    "离岗时间",
    "早餐",
    "午餐",
    "晚餐",
    "登录",
    "休假类型",
    "休假开始",
    "休假结束",
    "出差开始",
    "出差结束",
    "外出开始",
    "培训开始",
    "培训结束",
    "工作票",
    "数据来源",
    "轨迹状态",
  ];
  const lines = rows.map((r) =>
    [
      r.personId,
      r.name,
      r.orgName,
      r.recordDate,
      r.arrivalTime,
      r.departureTime,
      r.breakfastTime,
      r.lunchTime,
      r.dinnerTime,
      r.loginTime,
      r.leaveType,
      r.leaveStartTime,
      r.leaveEndTime,
      r.businessTripStartTime,
      r.businessTripEndTime,
      r.travelStartTime,
      r.trainingStartTime,
      r.trainingEndTime,
      r.workTicketRange,
      r.dataSources || (r.sources || []).join("、"),
      r.status,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: "multi-source-aggregation",
    moduleName: "多源数据汇总",
    moduleGroup: "无感数据管理",
    rowCount: rows.length,
    searchCriteria,
  });
}

export function parseImportedTrajectoryCsv(text) {
  const lines = text.replace(/^\ufeff/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("([^"]|"")*"|[^,]*)/g);
    if (!cols || cols.length < 4) continue;
    const clean = (c) => String(c || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
    rows.push({
      personId: clean(cols[0]),
      name: clean(cols[1]),
      orgName: clean(cols[2]),
      recordDate: clean(cols[3]),
      arrivalTime: clean(cols[4]) || "—",
      departureTime: clean(cols[5]) || "—",
      sources: ["导入数据"],
      dataSources: "导入数据",
      sourceCount: 1,
      status: "导入",
      breakfastTime: "—",
      lunchTime: "—",
      dinnerTime: "—",
      loginTime: "—",
      leaveStartTime: "—",
      leaveEndTime: "—",
      leaveType: "—",
      businessTripStartTime: "—",
      businessTripEndTime: "—",
      travelStartTime: "—",
      travelEndTime: "—",
      trainingStartTime: "—",
      trainingEndTime: "—",
      workTicketRange: "—",
      id: `import-${i}-${clean(cols[0])}`,
    });
  }
  return rows;
}

export function mergeImportedRows(importedRows) {
  const current = loadAggregatedData();
  const merged = mergeApiIntoWide(current.rows, importedRows);
  const result = {
    rows: merged.sort((a, b) => {
      if (a.personId !== b.personId) return a.personId.localeCompare(b.personId);
      return b.recordDate.localeCompare(a.recordDate);
    }),
    aggregatedAt: new Date().toISOString(),
    stats: {
      ...current.stats,
      totalRows: merged.length,
      importedCount: importedRows.length,
    },
  };
  saveJson(AGGREGATION_STORAGE_KEY, result);
  return result;
}

export function paginateRows(rows, page, pageSize) {
  const start = (page - 1) * pageSize;
  return { list: rows.slice(start, start + pageSize), total: rows.length };
}
