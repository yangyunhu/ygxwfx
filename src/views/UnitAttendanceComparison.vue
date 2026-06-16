<template>
  <div class="unit-comparison-page">
    <section class="query-panel">
      <el-form :inline="true" size="small" class="query-form">
        <el-form-item label="日期范围：">
          <el-date-picker
            v-model="query.startDate"
            type="date"
            placeholder="起始日期"
            value-format="yyyy-MM-dd"
            style="width: 140px"
          />
          <span class="date-sep">-</span>
          <el-date-picker
            v-model="query.endDate"
            type="date"
            placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="岗位类别：">
          <el-select
            v-model="query.positionCategory"
            placeholder="全部类别"
            clearable
            filterable
            class="filter-select filter-select--category"
            @change="handlePositionCategoryChange"
          >
            <el-option
              v-for="opt in positionCategoryOptions"
              :key="opt.value || 'all-category'"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位序列：">
          <el-select
            v-model="query.positionSequence"
            placeholder="全部序列"
            clearable
            filterable
            class="filter-select filter-select--sequence"
            @change="handlePositionSequenceChange"
          >
            <template v-if="query.positionCategory">
              <el-option
                v-for="opt in positionSequenceOptions"
                :key="opt.value || 'all-sequence'"
                :label="opt.label"
                :value="opt.value"
              />
            </template>
            <template v-else>
              <el-option label="全部序列" value="" />
              <el-option-group
                v-for="group in positionSequenceGroups"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="opt in group.options"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-option-group>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          <el-button type="success" plain icon="el-icon-download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- 图表1：各单位出勤天数横向对比 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">各单位出勤天数横向对比</h3>
        <div class="chart-card__controls">
          <span class="control-label">筛选类型：</span>
          <el-select
            v-model="attendanceDayTypeFilter"
            size="small"
            style="width: 130px"
            @change="handleAttendanceDayTypeChange"
          >
            <el-option
              v-for="opt in attendanceDayTypeFilterOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
      <div ref="rateChart" class="chart-box" />
    </section>

    <!-- 图表2：各单位迟到&早退情况 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">各单位迟到&amp;早退情况</h3>
      </div>
      <div ref="lateEarlyChart" class="chart-box" />
    </section>

    <!-- 图表3：各单位请假情况 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">各单位请假情况</h3>
        <div class="chart-card__controls">
          <span class="control-label">休假类型：</span>
          <el-select
            v-model="unitLeaveTypeFilter"
            size="small"
            filterable
            class="filter-select--leave-type"
            @change="handleUnitLeaveTypeChange"
          >
            <el-option
              v-for="opt in leaveTypeFilterOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
      <div ref="unitLeaveChart" class="chart-box" />
    </section>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption } from "../utils/chartTheme";
import {
  ATTENDANCE_DAY_TYPE_FILTER_OPTIONS,
  LEAVE_TYPE_FILTER_OPTIONS,
  DEFAULT_UNIT_LEAVE_TYPE,
  buildComparisonDashboard,
  DEFAULT_COMPARISON_QUERY,
  getExportRows,
} from "../utils/unitAttendanceComparisonData";
import { LEAVE_TYPE_COLORS } from "../utils/leaveBehaviorAnalysisData";
import {
  getPositionCategoryFilterOptions,
  getPositionSequenceOptionsByCategory,
  getPositionSequenceOptionGroups,
  findPositionCategoryBySequence,
  isSequenceInCategory,
  getPositionCategoryLabel,
  getPositionSequenceLabel,
} from "../utils/positionRelation";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "UnitAttendanceComparison",
  data() {
    return {
      attendanceDayTypeFilterOptions: ATTENDANCE_DAY_TYPE_FILTER_OPTIONS,
      leaveTypeFilterOptions: LEAVE_TYPE_FILTER_OPTIONS,
      query: { ...DEFAULT_COMPARISON_QUERY },
      appliedQuery: { ...DEFAULT_COMPARISON_QUERY },
      attendanceDayTypeFilter: "all",
      unitLeaveTypeFilter: DEFAULT_UNIT_LEAVE_TYPE,
      snapshot: buildComparisonDashboard(DEFAULT_COMPARISON_QUERY, {
        attendanceDayTypeFilter: "all",
        unitLeaveTypeFilter: DEFAULT_UNIT_LEAVE_TYPE,
      }),
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    positionCategoryOptions() {
      return getPositionCategoryFilterOptions();
    },
    positionSequenceOptions() {
      return getPositionSequenceOptionsByCategory(this.query.positionCategory);
    },
    positionSequenceGroups() {
      return getPositionSequenceOptionGroups();
    },
  },
  mounted() {
    const { startDate, endDate } = this.$route.query;
    if (startDate || endDate) {
      this.query.startDate = startDate || "";
      this.query.endDate = endDate || "";
      this.appliedQuery = { ...this.query };
      this.refreshData();
    }
    this.$nextTick(() => this.initAndRenderCharts());
    this.resizeHandler = () => {
      Object.values(this.charts).forEach((c) => c && c.resize());
    };
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
    this.charts = {};
  },
  methods: {
    refreshData() {
      this.snapshot = buildComparisonDashboard(this.appliedQuery, {
        attendanceDayTypeFilter: this.attendanceDayTypeFilter,
        unitLeaveTypeFilter: this.unitLeaveTypeFilter,
      });
      this.$nextTick(() => this.renderAllCharts());
    },
    handleQuery() {
      this.appliedQuery = { ...this.query };
      this.refreshData();
      this.$message.success("查询成功");
    },
    handleReset() {
      this.query = { ...DEFAULT_COMPARISON_QUERY };
      this.appliedQuery = { ...DEFAULT_COMPARISON_QUERY };
      this.attendanceDayTypeFilter = "all";
      this.unitLeaveTypeFilter = DEFAULT_UNIT_LEAVE_TYPE;
      this.refreshData();
    },
    handlePositionCategoryChange(category) {
      if (category && this.query.positionSequence && !isSequenceInCategory(this.query.positionSequence, category)) {
        this.query.positionSequence = "";
      }
    },
    handlePositionSequenceChange(sequence) {
      if (!sequence || this.query.positionCategory) return;
      const category = findPositionCategoryBySequence(sequence);
      if (category) {
        this.query.positionCategory = category;
      }
    },
    handleAttendanceDayTypeChange() {
      this.refreshData();
    },
    handleUnitLeaveTypeChange() {
      this.refreshData();
    },
    handleExport() {
      const rows = getExportRows(this.snapshot);
      downloadTableWithLog({
        headers: ["图表", "维度", "数值1", "数值2", "数值3", "备注"],
        rows,
        format: "csv",
        baseFilename: "各单位考勤数据对比",
        meta: {
          moduleCode: "unit_attendance_comparison",
          moduleName: "各单位考勤数据对比",
          moduleGroup: "员工行为可视化数据看板",
          searchCriteria: {
            startDate: this.appliedQuery.startDate || "—",
            endDate: this.appliedQuery.endDate || "—",
            positionCategory: getPositionCategoryLabel(this.appliedQuery.positionCategory),
            positionSequence: getPositionSequenceLabel(this.appliedQuery.positionSequence),
            leaveType: this.unitLeaveTypeFilter,
          },
        },
      });
      this.$message.success(`已导出 ${rows.length} 条对比数据`);
    },
    initAndRenderCharts() {
      const refs = {
        rate: "rateChart",
        lateEarly: "lateEarlyChart",
        unitLeave: "unitLeaveChart",
      };
      Object.entries(refs).forEach(([key, refName]) => {
        const el = this.$refs[refName];
        if (el && !this.charts[key]) {
          this.charts[key] = echarts.init(el);
        }
      });
      this.renderAllCharts();
    },
    renderAllCharts() {
      this.renderRateChart();
      this.renderLateEarlyChart();
      this.renderUnitLeaveChart();
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
    renderRateChart() {
      const chart = this.charts.rate;
      if (!chart) return;
      const { categories, training, businessTrip, normal } = this.snapshot.attendanceDays;
      const filter = this.attendanceDayTypeFilter;

      const allSeries = [
        {
          key: "training",
          name: "培训",
          color: "#722ED1",
          data: training,
        },
        {
          key: "businessTrip",
          name: "出差",
          color: "#FA8C16",
          data: businessTrip,
        },
        {
          key: "normal",
          name: "正常出勤",
          color: "#1890FF",
          data: normal,
        },
      ];
      const activeSeries = filter === "all"
        ? allSeries
        : allSeries.filter((s) => s.key === filter);
      const values = activeSeries.flatMap((s) => s.data);
      const maxVal = values.length ? Math.max(...values) : 30;
      const yMax = Math.ceil((maxVal + 2) / 5) * 5;

      chart.setOption(
        baseChartOption({
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params) => {
              if (!params || !params.length) return "";
              const lines = [`${params[0].axisValue}`];
              params.forEach((p) => {
                lines.push(`${p.marker}${p.seriesName}：${p.value} 天`);
              });
              return lines.join("<br/>");
            },
          },
          legend: {
            data: activeSeries.map((s) => s.name),
            top: 0,
            left: "center",
          },
          grid: { left: "2%", right: "2%", top: "14%", bottom: "12%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: 35, fontSize: 11 },
          },
          yAxis: {
            type: "value",
            name: "天数",
            min: 0,
            max: Math.max(yMax, 10),
            interval: Math.max(Math.ceil(yMax / 5), 2),
          },
          series: activeSeries.map((s) => ({
            name: s.name,
            type: "bar",
            barMaxWidth: filter === "all" ? 18 : 28,
            itemStyle: { color: s.color, borderRadius: [2, 2, 0, 0] },
            data: s.data,
          })),
        }),
        true
      );
    },
    renderLateEarlyChart() {
      const chart = this.charts.lateEarly;
      if (!chart) return;
      const { categories, attendanceDays, lateCount } = this.snapshot.lateEarly;

      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          legend: { data: ["出勤天数", "迟到次数"], top: 0, left: "center" },
          grid: { left: "2%", right: "2%", top: "14%", bottom: "12%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: 35, fontSize: 11 },
          },
          yAxis: { type: "value", min: 0 },
          series: [
            {
              name: "出勤天数",
              type: "bar",
              stack: "total",
              barMaxWidth: 36,
              itemStyle: { color: "#1890FF" },
              label: { show: true, position: "inside", color: "#fff", fontSize: 11 },
              data: attendanceDays,
            },
            {
              name: "迟到次数",
              type: "bar",
              stack: "total",
              barMaxWidth: 36,
              itemStyle: { color: "#FA8C16" },
              label: { show: true, position: "inside", color: "#fff", fontSize: 11 },
              data: lateCount,
            },
          ],
        }),
        true
      );
    },
    renderUnitLeaveChart() {
      const chart = this.charts.unitLeave;
      if (!chart) return;
      const { categories, totalDays, typeDays, selectedLeaveType } = this.snapshot.leaveByUnit;
      const typeColor = LEAVE_TYPE_COLORS[selectedLeaveType] || "#FA8C16";
      const values = [...totalDays, ...typeDays];
      const maxVal = values.length ? Math.max(...values) : 30;
      const yMax = Math.ceil((maxVal + 5) / 10) * 10;

      chart.setOption(
        baseChartOption({
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params) => {
              if (!params || !params.length) return "";
              const lines = [`${params[0].axisValue}`];
              params.forEach((p) => {
                lines.push(`${p.marker}${p.seriesName}：${p.value} 天`);
              });
              return lines.join("<br/>");
            },
          },
          legend: {
            data: ["总请假天数", selectedLeaveType],
            top: 0,
            left: "center",
          },
          grid: { left: "2%", right: "2%", top: "14%", bottom: "12%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: 35, fontSize: 11 },
          },
          yAxis: {
            type: "value",
            name: "天数",
            min: 0,
            max: Math.max(yMax, 20),
            interval: Math.max(Math.ceil(yMax / 5), 5),
          },
          series: [
            {
              name: "总请假天数",
              type: "bar",
              barMaxWidth: 22,
              itemStyle: { color: "#1890FF", borderRadius: [2, 2, 0, 0] },
              data: totalDays,
            },
            {
              name: selectedLeaveType,
              type: "bar",
              barMaxWidth: 22,
              itemStyle: { color: typeColor, borderRadius: [2, 2, 0, 0] },
              data: typeDays,
            },
          ],
        }),
        true
      );
    },
  },
};
</script>

<style scoped>
.unit-comparison-page {
  min-height: calc(100vh - 100px);
  padding: 12px 16px 24px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.query-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 14px 16px 6px;
  margin-bottom: 12px;
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

.filter-select {
  width: 100%;
}

.filter-select--category {
  width: 140px;
}

.filter-select--sequence {
  width: 240px;
}

.filter-select--leave-type {
  width: 150px;
}

.chart-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 12px;
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chart-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart-card__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  color: #606266;
}

.chart-box {
  height: 340px;
}
</style>
