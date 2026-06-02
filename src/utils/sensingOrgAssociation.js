/**
 * 无感数据 — 组织机构手动关联配置
 * 部分线上接入数据缺少内部组织机构信息，在此关联至组织树节点
 */
import {
  generateGateRows,
  generateCanteenRows,
  generateOnlineRows,
  isMissing,
} from "./sensingRecords";
import { SOURCE_META } from "./dataCleanRules";
import { findOrgManagementNode } from "./orgManagement";

const STORAGE_KEY = "ygxwfx_sensing_org_associations";

/** 源数据中的内部组织机构字段（不含单位名称/所属单位等公司级字段） */
const SOURCE_ORG_NAME_KEYS = [
  "orgName",
  "所属组织机构",
  "所属部门",
  "部门（供电所）组织名称",
];

const SOURCE_ORG_ID_KEYS = ["orgId", "组织机构ID", "所属单位ID", "DEPT_ID", "UNIT_ID"];

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function loadOrgAssociations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("loadOrgAssociations failed", e);
  }
  return {};
}

export function saveOrgAssociations(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("saveOrgAssociations failed", e);
  }
  return map;
}

export function loadAllSensingRecords() {
  return [...generateGateRows(), ...generateCanteenRows(), ...generateOnlineRows()];
}

function recordDisplayName(rec) {
  return rec.name || rec.姓名 || rec.出行人 || rec.负责人 || "—";
}

function recordDisplayPersonId(rec) {
  return rec.personId || rec.员工编号 || rec.用户ID || "—";
}

function pickFirst(rec, keys) {
  for (const k of keys) {
    const v = rec[k];
    if (!isMissing(v)) return String(v).trim();
  }
  return "";
}

/** 源数据中的组织机构名称（内部部门/班组，不含公司级单位名称） */
export function rawSourceOrgName(rec) {
  return pickFirst(rec, SOURCE_ORG_NAME_KEYS);
}

function rawSourceOrgId(rec) {
  return pickFirst(rec, SOURCE_ORG_ID_KEYS);
}

/** 源数据组织是否为空（名称与 ID 均无） */
export function isSourceOrgEmpty(rec) {
  return isMissing(rawSourceOrgName(rec)) && isMissing(rawSourceOrgId(rec));
}

/** 读取记录有效组织（手动关联优先） */
export function getEffectiveRecordOrg(rec, associations = loadOrgAssociations()) {
  const manual = associations[rec.id];
  if (manual) {
    return {
      orgId: manual.orgId,
      orgName: manual.orgName,
      orgCode: manual.orgCode || "",
      fromManual: true,
    };
  }
  const orgId = rawSourceOrgId(rec);
  const orgName = rawSourceOrgName(rec);
  return {
    orgId: isMissing(orgId) ? "" : orgId,
    orgName: isMissing(orgName) ? "" : orgName,
    orgCode: "",
    fromManual: false,
  };
}

/** 是否待关联：源数据组织为空且尚未手动关联 */
export function isPendingOrgAssociation(rec, associations = loadOrgAssociations()) {
  if (associations[rec.id]) return false;
  return isSourceOrgEmpty(rec);
}

/** 是否在本页展示：源组织为空，或已手动关联过的记录 */
export function isEligibleForAssociationPage(rec, associations = loadOrgAssociations()) {
  return isSourceOrgEmpty(rec) || !!associations[rec.id];
}

function resolveRecordDate(rec) {
  return (
    rec.recordDate ||
    String(rec.出差开始日期 || rec.培训时间 || rec.创建时间 || rec.实际开始时间 || "").slice(0, 10) ||
    "—"
  );
}

export function buildAssociationRows(records, associations, orgTree = []) {
  const eligible = (records || []).filter((rec) =>
    isEligibleForAssociationPage(rec, associations)
  );
  return eligible.map((rec) => {
    const effective = getEffectiveRecordOrg(rec, associations);
    const pending = isPendingOrgAssociation(rec, associations);
    const manual = associations[rec.id];
    const linkedNode = effective.fromManual
      ? findOrgManagementNode(orgTree, effective.orgId)?.node
      : null;
    const sourceOrgName = rawSourceOrgName(rec);
    return {
      id: rec.id,
      recordId: rec.id,
      sourceCode: rec.sourceCode,
      sourceName: rec.sourceName || rec.sourceCode,
      name: recordDisplayName(rec),
      personId: recordDisplayPersonId(rec),
      recordDate: resolveRecordDate(rec),
      rawOrgName: sourceOrgName || "—",
      rawOrgId: rawSourceOrgId(rec) || "—",
      linkedOrgId: effective.orgId || "",
      linkedOrgName: effective.orgName || "",
      linkedOrgCode: effective.orgCode || linkedNode?.code || "",
      linkedAt: manual?.updatedAt || "",
      linkedBy: manual?.resolvedBy || "",
      status: pending ? "待关联" : "已手动关联",
      statusType: pending ? "warning" : "success",
      pending,
      fromManual: effective.fromManual,
      _record: rec,
    };
  });
}

export function filterAssociationRows(rows, { keyword = "", sourceCode = "", status = "" } = {}) {
  let list = rows || [];
  const kw = String(keyword || "").trim().toLowerCase();
  if (kw) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.personId.toLowerCase().includes(kw) ||
        r.linkedOrgName.toLowerCase().includes(kw)
    );
  }
  if (sourceCode) {
    list = list.filter((r) => r.sourceCode === sourceCode);
  }
  if (status === "pending") {
    list = list.filter((r) => r.pending);
  } else if (status === "linked") {
    list = list.filter((r) => r.fromManual);
  }
  return list;
}

export function applyOrgAssociations(
  recordIds,
  orgNode,
  associations = loadOrgAssociations(),
  operator = "当前用户"
) {
  if (!orgNode || !orgNode.id) {
    throw new Error("请选择有效的组织机构");
  }
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const next = { ...associations };
  (recordIds || []).forEach((id) => {
    next[id] = {
      orgId: orgNode.id,
      orgName: orgNode.name,
      orgCode: orgNode.code || "",
      updatedAt: now,
      resolvedBy: operator,
    };
  });
  return saveOrgAssociations(next);
}

/** 单条 / 批量手动关联（与人员岗位关联配置一致的调用方式） */
export function resolveOrgAssociation(recordRows, orgNode, associations, operator = "当前用户") {
  const ids = (Array.isArray(recordRows) ? recordRows : [recordRows]).map((r) =>
    typeof r === "string" ? r : r.id
  );
  if (!ids.length) throw new Error("请选择需要关联的记录");
  return applyOrgAssociations(ids, orgNode, associations, operator);
}

export function batchResolveOrgAssociations(recordRows, orgNode, associations, operator = "当前用户") {
  const pendingRows = (recordRows || []).filter((r) => r.pending !== false);
  if (!pendingRows.length) throw new Error("所选记录均已关联");
  return resolveOrgAssociation(pendingRows, orgNode, associations, operator);
}

export function removeOrgAssociation(recordId, associations = loadOrgAssociations()) {
  const next = { ...associations };
  delete next[recordId];
  return saveOrgAssociations(next);
}

export function countAssociationStats(rows) {
  const pending = rows.filter((r) => r.pending).length;
  const manual = rows.filter((r) => r.fromManual).length;
  return { pending, manual, total: rows.length };
}

export function getSourceOptions() {
  return SOURCE_META.map((s) => ({ code: s.code, name: s.name }));
}
