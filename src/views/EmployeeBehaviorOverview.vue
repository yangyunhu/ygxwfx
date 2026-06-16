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
          <el-form-item class="query-export">
            <el-button type="success" plain icon="el-icon-download" @click="openExportDialog()">
              导出
            </el-button>
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
        <el-button type="primary" plain size="mini" icon="el-icon-download" @click="handleDirectExport('main')">
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
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('punctuality')">
              导出明细
            </el-button>
          </div>
          <div ref="punctualityChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">迟到早退人数</h3>
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('lateEarly')">
              导出明细
            </el-button>
          </div>
          <div ref="lateEarlyChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">请假趋势变化情况</h3>
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('leaveTrend')">
              导出明细
            </el-button>
          </div>
          <div ref="leaveTrendChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">请假类型分布情况</h3>
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('leaveType')">
              导出明细
            </el-button>
          </div>
          <div ref="leaveTypeChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">出差 &amp; 培训工时与专业相关性</h3>
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('businessTraining')">
              导出明细
            </el-button>
          </div>
          <div ref="businessTrainingChart" class="chart-box" />
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">专业与作业工时相关性</h3>
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('specialty')">
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
            <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleDirectExport('leaveDistribution')">
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

    <warning-overview-panel v-show="activeTab === 'warning'" :active="activeTab === 'warning'" />

    <!-- 统计模块导出 -->
    <el-dialog
      title="导出统计明细"
      :visible.sync="exportDialogVisible"
      width="640px"
      append-to-body
      class="export-module-dialog"
      @closed="resetExportDialog"
    >
      <p class="export-dialog-tip">
        请选择需要导出的统计模块，系统将按当前筛选条件生成对应明细表（CSV）。已选
        <strong>{{ selectedExportCount }}</strong> / {{ exportModules.length }} 项。
      </p>
      <div class="export-module-toolbar">
        <el-checkbox
          :indeterminate="exportIndeterminate"
          v-model="exportCheckAll"
          @change="handleExportCheckAll"
        >
          全选
        </el-checkbox>
      </div>
      <el-checkbox-group v-model="selectedExportModules" class="export-module-list" @change="syncExportCheckAll">
        <div
          v-for="mod in exportModules"
          :key="mod.key"
          class="export-module-item"
        >
          <el-checkbox :label="mod.key">{{ mod.label }}</el-checkbox>
          <span class="export-module-desc">{{ mod.desc }}</span>
        </div>
      </el-checkbox-group>
      <div slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-download" :disabled="!selectedExportCount" @click="confirmExportModules">
          确认导出
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from "echarts";
import {
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_PIE_COLORS,
  BUBBLE_COLORS,
  baseChartOption,
  legendBottomCenter,
  linePointLabel,
  stackBarLabel,
  withAlpha,
  PROTOTYPE_COLORS,
} from "../utils/chartTheme";
import {
  UNIT_OPTIONS,
  DEFAULT_QUERY,
  DEFAULT_LEAVE_QUERY,
  buildOverviewSnapshot,
  getMainChartSeriesMode,
} from "../utils/behaviorOverviewData";
import {
  OVERVIEW_EXPORT_MODULES,
  exportOverviewModules,
  getOverviewExportModuleLabel,
} from "../utils/behaviorOverviewExport";
import WarningOverviewPanel from "../components/WarningOverviewPanel.vue";

const RADAR_INDICATORS = [
  { name: "输电", max: 150 },
  { name: "营配", max: 150 },
  { name: "电网建设", max: 150 },
  { name: "变电", max: 150 },
  { name: "配电", max: 150 },
];

export default {
  name: "EmployeeBehaviorOverview",
  components: { WarningOverviewPanel },
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
      exportDialogVisible: false,
      exportModules: OVERVIEW_EXPORT_MODULES,
      selectedExportModules: [],
      exportCheckAll: false,
      exportIndeterminate: false,
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
        { key: "noRecord", label: "无考勤记录人员", value: d.noAttendancePersonnel, valueClass: "is-warning" },
        { key: "comparison", label: "考勤数据对比", value: "", valueClass: "" },
      ];
    },
    selectedExportCount() {
      return this.selectedExportModules.length;
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
  watch: {
    activeTab(val) {
      if (val === "attendance") {
        this.$nextTick(() => {
          Object.values(this.charts).forEach((c) => c && c.resize());
        });
      }
    },
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
      const C = PROTOTYPE_COLORS;

      if (mode.showNoRecord) {
        const noRecordData = s.main.noRecord || [];
        const maxVal = Math.max(...noRecordData, 1);
        const leftMax = Math.ceil(maxVal / 5) * 5 + 5;
        const leftInterval = leftMax <= 20 ? 5 : Math.ceil(leftMax / 5);

        chart.setOption(
          {
            color: [C.orange],
            textStyle: { color: "#606266", fontSize: 11 },
            tooltip: {
              trigger: "axis",
              axisPointer: { type: "shadow" },
              backgroundColor: "rgba(255,255,255,0.98)",
              borderColor: "#E8E8E8",
              borderWidth: 1,
              padding: [10, 14],
              textStyle: { color: "#303133", fontSize: 12 },
              extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 4px;",
              formatter(params) {
                if (!params || !params.length) return "";
                const p = params[0];
                return `<div style="font-weight:600;margin-bottom:4px;">${p.axisValue}</div>
                  <div>无考勤记录人员：<strong>${p.value}</strong> 人</div>`;
              },
            },
            legend: {
              data: ["无考勤记录人员"],
              top: 8,
              left: "center",
              icon: "rect",
              itemWidth: 12,
              itemHeight: 8,
              textStyle: { color: "#606266", fontSize: 11 },
            },
            grid: { left: "2%", right: "2%", top: "14%", bottom: "8%", containLabel: true },
            xAxis: {
              type: "category",
              data: s.categories,
              axisLine: { lineStyle: { color: "#E8E8E8" } },
              axisTick: { show: false },
              axisLabel: {
                color: "#606266",
                fontSize: 11,
                interval: 0,
                rotate: s.categories.length > 12 ? 35 : 0,
              },
            },
            yAxis: {
              type: "value",
              name: "人数",
              nameTextStyle: { color: "#909399", fontSize: 11 },
              min: 0,
              max: leftMax,
              interval: leftInterval,
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: "#606266", fontSize: 11 },
              splitLine: { lineStyle: { color: "#F0F0F0", type: "solid" } },
            },
            series: [{
              name: "无考勤记录人员",
              type: "bar",
              barMaxWidth: 36,
              itemStyle: {
                color: C.orange,
                borderRadius: [4, 4, 0, 0],
              },
              label: {
                show: true,
                position: "top",
                distance: 6,
                fontSize: 11,
                color: C.orange,
                formatter: (p) => `${p.value}人`,
              },
              data: noRecordData,
            }],
          },
          true
        );
        return;
      }

      const legend = [];
      const series = [];

      const stackMax = s.main.should.reduce(
        (max, v, i) => Math.max(max, v + (s.main.actual[i] || 0)),
        0
      );
      const leftMax = Math.max(7000, Math.ceil(stackMax / 1000) * 1000);
      const leftInterval = 1000;

      if (mode.showShould) {
        legend.push("应出勤人数");
        series.push({
          name: "应出勤人数",
          type: "bar",
          stack: "attendance",
          barMaxWidth: 28,
          itemStyle: {
            color: C.mainShould,
            opacity: this.barOpacity("should", mode.emphasis),
          },
          emphasis: { focus: "series" },
          data: s.main.should,
        });
      }
      if (mode.showActual) {
        legend.push("实际出勤人数");
        series.push({
          name: "实际出勤人数",
          type: "bar",
          stack: "attendance",
          barMaxWidth: 28,
          itemStyle: {
            color: C.mainActual,
            opacity: this.barOpacity("actual", mode.emphasis),
          },
          emphasis: { focus: "series" },
          data: s.main.actual,
        });
      }
      if (mode.showRate) {
        legend.push("出勤率");
        series.push({
          name: "出勤率",
          type: "line",
          yAxisIndex: 1,
          smooth: false,
          symbol: "circle",
          symbolSize: 6,
          z: 10,
          lineStyle: { width: 2, color: C.mainRate },
          itemStyle: { color: C.mainRate, borderColor: "#fff", borderWidth: 1 },
          label: {
            show: s.categories.length <= 16,
            position: "top",
            distance: 6,
            fontSize: 10,
            color: C.mainRate,
            formatter: (p) => `${p.value}%`,
          },
          data: s.main.rate,
        });
      }

      chart.setOption(
        {
          color: [C.mainShould, C.mainActual, C.mainRate],
          textStyle: { color: "#606266", fontSize: 11 },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            backgroundColor: "rgba(255,255,255,0.98)",
            borderColor: "#E8E8E8",
            borderWidth: 1,
            padding: [10, 14],
            textStyle: { color: "#303133", fontSize: 12 },
            extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 4px;",
            formatter(params) {
              if (!params || !params.length) return "";
              const title = params[0].axisValue;
              const rows = params
                .map((p) => {
                  const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
                  let val = p.value;
                  if (p.seriesName === "出勤率") {
                    val = `${p.value}%`;
                  } else if (typeof val === "number") {
                    val = val.toLocaleString();
                  }
                  return `<div style="display:flex;justify-content:space-between;gap:24px;margin-top:4px;">
                    <span>${dot}${p.seriesName}</span><span style="font-weight:500;">${val}</span></div>`;
                })
                .join("");
              return `<div style="font-weight:600;margin-bottom:4px;">${title}</div>${rows}`;
            },
          },
          legend: {
            data: legend,
            top: 8,
            left: "center",
            icon: "rect",
            itemWidth: 12,
            itemHeight: 8,
            itemGap: 24,
            textStyle: { color: "#606266", fontSize: 11 },
          },
          grid: {
            left: "2%",
            right: "2%",
            top: "14%",
            bottom: "8%",
            containLabel: true,
          },
          xAxis: {
            type: "category",
            data: s.categories,
            axisLine: { lineStyle: { color: "#E8E8E8" } },
            axisTick: { show: false },
            axisLabel: {
              color: "#606266",
              fontSize: 11,
              interval: 0,
              rotate: s.categories.length > 12 ? 35 : 0,
            },
          },
          yAxis: [
            {
              type: "value",
              name: "人数",
              nameTextStyle: { color: "#909399", fontSize: 11, padding: [0, 0, 0, 0] },
              min: 0,
              max: leftMax,
              interval: leftInterval,
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: "#606266", fontSize: 11 },
              splitLine: { lineStyle: { color: "#F0F0F0", type: "solid" } },
            },
            {
              type: "value",
              name: "百分比",
              nameTextStyle: { color: "#909399", fontSize: 11 },
              min: 0,
              max: 100,
              interval: 10,
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: { color: "#606266", fontSize: 11, formatter: "{value}%" },
              splitLine: { show: false },
            },
          ],
          series,
        },
        true
      );
    },

    renderPunctualityChart() {
      const chart = this.charts.punctuality;
      if (!chart) return;
      const s = this.snapshot;
      const C = PROTOTYPE_COLORS;

      const onTimeData = (s.punctuality.onTime || []).map((v) => Number(v) || 0);
      const lateEarlyData = (s.punctuality.late || []).map((v, i) => {
        const late = Number(v) || 0;
        const early = Number((s.punctuality.early || [])[i]) || 0;
        return Math.round((late + early) * 10) / 10;
      });

      const connectorLines = s.categories.map((name, i) => [
        { coord: [name, lateEarlyData[i]] },
        { coord: [name, onTimeData[i]] },
      ]);

      chart.setOption(
        {
          textStyle: { color: "#606266", fontSize: 11 },
          tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(255,255,255,0.98)",
            borderColor: "#E8E8E8",
            borderWidth: 1,
            textStyle: { color: "#303133", fontSize: 12 },
            formatter(params) {
              if (!params || !params.length) return "";
              const title = params[0].axisValue;
              const rows = params
                .filter((p) => p.seriesType === "line")
                .map((p) => {
                  const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
                  return `<div style="display:flex;justify-content:space-between;gap:20px;margin-top:4px;">
                    <span>${dot}${p.seriesName}</span><span>${p.value}%</span></div>`;
                })
                .join("");
              return `<div style="font-weight:600;margin-bottom:4px;">${title}</div>${rows}`;
            },
          },
          legend: {
            data: ["按时出勤率", "迟到早退率"],
            bottom: 0,
            left: "center",
            selectedMode: true,
            icon: "rect",
            itemWidth: 12,
            itemHeight: 8,
            itemGap: 24,
            textStyle: { color: "#606266", fontSize: 11 },
          },
          grid: { left: "2%", right: "3%", top: "12%", bottom: "14%", containLabel: true },
          xAxis: {
            type: "category",
            data: s.categories,
            boundaryGap: false,
            axisLine: { lineStyle: { color: "#E8E8E8" } },
            axisTick: { show: false },
            axisLabel: {
              color: "#606266",
              fontSize: 10,
              interval: 0,
              rotate: s.categories.length > 8 ? 35 : 0,
            },
          },
          yAxis: {
            type: "value",
            min: 0,
            max: 100,
            interval: 20,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#909399", fontSize: 10, formatter: "{value}%" },
            splitLine: { lineStyle: { color: "#F0F0F0", type: "solid" } },
          },
          series: [
            {
              name: "迟到早退率",
              type: "line",
              z: 2,
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              showSymbol: true,
              connectNulls: true,
              lineStyle: { width: 2, color: C.orange },
              itemStyle: { color: C.orange, borderColor: "#fff", borderWidth: 1 },
              label: {
                show: true,
                position: "top",
                distance: 4,
                fontSize: 10,
                color: C.orange,
                formatter: (p) => `${p.value}%`,
              },
              data: lateEarlyData,
            },
            {
              name: "按时出勤率",
              type: "line",
              z: 3,
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              showSymbol: true,
              connectNulls: true,
              lineStyle: { width: 2, color: C.blue },
              itemStyle: { color: C.blue, borderColor: "#fff", borderWidth: 1 },
              label: {
                show: true,
                position: "top",
                distance: 4,
                fontSize: 10,
                color: C.blue,
                formatter: (p) => `${p.value}%`,
              },
              data: onTimeData,
              markLine: {
                silent: true,
                symbol: ["none", "none"],
                lineStyle: { color: "#D9D9D9", width: 1, type: "solid" },
                data: connectorLines,
              },
            },
          ],
        },
        true
      );
    },

    renderLateEarlyChart() {
      const chart = this.charts.lateEarly;
      if (!chart) return;
      const s = this.snapshot;
      const C = PROTOTYPE_COLORS;
      chart.setOption(
        baseChartOption({
          legend: legendBottomCenter(["迟到人数", "早退人数"]),
          grid: { bottom: "16%", top: "12%" },
          xAxis: {
            data: s.categories,
            axisLabel: { rotate: s.categories.length > 8 ? 35 : 0, fontSize: 10, interval: 0 },
          },
          series: [
            {
              name: "迟到人数",
              type: "bar",
              stack: "late",
              barMaxWidth: 22,
              itemStyle: { color: C.blue },
              label: stackBarLabel(true),
              data: s.lateEarly.late,
            },
            {
              name: "早退人数",
              type: "bar",
              stack: "late",
              barMaxWidth: 22,
              itemStyle: { color: C.orange },
              label: stackBarLabel(true),
              data: s.lateEarly.early,
            },
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

      chart.setOption(
        {
          textStyle: { color: "#606266", fontSize: 11 },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            backgroundColor: "rgba(255,255,255,0.98)",
            borderColor: "#E8E8E8",
            borderWidth: 1,
            padding: [10, 14],
            textStyle: { color: "#303133", fontSize: 12 },
            extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-radius: 4px;",
            formatter(params) {
              if (!params || !params.length) return "";
              const title = params[0].axisValue;
              const rows = params
                .map((p) => {
                  const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>`;
                  return `<div style="display:flex;justify-content:space-between;gap:24px;margin-top:4px;">
                    <span>${dot}${p.seriesName}</span><span style="font-weight:500;">${p.value}</span></div>`;
                })
                .join("");
              return `<div style="font-weight:600;margin-bottom:4px;">${title}</div>${rows}`;
            },
          },
          legend: {
            data: leaveNames,
            bottom: 0,
            left: "center",
            icon: "rect",
            itemWidth: 12,
            itemHeight: 8,
            itemGap: 24,
            textStyle: { color: "#606266", fontSize: 11 },
          },
          grid: { left: "2%", right: "3%", top: "10%", bottom: "14%", containLabel: true },
          xAxis: {
            type: "category",
            data: s.categories,
            axisLine: { lineStyle: { color: "#E8E8E8" } },
            axisTick: { show: false },
            axisLabel: {
              color: "#606266",
              fontSize: 10,
              interval: 0,
              rotate: s.categories.length > 8 ? 45 : 0,
            },
          },
          yAxis: {
            type: "value",
            min: 0,
            max: 60,
            interval: 10,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#909399", fontSize: 10 },
            splitLine: { lineStyle: { color: "#EEEEEE", type: "solid" } },
          },
          series: leaveNames.map((name, i) => ({
            name,
            type: "bar",
            stack: "leave",
            barMaxWidth: 26,
            itemStyle: { color: LEAVE_TYPE_COLORS[name] },
            emphasis: { focus: "series" },
            data: datasets[i],
          })),
        },
        true
      );
    },

    renderLeaveTypeChart() {
      const chart = this.charts.leaveType;
      if (!chart) return;
      const pieData = this.snapshot.leavePie;
      chart.setOption(
        baseChartOption({
          legend: legendBottomCenter(pieData.map((d) => d.name)),
          series: [
            {
              type: "pie",
              radius: ["40%", "62%"],
              center: ["50%", "44%"],
              avoidLabelOverlap: true,
              label: {
                show: true,
                formatter: "{b}, {c}, {d}%",
                fontSize: 11,
                color: "#606266",
              },
              labelLine: { length: 10, length2: 8, lineStyle: { color: "#C0C4CC" } },
              data: pieData.map((d) => ({
                ...d,
                itemStyle: { color: LEAVE_TYPE_PIE_COLORS[d.name] },
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
      const C = PROTOTYPE_COLORS;
      chart.setOption(
        baseChartOption({
          legend: legendBottomCenter(["出差工时", "培训工时", "线性(出差工时)", "线性(培训工时)"]),
          grid: { bottom: "18%", top: "12%" },
          xAxis: { type: "value", name: "培训工时", nameTextStyle: { fontSize: 11 }, min: 0, max: 14 },
          yAxis: { type: "value", name: "出差工时", nameTextStyle: { fontSize: 11 }, min: 0, max: 30 },
          series: [
            {
              name: "出差工时",
              type: "scatter",
              symbolSize: 7,
              itemStyle: { color: C.blue },
              data: sc.business,
            },
            {
              name: "培训工时",
              type: "scatter",
              symbolSize: 7,
              itemStyle: { color: C.orange },
              data: sc.training,
            },
            {
              name: "线性(出差工时)",
              type: "line",
              lineStyle: { type: "dotted", color: C.blue, width: 1.5 },
              data: [[0, 13], [14, 13]],
              symbol: "none",
            },
            {
              name: "线性(培训工时)",
              type: "line",
              lineStyle: { type: "dotted", color: C.orange, width: 1.5 },
              data: [[0, 5], [14, 7]],
              symbol: "none",
            },
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
      const indicators = RADAR_INDICATORS.map((ind) => ({
        ...ind,
        max: Math.ceil(maxVal / 10) * 10 + 20,
      }));
      const C = PROTOTYPE_COLORS;
      chart.setOption(
        baseChartOption({
          legend: legendBottomCenter(["作业工时时长", "出勤工时"]),
          grid: { bottom: "14%" },
          radar: {
            indicator: indicators,
            radius: "55%",
            center: ["50%", "46%"],
            axisName: { color: "#606266", fontSize: 11 },
            splitArea: { areaStyle: { color: ["#fff", "#FAFAFA"] } },
            splitLine: { lineStyle: { color: "#F0F0F0" } },
            axisLine: { lineStyle: { color: "#E8E8E8" } },
          },
          series: [
            {
              type: "radar",
              symbol: "circle",
              symbolSize: 4,
              data: [
                {
                  value: sp.work,
                  name: "作业工时时长",
                  lineStyle: { color: C.blueLight, width: 2 },
                  itemStyle: { color: C.blueLight },
                  areaStyle: { color: withAlpha(C.blueLight, 0.25) },
                },
                {
                  value: sp.attend,
                  name: "出勤工时",
                  lineStyle: { color: C.blueDark, width: 2 },
                  itemStyle: { color: C.blueDark },
                  areaStyle: { color: withAlpha(C.blueDark, 0.15) },
                },
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
          grid: { bottom: "12%", top: "10%" },
          xAxis: {
            type: "value",
            name: "外勤频次",
            nameTextStyle: { fontSize: 11 },
            min: 0,
            max: xMax,
          },
          yAxis: {
            type: "value",
            name: "时长(h)",
            nameTextStyle: { fontSize: 11 },
            min: 0,
            max: yMax,
          },
          series: [
            {
              type: "scatter",
              symbolSize: (data) => Math.sqrt(data[2]) * 4.5,
              data: bubble.map((item, i) => ({
                value: item,
                itemStyle: { color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], opacity: 0.85 },
              })),
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
      this.rebuildSnapshot();
      this.renderMainChart();
      const labels = {
        total: "总应出勤人数",
        actual: "实际出勤人数",
        rate: "整体出勤率",
        noRecord: "无考勤记录人员",
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
      this.$router.push({
        path: "/behavior-visual-dashboard/unit-attendance-comparison",
        query: {
          startDate: this.queryParams.startDate || "",
          endDate: this.queryParams.endDate || "",
        },
      });
    },

    openExportDialog() {
      this.selectedExportModules = this.exportModules.map((m) => m.key);
      this.syncExportCheckAll(this.selectedExportModules);
      this.exportDialogVisible = true;
    },

    handleDirectExport(moduleKey) {
      exportOverviewModules(
        [moduleKey],
        this.snapshot,
        this.queryParams,
        this.leaveQueryParams
      );
      this.$message.success(`已导出「${getOverviewExportModuleLabel(moduleKey)}」明细`);
    },

    resetExportDialog() {
      this.selectedExportModules = [];
      this.exportCheckAll = false;
      this.exportIndeterminate = false;
    },

    handleExportCheckAll(checked) {
      this.selectedExportModules = checked ? this.exportModules.map((m) => m.key) : [];
      this.exportIndeterminate = false;
    },

    syncExportCheckAll(value) {
      const count = value.length;
      const total = this.exportModules.length;
      this.exportCheckAll = count === total;
      this.exportIndeterminate = count > 0 && count < total;
    },

    confirmExportModules() {
      if (!this.selectedExportModules.length) {
        this.$message.warning("请至少选择一个统计模块");
        return;
      }
      const count = exportOverviewModules(
        this.selectedExportModules,
        this.snapshot,
        this.queryParams,
        this.leaveQueryParams
      );
      this.exportDialogVisible = false;
      this.$message.success(`已开始导出 ${count} 个统计模块明细，请留意浏览器下载`);
    },
  },
};
</script>

<style scoped>
.employee-overview-page {
  min-height: calc(100vh - 100px);
  padding: 12px 16px 20px;
  background: #f5f5f5;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
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

.query-export {
  margin-right: 8px;
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
  background: #e6f7ff;
  border: 1px solid #bae7ff;
  border-radius: 2px;
  overflow: hidden;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 14px 10px;
  border-right: 1px solid #bae7ff;
  transition: background 0.2s;
}

.stat-item:last-child {
  border-right: none;
}

.stat-item.is-link {
  cursor: pointer;
}

.stat-item.is-link:hover {
  background: rgba(24, 144, 255, 0.06);
}

.stat-item.active {
  background: rgba(24, 144, 255, 0.1);
  box-shadow: inset 0 -2px 0 #1890ff;
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
  color: #52c41a;
}

.stat-value.is-success {
  color: #1890ff;
}

.comparison-btn {
  color: #1890ff;
  padding: 0;
  font-size: 12px;
}

/* 提示条 */
.tip-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 2px;
  font-size: 12px;
  color: #606266;
}

.tip-bar .el-icon-info {
  color: #faad14;
  font-size: 14px;
}

.tip-text {
  flex: 1;
  line-height: 1.5;
}

.tip-text strong {
  color: #1890ff;
  font-weight: 600;
}

/* 图表卡片 — 对齐原型白底卡片 */
.chart-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  padding: 12px 14px 14px;
  box-shadow: none;
}

.chart-card--main {
  margin-bottom: 0;
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: none;
  min-height: 32px;
}

.chart-card__header--wrap {
  flex-wrap: wrap;
  gap: 8px;
}

.chart-card__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  padding-left: 0;
  border-left: none;
  line-height: 1.4;
}

.header-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-box {
  height: 280px;
  width: 100%;
}

.chart-box--lg {
  height: 360px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.leave-table {
  margin-top: 10px;
}

.leave-table >>> .el-table {
  font-size: 12px;
}

.leave-table >>> .el-table th {
  background: #fafafa;
  color: #606266;
  font-weight: 600;
  padding: 8px 0;
}

.leave-table >>> .el-table td {
  padding: 7px 0;
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

  .query-export {
    margin-left: 0;
  }

  .query-actions {
    margin-left: 0;
    width: 100%;
  }
}

.export-dialog-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.export-dialog-tip strong {
  color: #1890ff;
}

.export-module-toolbar {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.export-module-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  overflow-y: auto;
}

.export-module-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.export-module-item >>> .el-checkbox__label {
  font-weight: 600;
  color: #303133;
}

.export-module-desc {
  font-size: 12px;
  color: #909399;
  padding-left: 24px;
  line-height: 1.5;
}
</style>
