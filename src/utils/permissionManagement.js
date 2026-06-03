/**
 * 权限管理 — 角色、功能模块、组织机构层级与权限控制
 */

import { loadOrgTree, findOrgManagementNode } from "./orgManagement";
import { downloadCsvWithLog } from "./exportLogger";

const STORAGE_KEY = "ygxwfx_permission_management";

export const ROLE_LEVEL_OPTIONS = ["集团级", "省级", "地市级", "县级", "班组级"];

export const DATA_SCOPE_OPTIONS = [
  { label: "全部数据", value: "all" },
  { label: "本级及下级", value: "self_and_children" },
  { label: "仅本级", value: "self_only" },
  { label: "仅本人", value: "self_person" },
];

/** 角色数据范围（编辑弹窗下拉选项，参照权限方案） */
export const ROLE_DATA_SCOPE_OPTIONS = [
  { value: "ALL", label: "全省/全系统数据，无组织限制" },
  { value: "ASSIGNED_ORG_CHILD", label: "指定组织及下级" },
  {
    value: "CURRENT_ORG_CHILD",
    label: "当前组织及下级",
  },
  { value: "SELF", label: "只展示当前登录人的数据" },
];

function formatRoleDate(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.getFullYear()}年${String(dt.getMonth() + 1).padStart(2, "0")}月${String(dt.getDate()).padStart(2, "0")}日`;
}

export function getRoleDataScopeLabel(type) {
  const opt = ROLE_DATA_SCOPE_OPTIONS.find((o) => o.value === type);
  if (!opt) return type || "—";
  return opt.desc ? `${opt.label}（${opt.desc}）` : opt.label;
}

function normalizeDataScopeType(type) {
  const legacy = {
    REPORTER: "SELF",
    CURRENT_ORG: "CURRENT_ORG_CHILD",
    LOCAL_ORG_HQ: "ASSIGNED_ORG_CHILD",
  };
  return legacy[type] || type;
}

function mapLegacyDataScope(scope) {
  const map = {
    all: "ALL",
    self_and_children: "ASSIGNED_ORG_CHILD",
    self_only: "CURRENT_ORG_CHILD",
    self_person: "SELF",
    CURRENT_ORG_CHILD: "CURRENT_ORG_CHILD",
    ASSIGNED_ORG: "ASSIGNED_ORG_CHILD",
    SELF: "SELF",
    REPORTER: "SELF",
    CURRENT_ORG: "CURRENT_ORG_CHILD",
    LOCAL_ORG_HQ: "ASSIGNED_ORG_CHILD",
  };
  return map[scope] || scope || "ASSIGNED_ORG_CHILD";
}

export function normalizeRole(role) {
  const rawType = role.dataScopeType || mapLegacyDataScope(role.permissionDetail?.dataScope);
  const dataScopeType = normalizeDataScopeType(rawType);
  return {
    ...role,
    dataScopeType,
    dataScopeLabel: getRoleDataScopeLabel(dataScopeType),
    createTime: role.createTime || formatRoleDate(new Date()),
  };
}

export const OPERATION_TYPES = [
  { key: "view", label: "查看" },
  { key: "add", label: "新增" },
  { key: "edit", label: "编辑" },
  { key: "delete", label: "删除" },
  { key: "export", label: "导出" },
];

/** 系统功能模块树（与左侧菜单一致） */
export const SYSTEM_MODULE_TREE = [
  {
    id: "mod-sensing",
    name: "无感数据管理",
    children: [
      {
        id: "mod-sensing-config",
        name: "无感数据配置",
        children: [
          { id: "mod-data-access", name: "数据接入管理", path: "/data-access" },
          { id: "mod-data-config", name: "无感数据配置", path: "/data-config" },
          { id: "mod-data-custom", name: "无感数据自定义", path: "/data-custom" },
        ],
      },
      {
        id: "mod-sensing-basic",
        name: "无感基础数据管理",
        children: [
          { id: "mod-sensing-clean", name: "数据清洗", path: "/sensing-basic/clean" },
          { id: "mod-sensing-organize", name: "数据整理", path: "/sensing-basic/organize" },
          { id: "mod-sensing-output", name: "数据结果输出", path: "/sensing-basic/output" },
        ],
      },
      {
        id: "mod-sensing-multi",
        name: "多源数据管理",
        children: [
          {
            id: "mod-external-api",
            name: "外部输入API接口",
            children: [
              { id: "mod-api-receive", name: "数据接收与解析", path: "/external-api-receive" },
              { id: "mod-api-auth", name: "认证与授权", path: "/external-api-auth" },
              { id: "mod-api-transform", name: "数据处理与转换", path: "/external-api-transform" },
            ],
          },
          {
            id: "mod-interface-config",
            name: "接口配置",
            children: [
              { id: "mod-interface-server", name: "服务器端口配置", path: "/interface-config/server" },
              { id: "mod-interface-format", name: "请求数据格式设定", path: "/interface-config/format" },
            ],
          },
          {
            id: "mod-multi-source",
            name: "多源数据汇总",
            children: [
              { id: "mod-multi-source-collect", name: "数据汇集", path: "/multi-source-aggregation/collect" },
              { id: "mod-multi-source-display", name: "数据展示及导入导出", path: "/multi-source-aggregation/display" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mod-system",
    name: "系统管理",
    children: [
      {
        id: "mod-staff-ledger",
        name: "人员信息台账",
        children: [
          { id: "mod-staff-basic", name: "员工基本信息台账", path: "/staff-basic-ledger" },
          { id: "mod-staff-attendance", name: "考勤管理台账", path: "/staff-attendance-ledger" },
          { id: "mod-staff-assessment", name: "考勤评估台账", path: "/staff-assessment-ledger" },
          { id: "mod-behavior-mode", name: "行为模式设置信息", path: "/behavior-mode-settings" },
          { id: "mod-major-category", name: "专业分类", path: "/major-category" },
        ],
      },
      {
        id: "mod-org-ledger",
        name: "组织机构台账",
        children: [
          { id: "mod-org-management", name: "组织机构管理", path: "/org-management" },
          { id: "mod-org-relation", name: "组织机构关联配置", path: "/org-relation-config" },
          { id: "mod-staff-post", name: "人员与岗位关联配置", path: "/staff-post-relation-config" },
        ],
      },
      {
        id: "mod-permission",
        name: "权限管理",
        children: [
          { id: "mod-role-mgmt", name: "角色管理", path: "/role-management" },
          { id: "mod-role-hierarchy", name: "角色层级管理", path: "/role-hierarchy" },
          { id: "mod-role-user", name: "角色与用户关联", path: "/role-user-association" },
          { id: "mod-module-perm", name: "功能模块权限分配", path: "/module-permission-allocation" },
          { id: "mod-org-level-perm", name: "组织机构层级分配", path: "/org-level-permission" },
          { id: "mod-perm-control", name: "权限控制与分配", path: "/permission-control" },
        ],
      },
    ],
  },
];

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function flattenModules(nodes, list = []) {
  nodes.forEach((n) => {
    if (n.path) list.push({ id: n.id, name: n.name, path: n.path });
    if (n.children) flattenModules(n.children, list);
  });
  return list;
}

export function getAllModuleLeaves() {
  return flattenModules(SYSTEM_MODULE_TREE);
}

export function getModuleRowsWithGroup() {
  const rows = [];
  SYSTEM_MODULE_TREE.forEach((group) => {
    function walk(node, trail) {
      if (node.path) {
        rows.push({ id: node.id, name: node.name, path: node.path, group: trail.join(" / ") });
        return;
      }
      (node.children || []).forEach((child) => walk(child, [...trail, node.name]));
    }
    walk(group, []);
  });
  return rows;
}

function allModuleIds() {
  return getAllModuleLeaves().map((m) => m.id);
}

function allOperationKeys() {
  return OPERATION_TYPES.map((o) => o.key);
}

function buildDefaultPermissionDetail(allModules = true) {
  const modules = allModules ? allModuleIds() : [];
  const ops = {};
  modules.forEach((id) => {
    ops[id] = allOperationKeys();
  });
  return {
    pageIds: [...modules],
    operations: ops,
    dataScope: "self_and_children",
  };
}

function generateDefaultRoles() {
  const defs = [
    {
      id: "role-admin",
      name: "系统管理员",
      code: "SYS_ADMIN",
      dataScopeType: "ALL",
      createTime: "2025年12月09日",
      remark: "系统级配置与授权管理",
      sort: 1,
      permissionDetail: buildDefaultPermissionDetail(true),
    },
    {
      id: "role-biz-admin",
      name: "业务管理员",
      code: "BIZ_ADMIN",
      dataScopeType: "ASSIGNED_ORG_CHILD",
      createTime: "2026年05月25日",
      remark: "无感数据与业务台账维护",
      sort: 2,
      permissionDetail: buildDefaultPermissionDetail(false),
    },
    {
      id: "role-org-leader",
      name: "单位负责人",
      code: "ORG_LEADER",
      dataScopeType: "CURRENT_ORG_CHILD",
      createTime: "2026年02月10日",
      remark: "本单位数据查看与汇总",
      sort: 3,
      permissionDetail: {
        pageIds: ["mod-staff-basic", "mod-staff-attendance", "mod-staff-assessment", "mod-org-management"],
        operations: {
          "mod-staff-basic": ["view", "export"],
          "mod-staff-attendance": ["view", "export"],
          "mod-staff-assessment": ["view", "export"],
          "mod-org-management": ["view", "export"],
        },
        dataScope: "self_and_children",
      },
    },
    {
      id: "role-auditor",
      name: "审核人员",
      code: "AUDITOR",
      dataScopeType: "ASSIGNED_ORG_CHILD",
      createTime: "2026年02月10日",
      remark: "异常与修复审批",
      sort: 4,
      permissionDetail: {
        pageIds: ["mod-sensing-clean", "mod-staff-assessment"],
        operations: {
          "mod-sensing-clean": ["view", "edit"],
          "mod-staff-assessment": ["view", "edit"],
        },
        dataScope: "self_and_children",
      },
    },
    {
      id: "role-dashboard",
      name: "看板查看用户",
      code: "DASHBOARD_VIEWER",
      dataScopeType: "ALL",
      createTime: "2026年02月06日",
      remark: "统计分析只读",
      sort: 5,
      permissionDetail: {
        pageIds: ["mod-staff-attendance", "mod-staff-assessment"],
        operations: {
          "mod-staff-attendance": ["view"],
          "mod-staff-assessment": ["view"],
        },
        dataScope: "all",
      },
    },
    {
      id: "role-employee",
      name: "普通员工",
      code: "EMPLOYEE",
      dataScopeType: "SELF",
      createTime: "2026年02月04日",
      remark: "默认本人数据权限",
      sort: 6,
      permissionDetail: {
        pageIds: ["mod-staff-basic", "mod-staff-attendance"],
        operations: {
          "mod-staff-basic": ["view"],
          "mod-staff-attendance": ["view"],
        },
        dataScope: "self_person",
      },
    },
  ];
  return defs.map((item) =>
    normalizeRole({
      level: "省级",
      orgScope: "云南电网有限责任公司",
      enabled: true,
      parentId: null,
      ...item,
      dataScopeLabel: getRoleDataScopeLabel(item.dataScopeType),
    })
  );
}

const USER_NAMES = [
  "管理员",
  "张三",
  "李四",
  "王五",
  "赵六",
  "陈明",
  "刘芳",
  "周强",
  "吴敏",
  "郑华",
  "孙丽",
  "马超",
  "黄蓉",
  "林峰",
  "何静",
];

function generateDefaultUsers() {
  const orgTree = loadOrgTree();
  const orgNodes = [];
  function walk(nodes) {
    nodes.forEach((n) => {
      if (n.id !== 1) orgNodes.push(n);
      if (n.children) walk(n.children);
    });
  }
  walk(orgTree);

  return USER_NAMES.map((name, i) => {
    const org = orgNodes[i % orgNodes.length] || orgNodes[0];
    const isAdmin = i === 0;
    return {
      id: `user-${i + 1}`,
      username: isAdmin ? "admin" : `user${String(i).padStart(3, "0")}`,
      name,
      orgId: org ? org.id : 1,
      orgName: org ? org.name : "云南电网有限责任公司",
      deptPath: org ? org.name : "",
      phone: `138${String(10000000 + i).slice(-8)}`,
      enabled: true,
      roleIds: isAdmin
        ? ["role-admin"]
        : i % 5 === 0
          ? ["role-biz-admin"]
          : i % 5 === 1
            ? ["role-org-leader"]
            : i % 5 === 2
              ? ["role-auditor"]
              : i % 5 === 3
                ? ["role-dashboard"]
                : ["role-employee"],
    };
  });
}

function buildDefaultModuleAllocation(roles) {
  const allocation = {};
  const leaves = getAllModuleLeaves();
  roles.forEach((role) => {
    allocation[role.id] = {};
    leaves.forEach((m) => {
      allocation[role.id][m.id] = (role.permissionDetail.pageIds || []).includes(m.id);
    });
  });
  return allocation;
}

function buildDefaultOrgLevelPermissions() {
  const orgTree = loadOrgTree();
  const map = {};
  function walk(nodes, depth) {
    nodes.forEach((n) => {
      if (n.id === 1) {
        map[n.id] = {
          inherit: false,
          dataScope: "all",
          modules: Object.fromEntries(getAllModuleLeaves().map((m) => [m.id, true])),
          remark: "根机构默认全部模块",
        };
      } else if (depth <= 2) {
        map[n.id] = {
          inherit: true,
          dataScope: "self_and_children",
          modules: Object.fromEntries(
            getAllModuleLeaves().map((m) => [m.id, !m.id.startsWith("mod-perm") && !m.id.startsWith("mod-role")])
          ),
          remark: depth === 1 ? "省级单位继承并限制权限模块" : "二级单位按业务开放",
        };
      }
      if (n.children) walk(n.children, depth + 1);
    });
  }
  walk(orgTree, 0);
  return map;
}

function buildDefaultState() {
  const roles = generateDefaultRoles();
  const users = generateDefaultUsers();
  return {
    roles,
    users,
    moduleAllocation: buildDefaultModuleAllocation(roles),
    orgLevelPermissions: buildDefaultOrgLevelPermissions(),
    updatedAt: new Date().toISOString(),
  };
}

let cache = null;

function loadRaw() {
  if (cache) return cloneDeep(cache);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw);
      cache.roles = (cache.roles || []).map(normalizeRole);
      return cloneDeep(cache);
    }
  } catch (e) {
    console.warn("loadPermissionState failed", e);
  }
  cache = buildDefaultState();
  return cloneDeep(cache);
}

function saveRaw(state) {
  cache = cloneDeep({ ...state, updatedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  return cloneDeep(cache);
}

export function loadPermissionState() {
  return loadRaw();
}

export function savePermissionState(state) {
  return saveRaw(state);
}

export function resetPermissionState() {
  localStorage.removeItem(STORAGE_KEY);
  cache = null;
  return loadRaw();
}

export function getRoles() {
  return loadRaw().roles.sort((a, b) => a.sort - b.sort);
}

export function saveRoles(roles) {
  const state = loadRaw();
  state.roles = roles;
  state.moduleAllocation = buildDefaultModuleAllocation(roles);
  return saveRaw(state);
}

export function findRole(roles, id) {
  return roles.find((r) => r.id === id) || null;
}

export function createRole(payload) {
  const state = loadRaw();
  const id = `role-${Date.now()}`;
  const maxSort = state.roles.reduce((m, r) => Math.max(m, r.sort || 0), 0);
  const dataScopeType = payload.dataScopeType || "ASSIGNED_ORG_CHILD";
  const role = normalizeRole({
    id,
    name: payload.name,
    code: payload.code,
    level: payload.level || "班组级",
    orgScope: payload.orgScope || "按所属部门",
    enabled: payload.enabled !== false,
    remark: payload.remark || "",
    parentId: payload.parentId || null,
    sort: maxSort + 1,
    dataScopeType,
    dataScopeLabel: payload.dataScopeLabel || getRoleDataScopeLabel(dataScopeType),
    createTime: formatRoleDate(new Date()),
    permissionDetail: payload.permissionDetail || {
      pageIds: [],
      operations: {},
      dataScope: "self_only",
    },
  });
  state.roles.push(role);
  state.moduleAllocation[id] = Object.fromEntries(getAllModuleLeaves().map((m) => [m.id, false]));
  return saveRaw(state);
}

export function updateRole(id, payload) {
  const state = loadRaw();
  const idx = state.roles.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error("角色不存在");
  const next = { ...state.roles[idx], ...payload, id };
  if (payload.dataScopeType) {
    next.dataScopeLabel = getRoleDataScopeLabel(payload.dataScopeType);
  }
  state.roles[idx] = normalizeRole(next);
  if (payload.permissionDetail) {
    state.moduleAllocation[id] = Object.fromEntries(
      getAllModuleLeaves().map((m) => [m.id, (payload.permissionDetail.pageIds || []).includes(m.id)])
    );
  }
  return saveRaw(state);
}

export function deleteRole(id) {
  const state = loadRaw();
  const hasChildren = state.roles.some((r) => r.parentId === id);
  if (hasChildren) throw new Error("请先调整下级角色的上级关系");
  state.roles = state.roles.filter((r) => r.id !== id);
  state.users = state.users.map((u) => ({
    ...u,
    roleIds: (u.roleIds || []).filter((rid) => rid !== id),
  }));
  delete state.moduleAllocation[id];
  return saveRaw(state);
}

export function buildRoleHierarchyTree(roles) {
  const map = {};
  roles.forEach((r) => {
    map[r.id] = { ...r, children: [] };
  });
  const roots = [];
  roles.forEach((r) => {
    const node = map[r.id];
    if (r.parentId && map[r.parentId]) {
      map[r.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  function sortNodes(nodes) {
    nodes.sort((a, b) => a.sort - b.sort);
    nodes.forEach((n) => {
      if (n.children.length) sortNodes(n.children);
    });
  }
  sortNodes(roots);
  return roots;
}

export function updateRoleParent(roleId, parentId) {
  const state = loadRaw();
  if (roleId === parentId) throw new Error("不能将角色设为自己的上级");
  const role = state.roles.find((r) => r.id === roleId);
  if (!role) throw new Error("角色不存在");
  if (parentId) {
    const parent = state.roles.find((r) => r.id === parentId);
    if (!parent) throw new Error("上级角色不存在");
    let cur = parent;
    while (cur && cur.parentId) {
      if (cur.parentId === roleId) throw new Error("不能形成循环层级");
      cur = state.roles.find((r) => r.id === cur.parentId);
    }
  }
  role.parentId = parentId || null;
  return saveRaw(state);
}

export function moveRoleOrder(roleId, direction) {
  const state = loadRaw();
  const role = state.roles.find((r) => r.id === roleId);
  if (!role) throw new Error("角色不存在");
  const siblings = state.roles
    .filter((r) => r.parentId === role.parentId)
    .sort((a, b) => a.sort - b.sort);
  const idx = siblings.findIndex((r) => r.id === roleId);
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= siblings.length) throw new Error("已到边界");
  const other = siblings[targetIdx];
  const tmp = role.sort;
  role.sort = other.sort;
  other.sort = tmp;
  return saveRaw(state);
}

export function getUsers() {
  return loadRaw().users;
}

export function updateUserRoles(userId, roleIds) {
  const state = loadRaw();
  const user = state.users.find((u) => u.id === userId);
  if (!user) throw new Error("用户不存在");
  user.roleIds = [...roleIds];
  return saveRaw(state);
}

export function batchUpdateUserRoles(userIds, roleIds, mode = "replace") {
  const state = loadRaw();
  state.users.forEach((u) => {
    if (!userIds.includes(u.id)) return;
    if (mode === "replace") {
      u.roleIds = [...roleIds];
    } else if (mode === "append") {
      u.roleIds = Array.from(new Set([...(u.roleIds || []), ...roleIds]));
    } else if (mode === "remove") {
      u.roleIds = (u.roleIds || []).filter((id) => !roleIds.includes(id));
    }
  });
  return saveRaw(state);
}

export function getUsersByRole(roleId) {
  return getUsers().filter((u) => (u.roleIds || []).includes(roleId));
}

export function getModuleAllocation() {
  return loadRaw().moduleAllocation;
}

export function updateModuleAllocation(roleId, moduleId, enabled) {
  const state = loadRaw();
  if (!state.moduleAllocation[roleId]) {
    state.moduleAllocation[roleId] = {};
  }
  state.moduleAllocation[roleId][moduleId] = enabled;
  const role = state.roles.find((r) => r.id === roleId);
  if (role) {
    const pageIds = new Set(role.permissionDetail.pageIds || []);
    if (enabled) pageIds.add(moduleId);
    else pageIds.delete(moduleId);
    role.permissionDetail.pageIds = Array.from(pageIds);
  }
  return saveRaw(state);
}

export function batchUpdateModuleAllocation(roleId, moduleIds, enabled) {
  const state = loadRaw();
  moduleIds.forEach((mid) => {
    if (!state.moduleAllocation[roleId]) state.moduleAllocation[roleId] = {};
    state.moduleAllocation[roleId][mid] = enabled;
  });
  const role = state.roles.find((r) => r.id === roleId);
  if (role) {
    const pageIds = new Set(role.permissionDetail.pageIds || []);
    moduleIds.forEach((mid) => {
      if (enabled) pageIds.add(mid);
      else pageIds.delete(mid);
    });
    role.permissionDetail.pageIds = Array.from(pageIds);
  }
  return saveRaw(state);
}

export function getOrgLevelPermissions() {
  return loadRaw().orgLevelPermissions;
}

export function getOrgLevelPermission(orgId) {
  const map = getOrgLevelPermissions();
  return map[orgId] || { inherit: true, dataScope: "self_and_children", modules: {}, remark: "" };
}

export function updateOrgLevelPermission(orgId, payload) {
  const state = loadRaw();
  state.orgLevelPermissions[orgId] = {
    ...getOrgLevelPermission(orgId),
    ...payload,
  };
  return saveRaw(state);
}

export function updateOrgLevelModule(orgId, moduleId, enabled) {
  const state = loadRaw();
  const cur = getOrgLevelPermission(orgId);
  const modules = { ...cur.modules, [moduleId]: enabled };
  state.orgLevelPermissions[orgId] = { ...cur, modules, inherit: false };
  return saveRaw(state);
}

export function getRolePermissionDetail(roleId) {
  const role = findRole(getRoles(), roleId);
  if (!role) return { pageIds: [], operations: {}, dataScope: "self_only" };
  return cloneDeep(role.permissionDetail);
}

export function updateRolePermissionDetail(roleId, detail) {
  return updateRole(roleId, { permissionDetail: detail });
}

export function modulesToTreeOptions(nodes) {
  return nodes.map((n) => ({
    id: n.id,
    label: n.name,
    path: n.path,
    children: n.children ? modulesToTreeOptions(n.children) : undefined,
  }));
}

export function filterOrgTreeForPermission(tree, keyword) {
  const kw = (keyword || "").trim().toLowerCase();
  if (!kw) return tree;
  function filterNode(node) {
    const match =
      (node.name && node.name.toLowerCase().includes(kw)) ||
      (node.code && String(node.code).toLowerCase().includes(kw));
    if (!node.children || !node.children.length) return match ? { ...node } : null;
    const children = node.children.map(filterNode).filter(Boolean);
    if (match || children.length) return { ...node, children: children.length ? children : node.children };
    return null;
  }
  return tree.map(filterNode).filter(Boolean);
}

export function getRoleNameMap() {
  const map = {};
  getRoles().forEach((r) => {
    map[r.id] = r.name;
  });
  return map;
}

export function formatUserRoles(user, roleNameMap) {
  return (user.roleIds || []).map((id) => roleNameMap[id] || id).join("、") || "—";
}

export function exportPermissionCsv(rows, headers, filename, meta = {}) {
  const lines = rows.map((r) =>
    r.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: meta.moduleCode || "role-management",
    moduleName: meta.moduleName || "权限管理",
    moduleGroup: meta.moduleGroup || "权限管理",
    rowCount: rows.length,
    searchCriteria: meta.searchCriteria || "—",
  });
}

export function countPermissionStats() {
  const state = loadRaw();
  const enabledRoles = state.roles.filter((r) => r.enabled).length;
  const assignedUsers = state.users.filter((u) => (u.roleIds || []).length).length;
  return {
    roles: state.roles.length,
    enabledRoles,
    users: state.users.length,
    assignedUsers,
    modules: getAllModuleLeaves().length,
  };
}

export function getOrgNodeName(orgId) {
  const ctx = findOrgManagementNode(loadOrgTree(), orgId);
  return ctx ? ctx.node.name : "—";
}
