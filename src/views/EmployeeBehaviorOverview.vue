<template>
  <div class="employee-overview-page">
    <el-tabs v-model="activeTab" class="page-tabs">
      <el-tab-pane label="员工出勤情况" name="attendance" />
      <el-tab-pane label="异常预警" name="warning" />
    </el-tabs>

    <div v-show="activeTab === 'attendance'" class="overview-body">
      <!-- 查询栏 -->
      <section class="query-panel">
        <el-form :inline="true" size="small" class="query-form">
          <el-form-item label="统计维度：">
            <el-select v-model="queryParams.dimension" placeholder="请选择" style="width: 140px">
              <el-option label="按单位" value="unit" />
              <el-option label="按部门" value="department" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围：">
            <el-date-picker
              v-model="queryParams.startDate"
              type="date"
              placeholder="起始日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
            <span class="date-sep">-</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item label="单位：">
            <el-select v-model="queryParams.unit" placeholder="请选择" style="width: 180px">
              <el-option
                v-for="opt in unitOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item class="query-actions">
            <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <!-- KPI 指标条 -->
      <section class="stats-banner">
        <div
          v-for="item in statItems"
          :key="item.key"
          class="stat-item"
          :class="{ active: activeMetric === item.key, 'is-link': item.key !== 'comparison' }"
          @click="item.key !== 'comparison' && handleCardClick(item.key)"
        >
          <template v-if="item.key !== 'comparison'">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :class="item.valueClass">{{ item.value }}</div>
          </template>
          <template v-else>
            <div class="stat-label">{{ item.label }}</div>
            <el-button type="text" size="small" class="comparison-btn" @click.stop="handleViewComparison">
              查看详情
            </el-button>
          </template>
        </div>
      </section>

      <!-- 操作提示 -->
      <div class="tip-bar">
        <i class="el-icon-info" />
        <span class="tip-text">
          当前统计维度：<strong>{{ snapshot.dimensionLabel }}</strong>；
          点击上方 KPI 卡片可切换主图展示指标；
          横轴为{{ snapshot.dimensionLabel }}名称，点击「查询」联动刷新全部图表。
        </span>
        <el-button type="primary" plain size="mini" icon="el-icon-download" @click="handleExportDetail">
          导出明细
        </el-button>
      </div>

      <!-- 主图表 -->
      <section class="chart-card chart-card--main">
        <div class="chart-card__header">
          <h3 class="chart-card__title">{{ snapshot.mainChartTitle }}</h3>
        </div>
        <div ref="mainChart" class="chart-box chart-box--lg" />
      </section>

      <!-- 双列图表 -->
      <div class="chart-grid">
        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">按时出勤 &amp; 迟到早退率</h3>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('punctuality')">
              导出明细
            </el-button>
          </div>
          <div ref="punctualityChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">迟到早退人数</h3>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('lateEarly')">
              导出明细
            </el-button>
          </div>
          <div ref="lateEarlyChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">请假趋势变化情况</h3>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('leaveTrend')">
              导出明细
            </el-button>
          </div>
          <div ref="leaveTrendChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">请假类型分布情况</h3>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('leaveType')">
              导出明细
            </el-button>
          </div>
          <div ref="leaveTypeChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">出差 &amp; 培训工时与专业相关性</h3>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('businessTraining')">
              导出明细
            </el-button>
          </div>
          <div ref="businessTrainingChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">专业与作业工时相关性</h3>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('specialty')">
              导出明细
            </el-button>
          </div>
          <div ref="specialtyChart" class="chart-box" />
        </section>
      </div>

      <!-- 年休假分布 -->
      <section class="chart-card chart-card--wide">
        <div class="chart-card__header chart-card__header--wrap">
          <h3 class="chart-card__title">年休假请假分布时段</h3>
          <div class="header-tools">
            <el-form :inline="true" size="mini">
              <el-form-item label="日期范围：">
                <el-date-picker
                  v-model="leaveQueryParams.startDate"
                  type="date"
                  placeholder="起始"
                  value-format="yyyy-MM-dd"
                  style="width: 120px"
                  @change="handleLeaveRangeChange"
                />
                <span class="date-sep">-</span>
                <el-date-picker
                  v-model="leaveQueryParams.endDate"
                  type="date"
                  placeholder="结束"
                  value-format="yyyy-MM-dd"
                  style="width: 120px"
                  @change="handleLeaveRangeChange"
                />
              </el-form-item>
            </el-form>
            <el-button type="text" size="small" icon="el-icon-download" @click="handleExportChart('leaveDistribution')">
              导出明细
            </el-button>
          </div>
        </div>
        <div ref="leaveBubbleChart" class="chart-box" />
        <el-table :data="leaveTableData" border stripe size="small" class="leave-table">
          <el-table-column prop="unit" label="单位" min-width="120" />
          <el-table-column prop="specialty" label="专业" min-width="100" />
          <el-table-column prop="fieldWorkCount" label="外勤人次" width="100" align="center" />
          <el-table-column prop="totalDuration" label="总时长" width="100" align="center" />
          <el-table-column prop="avgDuration" label="人均时长" width="100" align="center" />
          <el-table-column prop="businessType" label="业务类型" min-width="120" />
        </el-table>
      </section>
    </div>

    <div v-show="activeTab === 'warning'" class="warning-placeholder">
      <div class="placeholder-card">
        <h3>异常预警</h3>
        <p>异常预警统计图表建设中，后续将展示预警趋势与分布分析。</p>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import {
  CHART_COLORS,
  LEAVE_TYPE_COLORS,
  baseChartOption,
  withAlpha,
} from "../utils/chartTheme";
import {
  UNIT_OPTIONS,
  DEFAULT_QUERY,
  DEFAULT_LEAVE_QUERY,
  buildOverviewSnapshot,
  getMainChartSeriesMode,
} from "../utils/behaviorOverviewData";

const RADAR_INDICATORS = [
  { name: "输电", max: 150 },
  { name: "营配", max: 150 },
  { name: "电网建设", max: 150 },
  { name: "变电", max: 150 },
  { name: "配电", max: 150 },
];

export default {
  name: "EmployeeBehaviorOverview",
  data() {
    return {
      activeTab: "attendance",
      activeMetric: "total",
      unitOptions: UNIT_OPTIONS,
      queryParams: { ...DEFAULT_QUERY },
      leaveQueryParams: { ...DEFAULT_LEAVE_QUERY },
      snapshot: buildOverviewSnapshot(DEFAULT_QUERY, DEFAULT_LEAVE_QUERY, "total"),
      leaveTableData: [],
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    statsData() {
      return this.snapshot.stats;
    },
    statItems() {
      const d = this.statsData;
      return [
        { key: "total", label: "总应出勤人数", value: d.totalShouldAttendance, valueClass: "" },
        { key: "actual", label: "实际出勤人数", value: d.actualAttendance, valueClass: "is-primary" },
        { key: "rate", label: "整体出勤率", value: d.overallRate, valueClass: "is-success" },
        { key: "leave", label: "请假时长", value: d.leaveDuration, valueClass: "" },
        { key: "comparison", label: "考勤数据对比", value: "", valueClass: "" },
      ];
    },
  },
  mounted() {
    this.leaveTableData = this.snapshot.leaveTable;
    this.$nextTick(() => {
      this.initChartInstances();
      this.refreshAllCharts();
      this.resizeHandler = () => {
        Object.values(this.charts).forEach((c) => c && c.resize());
      };
      window.addEventListener("resize", this.resizeHandler);
    });
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((chart) => chart && chart.dispose());
  },
  methods: {
    rebuildSnapshot() {
      this.snapshot = buildOverviewSnapshot(
        this.queryParams,
        this.leaveQueryParams,
        this.activeMetric
      );
      this.leaveTableData = this.snapshot.leaveTable;
    },

    initChartInstances() {
      const map = {
        main: "mainChart",
        punctuality: "punctualityChart",
        lateEarly: "lateEarlyChart",
        leaveTrend: "leaveTrendChart",
        leaveType: "leaveTypeChart",
        businessTraining: "businessTrainingChart",
        specialty: "specialtyChart",
        leaveBubble: "leaveBubbleChart",
      };
      Object.keys(map).forEach((key) => {
        const el = this.$refs[map[key]];
        if (el) this.charts[key] = echarts.init(el);
      });
    },

    barOpacity(seriesKey, emphasis) {
      if (!emphasis || emphasis === seriesKey) return 1;
      return 0.35;
    },
    refreshAllCharts() {
      this.rebuildSnapshot();
      this.renderMainChart();
      this.renderPunctualityChart();
      this.renderLateEarlyChart();
      this.renderLeaveTrendChart();
      this.renderLeaveTypeChart();
      this.renderBusinessTrainingChart();
      this.renderSpecialtyChart();
      this.renderLeaveBubbleChart();
    },

    renderMainChart() {
      const chart = this.charts.main;
      if (!chart) return;
      const s = this.snapshot;
      const mode = getMainChartSeriesMode(this.activeMetric);
      const legend = [];
      const series = [];

      if (mode.showShould) {
        legend.push("应出勤人数");
        series.push({
          name: "应出勤人数",
          type: "bar",
          barMaxWidth: 18,
          itemStyle: {
            color: CHART_COLORS.secondary,
            borderRadius: [2, 2, 0, 0],
            opacity: this.barOpacity("should", mode.emphasis),
          },
          data: s.main.should,
        });
      }
      if (mode.showActual) {
        legend.push("实际出勤人数");
        series.push({
          name: "实际出勤人数",
          type: "bar",
          barMaxWidth: 18,
          itemStyle: {
            color: CHART_COLORS.primary,
            borderRadius: [2, 2, 0, 0],
            opacity: this.barOpacity("actual", mode.emphasis),
          },
          data: s.main.actual,
        });
      }
      if (mode.showRate) {
        legend.push("出勤率");
        series.push({
          name: "出勤率",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: mode.emphasis === "rate" ? 3 : 2, color: CHART_COLORS.success },
          itemStyle: { color: CHART_COLORS.success },
          data: s.main.rate,
        });
      }

      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          legend: { data: legend, top: 0 },
          xAxis: { data: s.categories, axisLabel: { rotate: s.categories.length > 8 ? 30 : 0, fontSize: 10 } },
          yAxis: [
            { type: "value", name: "人数", min: 0, max: s.yMax, interval: Math.ceil(s.yMax / 7 / 100) * 100 },
            {
              type: "value",
              name: "百分比",
              min: 0,
              max: 100,
              interval: 10,
              axisLabel: { formatter: "{value}%" },
            },
          ],
          series,
        }),
        true
      );
    },

    renderPunctualityChart() {
      const chart = this.charts.punctuality;
      if (!chart) return;
      const s = this.snapshot;
      chart.setOption(
        baseChartOption({
          legend: { data: ["按时出勤率", "迟到率", "早退率"], bottom: 0 },
          grid: { bottom: "18%" },
          xAxis: { data: s.categories, axisLabel: { rotate: s.categories.length > 8 ? 30 : 0, fontSize: 10 } },
          yAxis: { axisLabel: { formatter: "{value}%" }, max: 100 },
          series: [
            { name: "按时出勤率", type: "line", smooth: true, symbol: "none", itemStyle: { color: CHART_COLORS.primary }, data: s.punctuality.onTime },
            { name: "迟到率", type: "line", smooth: true, symbol: "none", itemStyle: { color: CHART_COLORS.warning }, data: s.punctuality.late },
            { name: "早退率", type: "line", smooth: true, symbol: "none", itemStyle: { color: CHART_COLORS.danger }, data: s.punctuality.early },
          ],
        }),
        true
      );
    },

    renderLateEarlyChart() {
      const chart = this.charts.lateEarly;
      if (!chart) return;
      const s = this.snapshot;
      chart.setOption(
        baseChartOption({
          legend: { data: ["迟到人数", "早退人数"], bottom: 0 },
          grid: { bottom: "18%" },
          xAxis: { data: s.categories, axisLabel: { rotate: s.categories.length > 8 ? 30 : 0, fontSize: 10 } },
          series: [
            { name: "迟到人数", type: "bar", stack: "late", barMaxWidth: 20, itemStyle: { color: CHART_COLORS.primary }, data: s.lateEarly.late },
            { name: "早退人数", type: "bar", stack: "late", barMaxWidth: 20, itemStyle: { color: CHART_COLORS.warning }, data: s.lateEarly.early },
          ],
        }),
        true
      );
    },

    renderLeaveTrendChart() {
      const chart = this.charts.leaveTrend;
      if (!chart) return;
      const s = this.snapshot;
      const leaveNames = ["事假", "病假", "年休假"];
      const datasets = [s.leaveTrend.personal, s.leaveTrend.sick, s.leaveTrend.annual];
      const yMax = Math.max(10, ...datasets.flat()) + 5;
      chart.setOption(
        baseChartOption({
          legend: { data: leaveNames, bottom: 0 },
          grid: { bottom: "18%" },
          xAxis: { data: s.categories, axisLabel: { rotate: s.categories.length > 8 ? 30 : 0, fontSize: 10 } },
          yAxis: { max: yMax },
          series: leaveNames.map((name, i) => ({
            name,
            type: "bar",
            stack: "leave",
            barMaxWidth: 20,
            itemStyle: { color: LEAVE_TYPE_COLORS[name] },
            data: datasets[i],
          })),
        }),
        true
      );
    },

    renderLeaveTypeChart() {
      const chart = this.charts.leaveType;
      if (!chart) return;
      const pieData = this.snapshot.leavePie;
      chart.setOption(
        baseChartOption({
          legend: { orient: "horizontal", bottom: 0, data: pieData.map((d) => d.name) },
          series: [
            {
              type: "pie",
              radius: ["42%", "68%"],
              center: ["50%", "46%"],
              avoidLabelOverlap: true,
              label: { show: true, formatter: "{b}\n{d}%", fontSize: 11, color: "#606266" },
              labelLine: { length: 8, length2: 6 },
              data: pieData.map((d) => ({
                ...d,
                itemStyle: { color: LEAVE_TYPE_COLORS[d.name] },
              })),
            },
          ],
        }),
        true
      );
    },

    renderBusinessTrainingChart() {
      const chart = this.charts.businessTraining;
      if (!chart) return;
      const sc = this.snapshot.scatter;
      chart.setOption(
        baseChartOption({
          legend: { data: ["出差工时", "培训工时", "线性(出差工时)", "线性(培训工时)"], bottom: 0 },
          grid: { bottom: "20%" },
          xAxis: { type: "value", name: "培训工时", min: 0, max: 14 },
          yAxis: { type: "value", name: "出差工时", min: 0, max: 30 },
          series: [
            { name: "出差工时", type: "scatter", symbolSize: 8, itemStyle: { color: CHART_COLORS.primary }, data: sc.business },
            { name: "培训工时", type: "scatter", symbolSize: 8, itemStyle: { color: CHART_COLORS.secondary }, data: sc.training },
            { name: "线性(出差工时)", type: "line", lineStyle: { type: "dotted", color: CHART_COLORS.warning }, data: [[0, 13], [14, 13]], symbol: "none" },
            { name: "线性(培训工时)", type: "line", lineStyle: { type: "dotted", color: CHART_COLORS.success }, data: [[0, 5], [14, 7]], symbol: "none" },
          ],
        }),
        true
      );
    },

    renderSpecialtyChart() {
      const chart = this.charts.specialty;
      if (!chart) return;
      const sp = this.snapshot.specialty;
      const maxVal = Math.max(...sp.work, ...sp.attend, 120);
      const indicators = RADAR_INDICATORS.map((ind) => ({ ...ind, max: Math.ceil(maxVal / 10) * 10 + 20 }));
      chart.setOption(
        baseChartOption({
          legend: { data: ["作业工时时长", "出勤工时"], bottom: 0 },
          radar: {
            indicator: indicators,
            radius: "58%",
            center: ["50%", "48%"],
            axisName: { color: "#606266", fontSize: 11 },
            splitArea: { areaStyle: { color: ["rgba(64,158,255,0.04)", "rgba(64,158,255,0.08)"] } },
            splitLine: { lineStyle: { color: "#EBEEF5" } },
            axisLine: { lineStyle: { color: "#DCDFE6" } },
          },
          series: [
            {
              type: "radar",
              data: [
                { value: sp.work, name: "作业工时时长", lineStyle: { color: CHART_COLORS.primary }, itemStyle: { color: CHART_COLORS.primary }, areaStyle: { color: withAlpha(CHART_COLORS.primary) } },
                { value: sp.attend, name: "出勤工时", lineStyle: { color: CHART_COLORS.secondary }, itemStyle: { color: CHART_COLORS.secondary }, areaStyle: { color: withAlpha(CHART_COLORS.secondary) } },
              ],
            },
          ],
        }),
        true
      );
    },

    renderLeaveBubbleChart() {
      const chart = this.charts.leaveBubble;
      if (!chart) return;
      const bubble = this.snapshot.bubble;
      const xMax = Math.max(60, ...bubble.map((d) => d[0])) + 10;
      const yMax = Math.max(250, ...bubble.map((d) => d[1])) + 20;
      chart.setOption(
        baseChartOption({
          grid: { bottom: "12%" },
          xAxis: { type: "value", name: "外勤频次", min: 0, max: xMax },
          yAxis: { type: "value", name: "时长(h)", min: 0, max: yMax },
          series: [
            {
              type: "scatter",
              itemStyle: { color: CHART_COLORS.primary, opacity: 0.75 },
              symbolSize: (data) => Math.sqrt(data[2]) * 5,
              data: bubble,
            },
          ],
        }),
        true
      );
    },

    handleQuery() {
      if (this.queryParams.startDate && this.queryParams.endDate) {
        if (this.queryParams.startDate > this.queryParams.endDate) {
          this.$message.warning("起始日期不能晚于结束日期");
          return;
        }
        if (!this.leaveQueryParams.startDate) {
          this.leaveQueryParams.startDate = this.queryParams.startDate;
        }
        if (!this.leaveQueryParams.endDate) {
          this.leaveQueryParams.endDate = this.queryParams.endDate;
        }
      }
      this.refreshAllCharts();
      this.$message.success("查询成功，图表已联动刷新");
    },

    handleReset() {
      this.queryParams = { ...DEFAULT_QUERY };
      this.leaveQueryParams = { ...DEFAULT_LEAVE_QUERY };
      this.activeMetric = "total";
      this.refreshAllCharts();
      this.$message.info("已重置查询条件");
    },

    handleCardClick(type) {
      this.activeMetric = type;
      this.renderMainChart();
      const labels = {
        total: "总应出勤人数",
        actual: "实际出勤人数",
        rate: "整体出勤率",
        leave: "请假时长",
      };
      this.$message.info(`主图已切换为「${labels[type]}」视角`);
    },

    handleLeaveRangeChange() {
      if (
        this.leaveQueryParams.startDate &&
        this.leaveQueryParams.endDate &&
        this.leaveQueryParams.startDate > this.leaveQueryParams.endDate
      ) {
        this.$message.warning("年休假分布起始日期不能晚于结束日期");
        return;
      }
      this.rebuildSnapshot();
      this.leaveTableData = this.snapshot.leaveTable;
      this.renderLeaveBubbleChart();
    },

    handleViewComparison() {
      this.$message.info("查看考勤数据对比详情功能待开发");
    },

    handleExportDetail() {
      this.$confirm("确定要导出当前筛选条件下的数据吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "info",
      })
        .then(() => this.$message.success("导出成功"))
        .catch(() => {});
    },

    handleExportChart(chartType) {
      this.$message.success(`已导出 ${chartType} 图表数据（当前筛选条件）`);
    },
  },
};
</script>

<style scoped>
.employee-overview-page {
  min-height: calc(100vh - 100px);
  padding: 12px 16px 20px;
  background: #f0f2f5;
  box-sizing: border-box;
}

.page-tabs {
  background: #fff;
  padding: 0 16px;
  margin-bottom: 12px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.page-tabs >>> .el-tabs__header {
  margin-bottom: 0;
}

.page-tabs >>> .el-tabs__item {
  height: 44px;
  line-height: 44px;
  font-size: 14px;
}

.page-tabs >>> .el-tabs__item.is-active {
  color: #409eff;
  font-weight: 600;
}

.page-tabs >>> .el-tabs__active-bar {
  height: 2px;
  background-color: #409eff;
}

.overview-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 查询区 */
.query-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 14px 16px 6px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.query-actions {
  margin-left: auto;
}

.date-sep {
  margin: 0 6px;
  color: #909399;
}

/* KPI 指标条 */
.stats-banner {
  display: flex;
  background: linear-gradient(180deg, #ecf5ff 0%, #f5faff 100%);
  border: 1px solid #d9ecff;
  border-radius: 4px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px 12px;
  border-right: 1px solid #d9ecff;
  transition: background 0.2s;
}

.stat-item:last-child {
  border-right: none;
}

.stat-item.is-link {
  cursor: pointer;
}

.stat-item.is-link:hover {
  background: rgba(64, 158, 255, 0.08);
}

.stat-item.active {
  background: rgba(64, 158, 255, 0.12);
  box-shadow: inset 0 -2px 0 #409eff;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-value.is-primary {
  color: #409eff;
}

.stat-value.is-success {
  color: #67c23a;
}

.comparison-btn {
  color: #409eff;
  padding: 0;
  font-size: 13px;
}

/* 提示条 */
.tip-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-left: 3px solid #409eff;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.tip-bar .el-icon-info {
  color: #409eff;
  font-size: 16px;
}

.tip-text {
  flex: 1;
  line-height: 1.5;
}

.tip-text strong {
  color: #409eff;
  font-weight: 600;
}

/* 图表卡片 */
.chart-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 14px 16px 16px;
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.chart-card__header--wrap {
  flex-wrap: wrap;
  gap: 8px;
}

.chart-card__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding-left: 10px;
  border-left: 3px solid #409eff;
  line-height: 1.4;
}

.header-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-box {
  height: 260px;
  width: 100%;
}

.chart-box--lg {
  height: 380px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.leave-table {
  margin-top: 12px;
}

.leave-table >>> .el-table th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

/* 异常预警占位 */
.warning-placeholder {
  padding: 20px 0;
}

.placeholder-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 40px 24px;
  text-align: center;
}

.placeholder-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}

.placeholder-card p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .stats-banner {
    flex-wrap: wrap;
  }

  .stat-item {
    min-width: 50%;
    border-bottom: 1px solid #d9ecff;
  }
}

@media (max-width: 768px) {
  .stat-item {
    min-width: 100%;
  }

  .stat-value {
    font-size: 22px;
  }

  .query-actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
