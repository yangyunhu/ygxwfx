<template>
  <div class="leave-behavior-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="请假时间分布" name="timeDist" />
        <el-tab-pane label="请假时长分析" name="duration" />
      </el-tabs>

      <div class="tab-body">
        <!-- Tab1 筛选 -->
        <el-form v-show="activeTab === 'timeDist'" :inline="true" size="small" class="filter-form">
          <el-form-item label="单位：">
            <el-select v-model="distQuery.unit" placeholder="请选择" style="width: 150px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="distQuery.department" placeholder="请选择" style="width: 150px">
              <el-option v-for="opt in departmentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-radio-group v-model="distQuery.granularity">
              <el-radio label="month">月度</el-radio>
              <el-radio label="quarter">季度</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleDistSearch">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleDistReset">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- Tab2 筛选 -->
        <el-form v-show="activeTab === 'duration'" :inline="true" size="small" class="filter-form">
          <el-form-item label="单位：">
            <el-select v-model="durationQuery.unit" placeholder="请选择" style="width: 150px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="durationQuery.department" placeholder="请选择" style="width: 150px">
              <el-option v-for="opt in departmentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="年度：">
            <el-select v-model="durationQuery.year" placeholder="请选择" style="width: 120px">
              <el-option v-for="opt in yearOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleDurationSearch">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleDurationReset">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="action-bar">
          <el-button type="primary" plain icon="el-icon-upload2" size="small" @click="handleExport">导出</el-button>
        </div>

        <!-- Tab1 图表 -->
        <div v-show="activeTab === 'timeDist'" class="tab-panel">
          <div class="chart-grid">
            <div class="chart-card">
              <div class="chart-card__title">请假时间分布</div>
              <div ref="leaveTrendChart" class="chart-box" />
            </div>
            <div class="chart-card">
              <div class="chart-card__title">请假类型分布情况</div>
              <div ref="leaveTypeChart" class="chart-box" />
            </div>
          </div>
        </div>

        <!-- Tab2 表格 -->
        <div v-show="activeTab === 'duration'" class="tab-panel">
          <div class="table-wrap">
            <el-table
              :data="pagedDurationRows"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              :height="tableHeight"
            >
              <el-table-column type="index" label="序号" width="60" align="center" :index="durationIndexMethod" />
              <el-table-column prop="department" label="部门" min-width="140" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="100" align="center" />
              <el-table-column prop="avgDuration" label="每次请假平均时长(小时)" width="160" align="center" />
              <el-table-column prop="maxDuration" label="最长请假时长(小时)" width="140" align="center" />
              <el-table-column prop="minDuration" label="最短请假时长(小时)" width="140" align="center" />
              <el-table-column prop="leaveType" label="请假类别" width="100" align="center" />
            </el-table>
          </div>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="durationPage"
              :page-sizes="[10, 25, 50]"
              :page-size="durationPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredDurationRows.length"
              @size-change="(v) => { durationPageSize = v; durationPage = 1; }"
              @current-change="(v) => { durationPage = v; }"
            />
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
  UNIT_OPTIONS,
  DEPARTMENT_OPTIONS,
  YEAR_OPTIONS,
  generateLeaveDurationRows,
  getLeaveDistributionChartData,
  getDefaultDistQuery,
  getDefaultDurationQuery,
} from "../utils/leaveBehaviorAnalysisData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "LeaveBehaviorAnalysis",
  data() {
    return {
      activeTab: "timeDist",
      unitOptions: UNIT_OPTIONS,
      departmentOptions: DEPARTMENT_OPTIONS,
      yearOptions: YEAR_OPTIONS,
      distQuery: getDefaultDistQuery(),
      appliedDistQuery: getDefaultDistQuery(),
      durationQuery: getDefaultDurationQuery(),
      appliedDurationQuery: getDefaultDurationQuery(),
      allDurationRows: generateLeaveDurationRows(168, "2025"),
      durationPage: 1,
      durationPageSize: 10,
      tableHeight: "calc(100vh - 340px)",
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    chartData() {
      return getLeaveDistributionChartData(this.appliedDistQuery);
    },
    filteredDurationRows() {
      const { unit, department, year } = this.appliedDurationQuery;
      return this.allDurationRows.filter((row) => {
        if (row.year !== year) return false;
        if (unit && row.unit !== unit) return false;
        if (department && row.department !== department) return false;
        return true;
      });
    },
    pagedDurationRows() {
      const start = (this.durationPage - 1) * this.durationPageSize;
      return this.filteredDurationRows.slice(start, start + this.durationPageSize);
    },
  },
  watch: {
    activeTab(val) {
      if (val === "timeDist") {
        this.$nextTick(() => this.initAndRenderCharts());
      }
    },
    chartData: {
      deep: true,
      handler() {
        if (this.activeTab === "timeDist") {
          this.$nextTick(() => this.renderCharts());
        }
      },
    },
    "appliedDurationQuery.year"(year) {
      this.allDurationRows = generateLeaveDurationRows(168, year);
      this.durationPage = 1;
    },
  },
  mounted() {
    this.resizeHandler = () => {
      Object.values(this.charts).forEach((c) => c && c.resize());
    };
    window.addEventListener("resize", this.resizeHandler);
    this.$nextTick(() => this.initAndRenderCharts());
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
    this.charts = {};
  },
  methods: {
    durationIndexMethod(index) {
      return (this.durationPage - 1) * this.durationPageSize + index + 1;
    },
    handleDistSearch() {
      this.appliedDistQuery = { ...this.distQuery };
    },
    handleDistReset() {
      this.distQuery = getDefaultDistQuery();
      this.appliedDistQuery = getDefaultDistQuery();
    },
    handleDurationSearch() {
      this.appliedDurationQuery = { ...this.durationQuery };
      this.durationPage = 1;
    },
    handleDurationReset() {
      this.durationQuery = getDefaultDurationQuery();
      this.appliedDurationQuery = getDefaultDurationQuery();
      this.allDurationRows = generateLeaveDurationRows(168, this.appliedDurationQuery.year);
      this.durationPage = 1;
      this.durationPageSize = 10;
    },
    filterLabel(value, allText) {
      return value || allText;
    },
    distExportMeta() {
      const { unit, department, granularity } = this.appliedDistQuery;
      return {
        unit: this.filterLabel(unit, "全部单位"),
        department: this.filterLabel(department, "全部部门"),
        granularity: granularity === "quarter" ? "季度" : "月度",
      };
    },
    durationExportMeta() {
      const { unit, department, year } = this.appliedDurationQuery;
      return {
        unit: this.filterLabel(unit, "全部单位"),
        department: this.filterLabel(department, "全部部门"),
        year: `${year}年`,
      };
    },
    handleExport() {
      if (this.activeTab === "timeDist") this.exportCharts();
      else this.exportDuration();
    },
    exportCharts() {
      const { trend, typeDistribution } = this.chartData;
      const rows = [
        ...trend.map((item) => ["请假时间分布", item.label, item.value, "次", ""]),
        ...typeDistribution.map((item) => ["请假类型分布", item.name, item.value, `${item.percent}%`, ""]),
      ];
      downloadTableWithLog({
        headers: ["数据类型", "时间/类别", "数值", "占比/单位", "备注"],
        rows,
        format: "csv",
        baseFilename: "请假时间分布",
        meta: {
          moduleCode: "leave_behavior_time_dist",
          moduleName: "请假时间分布",
          moduleGroup: "请假行为分析",
          searchCriteria: this.distExportMeta(),
        },
      });
      this.$message.success(`已导出 ${rows.length} 条图表数据`);
    },
    exportDuration() {
      const source = this.filteredDurationRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: [
          "序号", "单位", "部门", "姓名",
          "每次请假平均时长(小时)", "最长请假时长(小时)", "最短请假时长(小时)", "请假类别",
        ],
        rows: source.map((row, idx) => [
          idx + 1, row.unit, row.department, row.name,
          row.avgDuration, row.maxDuration, row.minDuration, row.leaveType,
        ]),
        format: "csv",
        baseFilename: "请假时长分析",
        meta: {
          moduleCode: "leave_behavior_duration",
          moduleName: "请假时长分析",
          moduleGroup: "请假行为分析",
          searchCriteria: this.durationExportMeta(),
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    initAndRenderCharts() {
      const refs = { trend: "leaveTrendChart", type: "leaveTypeChart" };
      Object.entries(refs).forEach(([key, refName]) => {
        const el = this.$refs[refName];
        if (el && !this.charts[key]) {
          this.charts[key] = echarts.init(el);
        }
      });
      this.renderCharts();
    },
    renderCharts() {
      if (!this.charts.trend) return;
      const { trend, typeDistribution } = this.chartData;

      this.charts.trend.setOption(
        baseChartOption({
          grid: { left: "3%", right: "4%", bottom: "10%", top: "14%", containLabel: true },
          tooltip: { trigger: "axis", formatter: (params) => {
            const p = params[0];
            return `${p.axisValue}<br/>${p.value}次`;
          } },
          xAxis: { type: "category", data: trend.map((d) => d.label), boundaryGap: false },
          yAxis: {
            type: "value",
            min: 0,
            max: 10,
            interval: 2,
            axisLabel: { formatter: "{value}次" },
          },
          series: [{
            type: "line",
            data: trend.map((d) => d.value),
            smooth: true,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { color: "#1890ff", width: 2 },
            itemStyle: { color: "#1890ff" },
            areaStyle: { color: "rgba(24,144,255,0.1)" },
          }],
        }),
        true
      );

      this.charts.type.setOption(
        baseChartOption({
          tooltip: { trigger: "item", formatter: "{b}<br/>{c}次 ({d}%)" },
          legend: {
            orient: "vertical",
            right: 12,
            top: "middle",
            textStyle: { fontSize: 12 },
            formatter: (name) => {
              const item = typeDistribution.find((d) => d.name === name);
              return item ? `${name}  ${item.value}次  ${item.percent}%` : name;
            },
          },
          series: [{
            type: "pie",
            roseType: "area",
            radius: ["18%", "68%"],
            center: ["38%", "50%"],
            label: {
              show: true,
              formatter: "{b}\n{c}次",
              fontSize: 11,
            },
            labelLine: { length: 8, length2: 10 },
            data: typeDistribution.map((d) => ({
              name: d.name,
              value: d.value,
              itemStyle: { color: d.color },
            })),
          }],
        }),
        true
      );

      Object.values(this.charts).forEach((c) => c && c.resize());
    },
  },
};
</script>

<style scoped>
.leave-behavior-page {
  min-height: calc(100vh - 100px);
  padding: 0 4px 20px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.page-shell {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.main-tabs {
  padding: 0 16px;
}

.main-tabs >>> .el-tabs__header {
  margin-bottom: 0;
}

.main-tabs >>> .el-tabs__nav-wrap::after {
  height: 1px;
  background: #e8e8e8;
}

.main-tabs >>> .el-tabs__item {
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  color: #606266;
}

.main-tabs >>> .el-tabs__item.is-active {
  color: #1890ff;
  font-weight: 500;
}

.main-tabs >>> .el-tabs__active-bar {
  background-color: #1890ff;
  height: 2px;
}

.tab-body {
  padding: 16px;
  min-height: 480px;
}

.tab-panel {
  min-height: 440px;
}

.filter-form {
  margin-bottom: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.action-bar {
  margin: 12px 0;
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.chart-card {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  padding: 12px 12px 8px;
  min-height: 380px;
}

.chart-card__title {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.chart-box {
  height: 340px;
}

.table-wrap {
  min-height: 0;
}

.leave-behavior-page >>> .table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.leave-behavior-page >>> .el-table__body tr:hover > td {
  background: #f0f7ff !important;
}

.pagination-wrap {
  margin-top: 12px;
  text-align: right;
}

@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
