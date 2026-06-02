/** 员工基本信息台账 Mock 数据 */

import { getEnabledLeafCategories } from "./majorCategory";
import { downloadCsvWithLog } from "./exportLogger";

export const EMPLOYEE_STATUS_OPTIONS = [
  "试用",
  "见习",
  "劳务派遣",
  "待岗",
  "内退",
  "长期病休假",
  "借调",
  "在岗",
  "离职",
  "退休",
];

export const POST_CATEGORY_OPTIONS = ["管理类", "专业技术类", "技能类", "辅助类"];

export const AGE_RANGE_OPTIONS = [
  { label: "25岁以下", min: 0, max: 24 },
  { label: "25-30岁", min: 25, max: 30 },
  { label: "30-35岁", min: 31, max: 35 },
  { label: "35-40岁", min: 36, max: 40 },
  { label: "40-45岁", min: 41, max: 45 },
  { label: "45-50岁", min: 46, max: 50 },
  { label: "50-55岁", min: 51, max: 55 },
  { label: "55-60岁", min: 56, max: 60 },
  { label: "60岁以上", min: 61, max: 120 },
];

const UNIT = "云南电网有限责任公司";

const DEPT_PATHS = [
  "变电运行二所\\操动区\\操动二班",
  "变电运行二所\\操动区\\操动三班",
  "变电运行一所\\运行区\\运行一班",
  "生产技术部\\检修中心\\检修一班",
  "人力资源部\\干部管理科",
  "数字化部\\应用开发科",
  "市场营销部\\客户服务班",
];

const NAMES = [
  "张伟",
  "李娜",
  "王强",
  "刘洋",
  "陈静",
  "赵敏",
  "孙浩",
  "周婷",
  "张明",
  "李华",
  "杨帆",
  "吴磊",
];

const POSTS = [
  "中级值班员",
  "高级值班员",
  "班长",
  "副班长",
  "专责",
  "高级专责",
  "主任科员",
];

const STATUSES = ["在岗", "试用", "见习", "借调", "待岗", "劳务派遣"];
const EMPLOYMENT_TYPES = ["劳动合同制", "劳务派遣", "项目制"];

function formatJoinDate(y, m, d) {
  return `${y}年${String(m).padStart(2, "0")}月${String(d).padStart(2, "0")}日`;
}

export function generateEmployeeBasicList() {
  const leaves = getEnabledLeafCategories();
  const list = [];
  for (let i = 0; i < 86; i++) {
    const y = 2015 + (i % 10);
    const m = (i % 12) + 1;
    const d = (i % 28) + 1;
    const age = 22 + (i % 38);
    const major = leaves.length ? leaves[i % leaves.length] : null;
    list.push({
      id: `emp-${i + 1}`,
      name: NAMES[i % NAMES.length],
      employeeCode: String(30309000 + i),
      gender: i % 3 === 0 ? "女" : "男",
      unit: UNIT,
      deptPath: DEPT_PATHS[i % DEPT_PATHS.length],
      orgName: DEPT_PATHS[i % DEPT_PATHS.length].split("\\")[0],
      postName: POSTS[i % POSTS.length],
      postCategory: POST_CATEGORY_OPTIONS[i % POST_CATEGORY_OPTIONS.length],
      majorCategoryId: major ? major.id : "",
      majorCategory: major ? major.path : "—",
      joinDate: formatJoinDate(y, m, d),
      joinDateRaw: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      employmentType: EMPLOYMENT_TYPES[i % EMPLOYMENT_TYPES.length],
      employeeStatus: STATUSES[i % STATUSES.length],
      age,
      phone: `138${String(10000000 + i).slice(-8)}`,
      idCard: `5301${String(19800101 + i).slice(0, 8)}****`,
      education: i % 2 === 0 ? "本科" : "硕士研究生",
      politicalStatus: "群众",
    });
  }
  return list;
}

let employeeListCache = null;

export function getEmployeeBasicList() {
  if (!employeeListCache) {
    employeeListCache = generateEmployeeBasicList();
  }
  return employeeListCache;
}

export function exportEmployeeCsv(rows, filename) {
  const headers = [
    "姓名",
    "员工编码",
    "性别",
    "单位",
    "部门路径",
    "岗位名称",
    "入本单位时间",
    "用工形式",
    "员工状态",
    "岗位类别",
    "专业分类",
    "年龄",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.employeeCode,
      r.gender,
      r.unit,
      r.deptPath,
      r.postName,
      r.joinDate,
      r.employmentType,
      r.employeeStatus,
      r.postCategory,
      r.majorCategory,
      r.age,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: "staff-basic",
    moduleName: "员工基本信息台账",
    moduleGroup: "人员信息台账",
    rowCount: rows.length,
    searchCriteria: "台账查询结果",
  });
}
