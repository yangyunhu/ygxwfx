/**
 * 员工行为总览 — 原型配色与 ECharts 公共样式
 * 色系：蓝 #1890FF / #0050B3、绿 #52C41A、橙 #FA8C16、黄 #FAAD14
 */
export const PROTOTYPE_COLORS = {
  blue: "#1890FF",
  blueLight: "#69C0FF",
  bluePale: "#91D5FF",
  blueDark: "#0050B3",
  green: "#52C41A",
  orange: "#FA8C16",
  yellow: "#FAAD14",
  text: "#303133",
  textSecondary: "#606266",
  border: "#E8E8E8",
  grid: "#F0F0F0",
};

/** 兼容旧引用 */
export const CHART_COLORS = {
  primary: PROTOTYPE_COLORS.blue,
  secondary: PROTOTYPE_COLORS.blueLight,
  success: PROTOTYPE_COLORS.green,
  warning: PROTOTYPE_COLORS.orange,
  danger: "#F5222D",
  info: "#909399",
  accent: PROTOTYPE_COLORS.blue,
  yellow: PROTOTYPE_COLORS.yellow,
  blueDark: PROTOTYPE_COLORS.blueDark,
};

export const CHART_PALETTE = [
  PROTOTYPE_COLORS.blue,
  PROTOTYPE_COLORS.green,
  PROTOTYPE_COLORS.orange,
  PROTOTYPE_COLORS.yellow,
  PROTOTYPE_COLORS.blueLight,
  PROTOTYPE_COLORS.blueDark,
];

/** 请假类型 — 事假蓝 / 病假浅蓝 / 年休假深蓝 */
export const LEAVE_TYPE_COLORS = {
  事假: PROTOTYPE_COLORS.blue,
  病假: PROTOTYPE_COLORS.blueLight,
  年休假: PROTOTYPE_COLORS.blueDark,
};

const AXIS = {
  axisLine: { lineStyle: { color: "#E8E8E8" } },
  axisTick: { show: false },
  axisLabel: { color: "#606266", fontSize: 11 },
  splitLine: { lineStyle: { color: "#F0F0F0", type: "solid" } },
};

export function baseChartOption(overrides = {}) {
  return {
    color: CHART_PALETTE,
    textStyle: { color: "#606266", fontFamily: "inherit", fontSize: 11 },
    tooltip: {
      backgroundColor: "rgba(255,255,255,0.98)",
      borderColor: "#E8E8E8",
      borderWidth: 1,
      textStyle: { color: "#303133", fontSize: 12 },
      extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-radius: 4px;",
    },
    legend: {
      textStyle: { color: "#606266", fontSize: 11 },
      itemWidth: 14,
      itemHeight: 8,
      itemGap: 20,
    },
    grid: {
      left: "2%",
      right: "3%",
      bottom: "14%",
      top: "14%",
      containLabel: true,
    },
    xAxis: { type: "category", ...AXIS },
    yAxis: {
      type: "value",
      nameTextStyle: { color: "#909399", fontSize: 11 },
      ...AXIS,
    },
    ...overrides,
  };
}

/** 原型：图例置顶居中 */
export function legendTopCenter(data) {
  return {
    data,
    top: 4,
    left: "center",
    icon: "rect",
    itemWidth: 12,
    itemHeight: 8,
  };
}

/** 原型：图例置底居中 */
export function legendBottomCenter(data) {
  return {
    data,
    bottom: 0,
    left: "center",
    icon: "rect",
    itemWidth: 12,
    itemHeight: 8,
  };
}

/** 折线图数据点标签（原型直接在点上标注百分比/数值） */
export function linePointLabel(color) {
  return {
    show: true,
    position: "top",
    distance: 4,
    fontSize: 10,
    color: color || "#606266",
    formatter: (p) => (p.value != null ? `${p.value}%` : ""),
  };
}

/** 堆叠柱内部数值标签 */
export function stackBarLabel(show) {
  return {
    show: show !== false,
    position: "inside",
    fontSize: 10,
    color: "#fff",
    formatter: (p) => (p.value > 0 ? p.value : ""),
  };
}

export function withAlpha(hex, alpha = 0.2) {
  const map = {
    "#1890FF": `rgba(24,144,255,${alpha})`,
    "#69C0FF": `rgba(105,192,255,${alpha})`,
    "#0050B3": `rgba(0,80,179,${alpha})`,
    "#52C41A": `rgba(82,196,26,${alpha})`,
    "#FA8C16": `rgba(250,140,22,${alpha})`,
    "#409EFF": `rgba(64,158,255,${alpha})`,
    "#5BA8D4": `rgba(91,168,212,${alpha})`,
  };
  const key = (hex || "").toUpperCase();
  return map[key] || hex;
}

/** 外勤气泡图多色 */
export const BUBBLE_COLORS = [
  PROTOTYPE_COLORS.blue,
  PROTOTYPE_COLORS.green,
  PROTOTYPE_COLORS.orange,
  PROTOTYPE_COLORS.yellow,
  PROTOTYPE_COLORS.blueDark,
];
