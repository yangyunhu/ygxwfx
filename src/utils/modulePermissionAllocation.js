/**
 * 功能模块权限分配 — 系统应用树与应用内角色
 */

const STORAGE_KEY = "ygxwfx_app_module_roles";

const APP_YGXWFX = "app-ygxwfx";

export const SYSTEM_APPLICATION_TREE = [
  {
    id: "app-yunnan-custom",
    name: "云南个性化应用",
    icon: "el-icon-folder-opened",
    children: [
      { id: APP_YGXWFX, name: "云南员工行为分析", icon: "el-icon-menu", isApp: true },
    ],
  },
];

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function findAppNode(tree, appId) {
  for (const node of tree || []) {
    if (node.id === appId && node.isApp) return node;
    if (node.children) {
      const found = findAppNode(node.children, appId);
      if (found) return found;
    }
  }
  return null;
}

function defaultRolesByApp() {
  return {
    [APP_YGXWFX]: [
      {
        id: "ar-city",
        appId: APP_YGXWFX,
        name: "市级管理员",
        description: "",
        appName: "云南员工行为分析",
        creator: "超级管理员1",
        createDate: "2025-10-13",
      },
      {
        id: "ar-county",
        appId: APP_YGXWFX,
        name: "县局管理员",
        description: "",
        appName: "云南员工行为分析",
        creator: "超级管理员1",
        createDate: "2025-10-13",
      },
      {
        id: "ar-province",
        appId: APP_YGXWFX,
        name: "省级管理员",
        description: "",
        appName: "云南员工行为分析",
        creator: "超级管理员1",
        createDate: "2025-10-13",
      },
    ],
  };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("load app module roles failed", e);
  }
  return defaultRolesByApp();
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function filterApplicationTree(tree, keyword) {
  const kw = (keyword || "").trim().toLowerCase();
  if (!kw) return tree;
  function walk(nodes) {
    return (nodes || [])
      .map((node) => {
        const children = walk(node.children);
        const match = (node.name || "").toLowerCase().includes(kw);
        if (match || children.length) return { ...node, children };
        return null;
      })
      .filter(Boolean);
  }
  return walk(cloneDeep(tree));
}

export function getAppName(appId) {
  const node = findAppNode(SYSTEM_APPLICATION_TREE, appId);
  return node ? node.name : "";
}

export function getAppRoles(appId) {
  const store = loadStore();
  const roles = cloneDeep(store[appId] || []);
  roles.forEach((role) => ensureRolePersonnel(role.id, role.name));
  return roles;
}

export function createAppRole(appId, payload) {
  const store = loadStore();
  const list = store[appId] || [];
  const appName = getAppName(appId) || payload.appName || "";
  const role = {
    id: `ar-${Date.now()}`,
    appId,
    name: payload.name,
    description: payload.description || "",
    appName,
    creator: payload.creator || "超级管理员1",
    createDate: payload.createDate || formatDate(new Date()),
  };
  store[appId] = [...list, role];
  saveStore(store);
  ensureRolePersonnel(role.id, role.name);
  return role;
}

export function updateAppRole(appId, roleId, payload) {
  const store = loadStore();
  const list = store[appId] || [];
  const idx = list.findIndex((r) => r.id === roleId);
  if (idx < 0) throw new Error("角色不存在");
  list[idx] = { ...list[idx], ...payload };
  store[appId] = list;
  saveStore(store);
  return list[idx];
}

export function deleteAppRole(appId, roleId) {
  const store = loadStore();
  store[appId] = (store[appId] || []).filter((r) => r.id !== roleId);
  saveStore(store);
}

export function deleteAppRoles(appId, roleIds) {
  const store = loadStore();
  const set = new Set(roleIds);
  store[appId] = (store[appId] || []).filter((r) => !set.has(r.id));
  saveStore(store);
}

export function formatDate(d = new Date()) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export const DEFAULT_SELECTED_APP_ID = APP_YGXWFX;

/** 权限配置弹窗 — 左侧应用导航树 */
export const PERMISSION_DIALOG_APP_TREE = [
  {
    id: "app-yunnan-custom",
    name: "云南个性化应用",
    icon: "el-icon-folder-opened",
    children: [
      {
        id: APP_YGXWFX,
        name: "云南员工行为分析",
        icon: "el-icon-folder-opened",
        children: [
          { id: "nav-ygxwfx-func", name: "员工行为分析", icon: "el-icon-menu", isResource: true },
        ],
      },
    ],
  },
];

/** 云南员工行为分析 — 全量功能资源树（与项目菜单一致） */
export const PROJECT_FUNCTION_TREE = [
  {
    id: "ygxwfx-root",
    name: "员工行为分析",
    children: [
      {
        id: "grp-sensing",
        name: "无感数据管理",
        children: [
          {
            id: "grp-sensing-config",
            name: "无感数据配置",
            children: [
              { id: "mod-data-access", name: "数据接入管理" },
              { id: "mod-data-config", name: "无感数据配置" },
              { id: "mod-data-custom", name: "无感数据自定义" },
            ],
          },
          {
            id: "grp-sensing-basic",
            name: "无感基础数据管理",
            children: [
              { id: "mod-sensing-clean", name: "数据清洗" },
              { id: "mod-sensing-organize", name: "数据整理" },
              { id: "mod-sensing-output", name: "数据结果输出" },
            ],
          },
          {
            id: "grp-sensing-multi",
            name: "多源数据管理",
            children: [
              {
                id: "grp-external-api",
                name: "外部输入API接口",
                children: [
                  { id: "mod-api-receive", name: "数据接收与解析" },
                  { id: "mod-api-auth", name: "认证与授权" },
                  { id: "mod-api-transform", name: "数据处理与转换" },
                ],
              },
              {
                id: "grp-interface-config",
                name: "接口配置",
                children: [
                  { id: "mod-interface-server", name: "服务器端口配置" },
                  { id: "mod-interface-format", name: "请求数据格式设定" },
                ],
              },
              {
                id: "grp-multi-source",
                name: "多源数据汇总",
                children: [
                  { id: "mod-multi-source-collect", name: "数据汇集" },
                  { id: "mod-multi-source-display", name: "数据展示及导入导出" },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "grp-staff",
        name: "人员信息台账",
        children: [
          { id: "mod-staff-basic", name: "员工基本信息台账" },
          { id: "mod-staff-attendance", name: "考勤管理台账" },
          { id: "mod-staff-assessment", name: "考勤评估台账" },
          { id: "mod-behavior-mode", name: "行为模式设置信息" },
          { id: "mod-major-category", name: "专业分类" },
        ],
      },
      {
        id: "grp-org",
        name: "组织机构台账",
        children: [
          { id: "mod-org-management", name: "组织机构管理" },
          { id: "mod-org-relation", name: "组织机构关联配置" },
          { id: "mod-staff-post", name: "人员与岗位关联配置" },
        ],
      },
      {
        id: "grp-permission",
        name: "权限管理",
        children: [
          { id: "mod-role-mgmt", name: "角色管理" },
          { id: "mod-role-hierarchy", name: "角色层级管理" },
          { id: "mod-role-user", name: "角色与用户关联" },
          { id: "mod-module-perm", name: "功能模块权限分配" },
          { id: "mod-org-level-perm", name: "组织机构层级分配" },
          { id: "mod-perm-control", name: "权限控制与分配" },
        ],
      },
      {
        id: "grp-log",
        name: "日志管理",
        children: [
          { id: "mod-login-log-content", name: "日志内容" },
          { id: "mod-login-log-query", name: "登录日志查询" },
          { id: "mod-login-log-mgmt", name: "日志管理" },
        ],
      },
      {
        id: "grp-abnormal",
        name: "异常数据修复记录",
        children: [
          { id: "mod-abnormal-processing", name: "数据质量检查及异常处置" },
          { id: "mod-data-repair", name: "数据修复记录" },
          { id: "mod-abnormal-disposal", name: "异常数据处置" },
        ],
      },
      {
        id: "grp-export",
        name: "数据导出记录查询",
        children: [
          { id: "mod-data-export", name: "数据导出功能" },
          { id: "mod-export-record", name: "导出记录查询" },
        ],
      },
    ],
  },
];

const DEFAULT_ROLE_PERMISSIONS = {
  "ar-city": ["mod-role-mgmt", "mod-login-log-mgmt", "mod-login-log-query", "mod-behavior-mode"],
  "ar-county": ["mod-role-mgmt", "mod-staff-basic", "mod-staff-attendance"],
  "ar-province": ["mod-role-mgmt", "mod-module-perm", "mod-perm-control", "mod-org-management"],
};

export function collectLeafIds(nodes, list = []) {
  (nodes || []).forEach((node) => {
    if (node.children && node.children.length) collectLeafIds(node.children, list);
    else list.push(node.id);
  });
  return list;
}

export function getAllProjectFunctionIds() {
  return collectLeafIds(PROJECT_FUNCTION_TREE);
}

export function getDefaultRolePermissionIds(roleId) {
  return DEFAULT_ROLE_PERMISSIONS[roleId] ? [...DEFAULT_ROLE_PERMISSIONS[roleId]] : [];
}

export function filterAuthorizedAppTree(tree, authorizedOnly, enabledLeafIds) {
  if (!authorizedOnly) return cloneDeep(tree);
  const enabled = new Set(enabledLeafIds || []);
  if (!enabled.size) return [];

  function walk(nodes) {
    return (nodes || [])
      .map((node) => {
        const children = walk(node.children);
        const isResource = node.isResource;
        const match = isResource && getAllProjectFunctionIds().some((id) => enabled.has(id));
        const isYgxwfxApp = node.id === APP_YGXWFX;
        if (match || children.length || (isYgxwfxApp && enabled.size)) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean);
  }
  return walk(cloneDeep(tree));
}

const PERSONNEL_STORAGE_KEY = "ygxwfx_app_role_personnel";

const ORG_PATH_ROOT = "组织机构/中国南方电网有限责任公司/云南电网有限责任公司";

function buildPerson(id, name, account, orgSuffix, createDate, registerDate = "", expiryDate = "") {
  return {
    id,
    name,
    account,
    registerDate,
    createDate,
    orgFullPath: `${ORG_PATH_ROOT}/${orgSuffix}`,
    expiryDate,
  };
}

function defaultPersonnelByRole() {
  return {
    "ar-city": [
      buildPerson("rp-city-1", "张*", "zhanghan@km.yn.csg.cn", "昆明供电局/盘龙供电局/人事部", "2023-10-13"),
      buildPerson("rp-city-2", "李*", "lixx@km.yn.csg.cn", "昆明供电局/西山供电局/办公室", "2023-11-05", "2023-11-01"),
      buildPerson("rp-city-3", "王*", "wangwu@km.yn.csg.cn", "昆明供电局/官渡供电局/数字化部", "2024-01-18"),
      buildPerson("rp-city-4", "赵*", "zhaoliu@km.yn.csg.cn", "昆明供电局/五华供电局/人力资源部", "2024-03-22", "", "2026-12-31"),
      buildPerson("rp-city-5", "陈*", "chenming@km.yn.csg.cn", "曲靖供电局/麒麟供电局/计划发展部", "2024-05-09"),
      buildPerson("rp-city-6", "刘*", "liufang@qj.yn.csg.cn", "曲靖供电局/沾益供电局/市场营销部", "2024-06-14", "2024-06-10"),
      buildPerson("rp-city-7", "周*", "zhouqiang@yx.yn.csg.cn", "玉溪供电局/红塔供电局/生产技术部", "2024-08-20"),
      buildPerson("rp-city-8", "吴*", "wumin@pe.yn.csg.cn", "普洱供电局/思茅供电局/基建部", "2024-09-03", "", "2025-12-31"),
      buildPerson("rp-city-9", "郑*", "zhenghua@lc.yn.csg.cn", "临沧供电局/临翔供电局/系统运行部", "2024-10-11"),
      buildPerson("rp-city-10", "孙*", "sunli@bs.yn.csg.cn", "保山供电局/隆阳供电局/安全监管部", "2025-01-06"),
    ],
    "ar-county": [
      buildPerson("rp-county-1", "马*", "machao@km.yn.csg.cn", "昆明供电局/盘龙供电局/综合部", "2023-12-01"),
      buildPerson("rp-county-2", "黄*", "huangrong@km.yn.csg.cn", "昆明供电局/盘龙供电局/财务部", "2024-02-15"),
      buildPerson("rp-county-3", "林*", "linfeng@km.yn.csg.cn", "昆明供电局/西山供电局/人事部", "2024-04-08"),
      buildPerson("rp-county-4", "何*", "hejing@km.yn.csg.cn", "曲靖供电局/麒麟供电局/办公室", "2024-07-19"),
      buildPerson("rp-county-5", "杨*", "yangbo@qj.yn.csg.cn", "曲靖供电局/马龙供电局/数字化部", "2024-11-25", "", "2026-06-30"),
      buildPerson("rp-county-6", "徐*", "xujing@yx.yn.csg.cn", "玉溪供电局/江川供电局/人力资源部", "2025-02-18"),
    ],
    "ar-province": [
      buildPerson("rp-prov-1", "方*", "fangxx@yn.csg.cn", "本部/人力资源部/干部管理科", "2023-08-15"),
      buildPerson("rp-prov-2", "申*", "shenyh@yn.csg.cn", "本部/人力资源部/培训管理科", "2023-09-20"),
      buildPerson("rp-prov-3", "吕*", "lvbb@yn.csg.cn", "本部/数字化部/数据管理科", "2024-01-10"),
      buildPerson("rp-prov-4", "丁*", "dingyi@yn.csg.cn", "本部/办公室/综合管理一科", "2024-03-05", "2024-03-01"),
      buildPerson("rp-prov-5", "韩*", "haner@yn.csg.cn", "本部/计划与财务部/预算管理科", "2024-06-28"),
      buildPerson("rp-prov-6", "冯*", "fengsan@yn.csg.cn", "本部/市场营销部/营业科", "2024-10-30", "", "2027-12-31"),
      buildPerson("rp-prov-7", "朱*", "zhuqi@yn.csg.cn", "本部/生产技术部/技术管理科", "2025-01-22"),
    ],
  };
}

const MOCK_SURNAMES = ["张", "李", "王", "赵", "陈", "刘", "周", "吴", "郑", "孙", "马", "黄", "林", "何", "杨"];
const MOCK_GIVEN = ["伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "艳", "军", "杰", "婷", "浩", "鹏", "琳"];
const MOCK_ORG_SUFFIXES = [
  "昆明供电局/盘龙供电局/人事部",
  "昆明供电局/西山供电局/办公室",
  "昆明供电局/官渡供电局/数字化部",
  "曲靖供电局/麒麟供电局/计划发展部",
  "玉溪供电局/红塔供电局/生产技术部",
  "本部/人力资源部/干部管理科",
  "本部/数字化部/数据管理科",
  "本部/办公室/综合管理一科",
  "本部/计划与财务部/预算管理科",
  "大理供电局/大理供电局/市场营销部",
];

const PERSONNEL_TEMPLATE_BY_NAME = {
  市级管理员: "ar-city",
  县局管理员: "ar-county",
  省级管理员: "ar-province",
  业务管理员: "biz-admin",
  单位负责人: "org-leader",
  审核人员: "auditor",
  看板查看用户: "dashboard",
  普通员工: "employee",
};

function hashCode(str) {
  let h = 0;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function clonePersonnelWithRoleId(roleId, list) {
  return list.map((person, index) => ({
    ...person,
    id: `${roleId}-p${index + 1}`,
  }));
}

function generateMockPersonnelForRole(roleId, roleName = "") {
  const seed = hashCode(`${roleId}:${roleName}`);
  const count = 6 + (seed % 4);
  const accountPrefix = (roleName || "user").replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "").slice(0, 6) || "user";
  const list = [];

  for (let i = 0; i < count; i += 1) {
    const idx = (seed + i * 7) % MOCK_SURNAMES.length;
    const given = MOCK_GIVEN[(seed + i * 3) % MOCK_GIVEN.length];
    const surname = MOCK_SURNAMES[idx];
    const org = MOCK_ORG_SUFFIXES[(seed + i) % MOCK_ORG_SUFFIXES.length];
    const year = 2023 + ((seed + i) % 3);
    const month = String(((seed + i * 2) % 12) + 1).padStart(2, "0");
    const day = String(((seed + i * 5) % 28) + 1).padStart(2, "0");
    const createDate = `${year}-${month}-${day}`;
    const hasRegister = (seed + i) % 3 !== 0;
    const hasExpiry = (seed + i) % 4 === 0;
    list.push(
      buildPerson(
        `${roleId}-gen-${i + 1}`,
        `${surname}${given.charAt(0)}*`,
        `${accountPrefix}${i + 1}@yn.csg.cn`,
        org,
        createDate,
        hasRegister ? `${year - 1}-${month}-${day}` : "",
        hasExpiry ? `${year + 2}-12-31` : ""
      )
    );
  }
  return list;
}

function buildPersonnelFromTemplate(roleId, templateKey) {
  const defaults = defaultPersonnelByRole();
  if (defaults[templateKey]) {
    return clonePersonnelWithRoleId(roleId, defaults[templateKey]);
  }

  const templateMap = {
    "biz-admin": [
      buildPerson("", "张*", "zhangbiz@yn.csg.cn", "本部/数字化部/应用开发科", "2023-05-12", "2023-05-01"),
      buildPerson("", "李*", "libiz@yn.csg.cn", "本部/人力资源部/劳动组织及用工管理科", "2023-08-20"),
      buildPerson("", "王*", "wangbiz@yn.csg.cn", "昆明供电局/盘龙供电局/数字化部", "2024-02-14", "", "2026-12-31"),
      buildPerson("", "赵*", "zhaobiz@yn.csg.cn", "曲靖供电局/麒麟供电局/计划发展部", "2024-04-09"),
      buildPerson("", "陈*", "chenbiz@yn.csg.cn", "玉溪供电局/红塔供电局/人力资源部", "2024-06-18", "2024-06-15"),
      buildPerson("", "刘*", "liubiz@yn.csg.cn", "本部/办公室/综合管理二科", "2024-09-25"),
      buildPerson("", "周*", "zhoubiz@yn.csg.cn", "大理供电局/大理供电局/数字化部", "2025-01-08"),
    ],
    "org-leader": [
      buildPerson("", "孙*", "sunleader@yn.csg.cn", "昆明供电局/领导班子", "2023-03-10"),
      buildPerson("", "吴*", "wuleader@km.yn.csg.cn", "曲靖供电局/领导班子", "2023-07-22"),
      buildPerson("", "郑*", "zhengleader@qj.yn.csg.cn", "玉溪供电局/领导班子", "2024-01-16", "", "2027-06-30"),
      buildPerson("", "马*", "maleader@yx.yn.csg.cn", "普洱供电局/领导班子", "2024-05-30"),
      buildPerson("", "黄*", "huangleader@pe.yn.csg.cn", "临沧供电局/领导班子", "2024-11-12"),
    ],
    auditor: [
      buildPerson("", "何*", "heaudit@yn.csg.cn", "本部/人力资源部/干部监督科", "2023-09-08"),
      buildPerson("", "林*", "linaudit@yn.csg.cn", "本部/审计部/审计科", "2024-02-28"),
      buildPerson("", "杨*", "yangaudit@yn.csg.cn", "昆明供电局/盘龙供电局/财务部", "2024-06-03"),
      buildPerson("", "徐*", "xuaudit@km.yn.csg.cn", "曲靖供电局/麒麟供电局/财务部", "2024-10-19"),
      buildPerson("", "韩*", "hanaudit@qj.yn.csg.cn", "玉溪供电局/红塔供电局/财务部", "2025-02-07"),
    ],
    dashboard: [
      buildPerson("", "冯*", "fengview@yn.csg.cn", "本部/计划与财务部/资产管理科", "2024-01-05"),
      buildPerson("", "丁*", "dingview@yn.csg.cn", "本部/市场营销部/营业科", "2024-04-21"),
      buildPerson("", "朱*", "zhuview@yn.csg.cn", "昆明供电局/西山供电局/市场营销部", "2024-08-11"),
      buildPerson("", "秦*", "qinview@km.yn.csg.cn", "曲靖供电局/沾益供电局/生产技术部", "2024-12-02"),
    ],
    employee: [
      buildPerson("", "许*", "xuemp@km.yn.csg.cn", "昆明供电局/盘龙供电局/综合管理科", "2023-11-18"),
      buildPerson("", "沈*", "shenemp@km.yn.csg.cn", "昆明供电局/官渡供电局/运维班", "2024-03-07"),
      buildPerson("", "曾*", "zengemp@km.yn.csg.cn", "曲靖供电局/麒麟供电局/营业班", "2024-07-15"),
      buildPerson("", "彭*", "pengemp@qj.yn.csg.cn", "玉溪供电局/江川供电局/检修班", "2024-10-28"),
      buildPerson("", "吕*", "lvemp@yx.yn.csg.cn", "普洱供电局/思茅供电局/客服班", "2025-01-20"),
      buildPerson("", "苏*", "suemp@pe.yn.csg.cn", "临沧供电局/临翔供电局/配电班", "2025-03-05"),
    ],
  };

  const template = templateMap[templateKey];
  if (template) return clonePersonnelWithRoleId(roleId, template);
  return generateMockPersonnelForRole(roleId, templateKey);
}

export function ensureRolePersonnel(roleId, roleName = "") {
  const store = loadPersonnelStore();
  if (store[roleId] && store[roleId].length) return cloneDeep(store[roleId]);

  const templateKey = PERSONNEL_TEMPLATE_BY_NAME[roleName];
  const defaults = defaultPersonnelByRole();
  const list = templateKey && defaults[templateKey]
    ? clonePersonnelWithRoleId(roleId, defaults[templateKey])
    : templateKey
      ? buildPersonnelFromTemplate(roleId, templateKey)
      : generateMockPersonnelForRole(roleId, roleName);

  store[roleId] = list;
  savePersonnelStore(store);
  return cloneDeep(list);
}

function loadPersonnelStore() {
  let store;
  try {
    const raw = localStorage.getItem(PERSONNEL_STORAGE_KEY);
    if (raw) store = JSON.parse(raw);
  } catch (e) {
    console.warn("load role personnel failed", e);
  }
  if (!store) {
    store = defaultPersonnelByRole();
  } else {
    const defaults = defaultPersonnelByRole();
    Object.keys(defaults).forEach((key) => {
      if (!store[key] || !store[key].length) store[key] = cloneDeep(defaults[key]);
    });
  }
  return store;
}

function savePersonnelStore(store) {
  localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(store));
}

export function getRolePersonnel(roleId, roleName = "") {
  return ensureRolePersonnel(roleId, roleName);
}

export function deleteRolePersonnel(roleId, personIds) {
  const store = loadPersonnelStore();
  const set = new Set(personIds);
  store[roleId] = (store[roleId] || []).filter((p) => !set.has(p.id));
  savePersonnelStore(store);
}

export function addRolePersonnel(roleId, person) {
  const store = loadPersonnelStore();
  const list = store[roleId] || [];
  list.push({
    id: `rp-${Date.now()}`,
    registerDate: "",
    expiryDate: "",
    createDate: formatDate(new Date()),
    ...person,
  });
  store[roleId] = list;
  savePersonnelStore(store);
}
