/**
 * 员工工作饱和度分析 — 明细导出
 */

import { downloadTableWithLog } from "./exportLogger";
import { UNIT_OPTIONS } from "./behaviorOverviewData";
import { getPredictionDimensionData } from "./workSaturationData";

/** 基本统计指标页 — 可导出模块 */
export const SATURATION_BASIC_EXPORT_MODULES = [
  {
    key: "department",
    label: "部门维度",
    desc: "各部门平均出勤天数、迟到率、早退率及饱和度指标",
  },
  {
    key: "employee",
    label: "员工维度",
    desc: "各员工平均出勤天数、迟到率、早退率及饱和度指标",
  },
];

/** 预测分析页 — 可导出模块 */
export const SATURATION_PREDICTION_EXPORT_MODULES = [
  {
    key: "predictionLate",
    label: "迟到概率预测",
    desc: "按当前维度统计的迟到概率预测明细",
  },
  {
    key: "predictionEarly",
    label: "早退概率预测",
    desc: "按当前维度统计的早退概率预测明细",
  },
  {
    key: "predictionAbsentee",
    label: "旷工概率预测",
    desc: "按当前维度统计的旷工概率预测明细",
  },
];

export const SATURATION_EXPORT_MODULES = [
  ...SATURATION_BASIC_EXPORT_MODULES,
  ...SATURATION_PREDICTION_EXPORT_MODULES,
];

function unitFilterLabel(unit) {
  const opt = UNIT_OPTIONS.find((o) => o.value === unit);
  return opt ? opt.label : "全部单位";
}

function buildCriteria(snapshot, options = {}) {
  const q = snapshot.query || {};
  const parts = [
    `单位:${unitFilterLabel(q.unit)}`,
    `日期:${snapshot.periodLabel || "全部日期"}`,
  ];
  if (options.predictionDimension) {
    parts.push(`维度:${options.predictionDimension === "employee" ? "按员工" : "按部门"}`);
  }
  return parts.join("; ");
}

function buildDepartmentExport(snapshot) {
  return {
    headers: [
      "序号",
      "部门",
      "平均出勤天数",
      "迟到率(%)",
      "早退率(%)",
      "工作饱和度(%)",
      "负荷指数",
      "加班时长(h)",
      "统计单位",
      "统计周期",
    ],
    rows: snapshot.departmentStats.map((d, i) => [
      i + 1,
      d.name,
      d.avgDays,
      d.lateRate,
      d.earlyRate,
      d.saturation,
      d.workloadIndex,
      d.overtimeHours,
      snapshot.unitLabel,
      snapshot.periodLabel,
    ]),
  };
}

function buildEmployeeExport(snapshot) {
  return {
    headers: [
      "序号",
      "姓名",
      "部门",
      "岗位",
      "平均出勤天数",
      "迟到率(%)",
      "早退率(%)",
      "工作饱和度(%)",
      "负荷指数",
      "加班时长(h)",
      "统计单位",
      "统计周期",
    ],
    rows: snapshot.employeeStats.map((e, i) => [
      i + 1,
      e.name,
      e.department,
      e.position,
      e.avgDays,
      e.lateRate,
      e.earlyRate,
      e.saturation,
      e.workloadIndex,
      e.overtimeHours,
      snapshot.unitLabel,
      snapshot.periodLabel,
    ]),
  };
}

function buildProbExport(snapshot, options, probKey, probLabel) {
  const dim = getPredictionDimensionData(snapshot.prediction, options.predictionDimension || "department");
  const dimCol = dim.dimensionLabel === "员工" ? "姓名" : "部门";
  const headers = [
    "序号",
    dimCol,
    probLabel,
    "统计单位",
    "统计周期",
    "统计维度",
  ];
  if (dim.dimensionLabel === "员工") headers.splice(2, 0, "所属部门");

  const rows = dim.items.map((item, i) => {
    if (dim.dimensionLabel === "员工") {
      return [
        i + 1,
        item.name,
        item.department,
        `${item[probKey]}%`,
        snapshot.unitLabel,
        snapshot.periodLabel,
        "按员工",
      ];
    }
    return [
      i + 1,
      item.name,
      `${item[probKey]}%`,
      snapshot.unitLabel,
      snapshot.periodLabel,
      "按部门",
    ];
  });

  return { headers, rows };
}

const BUILDERS = {
  department: buildDepartmentExport,
  employee: buildEmployeeExport,
  predictionLate: (snapshot, options) => buildProbExport(snapshot, options, "lateProb", "迟到概率(%)"),
  predictionEarly: (snapshot, options) => buildProbExport(snapshot, options, "earlyProb", "早退概率(%)"),
  predictionAbsentee: (snapshot, options) => buildProbExport(snapshot, options, "absenteeProb", "旷工概率(%)"),
};

export function exportSaturationModules(moduleKeys, snapshot, options = {}) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const criteria = buildCriteria(snapshot, options);
  let delay = 0;

  moduleKeys.forEach((key) => {
    const mod = SATURATION_EXPORT_MODULES.find((m) => m.key === key);
    const builder = BUILDERS[key];
    if (!mod || !builder) return;

    const { headers, rows } = builder(snapshot, options);
    setTimeout(() => {
      downloadTableWithLog({
        headers,
        rows,
        format: "csv",
        baseFilename: `工作饱和度_${mod.label}_${stamp}`,
        meta: {
          moduleCode: `work-saturation-${key}`,
          moduleName: `员工工作饱和度-${mod.label}`,
          moduleGroup: "员工行为智能分析",
          rowCount: rows.length,
          searchCriteria: criteria,
        },
      });
    }, delay);
    delay += 350;
  });

  return moduleKeys.length;
}
