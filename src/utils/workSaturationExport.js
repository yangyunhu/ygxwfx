/**
 * 员工工作饱和度分析 — 明细导出
 */

import { downloadTableWithLog } from "./exportLogger";
import { UNIT_OPTIONS } from "./behaviorOverviewData";

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
    key: "prediction",
    label: "预测分析",
    desc: "部门饱和度预测、风险预警及月度趋势数据",
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

function buildCriteria(snapshot) {
  const q = snapshot.query || {};
  return [
    `单位:${unitFilterLabel(q.unit)}`,
    `日期:${snapshot.periodLabel || "全部日期"}`,
  ].join("; ");
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

function buildPredictionExport(snapshot) {
  const p = snapshot.prediction;
  const trendHeaders = ["月份", "实际饱和度(%)", "预测饱和度(%)"];
  const trendRows = p.months.map((m, i) => [
    m,
    p.actualSaturation[i],
    p.predictedSaturation[i] != null ? p.predictedSaturation[i] : "—",
  ]);

  const forecastHeaders = [
    "序号",
    "维度",
    "类型",
    "当前饱和度(%)",
    "预测饱和度(%)",
    "趋势",
    "风险等级",
    "建议",
  ];
  const forecastRows = p.forecastTable.map((r, i) => [
    i + 1,
    r.dimension,
    r.dimensionType,
    r.currentSaturation,
    r.forecastSaturation,
    r.trend,
    r.riskLevel,
    r.suggestion,
  ]);

  return { trendHeaders, trendRows, forecastHeaders, forecastRows };
}

const BUILDERS = {
  department: buildDepartmentExport,
  employee: buildEmployeeExport,
};

export function exportSaturationModules(moduleKeys, snapshot) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const criteria = buildCriteria(snapshot);
  let delay = 0;

  moduleKeys.forEach((key) => {
    const mod = SATURATION_EXPORT_MODULES.find((m) => m.key === key);
    if (!mod) return;

    if (key === "prediction") {
      const result = buildPredictionExport(snapshot);
      setTimeout(() => {
        downloadTableWithLog({
          headers: result.trendHeaders,
          rows: result.trendRows,
          format: "csv",
          baseFilename: `工作饱和度_月度趋势_${stamp}`,
          meta: {
            moduleCode: "work-saturation-prediction-trend",
            moduleName: "员工工作饱和度-月度趋势",
            moduleGroup: "员工行为智能分析",
            rowCount: result.trendRows.length,
            searchCriteria: criteria,
          },
        });
      }, delay);
      delay += 350;
      setTimeout(() => {
        downloadTableWithLog({
          headers: result.forecastHeaders,
          rows: result.forecastRows,
          format: "csv",
          baseFilename: `工作饱和度_预测明细_${stamp}`,
          meta: {
            moduleCode: "work-saturation-prediction-forecast",
            moduleName: "员工工作饱和度-预测明细",
            moduleGroup: "员工行为智能分析",
            rowCount: result.forecastRows.length,
            searchCriteria: criteria,
          },
        });
      }, delay);
      delay += 350;
      return;
    }

    const builder = BUILDERS[key];
    if (!builder) return;
    const { headers, rows } = builder(snapshot);
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
