/**
 * 人资岗位类别、岗位序列、具体岗位及人员关联配置
 */

import { getEmployeeBasicList } from "./employeeLedger";
import { downloadCsvWithLog } from "./exportLogger";

const STORAGE_KEY = "ygxwfx_staff_post_relation";

/** 人资系统：岗位类别 → 岗位序列（与需求对照表一致） */
export const HR_CATEGORY_SEQUENCE_MAP = [
  {
    category: "技能类",
    sequences: [
      "通讯技能序列",
      "生产综合技能序列",
      "综合技能序列",
      "发电技能序列",
      "输电技能序列",
      "营销技能序列",
      "配电技能序列",
      "营配技能序列",
      "调度技能序列",
      "电网建设技能序列",
      "信息技能序列",
      "变电技能序列",
      "物流技能序列",
      "安检技能序列",
    ],
  },
  {
    category: "专业技术类",
    sequences: [
      "工会业务序列",
      "专业技术业务序列",
      "两级序列",
      "综合业务序列",
      "国际业务序列",
      "生产技术业务序列",
      "市场营销业务序列",
      "企管业务序列",
      "规划计划业务序列",
      "调度控制业务序列",
      "人力资源业务序列",
      "供应链业务序列",
      "财务会计业务序列",
      "纪检监察业务序列",
      "法律事务业务序列",
      "安全监管业务序列",
      "行政业务序列",
      "基建工程业务序列",
      "信息技术业务序列",
      "审计业务序列",
      "政工业务序列",
    ],
  },
  {
    category: "管理类",
    sequences: ["决策管理序列", "专业管理序列"],
  },
  {
    category: "辅助类",
    sequences: ["生产辅助序列", "行政辅助序列", "后勤辅助序列"],
  },
];

const POST_NAME_SUFFIX = ["专责", "高级专责", "业务员", "员", "助理"];

function slugId(prefix, category, name, index) {
  const base = `${category}-${name}-${index}`
    .replace(/\s/g, "")
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9-]/g, "");
  return `${prefix}-${base}`;
}

function buildDefaultPostsForSequence(category, sequenceName, seqIndex) {
  const count = 2 + (seqIndex % 3);
  const posts = [];
  const short = sequenceName.replace(/序列$/, "");
  for (let i = 0; i < count; i++) {
    const suffix = POST_NAME_SUFFIX[i % POST_NAME_SUFFIX.length];
    posts.push({
      id: slugId("post", category, sequenceName, i),
      name: `${short}${suffix}`,
      code: `GW${String(seqIndex * 10 + i + 1).padStart(4, "0")}`,
      enabled: true,
    });
  }
  return posts;
}

export function generatePositionTree() {
  return HR_CATEGORY_SEQUENCE_MAP.map((item, catIndex) => {
    const categoryId = `cat-${catIndex}`;
    const children = item.sequences.map((seqName, seqIndex) => {
      const sequenceId = `seq-${catIndex}-${seqIndex}`;
      const posts = buildDefaultPostsForSequence(item.category, seqName, seqIndex);
      return {
        id: sequenceId,
        name: seqName,
        type: "sequence",
        category: item.category,
        categoryId,
        code: `XL${String(catIndex + 1).padStart(2, "0")}${String(seqIndex + 1).padStart(2, "0")}`,
        children: posts.map((p) => ({
          ...p,
          type: "post",
          category: item.category,
          categoryId,
          sequenceId,
          sequenceName: seqName,
        })),
      };
    });
    return {
      id: categoryId,
      name: item.category,
      type: "category",
      category: item.category,
      code: `LB${String(catIndex + 1).padStart(2, "0")}`,
      children,
    };
  });
}

/** 对照表行（含 rowspan 用 categoryRowspan） */
export function getCategorySequenceTableRows() {
  const rows = [];
  HR_CATEGORY_SEQUENCE_MAP.forEach((item) => {
    item.sequences.forEach((seq, index) => {
      rows.push({
        category: item.category,
        sequence: seq,
        categoryRowspan: index === 0 ? item.sequences.length : 0,
      });
    });
  });
  return rows;
}

let treeCache = null;

export function loadPositionTree() {
  if (!treeCache) {
    treeCache = generatePositionTree();
  }
  return treeCache;
}

function findNodeContext(tree, id, parent = null) {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.id === id) {
      return { node, parent, index: i, siblings: tree };
    }
    if (node.children && node.children.length) {
      const found = findNodeContext(node.children, id, node);
      if (found) return found;
    }
  }
  return null;
}

export function findPositionNode(tree, id) {
  return findNodeContext(tree, id);
}

export function filterPositionTree(tree, keyword) {
  const kw = (keyword || "").trim().toLowerCase();
  if (!kw) return tree;

  function filterNode(node) {
    const selfMatch =
      (node.name && node.name.toLowerCase().includes(kw)) ||
      (node.code && String(node.code).toLowerCase().includes(kw));
    if (!node.children || !node.children.length) {
      return selfMatch ? { ...node } : null;
    }
    const children = node.children.map(filterNode).filter(Boolean);
    if (selfMatch || children.length) {
      return { ...node, children: children.length ? children : node.children };
    }
    return null;
  }

  return tree.map(filterNode).filter(Boolean);
}

export function getPositionPath(tree, id) {
  const parts = [];
  function walk(nodes, trail) {
    for (const n of nodes) {
      const next = [...trail, n.name];
      if (n.id === id) {
        parts.push(...next);
        return true;
      }
      if (n.children && walk(n.children, next)) return true;
    }
    return false;
  }
  walk(tree, []);
  return parts.join(" / ");
}

export function flattenSequences(tree) {
  const list = [];
  tree.forEach((cat) => {
    (cat.children || []).forEach((seq) => {
      list.push({
        id: seq.id,
        name: seq.name,
        category: cat.name,
        categoryId: cat.id,
        postCount: (seq.children || []).length,
      });
    });
  });
  return list;
}

export function flattenPosts(tree) {
  const list = [];
  tree.forEach((cat) => {
    (cat.children || []).forEach((seq) => {
      (seq.children || []).forEach((post) => {
        list.push({
          ...post,
          sequenceName: seq.name,
          categoryName: cat.name,
        });
      });
    });
  });
  return list;
}

function loadRelationMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return null;
}

function saveRelationMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function buildDefaultRelationMap(tree, employees) {
  const sequences = flattenSequences(tree);
  const posts = flattenPosts(tree);
  const map = {};
  employees.forEach((emp, i) => {
    const seqCandidates = sequences.filter((s) => s.category === emp.postCategory);
    const seq = seqCandidates.length ? seqCandidates[i % seqCandidates.length] : sequences[i % sequences.length];
    const postCandidates = posts.filter((p) => p.sequenceId === seq.id);
    const post = postCandidates.length ? postCandidates[i % postCandidates.length] : posts[i % posts.length];
    map[emp.id] = {
      categoryId: seq.categoryId,
      categoryName: seq.category,
      sequenceId: seq.id,
      sequenceName: seq.name,
      postId: post.id,
      postName: post.name,
      postCode: post.code,
    };
  });
  return map;
}

let relationMapCache = null;

export function loadStaffPostRelationMap() {
  if (relationMapCache) return relationMapCache;
  const tree = loadPositionTree();
  const employees = getEmployeeBasicList();
  const stored = loadRelationMap();
  relationMapCache = stored && typeof stored === "object" ? stored : buildDefaultRelationMap(tree, employees);
  return relationMapCache;
}

export function saveStaffPostRelationMap(map) {
  relationMapCache = { ...map };
  saveRelationMap(relationMapCache);
  return relationMapCache;
}

export function resetStaffPostRelationMap() {
  localStorage.removeItem(STORAGE_KEY);
  relationMapCache = null;
  const tree = loadPositionTree();
  const employees = getEmployeeBasicList();
  return saveStaffPostRelationMap(buildDefaultRelationMap(tree, employees));
}

export function getEmployeeWithPostRelation(employee, map) {
  const rel = map[employee.id];
  if (!rel) return { ...employee, postSequence: "—", hrPostName: employee.postName, hrPostCode: "—" };
  return {
    ...employee,
    postCategory: rel.categoryName || employee.postCategory,
    postSequence: rel.sequenceName || "—",
    hrPostName: rel.postName || employee.postName,
    hrPostCode: rel.postCode || "—",
    postId: rel.postId,
    sequenceId: rel.sequenceId,
    categoryId: rel.categoryId,
  };
}

export function getAllEmployeesWithPostRelation() {
  const map = loadStaffPostRelationMap();
  return getEmployeeBasicList().map((e) => getEmployeeWithPostRelation(e, map));
}

export function countEmployeesForNode(tree, nodeId, map) {
  const ctx = findPositionNode(tree, nodeId);
  if (!ctx) return 0;
  const { node } = ctx;
  const employees = getAllEmployeesWithPostRelation();
  if (node.type === "category") {
    return employees.filter((e) => e.categoryId === node.id).length;
  }
  if (node.type === "sequence") {
    return employees.filter((e) => e.sequenceId === node.id).length;
  }
  if (node.type === "post") {
    return employees.filter((e) => e.postId === node.id).length;
  }
  return 0;
}

export function getEmployeesForNode(tree, nodeId) {
  const ctx = findPositionNode(tree, nodeId);
  if (!ctx) return [];
  const { node } = ctx;
  const employees = getAllEmployeesWithPostRelation();
  if (node.type === "category") {
    return employees.filter((e) => e.categoryId === node.id);
  }
  if (node.type === "sequence") {
    return employees.filter((e) => e.sequenceId === node.id);
  }
  if (node.type === "post") {
    return employees.filter((e) => e.postId === node.id);
  }
  return [];
}

export function getSequenceListRows(tree, categoryId) {
  const cat = tree.find((c) => c.id === categoryId);
  if (!cat) return [];
  const map = loadStaffPostRelationMap();
  return (cat.children || []).map((seq, index) => ({
    sort: index + 1,
    id: seq.id,
    name: seq.name,
    code: seq.code,
    postCount: (seq.children || []).length,
    employeeCount: getEmployeesForNode(tree, seq.id).length,
    category: cat.name,
  }));
}

export function getPostListRows(tree, sequenceId) {
  const ctx = findPositionNode(tree, sequenceId);
  if (!ctx || ctx.node.type !== "sequence") return [];
  return (ctx.node.children || []).map((post, index) => ({
    sort: index + 1,
    id: post.id,
    name: post.name,
    code: post.code,
    employeeCount: getEmployeesForNode(tree, post.id).length,
    sequenceName: ctx.node.name,
  }));
}

export function toPostCascaderOptions(tree) {
  return tree.map((cat) => ({
    value: cat.id,
    label: cat.name,
    children: (cat.children || []).map((seq) => ({
      value: seq.id,
      label: seq.name,
      children: (seq.children || []).map((post) => ({
        value: post.id,
        label: post.name,
      })),
    })),
  }));
}

export function resolveCascaderSelection(tree, pathIds) {
  if (!pathIds || pathIds.length < 3) return null;
  const [categoryId, sequenceId, postId] = pathIds;
  const postCtx = findPositionNode(tree, postId);
  if (!postCtx || postCtx.node.type !== "post") return null;
  const post = postCtx.node;
  const seqCtx = findPositionNode(tree, sequenceId);
  const cat = tree.find((c) => c.id === categoryId);
  return {
    categoryId,
    categoryName: cat ? cat.name : post.category,
    sequenceId,
    sequenceName: seqCtx ? seqCtx.node.name : post.sequenceName,
    postId,
    postName: post.name,
    postCode: post.code,
  };
}

export function updateEmployeePostRelations(employeeIds, selection, tree) {
  const resolved = resolveCascaderSelection(tree, selection);
  if (!resolved) {
    throw new Error("请选择完整的岗位类别、岗位序列和岗位");
  }
  const map = loadStaffPostRelationMap();
  employeeIds.forEach((id) => {
    map[id] = { ...resolved };
  });
  saveStaffPostRelationMap(map);
  return map;
}

export function countPositionStats(tree) {
  const sequences = flattenSequences(tree);
  const posts = flattenPosts(tree);
  const employees = getAllEmployeesWithPostRelation();
  return {
    categories: tree.length,
    sequences: sequences.length,
    posts: posts.length,
    employees: employees.length,
  };
}

export function exportStaffPostCsv(rows, filename) {
  const headers = [
    "姓名",
    "员工编码",
    "部门路径",
    "岗位名称",
    "岗位编码",
    "岗位类别",
    "岗位序列",
    "员工状态",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.employeeCode,
      r.deptPath,
      r.hrPostName || r.postName,
      r.hrPostCode || "",
      r.postCategory,
      r.postSequence,
      r.employeeStatus,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: "staff-post",
    moduleName: "人员与岗位关联配置",
    moduleGroup: "组织机构台账",
    rowCount: rows.length,
    searchCriteria: "关联人员列表",
  });
}
