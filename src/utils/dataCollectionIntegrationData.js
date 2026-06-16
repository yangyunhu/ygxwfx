/**
 * 数据采集与整合 — 模拟数据
 */
import { UNIT_OPTIONS } from "./behaviorOverviewData";

export const DATA_SOURCE_OPTIONS = [
  { label: "业务系统", value: "business" },
  { label: "人事系统", value: "hr" },
  { label: "考勤系统", value: "attendance" },
  { label: "外部接口", value: "external" },
];

export const DATA_RANGE_OPTIONS = [
  { label: "全部范围", value: "all" },
  { label: "全省", value: "province" },
  { label: "本单位", value: "unit" },
  { label: "本部门", value: "department" },
];

export const COLLECTION_SPECIALTY_OPTIONS = [
  "通讯",
  "发电",
  "输电",
  "营销",
  "配电",
  "营配",
  "调度",
  "电网建设",
  "信息",
  "变电",
  "物流",
  "安监",
];

export const INTEGRATION_UNIT_OPTIONS = [
  { label: "全部单位", value: "" },
  ...UNIT_OPTIONS.filter((u) => u.value !== "all"),
];

export const INTEGRATION_DEPARTMENT_OPTIONS = [
  { label: "全部部门", value: "" },
  { label: "运维部", value: "运维部" },
  { label: "安全部", value: "安全部" },
  { label: "人力资源部", value: "人力资源部" },
  { label: "市场营销部", value: "市场营销部" },
  { label: "生产技术部", value: "生产技术部" },
  { label: "数字化部", value: "数字化部" },
];

export const INTEGRATION_TEAM_OPTIONS = [
  { label: "全部班组", value: "" },
  { label: "电气一班", value: "电气一班" },
  { label: "安全班组", value: "安全班组" },
  { label: "运维一组", value: "运维一组" },
  { label: "营销服务班", value: "营销服务班" },
  { label: "配电抢修班", value: "配电抢修班" },
];

export const INTEGRATION_SPECIALTY_OPTIONS = [
  { label: "全部专业", value: "" },
  ...COLLECTION_SPECIALTY_OPTIONS.map((s) => ({ label: s, value: s })),
];

export const DEFAULT_COLLECTION_QUERY = {
  dataSource: "business",
  dataRange: "all",
  specialties: [],
};

export const DEFAULT_INTEGRATION_QUERY = {
  unit: "",
  department: "",
  team: "",
  specialty: "",
  personName: "",
};

const SOURCE_LABEL = Object.fromEntries(DATA_SOURCE_OPTIONS.map((o) => [o.value, o.label]));
const RANGE_LABEL = Object.fromEntries(DATA_RANGE_OPTIONS.map((o) => [o.value, o.label]));

export function generateCollectionRows() {
  return [
    { id: 1, dataSource: "business", dataRange: "all", specialty: "信息", status: "启用" },
    { id: 2, dataSource: "hr", dataRange: "unit", specialty: "变电", status: "启用" },
    { id: 3, dataSource: "attendance", dataRange: "department", specialty: "营销", status: "停用" },
    { id: 4, dataSource: "external", dataRange: "province", specialty: "输电", status: "启用" },
  ].map((row) => ({
    ...row,
    dataSourceLabel: SOURCE_LABEL[row.dataSource],
    dataRangeLabel: row.dataRange === "all" ? "—" : RANGE_LABEL[row.dataRange],
  }));
}

export function filterCollectionRows(rows, query = {}) {
  const { dataSource, dataRange, specialties = [] } = query;
  return rows.filter((row) => {
    if (dataSource && row.dataSource !== dataSource) return false;
    if (dataRange && dataRange !== "all" && row.dataRange !== dataRange) return false;
    if (specialties.length && !specialties.includes(row.specialty)) return false;
    return true;
  });
}

export function generateIntegrationRows() {
  const unitLabel = "XXXXX公司";
  return [
    { id: 1, unit: unitLabel, department: "运维部", team: "电气一班", name: "张三", specialty: "电气" },
    { id: 2, unit: unitLabel, department: "安全部", team: "安全班组", name: "李四", specialty: "安全" },
    { id: 3, unit: unitLabel, department: "市场营销部", team: "营销服务班", name: "王五", specialty: "营销" },
    { id: 4, unit: unitLabel, department: "生产技术部", team: "运维一组", name: "赵六", specialty: "变电" },
    { id: 5, unit: unitLabel, department: "数字化部", team: "电气一班", name: "钱七", specialty: "信息" },
  ];
}

export function filterIntegrationRows(rows, query = {}) {
  const { unit, department, team, specialty, personName } = query;
  const kw = (personName || "").trim();
  return rows.filter((row) => {
    if (unit && !row.unit.includes(unit) && row.unit !== unit) {
      const unitOpt = INTEGRATION_UNIT_OPTIONS.find((o) => o.value === unit);
      if (unitOpt && unitOpt.label !== row.unit) return false;
    }
    if (department && row.department !== department) return false;
    if (team && row.team !== team) return false;
    if (specialty && row.specialty !== specialty) return false;
    if (kw && !row.name.includes(kw)) return false;
    return true;
  });
}

export function dataSourceLabel(value) {
  return SOURCE_LABEL[value] || value;
}

export function dataRangeLabel(value) {
  if (!value || value === "all") return "—";
  return RANGE_LABEL[value] || value;
}
