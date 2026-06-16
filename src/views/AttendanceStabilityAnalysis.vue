<template>
  <div class="attendance-stability-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="月度出勤天数统计" name="monthlyDays" />
        <el-tab-pane label="迟到早退次数统计" name="lateEarly" />
        <el-tab-pane label="缺勤原因分类统计" name="absenceReason" />
      </el-tabs>

      <div class="tab-body">
        <el-form :inline="true" size="small" class="filter-form">
          <el-form-item label="单位：">
            <el-select v-model="query.unit" placeholder="请选择" style="width: 150px">
              <el-option
                v-for="opt in unitOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="query.department" placeholder="请选择" style="width: 150px">
              <el-option
                v-for="opt in departmentOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
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
          <el-button type="primary" plain icon="el-icon-upload2" size="small" @click="handleExport">
            导出
          </el-button>
        </div>

        <!-- Tab1: 月度出勤天数统计 -->
        <div v-show="activeTab === 'monthlyDays'" class="tab-panel">
          <div class="table-wrap">
            <el-table
              :data="pagedMonthlyRows"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              :height="tableHeight"
            >
              <el-table-column type="index" label="序号" width="60" align="center" :index="monthlyIndexMethod" />
              <el-table-column prop="department" label="部门" min-width="140" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="100" align="center" />
              <el-table-column prop="actualDays" label="实际出勤天数" width="120" align="center" />
              <el-table-column label="员工的出勤率" width="120" align="center">
                <template slot-scope="scope">
                  <span :class="rateClass(scope.row.attendanceRate)">{{ scope.row.attendanceRate }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="absentDays" label="缺勤天数" width="100" align="center" />
              <el-table-column prop="overtimeDays" label="加班天数" width="100" align="center" />
            </el-table>
          </div>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="monthlyPage"
              :page-sizes="[10, 25, 50]"
              :page-size="monthlyPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredMonthlyRows.length"
              @size-change="handleMonthlySizeChange"
              @current-change="handleMonthlyPageChange"
            />
          </div>
        </div>

        <!-- Tab2: 迟到早退次数统计 -->
        <div v-show="activeTab === 'lateEarly'" class="tab-panel">
          <div class="table-wrap">
            <el-table
              :data="pagedLateEarlyRows"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              :height="tableHeight"
            >
              <el-table-column type="index" label="序号" width="60" align="center" :index="lateEarlyIndexMethod" />
              <el-table-column prop="department" label="部门" min-width="140" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="100" align="center" />
              <el-table-column prop="lateCount" label="迟到次数" width="100" align="center">
                <template slot-scope="scope">
                  <span :class="countClass(scope.row.lateCount)">{{ scope.row.lateCount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="earlyCount" label="早退次数" width="100" align="center">
                <template slot-scope="scope">
                  <span :class="countClass(scope.row.earlyCount)">{{ scope.row.earlyCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="openLateEarlyDetail(scope.row)">查看明细</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="lateEarlyPage"
              :page-sizes="[10, 25, 50]"
              :page-size="lateEarlyPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredLateEarlyRows.length"
              @size-change="handleLateEarlySizeChange"
              @current-change="handleLateEarlyPageChange"
            />
          </div>
        </div>

        <!-- Tab3: 缺勤原因分类统计 -->
        <div v-show="activeTab === 'absenceReason'" class="tab-panel">
          <div class="reason-layout">
            <div class="reason-chart-card">
              <div ref="reasonChart" class="reason-chart" />
            </div>
            <div class="reason-table-card">
              <el-table
                :data="absenceReasonRows"
                border
                stripe
                size="small"
                header-cell-class-name="table-header"
                height="360"
              >
                <el-table-column prop="reason" label="缺勤原因" min-width="120" />
                <el-table-column prop="count" label="缺勤次数" width="100" align="center" />
                <el-table-column label="占比" width="100" align="center">
                  <template slot-scope="scope">{{ scope.row.ratio }}%</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      :title="lateEarlyDialogTitle"
      :visible.sync="lateEarlyDialogVisible"
      width="960px"
      append-to-body
    >
      <div v-if="lateEarlyDetailList.length" class="detail-summary-bar">
        共 <strong>{{ lateEarlyDetailList.length }}</strong> 人有迟到或早退记录
      </div>
      <el-table :data="lateEarlyDetailList" border size="small" max-height="420">
        <el-table-column type="index" label="序号" width="55" align="center" />
        <el-table-column prop="name" label="姓名" width="80" align="center" />
        <el-table-column prop="unit" label="单位" min-width="110" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" min-width="110" show-overflow-tooltip />
        <el-table-column prop="lateCount" label="迟到次数" width="88" align="center">
          <template slot-scope="scope">
            <span :class="countClass(scope.row.lateCount)">{{ scope.row.lateCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="earlyCount" label="早退次数" width="88" align="center">
          <template slot-scope="scope">
            <span :class="countClass(scope.row.earlyCount)">{{ scope.row.earlyCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lateTimes" label="迟到时间" min-width="160" show-overflow-tooltip />
        <el-table-column prop="earlyTimes" label="早退时间" min-width="160" show-overflow-tooltip />
      </el-table>
      <div v-if="!lateEarlyDetailList.length" class="detail-empty">该部门暂无迟到早退人员</div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption } from "../utils/chartTheme";
import {
  UNIT_OPTIONS,
  DEPARTMENT_OPTIONS,
  generateMonthlyAttendanceRows,
  generateLateEarlyRows,
  generateAbsenceReasonStats,
  getDefaultQuery,
} from "../utils/attendanceStabilityData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "AttendanceStabilityAnalysis",
  data() {
    return {
      activeTab: "monthlyDays",
      unitOptions: UNIT_OPTIONS,
      departmentOptions: DEPARTMENT_OPTIONS,
      allMonthlyRows: generateMonthlyAttendanceRows(),
      allLateEarlyRows: generateLateEarlyRows(),
      query: getDefaultQuery(),
      appliedQuery: getDefaultQuery(),
      monthlyPage: 1,
      monthlyPageSize: 10,
      lateEarlyPage: 1,
      lateEarlyPageSize: 10,
      tableHeight: "calc(100vh - 340px)",
      reasonChart: null,
      lateEarlyDialogVisible: false,
      lateEarlyDialogTitle: "",
      lateEarlyDetailList: [],
      resizeHandler: null,
    };
  },
  computed: {
    filteredMonthlyRows() {
      return this.filterByOrg(this.allMonthlyRows);
    },
    pagedMonthlyRows() {
      return this.paginate(this.filteredMonthlyRows, this.monthlyPage, this.monthlyPageSize);
    },
    filteredLateEarlyRows() {
      return this.filterByOrg(this.allLateEarlyRows);
    },
    pagedLateEarlyRows() {
      return this.paginate(this.filteredLateEarlyRows, this.lateEarlyPage, this.lateEarlyPageSize);
    },
    absenceReasonRows() {
      return generateAbsenceReasonStats(this.appliedQuery);
    },
  },
  watch: {
    activeTab(val) {
      if (val === "absenceReason") {
        this.$nextTick(() => this.renderReasonChart());
      }
    },
    absenceReasonRows: {
      deep: true,
      handler() {
        if (this.activeTab === "absenceReason") {
          this.$nextTick(() => this.renderReasonChart());
        }
      },
    },
  },
  mounted() {
    this.resizeHandler = () => {
      if (this.reasonChart) this.reasonChart.resize();
    };
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    if (this.reasonChart) {
      this.reasonChart.dispose();
      this.reasonChart = null;
    }
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
    monthlyIndexMethod(index) {
      return (this.monthlyPage - 1) * this.monthlyPageSize + index + 1;
    },
    lateEarlyIndexMethod(index) {
      return (this.lateEarlyPage - 1) * this.lateEarlyPageSize + index + 1;
    },
    rateClass(rate) {
      if (rate >= 90) return "rate-high";
      if (rate >= 80) return "rate-mid";
      return "rate-low";
    },
    countClass(count) {
      if (count >= 4) return "count-high";
      if (count >= 2) return "count-mid";
      return "";
    },
    handleSearch() {
      this.appliedQuery = {
        unit: this.query.unit,
        department: this.query.department,
        dateRange: this.query.dateRange ? [...this.query.dateRange] : getDefaultQuery().dateRange,
      };
      this.monthlyPage = 1;
      this.lateEarlyPage = 1;
    },
    handleReset() {
      this.query = getDefaultQuery();
      this.appliedQuery = getDefaultQuery();
      this.monthlyPage = 1;
      this.lateEarlyPage = 1;
      this.monthlyPageSize = 10;
      this.lateEarlyPageSize = 10;
    },
    handleMonthlySizeChange(size) {
      this.monthlyPageSize = size;
      this.monthlyPage = 1;
    },
    handleMonthlyPageChange(page) {
      this.monthlyPage = page;
    },
    handleLateEarlySizeChange(size) {
      this.lateEarlyPageSize = size;
      this.lateEarlyPage = 1;
    },
    handleLateEarlyPageChange(page) {
      this.lateEarlyPage = page;
    },
    openLateEarlyDetail(row) {
      this.lateEarlyDetailList = this.filteredLateEarlyRows
        .filter(
          (item) =>
            item.unit === row.unit
            && item.department === row.department
            && (item.lateCount > 0 || item.earlyCount > 0)
        )
        .sort((a, b) => (b.lateCount + b.earlyCount) - (a.lateCount + a.earlyCount));
      this.lateEarlyDialogTitle = `${row.unit} · ${row.department} · 迟到早退人员`;
      this.lateEarlyDialogVisible = true;
    },
    filterLabel(value, allText) {
      return value || allText;
    },
    exportMetaSuffix() {
      const { unit, department, dateRange } = this.appliedQuery;
      return {
        unit: this.filterLabel(unit, "全部单位"),
        department: this.filterLabel(department, "全部部门"),
        startDate: dateRange && dateRange[0],
        endDate: dateRange && dateRange[1],
      };
    },
    handleExport() {
      if (this.activeTab === "monthlyDays") {
        this.exportMonthly();
      } else if (this.activeTab === "lateEarly") {
        this.exportLateEarly();
      } else {
        this.exportAbsenceReason();
      }
    },
    exportMonthly() {
      const source = this.filteredMonthlyRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: ["序号", "单位", "部门", "姓名", "实际出勤天数", "员工的出勤率", "缺勤天数", "加班天数"],
        rows: source.map((row, idx) => [
          idx + 1,
          row.unit,
          row.department,
          row.name,
          row.actualDays,
          `${row.attendanceRate}%`,
          row.absentDays,
          row.overtimeDays,
        ]),
        format: "csv",
        baseFilename: "月度出勤天数统计",
        meta: {
          moduleCode: "attendance_stability_monthly",
          moduleName: "月度出勤天数统计",
          moduleGroup: "出勤稳定性分析",
          searchCriteria: this.exportMetaSuffix(),
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    exportLateEarly() {
      const source = this.filteredLateEarlyRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: ["序号", "单位", "部门", "姓名", "迟到次数", "早退次数"],
        rows: source.map((row, idx) => [
          idx + 1,
          row.unit,
          row.department,
          row.name,
          row.lateCount,
          row.earlyCount,
        ]),
        format: "csv",
        baseFilename: "迟到早退次数统计",
        meta: {
          moduleCode: "attendance_stability_late_early",
          moduleName: "迟到早退次数统计",
          moduleGroup: "出勤稳定性分析",
          searchCriteria: this.exportMetaSuffix(),
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    exportAbsenceReason() {
      const source = this.absenceReasonRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: ["缺勤原因", "缺勤次数", "占比"],
        rows: source.map((row) => [row.reason, row.count, `${row.ratio}%`]),
        format: "csv",
        baseFilename: "缺勤原因分类统计",
        meta: {
          moduleCode: "attendance_stability_absence_reason",
          moduleName: "缺勤原因分类统计",
          moduleGroup: "出勤稳定性分析",
          searchCriteria: this.exportMetaSuffix(),
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    renderReasonChart() {
      const el = this.$refs.reasonChart;
      if (!el) return;
      if (!this.reasonChart) {
        this.reasonChart = echarts.init(el);
      }
      const data = this.absenceReasonRows;
      this.reasonChart.setOption(
        baseChartOption({
          tooltip: { trigger: "item", formatter: "{b}<br/>{c}次 ({d}%)" },
          legend: {
            orient: "vertical",
            right: 8,
            top: "middle",
            itemWidth: 10,
            itemHeight: 10,
            textStyle: { fontSize: 12, color: "#606266" },
            formatter: (name) => {
              const item = data.find((d) => d.reason === name);
              return item ? `${name}  ${item.ratio}%` : name;
            },
          },
          series: [{
            type: "pie",
            radius: ["42%", "68%"],
            center: ["36%", "50%"],
            label: { show: false },
            labelLine: { show: false },
            data: data.map((d) => ({
              name: d.reason,
              value: d.count,
              itemStyle: { color: d.color },
            })),
          }],
        }),
        true
      );
      this.reasonChart.resize();
    },
  },
};
</script>

<style scoped>
.attendance-stability-page {
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

.attendance-stability-page >>> .table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.attendance-stability-page >>> .el-table__body tr:hover > td {
  background: #f0f7ff !important;
}

.rate-high {
  color: #52c41a;
  font-weight: 600;
}

.rate-mid {
  color: #1890ff;
  font-weight: 600;
}

.rate-low {
  color: #fa8c16;
  font-weight: 600;
}

.count-mid {
  color: #fa8c16;
  font-weight: 600;
}

.count-high {
  color: #f5222d;
  font-weight: 600;
}

.pagination-wrap {
  margin-top: 12px;
  text-align: right;
}

.reason-layout {
  display: flex;
  gap: 16px;
  align-items: stretch;
  min-height: 380px;
}

.reason-chart-card,
.reason-table-card {
  flex: 1;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  padding: 12px;
}

.reason-chart {
  width: 100%;
  height: 360px;
}

.detail-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.detail-summary-bar {
  margin-bottom: 12px;
  font-size: 13px;
  color: #606266;
}

.detail-summary-bar strong {
  color: #1890ff;
  font-weight: 600;
}
</style>
