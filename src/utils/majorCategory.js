/**
 * 专业分类 — 按员工专业背景分类，便于管理与培训安排
 */
import { downloadCsvWithLog } from "./exportLogger";

const STORAGE_KEY = "ygxwfx_major_category_tree";

const RAW_MAJOR_CATEGORY_TREE = [
  [
    "运维检修",
    [
      [
        "输电",
        [
          "输电线路运行维护及检修",
          "输电电缆运行维护与检修",
          "输电带电作业",
          "输电专业技术",
        ],
      ],
      [
        "变电",
        [
          "有人值守变电站运行与维护",
          "换流站修试",
          "无人值班变电站运行与维护",
          "换流站运行维护",
          "继保自动化及站用电源运维",
          "高压试验、仪表试验、化验",
          "变电一次设备检修",
          "变电专业技术",
        ],
      ],
      [
        "配电",
        [
          "城区配电线路及设备运行维护与检修",
          "城区配电电缆运行维护及检修",
          "配网设备带电作业",
          "配网自动化及试验",
          "乡镇及农村10(20)kV配电线路运行及维护",
          "乡镇及农村0.4kV配电线路运行及维护",
        ],
      ],
    ],
  ],
  [
    "电力营销",
    [
      ["营业", ["抄表运维", "电费核算与账务"]],
      [
        "计量",
        [
          "电能计量装置室内检定",
          "电能计量装置现场检试",
          "计量自动化",
          "乡镇及农村营销",
          "营销专业技术",
        ],
      ],
      [
        "服务",
        [
          "服务调度",
          "营业厅服务",
          "业扩报装",
          "95598受理服务",
          "装表接电",
          "用电检查与营销稽查",
          "智能用电推广",
          "营销数据及电子渠道服务（省级）",
          "综合能源业务推广",
        ],
      ],
    ],
  ],
  [
    "信息通信",
    [
      [
        "信息",
        [
          "信息专业技术管理",
          "信息化规划",
          "信息化技术管理",
          "管制业务信息化项目管理",
          "信息系统建设",
          "信息系统运行",
          "数据资产管理",
          "网络安全管理",
        ],
      ],
      ["通信", ["通信专业管理", "通信调度", "通信运维检修"]],
    ],
  ],
  [
    "物资",
    [
      "物资计划与采购管理",
      "合同及履约管理",
      "供应商管理",
      "品控管理",
      "仓储配送与逆向物资",
      "物资基础管理",
    ],
  ],
  [
    "调峰调频发电",
    [
      ["常规水电机组", ["机组运行", "机组检修", "开关站运维", "水工运维"]],
      ["抽水蓄能机组", ["机组运行", "机组检修", "开关站运维", "水工运维"]],
    ],
  ],
  ["经营管理", ["职能管理", "业务支撑和实施机构管理与综合类专业技术"]],
  ["后勤保障", ["车辆", "其他辅助人员"]],
];

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function buildNodes(items, level, parentId) {
  return items.map((item, index) => {
    const sort = index + 1;
    if (typeof item === "string") {
      return {
        id: `${parentId}-${sort}`,
        name: item,
        level,
        enabled: true,
        sort,
        remark: "",
      };
    }
    const [name, children] = item;
    const id = `${parentId}-${sort}`;
    const node = {
      id,
      name,
      level,
      enabled: true,
      sort,
      remark: "",
    };
    if (Array.isArray(children) && children.length) {
      node.children = buildNodes(children, level + 1, id);
    }
    return node;
  });
}

export function buildDefaultMajorCategoryTree() {
  return RAW_MAJOR_CATEGORY_TREE.map((item, index) => {
    const sort = index + 1;
    const id = `mc-${sort}`;
    const [name, children] = item;
    const node = {
      id,
      name,
      level: 1,
      enabled: true,
      sort,
      remark: "",
    };
    if (Array.isArray(children) && children.length) {
      node.children = buildNodes(children, 2, id);
    }
    return node;
  });
}

let memoryCache = null;

function assignCategoryCodes(tree) {
  let seq = 0;
  const walk = (nodes) => {
    nodes.forEach((node) => {
      if (!node.code) {
        seq += 1;
        node.code = `ZY-${String(seq).padStart(3, "0")}`;
      }
      if (node.children && node.children.length) walk(node.children);
    });
  };
  walk(tree);
  return tree;
}

function normalizeTree(raw) {
  if (!Array.isArray(raw) || !raw.length) {
    return assignCategoryCodes(buildDefaultMajorCategoryTree());
  }
  return assignCategoryCodes(cloneDeep(raw));
}

export function loadMajorCategoryTree() {
  if (memoryCache) return cloneDeep(memoryCache);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = normalizeTree(JSON.parse(raw));
      return cloneDeep(memoryCache);
    }
  } catch (e) {
    console.warn("loadMajorCategoryTree failed", e);
  }
  memoryCache = buildDefaultMajorCategoryTree();
  assignCategoryCodes(memoryCache);
  return cloneDeep(memoryCache);
}

export function saveMajorCategoryTree(tree) {
  const normalized = normalizeTree(tree);
  memoryCache = normalized;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.warn("saveMajorCategoryTree failed", e);
  }
  return cloneDeep(normalized);
}

export function resetMajorCategoryTree() {
  memoryCache = assignCategoryCodes(buildDefaultMajorCategoryTree());
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* ignore */
  }
  return cloneDeep(memoryCache);
}

export function flattenMajorCategoryTree(tree = loadMajorCategoryTree(), parentPath = "") {
  const rows = [];
  tree.forEach((node) => {
    const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
    rows.push({
      id: node.id,
      name: node.name,
      code: node.code || "",
      level: node.level,
      enabled: node.enabled !== false,
      sort: node.sort,
      remark: node.remark || "",
      path,
      isLeaf: !node.children || !node.children.length,
    });
    if (node.children && node.children.length) {
      rows.push(...flattenMajorCategoryTree(node.children, path));
    }
  });
  return rows;
}

export function getEnabledLeafCategories() {
  return flattenMajorCategoryTree().filter((row) => row.isLeaf && row.enabled);
}

export function findMajorCategoryNode(tree, id) {
  for (const node of tree) {
    if (node.id === id) return { node, parent: null, siblings: tree };
    if (node.children && node.children.length) {
      const found = findMajorCategoryNode(node.children, id);
      if (found) {
        if (!found.parent) {
          return { node: found.node, parent: node, siblings: node.children };
        }
        return found;
      }
    }
  }
  return null;
}

export function getMajorCategoryPath(id, tree = loadMajorCategoryTree()) {
  const flat = flattenMajorCategoryTree(tree);
  const hit = flat.find((row) => row.id === id);
  return hit ? hit.path : "";
}

export function filterMajorCategoryTree(tree, keyword) {
  const kw = (keyword || "").trim();
  if (!kw) return tree;

  const filterNodes = (nodes) =>
    nodes
      .map((node) => {
        const children = node.children ? filterNodes(node.children) : [];
        const selfMatch = (node.name || "").includes(kw);
        if (selfMatch || children.length) {
          return {
            ...node,
            children: children.length ? children : node.children,
          };
        }
        return null;
      })
      .filter(Boolean);

  return filterNodes(tree);
}

export function countMajorCategoryStats(tree = loadMajorCategoryTree()) {
  const flat = flattenMajorCategoryTree(tree);
  return {
    total: flat.length,
    enabled: flat.filter((r) => r.enabled).length,
    leaves: flat.filter((r) => r.isLeaf).length,
    maxLevel: flat.reduce((max, r) => Math.max(max, r.level), 0),
  };
}

export function addMajorCategoryNode(tree, parentId, payload) {
  const next = cloneDeep(tree);
  const name = (payload.name || "").trim();
  if (!name) throw new Error("分类名称不能为空");

  const newNode = {
    id: `mc-custom-${Date.now()}`,
    name,
    code: payload.code ? String(payload.code).trim() : "",
    level: 1,
    enabled: payload.enabled !== false,
    sort: payload.sort || 1,
    remark: payload.remark || "",
  };

  if (!parentId) {
    newNode.sort = next.length + 1;
    newNode.id = `mc-${newNode.sort}`;
    next.push(newNode);
    return next;
  }

  const found = findMajorCategoryNode(next, parentId);
  if (!found) throw new Error("未找到上级分类");
  newNode.level = found.node.level + 1;
  if (!found.node.children) found.node.children = [];
  newNode.sort = found.node.children.length + 1;
  newNode.id = `${parentId}-${newNode.sort}`;
  found.node.children.push(newNode);
  return next;
}

export function updateMajorCategoryNode(tree, id, payload) {
  const next = cloneDeep(tree);
  const found = findMajorCategoryNode(next, id);
  if (!found) throw new Error("未找到分类节点");
  const name = (payload.name || "").trim();
  if (!name) throw new Error("分类名称不能为空");
  found.node.name = name;
  if (payload.code != null && String(payload.code).trim()) {
    found.node.code = String(payload.code).trim();
  }
  if (payload.remark != null) found.node.remark = payload.remark;
  if (payload.sort != null) found.node.sort = payload.sort;
  if (payload.enabled != null) found.node.enabled = payload.enabled;
  return next;
}

export function deleteMajorCategoryNode(tree, id) {
  const next = cloneDeep(tree);
  const found = findMajorCategoryNode(next, id);
  if (!found) throw new Error("未找到分类节点");
  if (found.node.children && found.node.children.length) {
    throw new Error("请先删除下级分类");
  }
  const idx = found.siblings.findIndex((n) => n.id === id);
  if (idx >= 0) found.siblings.splice(idx, 1);
  return next;
}

export function toggleMajorCategoryEnabled(tree, id, enabled) {
  const next = cloneDeep(tree);
  const found = findMajorCategoryNode(next, id);
  if (!found) throw new Error("未找到分类节点");
  found.node.enabled = enabled;
  return next;
}

export function exportMajorCategoryCsv(tree = loadMajorCategoryTree(), filename) {
  const rows = flattenMajorCategoryTree(tree);
  const headers = ["层级", "专业编码", "分类名称", "完整路径", "是否叶子节点", "状态", "排序", "说明"];
  const lines = rows.map((r) =>
    [
      r.level,
      r.code || "",
      r.name,
      r.path,
      r.isLeaf ? "是" : "否",
      r.enabled ? "启用" : "停用",
      r.sort,
      r.remark,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  const name = filename || `专业分类_${Date.now()}.csv`;
  downloadCsvWithLog(csv, name, {
    moduleCode: "major-category",
    moduleName: "专业分类",
    moduleGroup: "人员信息台账",
    rowCount: rows.length,
    searchCriteria: "专业分类树",
  });
}

export function getParentCategoryName(id, tree = loadMajorCategoryTree()) {
  const found = findMajorCategoryNode(tree, id);
  return found && found.parent ? found.parent.name : "—";
}

export function countEmployeesForCategory(categoryId, employees = [], tree = loadMajorCategoryTree()) {
  if (!categoryId) return 0;
  return employees.filter((emp) =>
    matchMajorCategoryFilter(emp.majorCategory, categoryId, tree)
  ).length;
}

export function getEmployeesForCategory(categoryId, employees = [], tree = loadMajorCategoryTree()) {
  if (!categoryId) return [];
  return employees.filter((emp) =>
    matchMajorCategoryFilter(emp.majorCategory, categoryId, tree)
  );
}

export function buildCategoryTableRow(node, employees, tree = loadMajorCategoryTree()) {
  if (!node) return null;
  return {
    id: node.id,
    sort: node.sort || 0,
    name: node.name,
    code: node.code || "—",
    parentName: getParentCategoryName(node.id, tree),
    employeeCount: countEmployeesForCategory(node.id, employees, tree),
    remark: node.remark || "",
    enabled: node.enabled !== false,
  };
}

export function getCategoryListRows(selectedNode, employees, tree = loadMajorCategoryTree()) {
  if (!selectedNode) return [];
  const hasChildren = selectedNode.children && selectedNode.children.length;
  const nodes = hasChildren
    ? [...selectedNode.children].sort((a, b) => (a.sort || 0) - (b.sort || 0))
    : [selectedNode];
  return nodes.map((node) => buildCategoryTableRow(node, employees, tree)).filter(Boolean);
}

export function matchMajorCategoryFilter(recordPath, selectedId, tree = loadMajorCategoryTree()) {
  if (!selectedId) return true;
  if (!recordPath) return false;
  const selectedPath = getMajorCategoryPath(selectedId, tree);
  if (!selectedPath) return false;
  return recordPath === selectedPath || recordPath.startsWith(`${selectedPath} /`);
}

export const MAJOR_LEVEL_LABELS = {
  1: "一级（业务板块）",
  2: "二级（专业方向）",
  3: "三级（具体工种）",
};

export function getMajorLevelLabel(level) {
  return MAJOR_LEVEL_LABELS[level] || `第 ${level} 级`;
}

export function toCascaderOptions(tree = loadMajorCategoryTree()) {
  return tree.map((node) => {
    const option = {
      value: node.id,
      label: node.name,
      disabled: node.enabled === false,
    };
    if (node.children && node.children.length) {
      option.children = toCascaderOptions(node.children);
    }
    return option;
  });
}
