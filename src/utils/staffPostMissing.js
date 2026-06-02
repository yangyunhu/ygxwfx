/**
 * 无感数据清洗后 — 人员岗位缺失扫描与手动关联
 */

import { loadCleanRules } from "./dataCleanRules";
import { loadSensingData } from "./dataRepairManagement";
import { buildMissingRows, isMissing } from "./sensingRecords";
import { getEmployeeBasicList } from "./employeeLedger";
import {
  loadPositionTree,
  loadStaffPostRelationMap,
  saveStaffPostRelationMap,
  resolveCascaderSelection,
} from "./positionRelation";

const RESOLVED_KEY = "ygxwfx_staff_post_sensing_resolved";

/** 各数据源需关注的岗位相关字段 */
export const POST_FIELDS_BY_SOURCE = {
  offline_gate: [
    { key: "postCategory", label: "岗位类别" },
    { key: "postName", label: "岗位名称" },
  ],
  offline_canteen: [
    { key: "postCategory", label: "岗位类别" },
    { key: "postName", label: "岗位名称" },
  ],
  online_login: [
    { key: "POST_NAME", label: "岗位名称" },
    { key: "POST_ID", label: "岗位ID" },
    { key: "岗位类别", label: "岗位类别" },
    { key: "岗位序列", label: "岗位序列" },
  ],
  online_leave: [
    { key: "岗位名称", label: "岗位名称" },
    { key: "岗位类别", label: "岗位类别" },
    { key: "岗位序列", label: "岗位序列" },
  ],
  online_travel: [
    { key: "岗位类别", label: "岗位类别" },
    { key: "岗位序列", label: "岗位序列" },
  ],
};

const POST_LABEL_PATTERN = /岗位|POST_/i;

export function isPostRelatedMissingRow(row) {
  if (!row) return false;
  const label = row.fieldLabel || "";
  const key = row.fieldKey || "";
  return POST_LABEL_PATTERN.test(label) || POST_LABEL_PATTERN.test(key);
}

function loadResolvedMap() {
  try {
    const raw = localStorage.getItem(RESOLVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return {};
}

function saveResolvedMap(map) {
  localStorage.setItem(RESOLVED_KEY, JSON.stringify(map));
}

export function loadResolvedPostBindings() {
  return loadResolvedMap();
}

function personKey(rec) {
  const pid = rec.personId || rec.员工编号 || rec.用户ID || rec.personKey;
  if (pid && !isMissing(pid)) return String(pid);
  const name = rec.name || rec.姓名 || rec.出行人 || "";
  const org = rec.orgName || rec.所属组织机构 || rec.单位名称 || rec.单位 || "";
  return `name:${name}::${org}`;
}

function matchEmployee(rec, employees) {
  const pid = rec.personId || rec.员工编号 || rec.用户ID;
  const name = rec.name || rec.姓名 || rec.出行人 || "";
  if (pid) {
    const byCode = employees.find((e) => String(e.employeeCode) === String(pid).replace(/^[A-Z]/, ""));
    if (byCode) return byCode;
    const num = String(pid).replace(/\D/g, "");
    if (num) {
      const byNum = employees.find((e) => String(e.employeeCode).endsWith(num.slice(-5)));
      if (byNum) return byNum;
    }
  }
  if (name) {
    const sameName = employees.filter((e) => e.name === name);
    if (sameName.length === 1) return sameName[0];
  }
  return null;
}

function scanDirectPostMissing(allRecords) {
  const rows = [];
  allRecords.forEach((rec) => {
    const defs = POST_FIELDS_BY_SOURCE[rec.sourceCode] || [];
    defs.forEach(({ key, label }) => {
      const val = rec[key];
      if (isMissing(val)) {
        rows.push({
          id: `${rec.id}-${key}`,
          recordId: rec.id,
          sourceCode: rec.sourceCode,
          sourceName: rec.sourceName,
          name: rec.name || rec.姓名 || rec.出行人 || "—",
          personId: rec.personId || rec.员工编号 || rec.用户ID || "—",
          fieldLabel: label,
          fieldKey: key,
          fieldValue: "",
          orgName: rec.orgName || rec.所属组织机构 || rec.单位名称 || rec.单位 || "—",
        });
      }
    });
  });
  return rows;
}

function aggregatePending(missingRows, resolvedMap, employees) {
  const groups = {};
  missingRows.forEach((row) => {
    const key = personKey(row);
    if (resolvedMap[key]) return;
    if (!groups[key]) {
      const emp = matchEmployee(row, employees);
      groups[key] = {
        personKey: key,
        name: row.name,
        personId: row.personId,
        orgName: row.orgName,
        employeeId: emp ? emp.id : "",
        employeeCode: emp ? emp.employeeCode : "",
        missingFields: [],
        sourceNames: new Set(),
        recordCount: 0,
        status: "pending",
      };
    }
    const g = groups[key];
    if (!g.missingFields.includes(row.fieldLabel)) {
      g.missingFields.push(row.fieldLabel);
    }
    g.sourceNames.add(row.sourceName);
    g.recordCount += 1;
  });
  return Object.values(groups).map((g) => ({
    ...g,
    sourceNames: [...g.sourceNames],
    missingSummary: g.missingFields.join("、"),
  }));
}

function aggregateResolved(resolvedMap, employees, tree) {
  return Object.entries(resolvedMap).map(([key, rel]) => {
    const emp = employees.find((e) => e.id === rel.employeeId);
    return {
      personKey: key,
      name: rel.name || (emp && emp.name) || key,
      personId: rel.personId || (emp && emp.employeeCode) || "—",
      orgName: rel.orgName || (emp && emp.deptPath) || "—",
      employeeId: rel.employeeId || "",
      employeeCode: emp ? emp.employeeCode : "",
      missingFields: [],
      missingSummary: "—",
      sourceNames: rel.sourceNames || [],
      recordCount: rel.recordCount || 0,
      status: "resolved",
      postCategory: rel.categoryName,
      postSequence: rel.sequenceName,
      hrPostName: rel.postName,
      hrPostCode: rel.postCode,
      resolvedAt: rel.resolvedAt,
      resolvedBy: rel.resolvedBy || "当前用户",
    };
  });
}

/** 扫描无感清洗后的岗位缺失人员（去重聚合） */
export function scanMissingPostPersonnel() {
  const data = loadSensingData();
  const cleanRules = loadCleanRules();
  const allRecords = [...data.gateRows, ...data.canteenRows, ...(data.onlineRows || [])];
  const fromRules = buildMissingRows(data.gateRows, data.canteenRows, data.onlineRows, cleanRules).filter(
    isPostRelatedMissingRow
  );
  const fromDirect = scanDirectPostMissing(allRecords);
  const missingRows = [...fromRules];
  const seen = new Set(fromRules.map((r) => r.id));
  fromDirect.forEach((r) => {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      missingRows.push(r);
    }
  });

  const employees = getEmployeeBasicList();
  const resolvedMap = loadResolvedMap();
  const pending = aggregatePending(missingRows, resolvedMap, employees);
  const resolved = aggregateResolved(resolvedMap, employees, loadPositionTree());
  return {
    pending,
    resolved,
    missingRowCount: missingRows.length,
    scannedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
  };
}

export function countMissingPostStats(scanResult) {
  const pending = scanResult?.pending || [];
  const resolved = scanResult?.resolved || [];
  const sources = new Set();
  pending.forEach((p) => p.sourceNames.forEach((s) => sources.add(s)));
  return {
    pending: pending.length,
    resolved: resolved.length,
    sources: sources.size,
    missingFields: pending.reduce((n, p) => n + p.missingFields.length, 0),
  };
}

export function filterMissingPostList(list, { keyword, source, status }) {
  let data = list || [];
  if (status === "pending") data = data.filter((r) => r.status === "pending");
  if (status === "resolved") data = data.filter((r) => r.status === "resolved");
  if (source) data = data.filter((r) => r.sourceNames.includes(source));
  const kw = (keyword || "").trim().toLowerCase();
  if (kw) {
    data = data.filter(
      (r) =>
        (r.name && r.name.toLowerCase().includes(kw)) ||
        (r.personId && String(r.personId).toLowerCase().includes(kw)) ||
        (r.orgName && r.orgName.toLowerCase().includes(kw)) ||
        (r.missingSummary && r.missingSummary.toLowerCase().includes(kw))
    );
  }
  return data;
}

export function getMissingPostSourceOptions(scanResult) {
  const names = new Set();
  [...(scanResult?.pending || []), ...(scanResult?.resolved || [])].forEach((r) => {
    (r.sourceNames || []).forEach((s) => names.add(s));
  });
  return [...names];
}

/** 手动关联岗位并写入持久化 */
export function resolvePersonPostBinding(personRow, cascaderPath, tree, operator = "当前用户") {
  const resolved = resolveCascaderSelection(tree, cascaderPath);
  if (!resolved) {
    throw new Error("请选择完整的岗位类别、岗位序列和具体岗位");
  }
  const map = loadResolvedMap();
  map[personRow.personKey] = {
    ...resolved,
    name: personRow.name,
    personId: personRow.personId,
    orgName: personRow.orgName,
    employeeId: personRow.employeeId || "",
    sourceNames: personRow.sourceNames || [],
    recordCount: personRow.recordCount || 0,
    resolvedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    resolvedBy: operator,
  };
  saveResolvedMap(map);

  if (personRow.employeeId) {
    const relMap = loadStaffPostRelationMap();
    relMap[personRow.employeeId] = { ...resolved };
    saveStaffPostRelationMap(relMap);
  }
  return map[personRow.personKey];
}

export function batchResolvePersonPostBindings(rows, cascaderPath, tree, operator = "当前用户") {
  rows.forEach((row) => resolvePersonPostBinding(row, cascaderPath, tree, operator));
}

export function clearResolvedPostBindings() {
  localStorage.removeItem(RESOLVED_KEY);
}
