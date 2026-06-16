<template>
  <div class="personal-app-showcase personal-stats-showcase">
    <header class="showcase-header">
      <h1 class="showcase-title">个人出勤管理 APP · 出勤统计</h1>
      <p class="showcase-desc">支持年度 / 季度 / 月度切换的数据统计视图，以及出勤率分析与趋势图表。</p>
    </header>

    <div class="mockup-grid-wrap">
      <div class="mockup-grid-scaler">
    <div class="mockup-grid">
      <!-- 年度 / 季度 / 月度 统计卡片 -->
      <div v-for="preset in periodMockups" :key="preset.key" class="mockup-item">
        <div class="phone-frame">
          <div class="phone-notch" />
          <div class="status-bar">
            <span>9:41</span>
            <span class="status-bar__icons">
              <i class="el-icon-mobile-phone" />
              <i class="el-icon-connection" />
              <i class="el-icon-lightning" />
            </span>
          </div>

          <div class="screen screen--scroll">
            <div class="filter-bar">
              <div class="period-tabs">
                <span
                  v-for="tab in periodTabs"
                  :key="tab.key"
                  class="period-tab"
                  :class="{ 'is-active': tab.key === preset.key }"
                >{{ tab.label }}</span>
              </div>
              <div class="period-picker">
                {{ preset.periodLabel }} <i class="el-icon-arrow-down" />
              </div>
            </div>

            <div class="search-bar">
              <span class="search-bar__dept">选择部门</span>
              <span class="search-bar__input">输入员工姓名搜索</span>
              <i class="el-icon-search search-bar__icon" />
            </div>

            <div class="card">
              <div class="card__title">{{ preset.title }}</div>
              <div class="stat-grid stat-grid--3">
                <div v-for="item in statItemsTop" :key="item.key" class="stat-cell">
                  <div class="stat-cell__icon" :style="{ background: item.color + '18', color: item.color }">
                    <i :class="item.icon" />
                  </div>
                  <div class="stat-cell__value">{{ summary[item.key] }}</div>
                  <div class="stat-cell__label">{{ item.label }}</div>
                </div>
              </div>
              <div class="stat-grid stat-grid--3">
                <div v-for="item in statItemsBottom" :key="item.key" class="stat-cell">
                  <div class="stat-cell__icon" :style="{ background: item.color + '18', color: item.color }">
                    <i :class="item.icon" />
                  </div>
                  <div class="stat-cell__value">{{ summary[item.key] }}</div>
                  <div class="stat-cell__label">{{ item.label }}</div>
                </div>
              </div>
              <div class="rate-row">
                <div class="rate-ring">
                  <svg viewBox="0 0 80 80" class="rate-ring__svg">
                    <circle cx="40" cy="40" r="34" class="rate-ring__bg" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      class="rate-ring__fg"
                      :style="{ strokeDashoffset: rateRingOffset }"
                    />
                  </svg>
                  <div class="rate-ring__text">
                    <strong>{{ summary.attendanceRate }}%</strong>
                  </div>
                </div>
                <div class="rate-row__label">出勤率</div>
              </div>
            </div>

            <div class="card">
              <div class="card__head">
                <span class="card__title card__title--sm">外勤时长统计</span>
                <span class="card__extra">总时长：<strong>{{ summary.fieldTotal }}</strong></span>
              </div>
              <div class="stat-grid stat-grid--3">
                <div v-for="item in fieldItems" :key="item.key" class="stat-cell stat-cell--compact">
                  <div class="stat-cell__icon stat-cell__icon--sm"><i :class="item.icon" /></div>
                  <div class="stat-cell__value">{{ summary[item.key] }}</div>
                  <div class="stat-cell__label">{{ item.label }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="tab-bar">
            <div class="tab-bar__item"><i class="el-icon-s-home" /><span>首页</span></div>
            <div class="tab-bar__item is-active"><i class="el-icon-data-line" /><span>出勤统计</span></div>
            <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
          </div>
        </div>
        <p class="mockup-label">{{ preset.mockupLabel }}</p>
      </div>

      <!-- 图表分析屏 -->
      <div class="mockup-item">
        <div class="phone-frame">
          <div class="phone-notch" />
          <div class="status-bar">
            <span>9:41</span>
            <span class="status-bar__icons">
              <i class="el-icon-mobile-phone" />
              <i class="el-icon-connection" />
              <i class="el-icon-lightning" />
            </span>
          </div>

          <div class="screen screen--scroll">
            <div class="filter-bar">
              <div class="period-tabs">
                <span class="period-tab is-active">年度</span>
                <span class="period-tab">季度</span>
                <span class="period-tab">月度</span>
              </div>
              <div class="period-picker">2025年 <i class="el-icon-arrow-down" /></div>
            </div>

            <div class="search-bar">
              <span class="search-bar__dept">选择部门</span>
              <span class="search-bar__input">输入员工姓名搜索</span>
              <i class="el-icon-search search-bar__icon" />
            </div>

            <div class="card">
              <div class="card__title card__title--sm">出勤率与旷工率</div>
              <div class="gauge-row">
                <div class="gauge-box">
                  <div ref="gaugePersonal" class="mini-chart" />
                  <div class="gauge-box__label">个人出勤率</div>
                </div>
                <div class="gauge-box">
                  <div ref="gaugeAbsent" class="mini-chart" />
                  <div class="gauge-box__label">旷工率</div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__head">
                <span class="card__title card__title--sm">出勤率对比</span>
                <span class="chart-legend">
                  <i class="dot dot--blue" />早退
                  <i class="dot dot--green" />迟到
                </span>
              </div>
              <div class="card__unit">单位：次</div>
              <div ref="compareChart" class="chart-box" />
            </div>

            <div class="card">
              <div class="card__head">
                <span class="card__title card__title--sm">业务班时长</span>
                <span class="chart-legend"><i class="dot dot--blue" />时长</span>
              </div>
              <div class="card__unit">单位：工时</div>
              <div ref="hoursChart" class="chart-box" />
            </div>
          </div>

          <div class="tab-bar">
            <div class="tab-bar__item"><i class="el-icon-s-home" /><span>首页</span></div>
            <div class="tab-bar__item is-active"><i class="el-icon-data-line" /><span>出勤统计</span></div>
            <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
          </div>
        </div>
        <p class="mockup-label">④ 出勤趋势分析</p>
      </div>
    </div>
    </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption } from "../utils/chartTheme";
import {
  PERIOD_TABS,
  PERIOD_PRESETS,
  getAttendanceSummary,
  getRateGaugeData,
  getCompareLineData,
  getWorkHoursBarData,
  STAT_ITEMS,
  FIELD_ITEMS,
} from "../utils/personalAttendanceStatsData";
import personalAppShowcaseScale from "../mixins/personalAppShowcaseScale";
import "../styles/personalAppShowcase.css";

function gaugeOption(value, color) {
  return {
    series: [{
      type: "gauge",
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      radius: "92%",
      center: ["50%", "58%"],
      progress: {
        show: true,
        width: 10,
        itemStyle: { color },
      },
      axisLine: { lineStyle: { width: 10, color: [[1, "#eef2f8"]] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        fontSize: 18,
        fontWeight: 700,
        color: "#303133",
        offsetCenter: [0, "8%"],
        formatter: "{value}%",
      },
      data: [{ value }],
    }],
  };
}

export default {
  name: "PersonalAttendanceStats",
  mixins: [personalAppShowcaseScale],
  data() {
    const summary = getAttendanceSummary();
    return {
      periodTabs: PERIOD_TABS,
      summary,
      statItemsTop: STAT_ITEMS.slice(0, 3),
      statItemsBottom: STAT_ITEMS.slice(3, 6),
      fieldItems: FIELD_ITEMS,
      periodMockups: [
        { key: "year", ...PERIOD_PRESETS.year, periodLabel: PERIOD_PRESETS.year.label, mockupLabel: "① 年度统计" },
        { key: "quarter", ...PERIOD_PRESETS.quarter, periodLabel: PERIOD_PRESETS.quarter.label, mockupLabel: "② 季度统计" },
        { key: "month", ...PERIOD_PRESETS.month, periodLabel: PERIOD_PRESETS.month.label, mockupLabel: "③ 月度统计" },
      ],
      gaugeData: getRateGaugeData(),
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    rateRingOffset() {
      const circumference = 2 * Math.PI * 34;
      const pct = this.summary.attendanceRate / 100;
      return circumference * (1 - pct);
    },
  },
  mounted() {
    this.resizeHandler = () => this.resizeCharts();
    window.addEventListener("resize", this.resizeHandler);
    this.$nextTick(() => this.initCharts());
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
    this.charts = {};
  },
  methods: {
    initCharts() {
      const refs = {
        gaugePersonal: "gaugePersonal",
        gaugeAbsent: "gaugeAbsent",
        compare: "compareChart",
        hours: "hoursChart",
      };
      Object.entries(refs).forEach(([key, refName]) => {
        const el = this.$refs[refName];
        if (el) this.charts[key] = echarts.init(el);
      });
      this.renderCharts();
    },
    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
    renderCharts() {
      const { personalRate, absentRate } = this.gaugeData;
      if (this.charts.gaugePersonal) {
        this.charts.gaugePersonal.setOption(gaugeOption(personalRate, "#1890ff"), true);
      }
      if (this.charts.gaugeAbsent) {
        this.charts.gaugeAbsent.setOption(gaugeOption(absentRate, "#f5222d"), true);
      }

      const line = getCompareLineData();
      if (this.charts.compare) {
        this.charts.compare.setOption(
          baseChartOption({
            grid: { left: "2%", right: "4%", bottom: "6%", top: "8%", containLabel: true },
            xAxis: { type: "category", data: line.months, boundaryGap: false },
            yAxis: { type: "value", max: 12 },
            series: [
              {
                name: "早退",
                type: "line",
                smooth: true,
                data: line.earlyLeave,
                symbolSize: 6,
                lineStyle: { color: "#1890ff", width: 2 },
                itemStyle: { color: "#1890ff" },
              },
              {
                name: "迟到",
                type: "line",
                smooth: true,
                data: line.late,
                symbolSize: 6,
                lineStyle: { color: "#52c41a", width: 2 },
                itemStyle: { color: "#52c41a" },
              },
            ],
          }),
          true
        );
      }

      const bar = getWorkHoursBarData();
      if (this.charts.hours) {
        this.charts.hours.setOption(
          baseChartOption({
            grid: { left: "2%", right: "4%", bottom: "6%", top: "8%", containLabel: true },
            xAxis: { type: "category", data: bar.months },
            yAxis: { type: "value", max: 200 },
            series: [{
              type: "bar",
              data: bar.hours,
              barWidth: "46%",
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#1890ff" },
                  { offset: 1, color: "rgba(24,144,255,0.15)" },
                ]),
                borderRadius: [4, 4, 0, 0],
              },
            }],
          }),
          true
        );
      }
      this.resizeCharts();
      this.updateShowcaseScale();
    },
  },
};
</script>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.period-tabs {
  display: flex;
  background: #e8ecf2;
  border-radius: 8px;
  padding: 3px;
}

.period-tab {
  padding: 5px 12px;
  font-size: 12px;
  color: #606266;
  border-radius: 6px;
  transition: all 0.2s;
}

.period-tab.is-active {
  background: #fff;
  color: #1890ff;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.period-picker {
  font-size: 12px;
  color: #303133;
  padding: 6px 10px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  font-size: 12px;
  flex-shrink: 0;
}

.search-bar__dept {
  color: #1890ff;
  font-weight: 500;
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-bar__icon {
  color: #909399;
  font-size: 14px;
}

.card {
  margin-bottom: 8px;
}

.card__title {
  margin-bottom: 8px;
}

.card__title--sm {
  margin-bottom: 6px;
}

.card__unit {
  font-size: 10px;
  color: #909399;
  margin-bottom: 2px;
}

.stat-grid {
  display: grid;
  gap: 6px;
  margin-bottom: 6px;
}

.stat-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.stat-cell {
  text-align: center;
  padding: 6px 4px;
  border-radius: 8px;
  background: #fafbfc;
}

.stat-cell--compact {
  padding: 8px 4px;
}

.stat-cell__icon {
  width: 28px;
  height: 28px;
  margin: 0 auto 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.stat-cell__icon--sm {
  width: 24px;
  height: 24px;
  background: #e6f7ff;
  color: #1890ff;
  font-size: 12px;
}

.stat-cell__value {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-cell__label {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
}

.rate-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  border-top: 1px dashed #eef0f4;
  margin-top: 2px;
}

.rate-ring {
  position: relative;
  width: 68px;
  height: 68px;
}

.rate-ring__svg {
  width: 68px;
  height: 68px;
  transform: rotate(-90deg);
}

.rate-ring__bg {
  fill: none;
  stroke: #eef2f8;
  stroke-width: 8;
}

.rate-ring__fg {
  fill: none;
  stroke: #1890ff;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 213.6;
  transition: stroke-dashoffset 0.6s ease;
}

.rate-ring__text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #1890ff;
}

.rate-row__label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.gauge-row {
  display: flex;
  justify-content: space-around;
  gap: 6px;
}

.gauge-box {
  flex: 1;
  text-align: center;
}

.mini-chart {
  height: 88px;
  width: 100%;
}

.gauge-box__label {
  font-size: 11px;
  color: #606266;
  margin-top: -6px;
}

.chart-legend {
  font-size: 10px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 2px;
}

.dot--blue { background: #1890ff; }
.dot--green { background: #52c41a; }

.chart-box {
  height: 96px;
  width: 100%;
}
</style>
