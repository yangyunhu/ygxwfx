/**
 * 组织机构管理 — 树形数据与机构详情
 */

import { downloadCsvWithLog } from "./exportLogger";

const STORAGE_KEY = "ygxwfx_org_management_tree";

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeSort(nodes) {
  if (!Array.isArray(nodes)) return nodes;
  nodes.forEach((n, i) => {
    if (n.sort == null) n.sort = i + 1;
    if (n.children && n.children.length) normalizeSort(n.children);
  });
  return nodes;
}

let memoryCache = null;

export function loadOrgTree() {
  if (memoryCache) return cloneDeep(memoryCache);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = normalizeSort(JSON.parse(raw));
      return cloneDeep(memoryCache);
    }
  } catch (e) {
    console.warn("loadOrgTree failed", e);
  }
  memoryCache = normalizeSort(generateOrgManagementTree());
  return cloneDeep(memoryCache);
}

export function saveOrgTree(tree) {
  memoryCache = normalizeSort(cloneDeep(tree));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
  } catch (e) {
    console.warn("saveOrgTree failed", e);
  }
  return cloneDeep(memoryCache);
}

export function resetOrgTree() {
  memoryCache = normalizeSort(generateOrgManagementTree());
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  return cloneDeep(memoryCache);
}

function findNodeContext(tree, id, parent = null) {
  for (let i = 0; i < tree.length; i += 1) {
    const node = tree[i];
    if (node.id === id) {
      return { node, parent, siblings: tree, index: i };
    }
    if (node.children && node.children.length) {
      const found = findNodeContext(node.children, id, node);
      if (found) return found;
    }
  }
  return null;
}

function collectDescendantIds(node, set = new Set()) {
  set.add(node.id);
  (node.children || []).forEach((c) => collectDescendantIds(c, set));
  return set;
}

function reindexSiblings(siblings) {
  siblings.forEach((n, i) => {
    n.sort = i + 1;
  });
}

function refreshUnitLevels(node, level) {
  node.unitLevel = level;
  (node.children || []).forEach((c) => refreshUnitLevels(c, level + 1));
}

/** 同级顺序：上移 / 下移 */
export function moveOrgNodeOrder(tree, nodeId, direction) {
  const next = cloneDeep(tree);
  const ctx = findNodeContext(next, nodeId);
  if (!ctx) throw new Error("未找到机构节点");

  const targetIndex = direction === "up" ? ctx.index - 1 : ctx.index + 1;
  if (targetIndex < 0 || targetIndex >= ctx.siblings.length) {
    throw new Error(direction === "up" ? "已在同级最前，无法上移" : "已在同级最后，无法下移");
  }

  const { siblings, index } = ctx;
  [siblings[index], siblings[targetIndex]] = [siblings[targetIndex], siblings[index]];
  reindexSiblings(siblings);
  return next;
}

/** 调整上级机构 */
export function changeOrgParent(tree, nodeId, newParentId) {
  const next = cloneDeep(tree);
  const ctx = findNodeContext(next, nodeId);
  if (!ctx) throw new Error("未找到机构节点");
  if (ctx.node.id === 1) throw new Error("根节点不可调整上级");

  const invalidIds = collectDescendantIds(ctx.node);
  if (invalidIds.has(newParentId)) throw new Error("不能调整到自身或下级机构");

  const currentParentId = ctx.parent ? ctx.parent.id : null;
  if (currentParentId === newParentId) throw new Error("目标上级与当前上级相同");

  ctx.siblings.splice(ctx.index, 1);
  reindexSiblings(ctx.siblings);

  let targetChildren;
  if (newParentId === 1) {
    if (!next[0].children) next[0].children = [];
    targetChildren = next[0].children;
  } else {
    const parentCtx = findNodeContext(next, newParentId);
    if (!parentCtx) throw new Error("未找到目标上级机构");
    if (!parentCtx.node.children) parentCtx.node.children = [];
    targetChildren = parentCtx.node.children;
  }

  targetChildren.push(ctx.node);
  reindexSiblings(targetChildren);
  refreshUnitLevels(next[0], 1);
  return next;
}

export function getSiblingRows(tree, nodeId) {
  const ctx = findNodeContext(tree, nodeId);
  if (!ctx) return [];
  return ctx.siblings
    .map((n, i) => ({
      id: n.id,
      name: n.name,
      code: n.code,
      sort: n.sort || i + 1,
      isCurrent: n.id === nodeId,
    }))
    .sort((a, b) => a.sort - b.sort);
}

export function toParentSelectOptions(tree, excludeNodeId) {
  const exclude = new Set();
  if (excludeNodeId) {
    const ctx = findNodeContext(tree, excludeNodeId);
    if (ctx) collectDescendantIds(ctx.node, exclude);
  }

  const build = (nodes) =>
    nodes
      .filter((n) => !exclude.has(n.id))
      .map((n) => {
        const item = { value: n.id, label: n.name };
        if (n.children && n.children.length) {
          const children = build(n.children);
          if (children.length) item.children = children;
        }
        return item;
      });

  return build(tree);
}

export function getOrgPath(tree, id) {
  const path = [];
  const walk = (nodes, stack) => {
    for (const n of nodes) {
      const next = [...stack, n.name];
      if (n.id === id) {
        path.push(...next);
        return true;
      }
      if (n.children && n.children.length && walk(n.children, next)) return true;
    }
    return false;
  };
  walk(tree, []);
  return path.join(" / ");
}

/** 从根到目标节点的 id 路径（供级联选择器回显） */
export function getOrgIdPath(tree, id) {
  const path = [];
  const walk = (nodes, stack) => {
    for (const n of nodes) {
      const next = [...stack, n.id];
      if (n.id === id) {
        path.push(...next);
        return true;
      }
      if (n.children && n.children.length && walk(n.children, next)) return true;
    }
    return false;
  };
  walk(tree, []);
  return path;
}

export function resolveOrgNodeFromCascader(tree, cascaderPath) {
  if (!cascaderPath || !cascaderPath.length) return null;
  const id = cascaderPath[cascaderPath.length - 1];
  return findOrgManagementNode(tree, id)?.node || null;
}

export const UNIT_LEVEL_OPTIONS = [
  { label: "全部层级", value: "" },
  { label: "一级", value: 1 },
  { label: "二级", value: 2 },
  { label: "三级", value: 3 },
  { label: "四级", value: 4 },
  { label: "五级", value: 5 },
];

function node(id, name, extra = {}) {
  const n = {
    id,
    name,
    code: extra.code || formatOrgCode(id),
    unitLevel: extra.unitLevel || inferUnitLevel(id),
    icon: extra.icon || (extra.children && extra.children.length ? "el-icon-folder" : "el-icon-document"),
    ...extra,
  };
  if (extra.children) n.children = extra.children;
  return n;
}

function formatOrgCode(id) {
  const base = String(id).padStart(6, "0");
  return `${base.slice(0, 4)}00-${base.slice(4, 6) || "00"}`;
}

function inferUnitLevel(id) {
  const s = String(id);
  if (s.length <= 2 || id === 1) return 1;
  if (s.length <= 3) return 2;
  if (s.length <= 5) return 3;
  return 4;
}

const leaf = (id, name, extra = {}) => node(id, name, { ...extra, unitLevel: extra.unitLevel || 4 });
const dept = (id, name, children, extra = {}) =>
  node(id, name, { ...extra, unitLevel: extra.unitLevel || 2, children });

export function generateOrgManagementTree() {
  return [
    node(1, "云南电网有限责任公司", {
      code: "050000-0000",
      unitLevel: 1,
      icon: "el-icon-office-building",
      children: [
        leaf(101, "领导班子", { unitLevel: 2 }),
        leaf(102, "南方电网公司出资企业专职董事监事", { unitLevel: 2 }),
        leaf(103, "免职未退休领导人员", { unitLevel: 2 }),
        leaf(104, "云南电网公司出资企业专职董事监事", { unitLevel: 2 }),
        leaf(105, "管理类职员", { unitLevel: 2 }),
        leaf(106, "专家委员会", { unitLevel: 2 }),
        leaf(107, "总师、副总师", { unitLevel: 2 }),
        dept(
          108,
          "办公室（党委办公室、董事会办公室、总经理办公室）",
          [
            leaf(10801, "综合管理一科", { code: "050108-0101" }),
            leaf(10802, "综合管理二科", { code: "050108-0102" }),
            leaf(10803, "文档管理科", { code: "050108-0103" }),
            leaf(10804, "后勤服务科", { code: "050108-0104" }),
          ],
          { code: "050108-0000" }
        ),
        dept(109, "战略规划部", [leaf(10901, "规划研究科"), leaf(10902, "投资管理科")], {
          code: "050109-0000",
        }),
        dept(
          110,
          "人力资源部",
          [
            leaf(1101, "部门负责人"),
            leaf(1102, "干部管理科"),
            leaf(1103, "干部监督科"),
            leaf(1104, "本部管理科"),
            leaf(1105, "人才管理科"),
            leaf(1106, "综合管理科"),
            leaf(1107, "劳动组织及用工管理科"),
            leaf(1108, "薪酬绩效科"),
            leaf(1109, "培训管理科"),
          ],
          { code: "050110-0000" }
        ),
        leaf(111, "社会保险事业管理局", { unitLevel: 2, code: "050111-0000" }),
        dept(112, "政策研究与企业架构部（全面深化改革办公室）", [leaf(11201, "政策研究科")], {
          code: "050112-0000",
        }),
        dept(113, "计划与财务部（云南电网资产运营监控中心）", [leaf(11301, "预算管理科"), leaf(11302, "资产管理科")], {
          code: "050113-0000",
        }),
        dept(114, "科技创新部", [leaf(11401, "创新管理科"), leaf(11402, "技术管理科")], {
          code: "050114-0000",
        }),
        dept(115, "数字化部", [leaf(11501, "应用开发科"), leaf(11502, "数据管理科")], {
          code: "050115-0000",
        }),
        dept(116, "市场营销部（客户服务部）", [leaf(11601, "营业科"), leaf(11602, "计量科")], {
          code: "050116-0000",
        }),
        dept(117, "基建部", [leaf(11701, "项目管理科"), leaf(11702, "质量监督科")], {
          code: "050117-0000",
        }),
        dept(
          130,
          "电网规划与建设部（质量监督项目站）",
          [
            leaf(13001, "规划管理科", { code: "050130-0101" }),
            leaf(13002, "建设管理科", { code: "050130-0102" }),
            leaf(13003, "质量监督科", { code: "050130-0103" }),
          ],
          { code: "050100-0500", unitLevel: 2 }
        ),
        dept(118, "新兴与国际业务部", [leaf(11801, "国际业务科")], { code: "050118-0000" }),
        dept(119, "生产技术部", [leaf(11901, "检修中心"), leaf(11902, "技术管理科")], {
          code: "050119-0000",
        }),
        dept(120, "系统运行部（与电力调度控制中心合署）", [leaf(12001, "调度科"), leaf(12002, "运行科")], {
          code: "050120-0000",
        }),
        dept(121, "供应链管理部", [leaf(12101, "采购科"), leaf(12102, "仓储配送科")], {
          code: "050121-0000",
        }),
        dept(122, "安全监管部（应急管理部）", [leaf(12201, "安全监察科"), leaf(12202, "应急管理科")], {
          code: "050122-0000",
        }),
        dept(123, "审计部", [leaf(12301, "审计一科"), leaf(12302, "审计二科")], { code: "050123-0000" }),
        dept(124, "法规部", [leaf(12401, "法律事务科")], { code: "050124-0000" }),
        dept(125, "党建工作部（企业文化部）", [leaf(12501, "组织科"), leaf(12502, "宣传科")], {
          code: "050125-0000",
        }),
        dept(126, "监督部（纪委办公室）", [leaf(12601, "案件管理科")], { code: "050126-0000" }),
        leaf(127, "公司党委巡察工作领导小组办公室", { unitLevel: 2, code: "050127-0000" }),
        leaf(128, "公司党委巡察组", { unitLevel: 2, code: "050128-0000" }),
        dept(129, "工会办公室（职工权益维护部）", [leaf(12901, "工会综合科")], { code: "050129-0000" }),
      ],
    }),
  ];
}

export function flattenOrgManagementTree(tree, parent = null, list = []) {
  tree.forEach((item) => {
    list.push({ node: item, parent });
    if (item.children && item.children.length) {
      flattenOrgManagementTree(item.children, item, list);
    }
  });
  return list;
}

export function findOrgManagementNode(tree, id) {
  const flat = flattenOrgManagementTree(tree);
  const hit = flat.find((item) => item.node.id === id);
  return hit || null;
}

export function filterOrgManagementTree(tree, keyword, unitLevel) {
  const kw = (keyword || "").trim().toLowerCase();
  const level = unitLevel === "" || unitLevel == null ? null : Number(unitLevel);

  const matchNode = (n) => {
    const kwMatch =
      !kw ||
      (n.name || "").toLowerCase().includes(kw) ||
      (n.code || "").toLowerCase().includes(kw);
    const levelMatch = level == null || n.unitLevel === level;
    return kwMatch && levelMatch;
  };

  const filterNodes = (nodes) =>
    nodes
      .map((n) => {
        const children = n.children ? filterNodes(n.children) : [];
        if (matchNode(n) || children.length) {
          return { ...n, children: children.length ? children : n.children };
        }
        return null;
      })
      .filter(Boolean);

  return filterNodes(tree);
}

function yesNo(val) {
  return val ? "是" : "否";
}

export function buildOrgDetail(orgItem, tree) {
  if (!orgItem) return null;
  const { node, parent } = orgItem;
  const root = tree[0];
  const isRoot = node.id === root.id;
  const parentNode = parent || (isRoot ? null : root);
  const seed = String(node.id).split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const staffQuota = 8 + (seed % 40);
  const onDuty = Math.max(1, staffQuota - (seed % 5));

  return {
    id: node.id,
    displayTitle: `${node.name}（${node.code}）`,
    unitInfo: {
      unitCode: isRoot ? node.code : parentNode?.code || root.code,
      unitName: isRoot ? node.name : parentNode?.name || root.name,
      unitShortName: isRoot ? "云南电网" : (parentNode?.name || "").slice(0, 8) || "—",
      parentUnitCode: isRoot ? "—" : root.code,
      parentUnitName: isRoot ? "—" : root.name,
      unitLevel: `${node.unitLevel || 2}级`,
      unitMgmtSpec: "网公司管理规范",
      unitType: isRoot ? "法人单位" : "内设机构所属单位",
      assetLink: "全资",
    },
    basicInfo: {
      internalOrgCode: node.code,
      internalOrgName: node.name,
      parentInternalOrgCode: parentNode ? parentNode.code : "—",
      parentInternalOrgName: parentNode ? parentNode.name : "—",
      orgNature: node.unitLevel <= 2 ? "职能部门" : "科室/班组",
      orgCategory: node.unitLevel <= 2 ? "管理部门" : "业务机构",
      orgCategoryL2: node.unitLevel <= 2 ? "本部职能部门" : "内设科室",
      mgmtSpec: "网公司管理规范",
      staffQuota,
      onDutyCount: onDuty,
      establishDocNo: `云电人资〔${2018 + (seed % 6)}〕${100 + (seed % 50)}号`,
      establishDate: `${2015 + (seed % 8)}-${String((seed % 12) + 1).padStart(2, "0")}-01`,
      isLeadership: yesNo(node.unitLevel <= 2 && seed % 3 === 0),
      isHeadquarters: yesNo(!isRoot && node.unitLevel <= 3),
      isJointOffice: yesNo(seed % 7 === 0),
      isVirtualAffiliation: yesNo(false),
      isEntrustedDept: yesNo(seed % 11 === 0),
      locationOrgName: root.name,
      orgProfessionalField: node.unitLevel <= 2 ? "职能管理" : "专业支撑",
      dutyDesc: `负责${node.name}相关管理、协调与业务支撑工作。`,
      remark: "—",
      establishDoc: "成立文件.pdf",
    },
    attachments: seed % 4 === 0
      ? []
      : [
          { id: 1, name: "关于设立机构的请示.pdf", type: "请示", uploadTime: "2024-03-12 10:20" },
          { id: 2, name: "机构设立批复.pdf", type: "批复", uploadTime: "2024-03-28 15:40" },
        ],
  };
}

export function exportOrgDetailCsv(detail, filename) {
  if (!detail) return;
  const rows = [
    ["区块", "字段", "值"],
    ...Object.entries(detail.unitInfo).map(([k, v]) => ["所在单位信息", k, v]),
    ...Object.entries(detail.basicInfo).map(([k, v]) => ["基本信息", k, v]),
  ];
  const csv = rows
    .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const name = filename || `组织机构_${Date.now()}.csv`;
  downloadCsvWithLog(csv, name, {
    moduleCode: "org-management",
    moduleName: "组织机构管理",
    moduleGroup: "组织机构台账",
    rowCount: rows.length - 1,
    searchCriteria: detail?.basicInfo?.orgName || "机构详情",
  });
}

export const UNIT_INFO_FIELDS = [
  { key: "unitCode", label: "单位编码" },
  { key: "unitName", label: "单位名称" },
  { key: "unitShortName", label: "单位简称" },
  { key: "parentUnitCode", label: "上级单位编码" },
  { key: "parentUnitName", label: "上级单位名称" },
  { key: "unitLevel", label: "单位层级" },
  { key: "unitMgmtSpec", label: "单位管理规范" },
  { key: "unitType", label: "单位类型" },
  { key: "assetLink", label: "资产纽带关系" },
];

export const BASIC_INFO_FIELDS = [
  { key: "internalOrgCode", label: "内设机构编码" },
  { key: "internalOrgName", label: "内设机构名称" },
  { key: "parentInternalOrgCode", label: "上级内设机构编码" },
  { key: "parentInternalOrgName", label: "上级内设机构名称" },
  { key: "orgNature", label: "机构性质" },
  { key: "orgCategory", label: "机构类别" },
  { key: "orgCategoryL2", label: "二级机构类别" },
  { key: "mgmtSpec", label: "管理规范" },
  { key: "staffQuota", label: "定编人数" },
  { key: "onDutyCount", label: "在岗人数" },
  { key: "establishDocNo", label: "成立文件号" },
  { key: "establishDate", label: "成立日期" },
  { key: "isLeadership", label: "是否领导班子" },
  { key: "isHeadquarters", label: "是否本部机构" },
  { key: "isJointOffice", label: "是否合署办公机构" },
  { key: "isVirtualAffiliation", label: "是否虚拟挂靠" },
  { key: "isEntrustedDept", label: "是否委托部门" },
  { key: "locationOrgName", label: "所在地机构名称" },
  { key: "orgProfessionalField", label: "机构专业领域" },
  { key: "dutyDesc", label: "职责说明", span: 3 },
  { key: "remark", label: "备注" },
  { key: "establishDoc", label: "成立文件" },
];
