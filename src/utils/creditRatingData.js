/**
 * 信用评级数据管理 — 模拟数据
 */

import { generateOrgTree } from "./orgTree";
import { findOrgNodeById, rowMatchesOrgFilter } from "./workDurationData";
import { UNIT_OPTIONS } from "./behaviorOverviewData";

export { findOrgNodeById, rowMatchesOrgFilter };

export function getCreditRatingOrgTree() {
  return generateOrgTree();
}

const NAMES = ["张三", "李四", "王五", "赵六", "陈强", "刘洋", "周敏", "吴磊", "郑华", "孙丽"];
const POSITIONS = ["班组长", "专责", "高级作业员", "作业员", "工程师", "技术员"];
const PROFESSIONS = ["人资", "安监", "营销", "生产", "财务"];
const BEHAVIOR_POS = ["积极参加培训", "主动完成攻坚任务", "提出合理化建议", "安全履职表现突出"];
const BEHAVIOR_NEG = ["A类违章", "B类违章", "迟到早退", "未戴安全帽", "违反操作规程"];
const GRADES = ["A级", "B级", "C级", "D级"];
const REPAIR_SOURCES = ["日常评价", "年度评价", "专项评价"];
const REPAIR_CATEGORIES = ["行为修复", "分值修复", "等级修复"];
const STATUSES = ["待提交", "待审核", "已完成"];
const RESULT_SOURCES = ["系统自动评价", "人工录入", "批量导入", "年度汇算"];

const UNITS = UNIT_OPTIONS.filter((u) => u.value !== "all");
const DEPT_PATHS = [
  "云南电网/昆明供电局/安监部/运维一组",
  "云南电网/曲靖供电局/人资部/综合管理科",
  "云南电网/玉溪供电局/营销部/客户服务班",
  "云南电网/红河供电局/生产部/配电抢修班",
  "云南电网/大理供电局/数字化部/系统运维科",
  "云南电网/楚雄供电局/安监部/安全监管科",
  "云南电网/昭通供电局/财务部/核算中心",
  "云南电网/丽江供电局/生产技术部/调度运行班",
];

const ORG_IDS = [110, 115, 116, 119, 120, 122, 113, 117, 1101, 1102, 108, 109];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function filterByOrg(rows, checkedOrgKeys, orgTree) {
  if (!checkedOrgKeys.length) return rows;
  return rows.filter((row) => rowMatchesOrgFilter(row, checkedOrgKeys, orgTree));
}

/** 员工信用基础数据维护 — 100 条 */
export function generateBasicCreditRows() {
  const rows = [];
  for (let i = 0; i < 100; i += 1) {
    const seed = hashSeed(`basic-${i}`);
    const isPositive = i % 3 !== 1;
    const unit = UNITS[i % UNITS.length];
    rows.push({
      id: i + 1,
      name: NAMES[i % NAMES.length],
      orgPath: DEPT_PATHS[i % DEPT_PATHS.length],
      unitName: unit.label,
      behaviorCategory: isPositive ? "正向" : "负向",
      behaviorName: isPositive
        ? BEHAVIOR_POS[i % BEHAVIOR_POS.length]
        : BEHAVIOR_NEG[i % BEHAVIOR_NEG.length],
      profession: PROFESSIONS[i % PROFESSIONS.length],
      score: isPositive ? 5 + (seed % 11) : -(3 + (seed % 8)),
      orgId: ORG_IDS[i % ORG_IDS.length],
    });
  }
  return rows;
}

export function filterBasicCreditRows(rows, query = {}, orgFilter = {}) {
  const { behaviorCategory = "all", behaviorName = "", profession = "all" } = query;
  let result = filterByOrg(rows, orgFilter.checkedOrgKeys || [], orgFilter.orgTree || []);
  if (behaviorCategory !== "all") {
    result = result.filter((r) => r.behaviorCategory === behaviorCategory);
  }
  if (behaviorName) result = result.filter((r) => r.behaviorName.includes(behaviorName));
  if (profession !== "all") result = result.filter((r) => r.profession === profession);
  return result;
}

export const DEFAULT_BASIC_QUERY = {
  behaviorCategory: "all",
  behaviorName: "",
  profession: "all",
};

/** 信用评级结果台账 — 100 条 */
export function generateRatingResultRows() {
  const rows = [];
  for (let i = 0; i < 100; i += 1) {
    const seed = hashSeed(`result-${i}`);
    const score = 55 + (seed % 46);
    const gradeIdx = score >= 90 ? 0 : score >= 75 ? 1 : score >= 60 ? 2 : 3;
    const unit = UNITS[i % UNITS.length];
    rows.push({
      id: i + 1,
      name: NAMES[i % NAMES.length],
      employeeId: `YG${String(10001 + i).padStart(5, "0")}`,
      department: DEPT_PATHS[i % DEPT_PATHS.length].split("/").slice(-2).join("/"),
      position: POSITIONS[i % POSITIONS.length],
      evalYear: i % 3 === 0 ? "2026" : i % 3 === 1 ? "2025" : "2024",
      resultSource: RESULT_SOURCES[i % RESULT_SOURCES.length],
      creditScore: score,
      creditGrade: GRADES[gradeIdx],
      behaviorCategory: i % 3 !== 1 ? "正向" : "负向",
      repairCategory: REPAIR_CATEGORIES[i % REPAIR_CATEGORIES.length],
      orgId: ORG_IDS[i % ORG_IDS.length],
      unitName: unit.label,
    });
  }
  return rows;
}

function applyResultStyleFilter(rows, query = {}, orgFilter = {}) {
  const { position = "", behaviorCategory = "all", repairCategory = "all" } = query;
  let result = filterByOrg(rows, orgFilter.checkedOrgKeys || [], orgFilter.orgTree || []);
  if (position) result = result.filter((r) => r.position.includes(position));
  if (behaviorCategory !== "all") {
    result = result.filter((r) => r.behaviorCategory === behaviorCategory);
  }
  if (repairCategory !== "all") {
    result = result.filter((r) => r.repairCategory === repairCategory);
  }
  return result;
}

export function filterRatingResultRows(rows, query = {}, orgFilter = {}) {
  return applyResultStyleFilter(rows, query, orgFilter);
}

export const DEFAULT_RESULT_QUERY = {
  position: "",
  behaviorCategory: "all",
  repairCategory: "all",
};

/** ② 正负向数据统计 — 100 条员工明细 */
export function generatePosNegStatRows() {
  const rows = [];
  for (let i = 0; i < 100; i += 1) {
    const seed = hashSeed(`posneg-${i}`);
    const isPositive = i % 3 !== 1;
    const addScore = isPositive ? 5 + (seed % 16) : seed % 4 === 0 ? 3 : 0;
    const deductScore = !isPositive ? 3 + (seed % 12) : seed % 5 === 0 ? 2 : 0;
    rows.push({
      id: i + 1,
      name: NAMES[i % NAMES.length],
      employeeId: `YG${String(20001 + i).padStart(5, "0")}`,
      department: DEPT_PATHS[i % DEPT_PATHS.length].split("/").slice(-2).join("/"),
      position: POSITIONS[i % POSITIONS.length],
      addScore,
      deductScore,
      behaviorCategory: isPositive ? "正向" : "负向",
      repairCategory: REPAIR_CATEGORIES[i % REPAIR_CATEGORIES.length],
      orgId: ORG_IDS[i % ORG_IDS.length],
    });
  }
  return rows;
}

export function filterPosNegStatRows(rows, query = {}, orgFilter = {}) {
  return applyResultStyleFilter(rows, query, orgFilter);
}

/** ③ 专业加扣分情况统计 — 100 条员工明细 */
export function generateProfessionStatRows() {
  const rows = [];
  for (let i = 0; i < 100; i += 1) {
    const seed = hashSeed(`profstat-${i}`);
    const score = 58 + (seed % 43);
    const gradeIdx = score >= 90 ? 0 : score >= 75 ? 1 : score >= 60 ? 2 : 3;
    const professionLabel = PROFESSIONS[i % PROFESSIONS.length];
    rows.push({
      id: i + 1,
      profession: professionLabel,
      name: NAMES[i % NAMES.length],
      employeeId: `YG${String(30001 + i).padStart(5, "0")}`,
      department: DEPT_PATHS[i % DEPT_PATHS.length].split("/").slice(-2).join("/"),
      position: POSITIONS[i % POSITIONS.length],
      evalYear: i % 3 === 0 ? "2026" : i % 3 === 1 ? "2025" : "2024",
      resultSource: RESULT_SOURCES[i % RESULT_SOURCES.length],
      creditScore: score,
      creditGrade: GRADES[gradeIdx],
      behaviorCategory: i % 3 !== 1 ? "正向" : "负向",
      repairCategory: REPAIR_CATEGORIES[i % REPAIR_CATEGORIES.length],
      orgId: ORG_IDS[i % ORG_IDS.length],
    });
  }
  return rows;
}

export function filterProfessionStatRows(rows, query = {}, orgFilter = {}) {
  return applyResultStyleFilter(rows, query, orgFilter);
}

/** 信用修复 — 100 条 */
export function generateCreditRepairRows() {
  const reasons = [
    "因系统误判申请修复",
    "已完成安全培训申请恢复分值",
    "年度评价结果复核",
    "违章记录已整改完毕",
    "补充证明材料申请修复",
  ];
  const rows = [];
  for (let i = 0; i < 100; i += 1) {
    const status = STATUSES[i % STATUSES.length];
    const unit = UNITS[i % UNITS.length];
    const year = i % 2 === 0 ? "2026" : "2025";
    rows.push({
      id: i + 1,
      applicant: NAMES[i % NAMES.length],
      repairSource: REPAIR_SOURCES[i % REPAIR_SOURCES.length],
      repairCategory: REPAIR_CATEGORIES[i % REPAIR_CATEGORIES.length],
      applyDate: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
      year,
      reason: reasons[i % reasons.length],
      status,
      unitName: unit.label,
    });
  }
  return rows;
}

export function filterCreditRepairRows(rows, query = {}) {
  const {
    applicant = "",
    repairSource = "all",
    repairCategory = "all",
    year = "all",
    status = "all",
    unit = "all",
  } = query;
  let result = rows;
  if (applicant) result = result.filter((r) => r.applicant.includes(applicant));
  if (repairSource !== "all") result = result.filter((r) => r.repairSource === repairSource);
  if (repairCategory !== "all") result = result.filter((r) => r.repairCategory === repairCategory);
  if (year !== "all") result = result.filter((r) => r.year === year);
  if (status !== "all") result = result.filter((r) => r.status === status);
  if (unit !== "all") result = result.filter((r) => r.unitName === unit);
  return result;
}

export const DEFAULT_REPAIR_QUERY = {
  applicant: "",
  repairSource: "all",
  repairCategory: "all",
  year: "all",
  status: "all",
  unit: "all",
};

export const REPAIR_SOURCE_OPTIONS = [
  { label: "全部", value: "all" },
  ...REPAIR_SOURCES.map((s) => ({ label: s, value: s })),
];

export const REPAIR_CATEGORY_OPTIONS = [
  { label: "全部", value: "all" },
  ...REPAIR_CATEGORIES.map((s) => ({ label: s, value: s })),
];

export const REPAIR_STATUS_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "待提交", value: "待提交" },
  { label: "待审核", value: "待审核" },
  { label: "已完成", value: "已完成" },
];

export const BEHAVIOR_CATEGORY_FILTER = [
  { label: "全部", value: "all" },
  { label: "正向", value: "正向" },
  { label: "负向", value: "负向" },
];

export const PROFESSION_FILTER = [
  { label: "全部", value: "all" },
  ...PROFESSIONS.map((p) => ({ label: p, value: p })),
];

export const REPAIR_CATEGORY_FILTER = [
  { label: "全部", value: "all" },
  ...REPAIR_CATEGORIES.map((c) => ({ label: c, value: c })),
];

export const YEAR_FILTER = [
  { label: "全部年度", value: "all" },
  { label: "2026年", value: "2026" },
  { label: "2025年", value: "2025" },
  { label: "2024年", value: "2024" },
];

export const UNIT_FILTER = [
  { label: "全部单位", value: "all" },
  ...UNITS.map((u) => ({ label: u.label, value: u.label })),
];

export function repairStatusTagType(status) {
  if (status === "待提交") return "success";
  if (status === "待审核") return "danger";
  return "info";
}
