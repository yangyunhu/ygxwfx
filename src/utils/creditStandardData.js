/**
 * 信用评价标准库 — 模拟数据（对齐原型）
 */

import { UNIT_OPTIONS } from "./behaviorOverviewData";

export const ROOT_ORG_LABEL = "云南电网有限责任公司";

export const BEHAVIOR_CATEGORY_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "正向", value: "正向" },
  { label: "负向", value: "负向" },
];

export const CATEGORY_BELONG_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "通用库", value: "通用库" },
  { label: "本地库", value: "本地库" },
];

export const PROFESSION_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "人资", value: "人资" },
  { label: "安监", value: "安监" },
  { label: "营销", value: "营销" },
  { label: "生产", value: "生产" },
  { label: "财务", value: "财务" },
];

export const YEAR_OPTIONS = [
  { label: "全部年度", value: "all" },
  { label: "2026年", value: "2026" },
  { label: "2025年", value: "2025" },
  { label: "2024年", value: "2024" },
];

export const DEFAULT_CATEGORY_QUERY = {
  orgUnit: ROOT_ORG_LABEL,
  behaviorCategory: "all",
  behaviorName: "",
  score: "",
  categoryBelong: "all",
  profession: "all",
  scopeType: "通用",
};

export const DEFAULT_UNIT_LIB_QUERY = {
  year: "all",
  name: "",
};

const BEHAVIOR_NAMES_POS = [
  "积极参加培训", "主动完成攻坚任务", "提出合理化建议", "安全履职表现突出", "优质服务获表扬",
];
const BEHAVIOR_NAMES_NEG = [
  "A类违章", "B类违章", "迟到早退", "未戴安全帽", "违反操作规程", "旷工", "早退", "脱岗",
];

const RECORDERS = ["张山", "李四", "王芳", "赵敏", "陈强", "刘洋"];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 标准库类目管理 — 100 条 */
export function generateCategoryBehaviorRows() {
  const professions = ["人资", "安监", "营销", "生产", "财务"];
  const rows = [];

  for (let i = 0; i < 100; i += 1) {
    const seed = hashSeed(`cat-${i}`);
    const isPositive = i % 3 !== 1;
    const behaviorCategory = isPositive ? "正向" : "负向";
    const names = isPositive ? BEHAVIOR_NAMES_POS : BEHAVIOR_NAMES_NEG;
    const categoryBelong = i % 4 === 0 ? "通用库" : "本地库";
    const isRepair = i % 5 === 0;
    const enabled = i % 7 !== 0;

    rows.push({
      id: i + 1,
      behaviorCategory,
      behaviorName: names[i % names.length],
      profession: professions[i % professions.length],
      score: 5 + (seed % 16),
      scoreText: `${5 + (seed % 16)}分`,
      categoryBelong,
      isRepair,
      enabled,
      recorder: RECORDERS[i % RECORDERS.length],
      scopeType: i % 2 === 0 ? "通用" : "本部",
    });
  }
  return rows;
}

export function filterCategoryBehaviorRows(rows, query = {}) {
  const {
    behaviorCategory = "all",
    behaviorName = "",
    score = "",
    categoryBelong = "all",
    profession = "all",
    scopeType = "通用",
  } = query;

  return rows.filter((row) => {
    if (behaviorCategory !== "all" && row.behaviorCategory !== behaviorCategory) return false;
    if (behaviorName && !row.behaviorName.includes(behaviorName)) return false;
    if (score && String(row.score) !== String(score) && !row.scoreText.includes(score)) return false;
    if (categoryBelong !== "all" && row.categoryBelong !== categoryBelong) return false;
    if (profession !== "all" && row.profession !== profession) return false;
    if (scopeType && row.scopeType !== scopeType) return false;
    return true;
  });
}

/** 单位标准库 — 100 条 */
export function generateUnitLibraryRows() {
  const units = UNIT_OPTIONS.filter((u) => u.value !== "all");
  const years = ["2026", "2025", "2024"];
  const rows = [];

  for (let i = 0; i < 100; i += 1) {
    const year = years[i % years.length];
    const unit = units[i % units.length];
    const enabled = i % 4 !== 1;
    rows.push({
      id: i + 1,
      year,
      yearLabel: `${year}年`,
      standardName: `${year}员工信用评级标准库`,
      enabled,
      evaluationScope: unit.label,
      unitKey: unit.value,
    });
  }
  return rows;
}

export function filterUnitLibraryRows(rows, query = {}) {
  const { year = "all", name = "" } = query;
  let result = rows;
  if (year !== "all") result = result.filter((r) => r.year === year);
  if (name) result = result.filter((r) => r.standardName.includes(name));
  return result;
}

/** 信用评级 — 等级分数区间 */
export function getGradeScoreRanges() {
  return [
    { id: 1, grade: "A级", scoreMin: 90, scoreMax: 100 },
    { id: 2, grade: "B级", scoreMin: 75, scoreMax: 89 },
    { id: 3, grade: "C级", scoreMin: 60, scoreMax: 74 },
    { id: 4, grade: "D级", scoreMin: 0, scoreMax: 59 },
  ];
}

/** 信用评级 — 专业评分占比 */
export function getProfessionRatioRows() {
  return [
    { id: 1, profession: "人资", ratio: 90 },
    { id: 2, profession: "安监", ratio: 70 },
    { id: 3, profession: "营销", ratio: 85 },
    { id: 4, profession: "生产", ratio: 80 },
    { id: 5, profession: "财务", ratio: 75 },
  ];
}

export function unitLabel(value) {
  if (value === "all") return "全部单位";
  const opt = UNIT_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : value;
}
