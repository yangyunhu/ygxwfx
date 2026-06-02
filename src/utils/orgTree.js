/** 组织机构树（与无感数据配置页共用） */
export function generateOrgTree() {
  const leaf = (id, name) => ({ id, name, icon: "el-icon-user" });
  const section = (id, name) => ({ id, name, icon: "el-icon-folder" });

  return [
    {
      id: 1,
      name: "云南电网有限责任公司",
      icon: "el-icon-data-analysis",
      children: [
        leaf(101, "领导班子"),
        leaf(102, "南方电网公司出资企业专职董事监事"),
        leaf(103, "免职未退休领导人员"),
        leaf(104, "云南电网公司出资企业专职董事监事"),
        leaf(105, "管理类职员"),
        leaf(106, "专家委员会"),
        leaf(107, "总师、副总师"),
        section(108, "办公室（党委办公室、董事会办公室、总经理办公室）"),
        section(109, "战略规划部"),
        {
          id: 110,
          name: "人力资源部",
          icon: "el-icon-folder",
          children: [
            leaf(1101, "部门负责人"),
            section(1102, "干部管理科"),
            section(1103, "干部监督科"),
            section(1104, "本部管理科"),
            section(1105, "人才管理科"),
            section(1106, "综合管理科"),
            section(1107, "劳动组织及用工管理科"),
            section(1108, "薪酬绩效科"),
            section(1109, "培训管理科"),
          ],
        },
        leaf(111, "社会保险事业管理局"),
        section(112, "政策研究与企业架构部（全面深化改革办公室）"),
        section(113, "计划与财务部（云南电网资产运营监控中心）"),
        section(114, "科技创新部"),
        section(115, "数字化部"),
        section(116, "市场营销部（客户服务部）"),
        section(117, "基建部"),
        section(118, "新兴与国际业务部"),
        section(119, "生产技术部"),
        section(120, "系统运行部（与电力调度控制中心合署）"),
        section(121, "供应链管理部"),
        section(122, "安全监管部（应急管理部）"),
        section(123, "审计部"),
        section(124, "法规部"),
        section(125, "党建工作部（企业文化部）"),
        section(126, "监督部（纪委办公室）"),
        section(127, "公司党委巡察工作领导小组办公室"),
        leaf(128, "公司党委巡察组"),
        section(129, "工会办公室（职工权益维护部）"),
      ],
    },
  ];
}

/** 判断记录是否属于选中组织（支持简称匹配） */
export function matchOrgFilter(recordOrgName, selectedOrg) {
  if (!selectedOrg) return true;
  if (!recordOrgName) return false;
  return (
    recordOrgName === selectedOrg ||
    recordOrgName.includes(selectedOrg) ||
    selectedOrg.includes(recordOrgName)
  );
}
