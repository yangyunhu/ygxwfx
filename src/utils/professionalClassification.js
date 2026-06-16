/**
 * 专业分类树（云南电网岗位专业分类体系）
 */

function leaf(name) {
  return { name };
}

function branch(name, children) {
  return { name, children };
}

export const PROFESSIONAL_CLASSIFICATION_TREE = [
  branch("电网规划", [leaf("系统规划"), leaf("可研评审"), leaf("接入方案评审")]),
  branch("电网建设", [
    branch("基建项目建设管理", [
      leaf("110kV及以上基建项目建设管理"),
      leaf("35kV及以下基建项目建设管理"),
    ]),
    leaf("基建项目初步设计评审管理"),
    leaf("生产项目管理"),
    leaf("工程质量监督"),
    leaf("工程定额管理"),
  ]),
  branch("电力调度", [
    branch("电力调度运行", [
      leaf("电力调度运行"),
      leaf("电网设备监控运行"),
      leaf("配网调控运行"),
    ]),
    leaf("配网抢修指挥"),
    leaf("运行方式"),
    leaf("继电保护"),
    branch("调度自动化", [leaf("主网调度自动化"), leaf("配网调度自动化")]),
    leaf("电力监控系统网络安全"),
    leaf("发电调度"),
    leaf("水库调度"),
  ]),
  branch("运维检修", [
    branch("输电", [
      leaf("输电线路运行维护及检修"),
      leaf("输电电缆运行维护及检修"),
      leaf("输电带电作业"),
      leaf("输电专业技术"),
    ]),
    branch("变电", [
      leaf("有人值守变电站运行与维护"),
      leaf("变电站调试"),
      leaf("无人值守变电站运行与维护"),
      leaf("变电站运行维护"),
      leaf("站用自动化及站用电源运维"),
      leaf("高压试验、仪表试验、化验"),
      leaf("变电一次设备检修"),
      leaf("变电专业技术"),
    ]),
    branch("配电", [
      leaf("城区配电线路及设备运行维护与检修"),
      leaf("城区配电电缆运行维护及检修"),
      leaf("配网设备带电作业"),
      leaf("配网自动化调试及试验"),
      leaf("乡镇及农村10(20)kV配电线路运行及维护"),
      leaf("乡镇及农村0.4kV配电线路运行及维护"),
    ]),
  ]),
  branch("电力营销", [
    branch("营业", [leaf("抄表运维"), leaf("电费核对与账务")]),
    branch("计量", [leaf("室内检定"), leaf("现场校验"), leaf("计量自动化")]),
    leaf("乡镇及农村营销"),
    leaf("营销专业技术"),
    branch("服务", [
      leaf("服务调度"),
      leaf("营业厅服务"),
      leaf("业扩报装"),
      leaf("95598坐席服务"),
      leaf("抄表核电"),
      leaf("用电检查与台区经理"),
      leaf("智能用电"),
      leaf("营销数据及电子渠道服务"),
      leaf("综合能源业务推广"),
    ]),
  ]),
  branch("信息通信", [
    branch("信息", [
      branch("信息专业技术管理", [
        leaf("信息化规划"),
        leaf("信息化技术管理"),
        leaf("管理业务信息化项目管理"),
      ]),
      leaf("信息系统建设"),
      leaf("信息系统运行"),
      leaf("数据资产管理"),
      leaf("网络安全管理"),
    ]),
    branch("通信", [leaf("通信专业管理"), leaf("通信调度"), leaf("通信运维检修")]),
  ]),
  branch("物资", [
    leaf("物资计划与采购管理"),
    leaf("合同及履约管理"),
    leaf("供应商管理"),
    leaf("品控管理"),
    leaf("仓储配送与逆向物资"),
    leaf("物资基础管理"),
  ]),
  branch("调峰调频发电", [
    branch("常规水电机组", [
      leaf("机组运行"),
      leaf("机组检修"),
      leaf("开关站运维"),
      leaf("水工运维"),
    ]),
    branch("抽水蓄能机组", [
      leaf("机组运行"),
      leaf("机组检修"),
      leaf("开关站运维"),
      leaf("水工运维"),
    ]),
  ]),
  branch("经营管理", [leaf("职能管理"), leaf("业务支撑和实施机构管理与综合类专业技术")]),
  branch("后勤保障", [leaf("车辆"), leaf("其他辅助人员")]),
];

function assignIds(nodes, prefix = "prof") {
  return nodes.map((n, i) => {
    const id = `${prefix}-${i}`;
    const node = { id, name: n.name };
    if (n.children && n.children.length) {
      node.children = assignIds(n.children, id);
    }
    return node;
  });
}

export const PROFESSIONAL_CLASSIFICATION_TREE_WITH_ID = assignIds(
  PROFESSIONAL_CLASSIFICATION_TREE
);

export function professionalToCascaderOptions(nodes = PROFESSIONAL_CLASSIFICATION_TREE_WITH_ID) {
  return nodes.map((n) => {
    const opt = { value: n.name, label: n.name };
    if (n.children && n.children.length) {
      opt.children = professionalToCascaderOptions(n.children);
    }
    return opt;
  });
}

/** 扁平叶子：含完整路径 */
export function flattenProfessionalLeaves(
  nodes = PROFESSIONAL_CLASSIFICATION_TREE_WITH_ID,
  trail = []
) {
  const list = [];
  nodes.forEach((n) => {
    const path = [...trail, n.name];
    if (!n.children || !n.children.length) {
      list.push({
        id: n.id,
        name: n.name,
        path,
        pathText: path.join(" / "),
        level1: path[0] || "",
        level2: path[1] || "",
        level3: path[2] || "",
        level4: path[3] || "",
      });
    } else {
      list.push(...flattenProfessionalLeaves(n.children, path));
    }
  });
  return list;
}

export function getProfessionalLevel1Options() {
  return PROFESSIONAL_CLASSIFICATION_TREE_WITH_ID.map((n) => n.name);
}

/** 图二筛选默认：运维检修 / 变电 / 变电站运行维护 */
export const DEFAULT_PROFESSIONAL_PATH = ["运维检修", "变电", "变电站运行维护"];

export function formatProfessionalPath(path) {
  if (!path || !path.length) return "全部专业";
  return Array.isArray(path) ? path.join(" / ") : String(path);
}

/** 路径数组是否匹配筛选（前缀匹配） */
export function matchProfessionalPath(itemPathText, filterPath) {
  if (!filterPath || !filterPath.length) return true;
  const prefix = Array.isArray(filterPath) ? filterPath.join(" / ") : filterPath;
  return (itemPathText || "").startsWith(prefix);
}

/** el-tree 展示用 */
export function getProfessionalTreeForDisplay() {
  return PROFESSIONAL_CLASSIFICATION_TREE_WITH_ID;
}
