<template>
  <div class="work-hour-analysis">
    <el-tabs v-model="subTab" class="sub-tabs">
      <el-tab-pane label="工时分析" name="analysis" />
      <el-tab-pane label="工时与专业的统计分布" name="distribution" />
    </el-tabs>

    <div v-show="subTab === 'analysis'" class="sub-tab-body">
      <section class="chart-section">
        <h3 class="section-title">
          <span class="section-dot" />
          按工时类型展示
        </h3>
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="专业：">
            <el-select v-model="typeQuery.specialty" placeholder="请选择" style="width: 120px">
              <el-option
                v-for="opt in specialtyOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间：">
            <el-date-picker
              v-model="typeQuery.startDate"
              type="date"
              placeholder="开始日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
            <span class="date-sep">~</span>
            <el-date-picker
              v-model="typeQuery.endDate"
              type="date"
              placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleTypeQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetTypeQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div ref="typeChart" class="chart-box" />
      </section>

      <section class="chart-section">
        <h3 class="section-title">
          <span class="section-dot" />
          按单位及部门展示
        </h3>
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="时间：">
            <el-date-picker
              v-model="unitDeptQuery.startDate"
              type="date"
              placeholder="开始日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
            <span class="date-sep">~</span>
            <el-date-picker
              v-model="unitDeptQuery.endDate"
              type="date"
              placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item label="">
            <el-radio-group v-model="unitDeptQuery.dimension" size="small">
              <el-radio label="unit">按单位</el-radio>
              <el-radio label="department">按部门</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleUnitDeptQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetUnitDeptQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div ref="unitDeptChart" class="chart-box" />
      </section>
    </div>

    <div v-show="subTab === 'distribution'" class="sub-tab-body">
      <section class="chart-section">
        <h3 class="section-title">
          <span class="section-dot" />
          各专业工时结构分布
        </h3>
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="单位：">
            <el-select v-model="distQuery.unit" placeholder="请选择" style="width: 160px">
              <el-option
                v-for="opt in unitOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间：">
            <el-date-picker
              v-model="distQuery.startDate"
              type="date"
              placeholder="开始日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
            <span class="date-sep">~</span>
            <el-date-picker
              v-model="distQuery.endDate"
              type="date"
              placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleDistQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetDistQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div ref="distStackChart" class="chart-box chart-box--lg" />
      </section>

      <section class="chart-section">
        <h3 class="section-title">
          <span class="section-dot" />
          专业工时占比
        </h3>
        <div class="dist-summary">
          当前单位：<strong>{{ distUnitLabel }}</strong>
          <span class="dist-summary__sep">|</span>
          统计区间：<strong>{{ distQuery.startDate }} ~ {{ distQuery.endDate }}</strong>
        </div>
        <div ref="distPieChart" class="chart-box chart-box--md" />
      </section>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption, legendTopCenter, CHART_PALETTE } from "../utils/chartTheme";
import { UNIT_OPTIONS } from "../utils/behaviorOverviewData";
import {
  SPECIALTY_OPTIONS,
  DEFAULT_HOUR_ANALYSIS_QUERY,
  DEFAULT_UNIT_DEPT_QUERY,
  DEFAULT_DISTRIBUTION_QUERY,
  buildHourTypeByCity,
  buildSpecialtyHourDiff,
  buildSpecialtyDistribution,
  unitLabel,
} from "../utils/workHourAnalysisData";

const HOUR_TYPE_COLORS = {
  businessTrip: "#1890FF",
  training: "#FAAD14",
  attendance: "#13C2C2",
};

const DIST_COLORS = {
  attendance: "#13C2C2",
  businessTrip: "#1890FF",
  training: "#FAAD14",
  overtime: "#722ED1",
};

export default {
  name: "WorkHourAnalysisPanel",
  props: {
    panelActive: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      subTab: "analysis",
      specialtyOptions: SPECIALTY_OPTIONS,
      unitOptions: UNIT_OPTIONS.filter((u) => u.value !== "all"),
      typeQuery: { ...DEFAULT_HOUR_ANALYSIS_QUERY },
      unitDeptQuery: { ...DEFAULT_UNIT_DEPT_QUERY },
      distQuery: { ...DEFAULT_DISTRIBUTION_QUERY },
      typeData: buildHourTypeByCity(DEFAULT_HOUR_ANALYSIS_QUERY),
      unitDeptData: buildSpecialtyHourDiff(DEFAULT_UNIT_DEPT_QUERY),
      distData: buildSpecialtyDistribution(DEFAULT_DISTRIBUTION_QUERY),
      charts: {},
      resizeHandler: null,
      resizeObserver: null,
    };
  },
  computed: {
    distUnitLabel() {
      return unitLabel(this.distQuery.unit);
    },
  },
  watch: {
    panelActive(val) {
      if (val) this.ensureChartsReady();
    },
    subTab() {
      if (!this.panelActive) return;
      this.ensureChartsReady();
    },
    "unitDeptQuery.dimension"() {
      this.refreshUnitDeptData();
      this.$nextTick(() => this.renderUnitDeptChart());
    },
  },
  mounted() {
    this.bindResizeObserver();
    this.resizeHandler = () => this.resizeCharts();
    window.addEventListener("resize", this.resizeHandler);
    if (this.panelActive) this.ensureChartsReady();
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    Object.values(this.charts).forEach((c) => c && c.dispose());
  },
  methods: {
    ensureChartsReady() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.initCharts(true);
          this.renderAllCharts();
          this.resizeCharts();
        });
      });
    },
    bindResizeObserver() {
      if (typeof ResizeObserver === "undefined") return;
      this.resizeObserver = new ResizeObserver(() => {
        if (this.panelActive) this.resizeCharts();
      });
      this.$nextTick(() => {
        ["typeChart", "unitDeptChart", "distStackChart", "distPieChart"].forEach((refName) => {
          const el = this.$refs[refName];
          if (el) this.resizeObserver.observe(el);
        });
      });
    },
    initCharts(forceReinit = false) {
      const refs = {
        type: "typeChart",
        unitDept: "unitDeptChart",
        distStack: "distStackChart",
        distPie: "distPieChart",
      };
      Object.keys(refs).forEach((key) => {
        const el = this.$refs[refs[key]];
        if (!el) return;
        if (forceReinit && this.charts[key]) {
          this.charts[key].dispose();
          delete this.charts[key];
        }
        if (!this.charts[key] && el.clientWidth > 0) {
          this.charts[key] = echarts.init(el);
        }
      });
    },
    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
    refreshTypeData() {
      this.typeData = buildHourTypeByCity(this.typeQuery);
    },
    refreshUnitDeptData() {
      this.unitDeptData = buildSpecialtyHourDiff(this.unitDeptQuery);
    },
    refreshDistData() {
      this.distData = buildSpecialtyDistribution(this.distQuery);
    },
    handleTypeQuery() {
      this.refreshTypeData();
      this.renderTypeChart();
    },
    resetTypeQuery() {
      this.typeQuery = { ...DEFAULT_HOUR_ANALYSIS_QUERY };
      this.refreshTypeData();
      this.renderTypeChart();
    },
    handleUnitDeptQuery() {
      this.refreshUnitDeptData();
      this.renderUnitDeptChart();
    },
    resetUnitDeptQuery() {
      this.unitDeptQuery = { ...DEFAULT_UNIT_DEPT_QUERY };
      this.refreshUnitDeptData();
      this.renderUnitDeptChart();
    },
    handleDistQuery() {
      this.refreshDistData();
      this.renderDistributionCharts();
    },
    resetDistQuery() {
      this.distQuery = { ...DEFAULT_DISTRIBUTION_QUERY };
      this.refreshDistData();
      this.renderDistributionCharts();
    },
    renderAllCharts() {
      this.renderTypeChart();
      this.renderUnitDeptChart();
      this.renderDistributionCharts();
    },
    renderTypeChart() {
      const chart = this.charts.type;
      if (!chart) return;
      const { categories, businessTrip, training, attendance } = this.typeData;
      const maxVal = Math.max(...businessTrip, ...training, ...attendance, 50);
      const yMax = Math.min(280, Math.ceil(maxVal / 50) * 50 + 50);

      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: legendTopCenter(["出差工时", "培训工时", "出勤工时"]),
          grid: { left: "2%", right: "3%", top: "16%", bottom: "18%", containLabel: true },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: categories,
            axisLabel: {
              interval: 0,
              rotate: categories.length > 8 ? 40 : 0,
              fontSize: 11,
              hideOverlap: true,
            },
          },
          yAxis: {
            type: "value",
            min: 0,
            max: yMax,
            interval: Math.max(50, Math.round(yMax / 5)),
          },
          series: [
            {
              name: "出差工时",
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { width: 2, color: HOUR_TYPE_COLORS.businessTrip },
              itemStyle: { color: HOUR_TYPE_COLORS.businessTrip },
              data: businessTrip,
            },
            {
              name: "培训工时",
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { width: 2, color: HOUR_TYPE_COLORS.training },
              itemStyle: { color: HOUR_TYPE_COLORS.training },
              data: training,
            },
            {
              name: "出勤工时",
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { width: 2, color: HOUR_TYPE_COLORS.attendance },
              itemStyle: { color: HOUR_TYPE_COLORS.attendance },
              data: attendance,
            },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderUnitDeptChart() {
      const chart = this.charts.unitDept;
      if (!chart) return;
      const { categories, values } = this.unitDeptData;
      const dimLabel = this.unitDeptQuery.dimension === "unit" ? "按单位" : "按部门";

      chart.setOption(
        baseChartOption({
          title: {
            text: "专业工时差异",
            left: "center",
            top: 4,
            textStyle: { fontSize: 14, fontWeight: 600, color: "#303133" },
          },
          tooltip: {
            trigger: "axis",
            formatter: (params) => {
              const p = params[0];
              return `${p.name}<br/>工时差异指数：<strong>${p.value}%</strong><br/>维度：${dimLabel}`;
            },
          },
          grid: { left: "2%", right: "3%", top: "18%", bottom: "16%", containLabel: true },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: categories,
            axisLabel: { interval: 0, rotate: 32, fontSize: 11, hideOverlap: true },
          },
          yAxis: {
            type: "value",
            min: 0,
            max: 100,
            interval: 20,
            axisLabel: { formatter: "{value}%", fontSize: 11 },
          },
          series: [
            {
              name: "专业工时差异",
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: 7,
              lineStyle: { width: 2.5, color: "#13C2C2" },
              itemStyle: { color: "#13C2C2", borderColor: "#fff", borderWidth: 2 },
              areaStyle: { color: "rgba(19,194,194,0.12)" },
              data: values,
            },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderDistributionCharts() {
      this.renderDistStackChart();
      this.renderDistPieChart();
    },
    renderDistStackChart() {
      const chart = this.charts.distStack;
      if (!chart) return;
      const { categories, attendance, businessTrip, training, overtime } = this.distData;

      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          legend: legendTopCenter(["出勤工时", "出差工时", "培训工时", "加班工时"]),
          grid: { left: "2%", right: "3%", top: "16%", bottom: "14%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: 28, fontSize: 11 },
          },
          yAxis: { type: "value", min: 0 },
          series: [
            {
              name: "出勤工时",
              type: "bar",
              stack: "hours",
              barMaxWidth: 40,
              itemStyle: { color: DIST_COLORS.attendance },
              data: attendance,
            },
            {
              name: "出差工时",
              type: "bar",
              stack: "hours",
              itemStyle: { color: DIST_COLORS.businessTrip },
              data: businessTrip,
            },
            {
              name: "培训工时",
              type: "bar",
              stack: "hours",
              itemStyle: { color: DIST_COLORS.training },
              data: training,
            },
            {
              name: "加班工时",
              type: "bar",
              stack: "hours",
              itemStyle: { color: DIST_COLORS.overtime, borderRadius: [3, 3, 0, 0] },
              data: overtime,
            },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderDistPieChart() {
      const chart = this.charts.distPie;
      if (!chart) return;

      chart.setOption(
        baseChartOption({
          color: CHART_PALETTE,
          tooltip: { trigger: "item", formatter: "{b}<br/>工时合计：{c} h ({d}%)" },
          legend: {
            orient: "vertical",
            right: "4%",
            top: "center",
            textStyle: { fontSize: 11 },
          },
          series: [
            {
              name: "专业工时占比",
              type: "pie",
              radius: ["42%", "68%"],
              center: ["38%", "50%"],
              avoidLabelOverlap: true,
              itemStyle: { borderColor: "#fff", borderWidth: 2 },
              label: { show: true, formatter: "{b}\n{d}%", fontSize: 11 },
              data: this.distData.pieData,
            },
          ],
        }),
        true
      );
      chart.resize();
    },
  },
};
</script>

<style scoped>
.work-hour-analysis {
  width: 100%;
  min-width: 0;
  min-height: 520px;
  box-sizing: border-box;
}

.sub-tabs {
  margin-bottom: 12px;
}

.sub-tabs >>> .el-tabs__header {
  margin-bottom: 0;
}

.sub-tabs >>> .el-tabs__item {
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

.sub-tabs >>> .el-tabs__item.is-active {
  color: #1890ff;
  font-weight: 500;
}

.sub-tabs >>> .el-tabs__active-bar {
  background-color: #1890ff;
}

.sub-tab-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
}

.chart-section {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px 16px 12px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  flex-shrink: 0;
}

.section-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.section-form >>> .el-form-item {
  margin-bottom: 8px;
}

.section-form__actions {
  margin-left: auto;
}

.date-sep {
  margin: 0 6px;
  color: #909399;
}

.chart-box {
  display: block;
  width: 100%;
  min-width: 0;
  height: 340px;
  box-sizing: border-box;
}

.chart-box--lg {
  height: 380px;
}

.chart-box--md {
  height: 320px;
}

.dist-summary {
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.dist-summary strong {
  color: #303133;
  font-weight: 600;
}

.dist-summary__sep {
  margin: 0 12px;
  color: #dcdfe6;
}

@media (max-width: 768px) {
  .section-form__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
