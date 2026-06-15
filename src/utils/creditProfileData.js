/**
 * 信用画像展示 — 模拟数据
 */

import { generateOrgTree } from "./orgTree";

export function getProfileOrgTree() {
  return generateOrgTree();
}

export const YEAR_OPTIONS = [
  { label: "2026年", value: "2026" },
  { label: "2025年", value: "2025" },
  { label: "2024年", value: "2024" },
];

const EMPLOYEES = [
  { id: 1, name: "张山", empNo: "EMP202500123", dept: "技术部", position: "专员", joinDate: "2023-07-15" },
  { id: 2, name: "李四", empNo: "EMP202500124", dept: "安监部", position: "班组长", joinDate: "2022-03-10" },
  { id: 3, name: "王五", empNo: "EMP202500125", dept: "人资部", position: "专责", joinDate: "2021-11-20" },
  { id: 4, name: "赵六", empNo: "EMP202500126", dept: "营销部", position: "作业员", joinDate: "2024-01-08" },
  { id: 5, name: "陈强", empNo: "EMP202500127", dept: "生产技术部", position: "工程师", joinDate: "2020-06-01" },
  { id: 6, name: "刘洋", empNo: "EMP202500128", dept: "数字化部", position: "技术员", joinDate: "2023-09-15" },
  { id: 7, name: "周敏", empNo: "EMP202500129", dept: "财务部", position: "专员", joinDate: "2022-08-22" },
  { id: 8, name: "吴磊", empNo: "EMP202500130", dept: "安监部", position: "高级作业员", joinDate: "2019-12-05" },
];

export function getEmployeeList(keyword = "") {
  const kw = (keyword || "").trim();
  if (!kw) return EMPLOYEES;
  return EMPLOYEES.filter((e) => e.name.includes(kw) || e.dept.includes(kw));
}

export function getEmployeeProfile(employeeId = 1) {
  const emp = EMPLOYEES.find((e) => e.id === employeeId) || EMPLOYEES[0];
  return {
    ...emp,
    unitPath: "云南电网有限责任公司 > 昆明供电局 > 技术部",
    creditGrade: "B",
    totalScore: 86,
    maxScore: 100,
    unitAvg: 92,
    deptAvg: 88,
    unitRank: 79,
    dimensionRadar: {
      dims: ["履职表现", "安全合规", "考勤纪律", "团队协作", "学习成长", "服务质量"],
      values: [88, 82, 90, 85, 78, 84],
    },
    ratingTrend: {
      months: ["4月", "5月", "6月", "7月", "8月", "9月"],
      scores: [78, 80, 82, 84, 85, 86],
    },
    behaviors: [
      {
        id: 1,
        time: "2025-09-01 17:10",
        type: "绩效表现",
        desc: "零违章记录",
        score: 3,
        tone: "positive",
      },
      {
        id: 2,
        time: "2025-09-05 14:20",
        type: "流程延误",
        desc: "未按时处理部门流程",
        score: -2,
        tone: "negative",
      },
      {
        id: 3,
        time: "2025-09-10 08:30",
        type: "考勤",
        desc: "准时到岗，无迟到",
        score: 1,
        tone: "neutral",
      },
    ],
    risk: {
      level: "高风险",
      desc: "近1个月出现2次流程延误",
      suggestion: "建议加强时效管理",
    },
    compare: { self: 86, dept: 78 },
    peerRank: { rank: 6, total: 32 },
    deptGradeDist: [
      { grade: "A", percent: 22 },
      { grade: "B", percent: 45 },
      { grade: "C", percent: 23 },
      { grade: "D", percent: 10 },
    ],
  };
}

export function getUnitSummary() {
  return {
    unitPath: "云南电网有限责任公司 > 昆明供电局",
    employeeCount: 286,
    totalDeduct: -124,
    avgScore: 85.6,
    topDeductProfessions: "安监、人资、其他",
  };
}

export function getUnitGradeDistribution() {
  return [
    { name: "A级（优秀）", value: 62, percent: 21.7, color: "#722ED1" },
    { name: "B级（良好）", value: 128, percent: 44.8, color: "#1890FF" },
    { name: "C级（一般）", value: 75, percent: 26.2, color: "#8C6E4A" },
    { name: "D级（风险）", value: 21, percent: 7.3, color: "#F5222D" },
  ];
}

export function getUnitSpecialtyDeduct() {
  return [
    { name: "安监", value: 48 },
    { name: "人资", value: 36 },
    { name: "营销", value: 22 },
    { name: "生产", value: 18 },
    { name: "其他", value: 52 },
  ];
}

export function getUnitRankingRows() {
  return [
    {
      id: 1,
      rank: 1,
      name: "技术一部",
      employeeCount: 32,
      totalScore: 2765,
      avgScore: 86.4,
      gradeDist: "A:8 B:16 C:6 D:2",
      trend: "up",
    },
    {
      id: 2,
      rank: 2,
      name: "安监部",
      employeeCount: 28,
      totalScore: 2401,
      avgScore: 85.8,
      gradeDist: "A:6 B:14 C:7 D:1",
      trend: "down",
    },
    {
      id: 3,
      rank: 3,
      name: "人资部",
      employeeCount: 19,
      totalScore: 1625,
      avgScore: 85.5,
      gradeDist: "A:5 B:9 C:4 D:1",
      trend: "up",
    },
    {
      id: 4,
      rank: 4,
      name: "营销部",
      employeeCount: 24,
      totalScore: 2016,
      avgScore: 84.0,
      gradeDist: "A:4 B:12 C:6 D:2",
      trend: "flat",
    },
    {
      id: 5,
      rank: 5,
      name: "生产技术部",
      employeeCount: 35,
      totalScore: 2905,
      avgScore: 83.0,
      gradeDist: "A:5 B:15 C:11 D:4",
      trend: "down",
    },
  ];
}

export function getUnitScoreDetailRows() {
  return [
    {
      id: 1,
      time: "2025-09-10",
      dept: "安监部",
      person: "张三",
      desc: "安全培训未按时完成",
      profession: "安监",
      score: -2,
    },
    {
      id: 2,
      time: "2025-09-08",
      dept: "技术一部",
      person: "李四",
      desc: "季度绩效优秀",
      profession: "其他",
      score: 3,
    },
    {
      id: 3,
      time: "2025-09-05",
      dept: "人资部",
      person: "王五",
      desc: "迟到打卡1次",
      profession: "人资",
      score: -1,
    },
    {
      id: 4,
      time: "2025-09-03",
      dept: "营销部",
      person: "赵六",
      desc: "客户表扬加分",
      profession: "营销",
      score: 2,
    },
    {
      id: 5,
      time: "2025-09-01",
      dept: "生产技术部",
      person: "陈强",
      desc: "违章操作扣分",
      profession: "生产",
      score: -3,
    },
  ];
}

export const PROFESSION_FILTER = [
  { label: "全部专业", value: "all" },
  { label: "安监", value: "安监" },
  { label: "人资", value: "人资" },
  { label: "营销", value: "营销" },
  { label: "生产", value: "生产" },
  { label: "其他", value: "其他" },
];

export const SCORE_TYPE_FILTER = [
  { label: "全部类型", value: "all" },
  { label: "加分", value: "add" },
  { label: "扣分", value: "deduct" },
];

export const MONTH_FILTER = [
  { label: "全部月份", value: "all" },
  { label: "9月", value: "09" },
  { label: "8月", value: "08" },
  { label: "7月", value: "07" },
];

export function filterScoreDetailRows(rows, query = {}) {
  const { profession = "all", scoreType = "all", month = "all" } = query;
  let result = rows;
  if (profession !== "all") result = result.filter((r) => r.profession === profession);
  if (scoreType === "add") result = result.filter((r) => r.score > 0);
  if (scoreType === "deduct") result = result.filter((r) => r.score < 0);
  if (month !== "all") result = result.filter((r) => r.time.includes(`-${month}-`));
  return result;
}
