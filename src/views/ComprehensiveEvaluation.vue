<template>
  <div class="comprehensive-eval-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="行为画像报告" name="report" />
        <el-tab-pane label="行为画像可视化" name="visual" />
        <el-tab-pane label="个性化培训与辅导建议" name="training" />
      </el-tabs>

      <div class="tab-body">
        <el-form :inline="true" size="small" class="filter-form">
          <el-form-item label="单位：">
            <el-select v-model="query.unit" placeholder="请选择" clearable style="width: 150px" @change="handleUnitChange">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="query.department" placeholder="请选择" clearable style="width: 150px">
              <el-option v-for="opt in departmentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="姓名：">
            <el-select
              v-model="query.name"
              filterable
              clearable
              placeholder="请选择或搜索"
              style="width: 150px"
            >
              <el-option v-for="name in nameOptions" :key="name" :label="name" :value="name" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="action-bar">
          <span v-if="currentEmployee" class="employee-tag">
            当前评估对象：<strong>{{ currentEmployee.unit }} · {{ currentEmployee.department }} · {{ currentEmployee.name }}</strong>
          </span>
          <el-button
            v-if="activeTab !== 'training'"
            type="primary"
            plain
            icon="el-icon-upload2"
            size="small"
            @click="handleExport"
          >导出</el-button>
        </div>

        <div v-if="!reportData && activeTab !== 'training'" class="empty-hint">
          <i class="el-icon-user" />
          <p>请选择员工后查询</p>
        </div>

        <div v-if="activeTab === 'training'" class="tab-panel">
          <div class="developing-placeholder">
            <i class="el-icon-reading developing-placeholder__icon" />
            <p class="developing-placeholder__title">个性化培训与辅导建议</p>
            <p class="developing-placeholder__desc">功能暂未确定，敬请期待</p>
          </div>
        </div>

        <template v-else-if="reportData">
          <!-- Tab1 行为画像报告 -->
          <div v-show="activeTab === 'report'" class="tab-panel">
            <div class="profile-hero">
              <div class="profile-hero__main">
                <el-avatar :size="72" class="profile-avatar">{{ avatarText }}</el-avatar>
                <div class="profile-info">
                  <div class="profile-info__name">
                    {{ reportData.employee.name }}
                    <el-tag :type="gradeTagType" size="small" effect="dark" class="grade-tag">
                      {{ reportData.overall.grade }}
                    </el-tag>
                  </div>
                  <div class="profile-info__meta">
                    <span>{{ reportData.employee.gender }}</span>
                    <span class="dot">·</span>
                    <span>{{ reportData.employee.age }}岁</span>
                    <span class="dot">·</span>
                    <span>{{ reportData.employee.unit }}</span>
                    <span class="dot">·</span>
                    <span>{{ reportData.employee.department }}</span>
                  </div>
                  <div class="profile-info__title">{{ reportData.employee.title }}</div>
                </div>
              </div>
              <div class="score-ring">
                <div class="score-ring__value" :style="{ color: reportData.overall.color }">
                  {{ reportData.overall.score }}
                </div>
                <div class="score-ring__label">综合得分</div>
              </div>
            </div>

            <div class="section-title">出勤稳定性</div>
            <div class="kpi-grid">
              <div v-for="item in stabilityKpis" :key="item.key" class="kpi-card">
                <div class="kpi-card__value" :style="{ color: item.color }">
                  {{ item.value }}<span class="kpi-card__unit">{{ item.suffix }}</span>
                </div>
                <div class="kpi-card__label">{{ item.label }}</div>
              </div>
            </div>

            <div class="report-grid">
              <div class="panel-card">
                <div class="panel-card__title">请假类型分布</div>
                <div ref="reportLeaveChart" class="chart-box chart-box--sm" />
              </div>
              <div class="panel-card">
                <div class="panel-card__title">出勤时间规律</div>
                <div class="metric-list">
                  <div v-for="row in timePatternRows" :key="row.key" class="metric-list__item">
                    <span class="metric-list__label">{{ row.label }}</span>
                    <span class="metric-list__value">
                      {{ reportData.timePattern[row.key] }}{{ row.suffix }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="summary-card">
              <i class="el-icon-document" />
              <p>{{ reportData.summary }}</p>
            </div>
          </div>

          <!-- Tab2 行为画像可视化 -->
          <div v-show="activeTab === 'visual'" class="tab-panel">
            <div class="chart-grid">
              <div class="panel-card">
                <div class="panel-card__title">出勤情况</div>
                <div ref="attendanceChart" class="chart-box" />
              </div>
              <div class="panel-card">
                <div class="panel-card__title">时间趋势</div>
                <div ref="timeTrendChart" class="chart-box" />
              </div>
              <div class="panel-card">
                <div class="panel-card__title">出勤类型</div>
                <div ref="attendanceTypeChart" class="chart-box" />
              </div>
              <div class="panel-card">
                <div class="panel-card__title">行为画像雷达</div>
                <div ref="radarChart" class="chart-box" />
              </div>
            </div>
          </div>
        </template>
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
  buildEmployeeRoster,
  getDefaultQuery,
  filterEmployees,
  resolveEmployee,
  getBehaviorReport,
  getVisualizationData,
  STABILITY_KPI_META,
  TIME_PATTERN_ROWS,
} from "../utils/comprehensiveEvaluationData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "ComprehensiveEvaluation",
  data() {
    const roster = buildEmployeeRoster(64);
    const defaultQuery = getDefaultQuery();
    const first = resolveEmployee(roster, defaultQuery);
    return {
      activeTab: "report",
      unitOptions: UNIT_OPTIONS,
      departmentOptions: DEPARTMENT_OPTIONS,
      roster,
      query: { ...defaultQuery, name: first ? first.name : "" },
      appliedQuery: { ...defaultQuery, name: first ? first.name : "" },
      stabilityKpiMeta: STABILITY_KPI_META,
      timePatternRowMeta: TIME_PATTERN_ROWS,
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    filteredRoster() {
      return filterEmployees(this.roster, {
        unit: this.query.unit,
        department: this.query.department,
      });
    },
    nameOptions() {
      const names = this.filteredRoster.map((r) => r.name);
      return [...new Set(names)];
    },
    currentEmployee() {
      return resolveEmployee(this.roster, this.appliedQuery);
    },
    reportData() {
      return getBehaviorReport(this.currentEmployee);
    },
    visualData() {
      return getVisualizationData(this.currentEmployee);
    },
    avatarText() {
      const name = this.reportData && this.reportData.employee.name;
      return name ? name.slice(-1) : "?";
    },
    gradeTagType() {
      const grade = this.reportData && this.reportData.overall.grade;
      if (grade === "优秀") return "success";
      if (grade === "良好") return "";
      if (grade === "合格") return "warning";
      return "danger";
    },
    stabilityKpis() {
      if (!this.reportData) return [];
      return this.stabilityKpiMeta.map((item) => ({
        ...item,
        value: this.reportData.stability[item.key],
      }));
    },
    timePatternRows() {
      return this.timePatternRowMeta;
    },
  },
  watch: {
    activeTab(val) {
      this.$nextTick(() => {
        if (val === "report") this.renderReportChart();
        if (val === "visual") this.initAndRenderVisualCharts();
      });
    },
    reportData: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          if (this.activeTab === "report") this.renderReportChart();
          if (this.activeTab === "visual") this.renderVisualCharts();
        });
      },
    },
  },
  mounted() {
    this.handleSearch();
    this.resizeHandler = () => {
      Object.values(this.charts).forEach((c) => c && c.resize());
    };
    window.addEventListener("resize", this.resizeHandler);
    this.$nextTick(() => this.renderReportChart());
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
    this.charts = {};
  },
  methods: {
    handleUnitChange() {
      if (this.query.name && !this.nameOptions.includes(this.query.name)) {
        this.query.name = this.nameOptions[0] || "";
      }
    },
    handleSearch() {
      this.appliedQuery = { ...this.query };
      if (!this.appliedQuery.name && this.nameOptions.length) {
        this.appliedQuery.name = this.nameOptions[0];
        this.query.name = this.appliedQuery.name;
      }
    },
    handleReset() {
      const first = resolveEmployee(this.roster, getDefaultQuery());
      this.query = { ...getDefaultQuery(), name: first ? first.name : "" };
      this.appliedQuery = { ...this.query };
    },
    exportMeta() {
      const e = this.currentEmployee;
      return {
        unit: e ? e.unit : "—",
        department: e ? e.department : "—",
        name: e ? e.name : "—",
      };
    },
    handleExport() {
      if (!this.currentEmployee) {
        this.$message.warning("请先选择员工");
        return;
      }
      if (this.activeTab === "report") this.exportReport();
      else if (this.activeTab === "visual") this.exportVisual();
    },
    exportReport() {
      const r = this.reportData;
      const rows = [
        ["基本信息", "姓名", r.employee.name, "", ""],
        ["基本信息", "单位", r.employee.unit, "", ""],
        ["基本信息", "部门", r.employee.department, "", ""],
        ["基本信息", "岗位", r.employee.title, "", ""],
        ["综合评估", "等级", r.overall.grade, "得分", r.overall.score],
        ...STABILITY_KPI_META.map((k) => ["出勤稳定性", k.label, r.stability[k.key], k.suffix, ""]),
        ...TIME_PATTERN_ROWS.map((k) => ["出勤时间规律", k.label, r.timePattern[k.key], k.suffix, ""]),
        ...r.leaveTypes.map((t) => ["请假类型", t.name, t.value, `${t.percent}%`, ""]),
        ["评估摘要", r.summary, "", "", ""],
      ];
      downloadTableWithLog({
        headers: ["分类", "指标/类型", "数值", "单位/占比", "备注"],
        rows,
        format: "csv",
        baseFilename: "行为画像报告",
        meta: {
          moduleCode: "comprehensive_eval_report",
          moduleName: "行为画像报告",
          moduleGroup: "员工行为画像综合评估",
          searchCriteria: this.exportMeta(),
        },
      });
      this.$message.success("报告已导出");
    },
    exportVisual() {
      const v = this.visualData;
      const rows = [
        ...v.attendanceStatus.map((d) => ["出勤情况", d.month, d.attendanceDays, d.lateCount, d.earlyCount]),
        ...v.timeTrend.map((d) => ["时间趋势", d.month, d.arrivalHour, d.departureHour, d.workHours]),
        ...v.attendanceTypes.map((d) => ["出勤类型", d.name, d.value, `${d.percent}%`, ""]),
        ["雷达图", "出勤率", v.radar.values[0], "", ""],
        ["雷达图", "加班时长", v.radar.values[1], "", ""],
        ["雷达图", "工作饱和度", v.radar.values[2], "", ""],
      ];
      downloadTableWithLog({
        headers: ["图表", "维度", "数值1", "数值2", "数值3"],
        rows,
        format: "csv",
        baseFilename: "行为画像可视化",
        meta: {
          moduleCode: "comprehensive_eval_visual",
          moduleName: "行为画像可视化",
          moduleGroup: "员工行为画像综合评估",
          searchCriteria: this.exportMeta(),
        },
      });
      this.$message.success("可视化数据已导出");
    },
    ensureChart(key, refName) {
      const el = this.$refs[refName];
      if (el && !this.charts[key]) {
        this.charts[key] = echarts.init(el);
      }
      return this.charts[key];
    },
    renderReportChart() {
      const chart = this.ensureChart("reportLeave", "reportLeaveChart");
      if (!chart || !this.reportData) return;
      const data = this.reportData.leaveTypes;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "item", formatter: "{b}<br/>{c}次 ({d}%)" },
          legend: { orient: "vertical", right: 8, top: "middle" },
          series: [{
            type: "pie",
            radius: ["42%", "68%"],
            center: ["38%", "50%"],
            label: { show: true, formatter: "{b}\n{d}%", fontSize: 11 },
            data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
          }],
        }),
        true
      );
      chart.resize();
    },
    initAndRenderVisualCharts() {
      const refs = {
        attendance: "attendanceChart",
        timeTrend: "timeTrendChart",
        attendanceType: "attendanceTypeChart",
        radar: "radarChart",
      };
      Object.entries(refs).forEach(([key, refName]) => this.ensureChart(key, refName));
      this.renderVisualCharts();
    },
    renderVisualCharts() {
      if (!this.visualData) return;
      this.renderAttendanceChart();
      this.renderTimeTrendChart();
      this.renderAttendanceTypeChart();
      this.renderRadarChart();
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
    renderAttendanceChart() {
      const chart = this.charts.attendance;
      if (!chart) return;
      const data = this.visualData.attendanceStatus;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: { data: ["出勤天数", "迟到次数", "早退次数"], top: 0 },
          grid: { left: "3%", right: "4%", bottom: "8%", top: "16%", containLabel: true },
          xAxis: { type: "category", data: data.map((d) => d.month) },
          yAxis: { type: "value", min: 0 },
          series: [
            { name: "出勤天数", type: "bar", barMaxWidth: 18, itemStyle: { color: "#FAAD14", borderRadius: [3, 3, 0, 0] }, data: data.map((d) => d.attendanceDays) },
            { name: "迟到次数", type: "bar", barMaxWidth: 18, itemStyle: { color: "#1890FF", borderRadius: [3, 3, 0, 0] }, data: data.map((d) => d.lateCount) },
            { name: "早退次数", type: "line", smooth: true, symbolSize: 6, lineStyle: { color: "#52C41A", width: 2 }, itemStyle: { color: "#52C41A" }, data: data.map((d) => d.earlyCount) },
          ],
        }),
        true
      );
    },
    renderTimeTrendChart() {
      const chart = this.charts.timeTrend;
      if (!chart) return;
      const data = this.visualData.timeTrend;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: { data: ["平均到岗(时)", "平均离岗(时)", "有效工时(时)"], top: 0 },
          grid: { left: "3%", right: "4%", bottom: "8%", top: "16%", containLabel: true },
          xAxis: { type: "category", data: data.map((d) => d.month), boundaryGap: false },
          yAxis: { type: "value", min: 6, max: 20 },
          series: [
            { name: "平均到岗(时)", type: "line", smooth: true, data: data.map((d) => d.arrivalHour), lineStyle: { color: "#1890FF" }, itemStyle: { color: "#1890FF" } },
            { name: "平均离岗(时)", type: "line", smooth: true, data: data.map((d) => d.departureHour), lineStyle: { color: "#52C41A" }, itemStyle: { color: "#52C41A" } },
            { name: "有效工时(时)", type: "line", smooth: true, data: data.map((d) => d.workHours), lineStyle: { color: "#722ED1" }, itemStyle: { color: "#722ED1" } },
          ],
        }),
        true
      );
    },
    renderAttendanceTypeChart() {
      const chart = this.charts.attendanceType;
      if (!chart) return;
      const data = this.visualData.attendanceTypes;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "item", formatter: "{b}<br/>{c}次 ({d}%)" },
          legend: {
            orient: "vertical",
            right: 8,
            top: "middle",
            formatter: (name) => {
              const item = data.find((d) => d.name === name);
              return item ? `${name}  ${item.value}次  ${item.percent}%` : name;
            },
          },
          series: [{
            type: "pie",
            radius: ["40%", "65%"],
            center: ["38%", "50%"],
            label: { show: false },
            data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
          }],
        }),
        true
      );
    },
    renderRadarChart() {
      const chart = this.charts.radar;
      if (!chart) return;
      const { indicators, values } = this.visualData.radar;
      chart.setOption(
        baseChartOption({
          tooltip: {},
          radar: {
            indicator: indicators,
            radius: "62%",
            center: ["50%", "52%"],
            splitArea: { areaStyle: { color: ["rgba(24,144,255,0.02)", "rgba(24,144,255,0.06)"] } },
            axisName: { color: "#606266", fontSize: 12 },
          },
          series: [{
            type: "radar",
            data: [{
              value: values,
              name: "行为画像",
              areaStyle: { color: "rgba(24,144,255,0.25)" },
              lineStyle: { color: "#1890FF", width: 2 },
              itemStyle: { color: "#1890FF" },
            }],
          }],
        }),
        true
      );
    },
  },
};
</script>

<style scoped>
.comprehensive-eval-page {
  min-height: calc(100vh - 100px);
  padding: 0 4px 20px;
  background: #f0f2f5;
  box-sizing: border-box;
}

.page-shell {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
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
}

.main-tabs >>> .el-tabs__item.is-active {
  color: #1890ff;
  font-weight: 500;
}

.tab-body {
  padding: 16px 20px 24px;
}

.filter-form {
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 16px;
}

.employee-tag {
  font-size: 13px;
  color: #606266;
}

.employee-tag strong {
  color: #303133;
}

.empty-hint {
  text-align: center;
  padding: 80px 0;
  color: #909399;
}

.empty-hint i {
  font-size: 48px;
  margin-bottom: 12px;
}

/* Profile hero */
.profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0f7ff 0%, #fff 60%);
  border: 1px solid #d6e8ff;
  border-radius: 8px;
  margin-bottom: 20px;
}

.profile-hero__main {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-avatar {
  background: #1890ff;
  font-size: 28px;
  font-weight: 600;
}

.profile-info__name {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-info__meta {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}

.profile-info__meta .dot {
  margin: 0 6px;
}

.profile-info__title {
  margin-top: 8px;
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
}

.score-ring {
  text-align: center;
  min-width: 88px;
}

.score-ring__value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.score-ring__label {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #1890ff;
}

/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.kpi-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  transition: box-shadow 0.2s;
}

.kpi-card:hover {
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.kpi-card__value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-card__unit {
  font-size: 12px;
  font-weight: 400;
  margin-left: 2px;
}

.kpi-card__label {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

/* Panels */
.report-grid,
.chart-grid {
  display: grid;
  gap: 16px;
}

.report-grid {
  grid-template-columns: 1fr 1fr;
}

.chart-grid {
  grid-template-columns: 1fr 1fr;
}

.panel-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}

.panel-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.panel-card__title i {
  margin-right: 6px;
  color: #1890ff;
}

.chart-box {
  height: 300px;
}

.chart-box--sm {
  height: 260px;
}

.metric-list {
  padding: 8px 0;
}

.metric-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.metric-list__item:last-child {
  border-bottom: none;
}

.metric-list__label {
  font-size: 13px;
  color: #606266;
}

.metric-list__value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.summary-card {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 16px 20px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
}

.summary-card i {
  font-size: 20px;
  color: #1890ff;
  margin-top: 2px;
}

.summary-card p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #606266;
}

.developing-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  color: #909399;
}

.developing-placeholder__icon {
  font-size: 56px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.developing-placeholder__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.developing-placeholder__desc {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .report-grid,
  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
