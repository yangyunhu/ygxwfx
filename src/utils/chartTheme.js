/**
 * 图表与看板统一色系（对齐电网管理平台 Element UI 主题）
 */
export const CHART_COLORS = {
  primary: "#409EFF",
  secondary: "#5BA8D4",
  success: "#67C23A",
  warning: "#E6A23C",
  danger: "#F56C6C",
  info: "#909399",
  accent: "#1890FF",
  teal: "#36CFC9",
  purple: "#597EF7",
};

/** 序列色板（柱状/折线/饼图按序取用） */
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.teal,
  CHART_COLORS.purple,
  CHART_COLORS.danger,
  CHART_COLORS.info,
];

/** 请假类型固定配色 */
export const LEAVE_TYPE_COLORS = {
  事假: CHART_COLORS.primary,
  病假: CHART_COLORS.secondary,
  年休假: CHART_COLORS.success,
};

const AXIS = {
  axisLine: { lineStyle: { color: "#DCDFE6" } },
  axisTick: { show: false },
  axisLabel: { color: "#606266", fontSize: 11 },
  splitLine: { lineStyle: { color: "#EBEEF5", type: "dashed" } },
};

/** ECharts 公共基础配置 */
export function baseChartOption(overrides = {}) {
  return {
    color: CHART_PALETTE,
    textStyle: { color: "#606266", fontFamily: "inherit" },
    tooltip: {
      backgroundColor: "rgba(255,255,255,0.96)",
      borderColor: "#E4E7ED",
      borderWidth: 1,
      textStyle: { color: "#303133", fontSize: 12 },
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.08);",
    },
    legend: {
      textStyle: { color: "#606266", fontSize: 12 },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "16%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      ...AXIS,
    },
    yAxis: {
      type: "value",
      nameTextStyle: { color: "#909399", fontSize: 11 },
      ...AXIS,
    },
    ...overrides,
  };
}

/** 带透明度的面积/雷达填充色 */
export function withAlpha(hex, alpha = 0.18) {
  const map = {
    "#409EFF": `rgba(64,158,255,${alpha})`,
    "#5BA8D4": `rgba(91,168,212,${alpha})`,
    "#67C23A": `rgba(103,194,58,${alpha})`,
    "#E6A23C": `rgba(230,162,60,${alpha})`,
    "#F56C6C": `rgba(245,108,108,${alpha})`,
  };
  return map[hex.toUpperCase()] || hex;
}
