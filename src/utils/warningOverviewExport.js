/**
 * 异常预警 — 各统计模块明细导出
 */

import { downloadTableWithLog } from "./exportLogger";
import { UNIT_OPTIONS } from "./behaviorOverviewData";
import {
  getMapMetricMeta,
  buildWarningDetailExportRows,
  WARNING_DETAIL_EXPORT_HEADERS,
} from "./warningOverviewData";

export const WARNING_EXPORT_MODULES = [
  {
    key: "map",
    label: "地图区域统计",
    desc: "当前地图维度下各地市/县区预警数值明细",
  },
  {
    key: "lateTop5",
    label: "迟到预警TOP5",
    desc: "迟到预警排名及关联人员异常明细",
  },
  {
    key: "earlyTop5",
    label: "早退预警TOP5",
    desc: "早退预警排名及关联人员异常明细",
  },
  {
    key: "longAbsentTop5",
    label: "长期不在岗TOP5",
    desc: "长期不在岗排名及关联人员异常明细",
  },
  {
    key: "abnormalChange",
    label: "异常变化情况",
    desc: "按单位/部门维度的异常汇总及人员明细（含两份表）",
  },
  {
    key: "detail",
    label: "全省异常预警明细",
    desc: "底部明细表全量人员预警记录",
  },
];

const NAMES = ["张伟", "李娜", "王强", "刘洋", "陈静", "赵敏", "孙浩", "周婷", "张明", "李华"];
const POSITIONS = ["变电检修", "线路运维", "营销专责", "安监专责", "人资专责", "综合管理员"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function mockEmpId(seed) {
  return `YN${String(100000 + (seed % 900000)).padStart(6, "0")}`;
}

function mockDate(seed) {
  const m = ((seed % 12) + 1);
  const d = (seed % 26) + 1;
  return `2025-${pad2(m)}-${pad2(d)}`;
}

function periodLabel(queryParams) {
  if (queryParams && queryParams.startDate && queryParams.endDate) {
    return `${queryParams.startDate} ~ ${queryParams.endDate}`;
  }
  return "全部日期";
}

function unitFilterLabel(unit) {
  const opt = UNIT_OPTIONS.find((o) => o.value === unit);
  return opt ? opt.label : "全部单位";
}

function buildSearchCriteria(options) {
  const metricMeta = getMapMetricMeta(options.mapMetric || "late");
  const parts = [
    `统计维度:${metricMeta.label}`,
    `单位:${unitFilterLabel(options.queryParams && options.queryParams.unit)}`,
    `日期:${periodLabel(options.queryParams)}`,
    options.drillLevel === "county" ? `下钻:县级` : "下钻:省级",
  ];
  if (options.linkFilterLabel) parts.push(`区域:${options.linkFilterLabel}`);
  if (options.changeMode) parts.push(`异常变化:${options.changeMode === "department" ? "部门" : "单位"}`);
  return parts.join("; ");
}

function buildMapRegionDetail(snapshot, options) {
  const metricMeta = getMapMetricMeta(options.mapMetric || snapshot.mapMetric);
  const regionLabel = options.drillLevel === "county" ? "县区" : "单位";
  const headers = [
    "序号",
    regionLabel,
    "全称",
    metricMeta.label,
    "数值单位",
    "统计周期",
    "区域筛选",
  ];
  const mapData = options.mapData || snapshot.mapData || [];
  const rows = mapData.map((item, i) => [
    i + 1,
    item.name,
    item.fullName || item.name,
    item.value != null ? item.value : 0,
    metricMeta.valueUnit,
    periodLabel(options.queryParams),
    options.linkFilterLabel || "全省",
  ]);
  if (!rows.length) {
    rows.push([1, "—", "—", 0, metricMeta.valueUnit, periodLabel(options.queryParams), "暂无数据"]);
  }
  return { headers, rows };
}

function buildTop5PersonDetail(topList, metricKey, options) {
  const metricMeta = getMapMetricMeta(metricKey);
  const regionLabel = options.drillLevel === "county" ? "县区" : "单位";
  const headers = [
    "序号",
    "姓名",
    "工号",
    "所属单位",
    regionLabel,
    "部门",
    "岗位",
    metricMeta.label,
    "异常日期",
    "预警状态",
    "说明",
    "统计周期",
  ];
  const remarks = {
    late: ["上班迟到", "会议迟到", "交通延误迟到", "打卡异常"],
    early: ["下班早退", "未签退早离", "外勤早退", "会议早退"],
    longAbsent: ["长期外勤未归", "病假超期", "旷工累计", "岗位空缺"],
  };
  const remarkPool = remarks[metricKey] || remarks.late;
  const rows = [];
  let seq = 1;

  (topList || []).forEach((item, ri) => {
    const personCount = Math.min(6, Math.max(2, Math.ceil(item.count / 4)));
    for (let j = 0; j < personCount; j++) {
      const seed = ri * 11 + j + (metricKey === "early" ? 3 : metricKey === "longAbsent" ? 7 : 0);
      rows.push([
        seq++,
        NAMES[seed % NAMES.length],
        mockEmpId(seed + 300),
        item.unit || item.unitShort,
        item.unitShort,
        item.department,
        POSITIONS[seed % POSITIONS.length],
        Math.max(1, Math.round(item.count / personCount) + (j % 2)),
        mockDate(seed),
        item.status,
        remarkPool[seed % remarkPool.length],
        periodLabel(options.queryParams),
      ]);
    }
  });

  if (!rows.length) {
    rows.push([
      1,
      "—",
      "—",
      "—",
      "—",
      "—",
      "—",
      0,
      "—",
      "—",
      "当前筛选条件下暂无记录",
      periodLabel(options.queryParams),
    ]);
  }
  return { headers, rows };
}

function buildAbnormalChangeDetail(snapshot, options) {
  const ac = snapshot.abnormalChange || {};
  const categories = ac.categories || [];
  const headers = [
    "序号",
    "维度名称",
    "迟到",
    "早退",
    "在岗证据不足",
    "旷工",
    "长期不在岗",
    "合计",
    "统计周期",
    "维度类型",
  ];
  const dimType =
    snapshot.drillLevel === "county"
      ? "县区"
      : snapshot.changeMode === "department"
        ? "部门"
        : "单位";
  const rows = categories.map((name, i) => {
    const late = ac.late[i] || 0;
    const early = ac.early[i] || 0;
    const evidence = ac.evidence[i] || 0;
    const absentee = ac.absentee[i] || 0;
    const longAbsent = ac.longAbsent[i] || 0;
    return [
      i + 1,
      name,
      late,
      early,
      evidence,
      absentee,
      longAbsent,
      late + early + evidence + absentee + longAbsent,
      periodLabel(options.queryParams),
      dimType,
    ];
  });

  const detailHeaders = [
    "序号",
    "姓名",
    "工号",
    "维度名称",
    "异常类型",
    "次数",
    "最近异常日期",
    "预警状态",
    "统计周期",
  ];
  const detailRows = [];
  let seq = 1;
  const types = ["迟到", "早退", "在岗证据不足", "旷工", "长期不在岗"];
  categories.forEach((name, ci) => {
    types.forEach((type, ti) => {
      const countMap = {
        迟到: ac.late[ci],
        早退: ac.early[ci],
        在岗证据不足: ac.evidence[ci],
        旷工: ac.absentee[ci],
        长期不在岗: ac.longAbsent[ci],
      };
      const total = countMap[type] || 0;
      if (total <= 0) return;
      const n = Math.min(4, Math.max(1, Math.ceil(total / 3)));
      for (let j = 0; j < n; j++) {
        const seed = ci * 17 + ti * 5 + j;
        detailRows.push([
          seq++,
          NAMES[seed % NAMES.length],
          mockEmpId(seed + 500),
          name,
          type,
          Math.max(1, Math.round(total / n)),
          mockDate(seed),
          ["预警中", "处理中", "已处理", "提醒"][seed % 4],
          periodLabel(options.queryParams),
        ]);
      }
    });
  });

  return {
    headers,
    rows,
    detailHeaders,
    detailRows,
  };
}

const BUILDERS = {
  map: buildMapRegionDetail,
  lateTop5: (snapshot, options) => buildTop5PersonDetail(snapshot.lateTop5, "late", options),
  earlyTop5: (snapshot, options) => buildTop5PersonDetail(snapshot.earlyTop5, "early", options),
  longAbsentTop5: (snapshot, options) =>
    buildTop5PersonDetail(snapshot.longAbsentTop5, "longAbsent", options),
  abnormalChange: buildAbnormalChangeDetail,
  detail: (snapshot) => ({
    headers: WARNING_DETAIL_EXPORT_HEADERS,
    rows: buildWarningDetailExportRows(snapshot.detailTable || []),
  }),
};

export function getWarningExportModuleLabel(moduleKey) {
  const mod = WARNING_EXPORT_MODULES.find((m) => m.key === moduleKey);
  return mod ? mod.label : moduleKey;
}

export function buildWarningExportTable(moduleKey, snapshot, options = {}) {
  const builder = BUILDERS[moduleKey];
  if (!builder) return { headers: [], rows: [] };
  return builder(snapshot, options);
}

/**
 * 导出单个异常预警统计模块明细
 */
export function exportWarningModule(moduleKey, snapshot, options = {}) {
  const mod = WARNING_EXPORT_MODULES.find((m) => m.key === moduleKey);
  if (!mod) return 0;

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const criteria = buildSearchCriteria(options);
  const result = buildWarningExportTable(moduleKey, snapshot, options);

  if (moduleKey === "abnormalChange" && result.detailRows && result.detailRows.length) {
    downloadTableWithLog({
      headers: result.detailHeaders,
      rows: result.detailRows,
      format: "csv",
      baseFilename: `异常预警_${mod.label}_人员明细_${stamp}`,
      meta: {
        moduleCode: `behavior-overview-warning-${moduleKey}-person`,
        moduleName: `员工行为总览-${mod.label}-人员明细`,
        moduleGroup: "员工出勤行为管理",
        rowCount: result.detailRows.length,
        searchCriteria: criteria,
      },
    });
    setTimeout(() => {
      downloadTableWithLog({
        headers: result.headers,
        rows: result.rows,
        format: "csv",
        baseFilename: `异常预警_${mod.label}_汇总_${stamp}`,
        meta: {
          moduleCode: `behavior-overview-warning-${moduleKey}-summary`,
          moduleName: `员工行为总览-${mod.label}-汇总`,
          moduleGroup: "员工出勤行为管理",
          rowCount: result.rows.length,
          searchCriteria: criteria,
        },
      });
    }, 300);
    return result.detailRows.length + result.rows.length;
  }

  downloadTableWithLog({
    headers: result.headers,
    rows: result.rows,
    format: "csv",
    baseFilename: `异常预警_${mod.label}_${stamp}`,
    meta: {
      moduleCode: `behavior-overview-warning-${moduleKey}`,
      moduleName: `员工行为总览-${mod.label}`,
      moduleGroup: "员工出勤行为管理",
      rowCount: result.rows.length,
      searchCriteria: criteria,
    },
  });
  return result.rows.length;
}

/**
 * 批量导出选中的异常预警统计模块（每个模块一个或多个 CSV 文件）
 */
export function exportWarningModules(moduleKeys, snapshot, options = {}) {
  moduleKeys.forEach((key, index) => {
    setTimeout(() => {
      exportWarningModule(key, snapshot, options);
    }, index * 350);
  });
  return moduleKeys.length;
}
