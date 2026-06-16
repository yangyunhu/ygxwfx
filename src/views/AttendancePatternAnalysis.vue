<template>
  <div class="attendance-pattern-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="出勤时间分布" name="timeDist" />
        <el-tab-pane label="出勤率与迟到早退情况" name="rateCharts" />
        <el-tab-pane label="应出勤与实际出勤对比" name="requiredActual" />
      </el-tabs>

      <div class="tab-body">
        <el-form :inline="true" size="small" class="filter-form">
          <el-form-item label="单位：">
            <el-select v-model="query.unit" placeholder="请选择" style="width: 150px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="query.department" placeholder="请选择" style="width: 150px">
              <el-option v-for="opt in departmentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间：" required>
            <el-date-picker
              v-model="query.dateRange"
              type="daterange"
              range-separator="~"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="action-bar">
          <el-button type="primary" plain icon="el-icon-upload2" size="small" @click="handleExport">导出</el-button>
        </div>

        <!-- Tab1 -->
        <div v-show="activeTab === 'timeDist'" class="tab-panel">
          <div class="table-wrap">
            <el-table
              :data="pagedTimeDistRows"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              :height="tableHeight"
            >
              <el-table-column type="index" label="序号" width="60" align="center" :index="timeDistIndexMethod" />
              <el-table-column prop="department" label="部门" min-width="140" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="100" align="center" />
              <el-table-column prop="avgArrivalTime" label="每天平均到岗时间" width="150" align="center" />
              <el-table-column prop="avgDepartureTime" label="每天平均离岗时间" width="150" align="center" />
            </el-table>
          </div>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="timeDistPage"
              :page-sizes="[10, 25, 50]"
              :page-size="timeDistPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredTimeDistRows.length"
              @size-change="(v) => { timeDistPageSize = v; timeDistPage = 1; }"
              @current-change="(v) => { timeDistPage = v; }"
            />
          </div>
        </div>

        <!-- Tab2 -->
        <div v-show="activeTab === 'rateCharts'" class="tab-panel">
          <div class="chart-grid">
            <div class="chart-card">
              <div class="chart-card__title">出勤率趋势图</div>
              <div ref="rateTrendChart" class="chart-box" />
            </div>
            <div class="chart-card">
              <div class="chart-card__title">异常出勤情况分析图</div>
              <div ref="abnormalChart" class="chart-box" />
            </div>
            <div class="chart-card">
              <div class="chart-card__title">员工出勤情况对比</div>
              <div ref="yearCompareChart" class="chart-box" />
            </div>
            <div class="chart-card">
              <div class="chart-card__title">出勤情况分布图</div>
              <div ref="distChart" class="chart-box" />
            </div>
          </div>
        </div>

        <!-- Tab3 -->
        <div v-show="activeTab === 'requiredActual'" class="tab-panel">
          <div class="table-wrap">
            <el-table
              :data="pagedRequiredActualRows"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              :height="tableHeight"
            >
              <el-table-column type="index" label="序号" width="60" align="center" :index="requiredIndexMethod" />
              <el-table-column prop="department" label="部门" min-width="140" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="100" align="center" />
              <el-table-column prop="requiredHours" label="应出勤时长" width="110" align="center" />
              <el-table-column prop="actualHours" label="实际出勤时长" width="110" align="center" />
              <el-table-column label="差值" width="90" align="center">
                <template slot-scope="scope">
                  <span :class="diffClass(scope.row.diff)">{{ scope.row.diff }}</span>
                </template>
              </el-table-column>
              <el-table-column label="判断结果" width="110" align="center">
                <template slot-scope="scope">
                  <span :class="judgmentClass(scope.row.judgment)">{{ scope.row.judgment }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="requiredPage"
              :page-sizes="[10, 25, 50]"
              :page-size="requiredPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredRequiredActualRows.length"
              @size-change="(v) => { requiredPageSize = v; requiredPage = 1; }"
              @current-change="(v) => { requiredPage = v; }"
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
  generateTimeDistributionRows,
  generateRequiredActualRows,
  getPatternChartData,
  getDefaultQuery,
} from "../utils/attendancePatternData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "AttendancePatternAnalysis",
  data() {
    return {
      activeTab: "timeDist",
      unitOptions: UNIT_OPTIONS,
      departmentOptions: DEPARTMENT_OPTIONS,
      allTimeDistRows: generateTimeDistributionRows(),
      allRequiredActualRows: generateRequiredActualRows(),
      query: getDefaultQuery(),
      appliedQuery: getDefaultQuery(),
      timeDistPage: 1,
      timeDistPageSize: 10,
      requiredPage: 1,
      requiredPageSize: 10,
      tableHeight: "calc(100vh - 340px)",
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    filteredTimeDistRows() {
      return this.filterByOrg(this.allTimeDistRows);
    },
    pagedTimeDistRows() {
      return this.paginate(this.filteredTimeDistRows, this.timeDistPage, this.timeDistPageSize);
    },
    filteredRequiredActualRows() {
      return this.filterByOrg(this.allRequiredActualRows);
    },
    pagedRequiredActualRows() {
      return this.paginate(this.filteredRequiredActualRows, this.requiredPage, this.requiredPageSize);
    },
    chartData() {
      return getPatternChartData(this.appliedQuery);
    },
  },
  watch: {
    activeTab(val) {
      if (val === "rateCharts") {
        this.$nextTick(() => this.initAndRenderCharts());
      }
    },
    chartData: {
      deep: true,
      handler() {
        if (this.activeTab === "rateCharts") {
          this.$nextTick(() => this.renderCharts());
        }
      },
    },
  },
  mounted() {
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
    filterByOrg(rows) {
      const { unit, department } = this.appliedQuery;
      return rows.filter((row) => {
        if (unit && row.unit !== unit) return false;
        if (department && row.department !== department) return false;
        return true;
      });
    },
    paginate(rows, page, pageSize) {
      const start = (page - 1) * pageSize;
      return rows.slice(start, start + pageSize);
    },
    timeDistIndexMethod(index) {
      return (this.timeDistPage - 1) * this.timeDistPageSize + index + 1;
    },
    requiredIndexMethod(index) {
      return (this.requiredPage - 1) * this.requiredPageSize + index + 1;
    },
    diffClass(diff) {
      if (diff < 0) return "text-danger";
      if (diff > 15) return "text-danger";
      return "";
    },
    judgmentClass(judgment) {
      if (judgment === "正常") return "text-normal";
      return "text-danger";
    },
    handleSearch() {
      this.appliedQuery = {
        unit: this.query.unit,
        department: this.query.department,
        dateRange: this.query.dateRange ? [...this.query.dateRange] : getDefaultQuery().dateRange,
      };
      this.timeDistPage = 1;
      this.requiredPage = 1;
    },
    handleReset() {
      this.query = getDefaultQuery();
      this.appliedQuery = getDefaultQuery();
      this.timeDistPage = 1;
      this.requiredPage = 1;
      this.timeDistPageSize = 10;
      this.requiredPageSize = 10;
    },
    filterLabel(value, allText) {
      return value || allText;
    },
    exportMeta() {
      const { unit, department, dateRange } = this.appliedQuery;
      return {
        unit: this.filterLabel(unit, "全部单位"),
        department: this.filterLabel(department, "全部部门"),
        startDate: dateRange && dateRange[0],
        endDate: dateRange && dateRange[1],
      };
    },
    handleExport() {
      if (this.activeTab === "timeDist") this.exportTimeDist();
      else if (this.activeTab === "rateCharts") this.exportCharts();
      else this.exportRequiredActual();
    },
    exportTimeDist() {
      const source = this.filteredTimeDistRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: ["序号", "单位", "部门", "姓名", "每天平均到岗时间", "每天平均离岗时间"],
        rows: source.map((row, idx) => [
          idx + 1, row.unit, row.department, row.name, row.avgArrivalTime, row.avgDepartureTime,
        ]),
        format: "csv",
        baseFilename: "出勤时间分布",
        meta: {
          moduleCode: "attendance_pattern_time_dist",
          moduleName: "出勤时间分布",
          moduleGroup: "出勤时间规律分析",
          searchCriteria: this.exportMeta(),
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    exportRequiredActual() {
      const source = this.filteredRequiredActualRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: ["序号", "单位", "部门", "姓名", "应出勤时长", "实际出勤时长", "差值", "判断结果"],
        rows: source.map((row, idx) => [
          idx + 1, row.unit, row.department, row.name,
          row.requiredHours, row.actualHours, row.diff, row.judgment,
        ]),
        format: "csv",
        baseFilename: "应出勤与实际出勤对比",
        meta: {
          moduleCode: "attendance_pattern_required_actual",
          moduleName: "应出勤与实际出勤对比",
          moduleGroup: "出勤时间规律分析",
          searchCriteria: this.exportMeta(),
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    exportCharts() {
      const { rateTrend, abnormal, yearCompare, distribution } = this.chartData;
      const rows = [
        ...rateTrend.map((item) => ["出勤率趋势", item.month, `${item.rate}%`, "", ""]),
        ...abnormal.map((item) => ["异常出勤", item.name, item.value, `${item.percent}%`, ""]),
        ...yearCompare.map((item) => ["年度对比", item.month, item.year2024, item.year2025, ""]),
        ...distribution.map((item) => ["出勤分布", item.month, item.value, "", ""]),
      ];
      downloadTableWithLog({
        headers: ["数据类型", "月份/类别", "数值1", "数值2", "备注"],
        rows,
        format: "csv",
        baseFilename: "出勤率与迟到早退情况",
        meta: {
          moduleCode: "attendance_pattern_charts",
          moduleName: "出勤率与迟到早退情况",
          moduleGroup: "出勤时间规律分析",
          searchCriteria: this.exportMeta(),
        },
      });
      this.$message.success(`已导出 ${rows.length} 条图表数据`);
    },
    initAndRenderCharts() {
      const refs = {
        rateTrend: "rateTrendChart",
        abnormal: "abnormalChart",
        yearCompare: "yearCompareChart",
        dist: "distChart",
      };
      Object.entries(refs).forEach(([key, refName]) => {
        const el = this.$refs[refName];
        if (el && !this.charts[key]) {
          this.charts[key] = echarts.init(el);
        }
      });
      this.renderCharts();
    },
    renderCharts() {
      if (!this.charts.rateTrend) return;
      const { rateTrend, abnormal, yearCompare, distribution } = this.chartData;

      this.charts.rateTrend.setOption(
        baseChartOption({
          grid: { left: "3%", right: "4%", bottom: "8%", top: "12%", containLabel: true },
          tooltip: { trigger: "axis" },
          xAxis: { type: "category", data: rateTrend.map((d) => d.month), boundaryGap: false },
          yAxis: { type: "value", min: 80, max: 100, axisLabel: { formatter: "{value}%" } },
          series: [{
            type: "line",
            data: rateTrend.map((d) => d.rate),
            smooth: true,
            symbolSize: 6,
            lineStyle: { color: "#1890ff", width: 2 },
            itemStyle: { color: "#1890ff" },
            areaStyle: { color: "rgba(24,144,255,0.12)" },
          }],
        }),
        true
      );

      this.charts.abnormal.setOption(
        baseChartOption({
          tooltip: { trigger: "item", formatter: "{b}<br/>{c}次 ({d}%)" },
          legend: {
            orient: "vertical",
            right: 8,
            top: "middle",
            textStyle: { fontSize: 12 },
            formatter: (name) => {
              const item = abnormal.find((d) => d.name === name);
              return item ? `${name}  ${item.value}次  ${item.percent}%` : name;
            },
          },
          series: [{
            type: "pie",
            radius: ["42%", "68%"],
            center: ["38%", "50%"],
            label: { show: false },
            data: abnormal.map((d) => ({
              name: d.name,
              value: d.value,
              itemStyle: { color: d.color },
            })),
          }],
        }),
        true
      );

      this.charts.yearCompare.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: { data: ["2024年", "2025年"], top: 0 },
          grid: { left: "3%", right: "4%", bottom: "8%", top: "18%", containLabel: true },
          xAxis: { type: "category", data: yearCompare.map((d) => d.month) },
          yAxis: { type: "value", max: 160 },
          series: [
            {
              name: "2024年",
              type: "bar",
              barWidth: 14,
              data: yearCompare.map((d) => d.year2024),
              itemStyle: { color: "#faad14" },
            },
            {
              name: "2025年",
              type: "bar",
              barWidth: 14,
              data: yearCompare.map((d) => d.year2025),
              itemStyle: { color: "#1890ff" },
            },
          ],
        }),
        true
      );

      this.charts.dist.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          grid: { left: "3%", right: "4%", bottom: "8%", top: "12%", containLabel: true },
          xAxis: { type: "category", data: distribution.map((d) => d.month) },
          yAxis: { type: "value", max: 220 },
          series: [{
            type: "bar",
            data: distribution.map((d) => d.value),
            barWidth: "46%",
            itemStyle: {
              color: "#1890ff",
              borderRadius: [4, 4, 0, 0],
            },
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
.attendance-pattern-page {
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

.table-wrap {
  min-height: 0;
}

.attendance-pattern-page >>> .table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.attendance-pattern-page >>> .el-table__body tr:hover > td {
  background: #f0f7ff !important;
}

.pagination-wrap {
  margin-top: 12px;
  text-align: right;
}

.text-danger {
  color: #f5222d;
  font-weight: 600;
}

.text-normal {
  color: #303133;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  padding: 12px 12px 4px;
  min-height: 320px;
}

.chart-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 4px;
}

.chart-box {
  width: 100%;
  height: 280px;
}

@media (max-width: 1200px) {
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
