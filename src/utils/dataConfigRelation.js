/**
 * 无感数据关联配置 — 岗位 + 岗位类别/序列 + 专业分类
 */

import {
  HR_CATEGORY_SEQUENCE_MAP,
  loadPositionTree,
  flattenPosts,
} from "./positionRelation";
import {
  flattenProfessionalLeaves,
  professionalToCascaderOptions,
  getProfessionalLevel1Options,
  matchProfessionalPath,
} from "./professionalClassification";

const STORAGE_KEY = "ygxwfx_data_config_relation";

export {
  HR_CATEGORY_SEQUENCE_MAP,
  professionalToCascaderOptions,
  getProfessionalLevel1Options,
  matchProfessionalPath,
};

export function getJobCategoryOptions() {
  return HR_CATEGORY_SEQUENCE_MAP.map((x) => x.category);
}

export function getJobSequenceOptions(category) {
  if (!category) {
    return HR_CATEGORY_SEQUENCE_MAP.flatMap((x) => x.sequences);
  }
  const found = HR_CATEGORY_SEQUENCE_MAP.find((x) => x.category === category);
  return found ? [...found.sequences] : [];
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return fallback;
}

function saveJson(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const DEPARTMENTS = [
  "办公室",
  "人力资源部",
  "生产技术部",
  "市场营销部",
  "运维检修部",
  "调控中心",
  "信息通信部",
  "安全监管部",
  "基建部",
  "客户服务中心",
  "计划财务部",
  "审计部",
  "党建部",
  "法规部",
  "物资管理部",
];

const OPERATORS = ["张明", "李华", "王芳", "赵敏", "刘强", "陈静", "杨帆", "周丽", "吴刚", "徐敏"];

function padTime(dayOffset, hour) {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(hour)}:${p(30)}:00`;
}

/** 生成关联配置列表（岗位来自人资岗位树，专业分类来自专业分类树） */
export function generateRelationConfigData() {
  const posts = flattenPosts(loadPositionTree());
  const profLeaves = flattenProfessionalLeaves();
  if (!posts.length || !profLeaves.length) return [];

  const list = [];
  let id = 1;
  DEPARTMENTS.forEach((dept, deptIndex) => {
    const count = deptIndex < 5 ? 4 : 2;
    for (let j = 0; j < count; j++) {
      const post = posts[(deptIndex * 3 + j) % posts.length];
      const prof = profLeaves[(deptIndex * 2 + j) % profLeaves.length];
      const mobileConnected = (id + j) % 5 !== 0;
      const webConnected = (id + j) % 4 !== 0;
      list.push({
        id: id++,
        department: dept,
        postName: post.name,
        postCode: post.code,
        jobCategory: post.category,
        jobSequence: post.sequenceName,
        profClassPath: prof.pathText,
        profClassLeaf: prof.name,
        profClassLevel1: prof.level1,
        majorType: prof.level1,
        mobileStatus: mobileConnected ? "connected" : "disconnected",
        webStatus: webConnected ? "connected" : "disconnected",
        operator: OPERATORS[id % OPERATORS.length],
        updateTime: padTime(id % 3, 8 + (id % 10)),
        mobileSourceCodes: ["offline_gate", "offline_canteen", "online_login"],
        webSourceCodes: ["offline_gate", "offline_canteen", "online_login"],
      });
    }
  });
  return list;
}

export function loadRelationConfigData() {
  const stored = loadJson(STORAGE_KEY, null);
  if (stored && stored.length && stored[0].jobCategory && stored[0].profClassPath) {
    return stored;
  }
  const initial = generateRelationConfigData();
  saveJson(STORAGE_KEY, initial);
  return initial;
}

export function saveRelationConfigData(list) {
  saveJson(STORAGE_KEY, list);
}

export function filterRelationList(list, filters) {
  let data = list;
  const {
    selectedOrg,
    searchKeyword,
    jobCategory,
    jobSequence,
    profClassPath,
    statusFilter,
  } = filters;

  if (selectedOrg) {
    data = data.filter((item) => item.department === selectedOrg);
  }
  if (searchKeyword && searchKeyword.trim()) {
    const kw = searchKeyword.trim();
    data = data.filter(
      (item) =>
        item.postName.includes(kw) ||
        item.jobCategory.includes(kw) ||
        item.jobSequence.includes(kw) ||
        item.profClassPath.includes(kw) ||
        item.operator.includes(kw)
    );
  }
  if (jobCategory) {
    data = data.filter((item) => item.jobCategory === jobCategory);
  }
  if (jobSequence) {
    data = data.filter((item) => item.jobSequence === jobSequence);
  }
  if (profClassPath && profClassPath.length) {
    data = data.filter((item) => matchProfessionalPath(item.profClassPath, profClassPath));
  }
  if (statusFilter) {
    switch (statusFilter) {
      case "mobile_connected":
        data = data.filter((item) => item.mobileStatus === "connected");
        break;
      case "mobile_disconnected":
        data = data.filter((item) => item.mobileStatus === "disconnected");
        break;
      case "web_connected":
        data = data.filter((item) => item.webStatus === "connected");
        break;
      case "web_disconnected":
        data = data.filter((item) => item.webStatus === "disconnected");
        break;
      case "all_connected":
        data = data.filter(
          (item) => item.mobileStatus === "connected" && item.webStatus === "connected"
        );
        break;
      case "pending":
        data = data.filter(
          (item) => item.mobileStatus === "disconnected" && item.webStatus === "disconnected"
        );
        break;
      default:
        break;
    }
  }
  return data;
}
