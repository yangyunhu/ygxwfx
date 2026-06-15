<template>
  <div class="behavior-intelligence-page">
    <div class="page-body">
      <el-tabs v-model="subTab" class="sub-tabs">
        <el-tab-pane label="基本统计指标" name="basic" />
        <el-tab-pane label="预测分析" name="prediction" />
      </el-tabs>

      <section class="query-panel">
        <el-form :inline="true" size="small" class="query-form">
          <el-form-item label="单位：">
            <el-select
              v-model="queryParams.unit"
              placeholder="请选择"
              style="width: 180px"
              @change="handleFilterChange"
            >
              <el-option
                v-for="opt in unitOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="subTab === 'basic'" label="时间：">
            <el-date-picker
              v-model="queryParams.startDate"
              type="date"
              placeholder="开始日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
              @change="handleFilterChange"
            />
            <span class="date-sep">~</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 140px"
              @change="handleFilterChange"
            />
          </el-form-item>
          <el-form-item v-if="subTab === 'prediction'" label="维度：">
            <el-radio-group v-model="predictionDimension" size="mini" @change="handlePredictionDimensionChange">
              <el-radio-button label="employee">按员工</el-radio-button>
              <el-radio-button label="department">按部门</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item class="query-export">
            <el-button type="success" plain icon="el-icon-download" @click="openExportDialog">导出</el-button>
          </el-form-item>
          <el-form-item class="query-actions">
            <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <div class="linkage-bar">
          <i class="el-icon-connection" />
          <span>
            当前统计：
            <strong>{{ linkageLabel }}</strong>
            <span class="linkage-hint">{{ linkageHint }}</span>
          </span>
          <el-button v-if="linkedDepartment" type="text" size="mini" @click="clearDepartmentLink">
            清除部门联动
          </el-button>
        </div>
      </section>

      <div v-show="subTab === 'basic'" class="tab-content">
        <section class="chart-card" :class="{ 'is-linked': linkedDepartment }">
          <h3 class="chart-card__title chart-card__title--center">
            部门维度
            <span class="section-filter-tip">（{{ snapshot.unitLabel }} · {{ snapshot.periodLabel }}）</span>
          </h3>
          <div ref="deptChart" class="chart-box chart-box--lg chart-box--clickable" />
        </section>

        <section class="chart-card" :class="{ 'is-linked': linkedDepartment }">
          <h3 class="chart-card__title chart-card__title--center">
            员工维度
            <span v-if="linkedDepartment" class="section-filter-tip linked-badge">联动 · {{ linkedDepartment }}</span>
            <span v-else class="section-filter-tip">（{{ snapshot.unitLabel }} · 全部部门）</span>
          </h3>
          <div ref="empChart" class="chart-box chart-box--lg" />
        </section>
      </div>

      <div v-show="subTab === 'prediction'" class="tab-content">
        <section class="chart-card chart-card--prediction">
          <h3 class="chart-card__title chart-card__title--center">迟到概率预测</h3>
          <div ref="lateProbChart" class="chart-box chart-box--prediction" />
        </section>

        <section class="chart-card chart-card--prediction">
          <h3 class="chart-card__title chart-card__title--center">早退概率预测</h3>
          <div ref="earlyProbChart" class="chart-box chart-box--prediction" />
        </section>

        <section class="chart-card chart-card--prediction">
          <h3 class="chart-card__title chart-card__title--center">旷工概率预测</h3>
          <div ref="absenteeProbChart" class="chart-box chart-box--prediction" />
        </section>
      </div>
    </div>

    <el-dialog
      :title="exportDialogTitle"
      :visible.sync="exportDialogVisible"
      width="600px"
      append-to-body
      @closed="resetExportDialog"
    >
      <p class="export-dialog-tip">
        请选择需要导出的模块，系统将按当前筛选条件生成 CSV 明细。已选
        <strong>{{ selectedExportModules.length }}</strong> / {{ exportModules.length }} 项。
      </p>
      <div class="export-module-toolbar">
        <el-checkbox v-model="exportCheckAll" :indeterminate="exportIndeterminate" @change="handleExportCheckAll">
          全选
        </el-checkbox>
      </div>
      <el-checkbox-group v-model="selectedExportModules" class="export-module-list" @change="syncExportCheckAll">
        <div v-for="mod in exportModules" :key="mod.key" class="export-module-item">
          <el-checkbox :label="mod.key">{{ mod.label }}</el-checkbox>
          <span class="export-module-desc">{{ mod.desc }}</span>
        </div>
      </el-checkbox-group>
      <div slot="footer">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-download" :disabled="!selectedExportModules.length" @click="confirmExport">
          确认导出
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption, legendBottomCenter } from "../utils/chartTheme";
import {
  UNIT_OPTIONS,
  DEFAULT_SATURATION_QUERY,
  buildWorkSaturationSnapshot,
  getPredictionDimensionData,
} from "../utils/workSaturationData";
import {
  SATURATION_BASIC_EXPORT_MODULES,
  SATURATION_PREDICTION_EXPORT_MODULES,
  exportSaturationModules,
} from "../utils/workSaturationExport";

const DEPT_COLORS = { bar: "#FAAD14", late: "#52C41A", early: "#EB2F96" };
const EMP_COLORS = { bar: "#1890FF", late: "#722ED1", early: "#69C0FF" };

const PROB_CHART_COLORS = {
  late: "#52C41A",
  early: "#722ED1",
  absentee: "#FA8C16",
};

export default {
  name: "BehaviorIntelligencePanel",
  data() {
    return {
      subTab: "basic",
      predictionDimension: "department",
      unitOptions: UNIT_OPTIONS.filter((u) => u.value !== "all"),
      queryParams: { ...DEFAULT_SATURATION_QUERY },
      snapshot: buildWorkSaturationSnapshot(DEFAULT_SATURATION_QUERY),
      charts: {},
      exportDialogVisible: false,
      selectedExportModules: [],
      exportCheckAll: false,
      exportIndeterminate: false,
      resizeHandler: null,
      linkedDepartment: null,
      deptClickBound: false,
    };
  },
  computed: {
    linkageLabel() {
      const parts = [this.snapshot.unitLabel];
      if (this.subTab === "basic") {
        parts.push(this.snapshot.periodLabel);
        if (this.linkedDepartment) parts.push(this.linkedDepartment);
      } else {
        parts.push(this.predictionDimension === "employee" ? "按员工" : "按部门");
      }
      parts.push(this.subTab === "prediction" ? "预测分析" : "基本统计指标");
      return parts.join(" · ");
    },
    linkageHint() {
      if (this.subTab === "prediction") {
        return "切换单位或维度后，下方三张概率预测图将自动联动刷新";
      }
      return "切换单位/时间后下方图表自动联动刷新；点击部门柱图可筛选员工维度";
    },
    currentPredictionData() {
      const dim = getPredictionDimensionData(this.snapshot.prediction, this.predictionDimension);
      return { ...dim };
    },
    displayEmployeeStats() {
      const list = this.snapshot.employeeStats || [];
      if (!this.linkedDepartment) return list;
      return list.filter((e) => e.department === this.linkedDepartment);
    },
    exportModules() {
      return this.subTab === "prediction"
        ? SATURATION_PREDICTION_EXPORT_MODULES
        : SATURATION_BASIC_EXPORT_MODULES;
    },
    exportDialogTitle() {
      return this.subTab === "prediction" ? "导出预测分析明细" : "导出基本统计明细";
    },
  },
  watch: {
    subTab(val) {
      this.$nextTick(() => {
        this.initCharts();
        this.renderAllCharts();
        this.resizeCharts();
      });
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts();
      this.bindDeptChartClick();
      this.renderAllCharts();
    });
    this.resizeHandler = () => this.resizeCharts();
    window.addEventListener("resize", this.resizeHandler);
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
  },
  methods: {
    initCharts() {
      const refs = {
        dept: "deptChart",
        emp: "empChart",
        lateProb: "lateProbChart",
        earlyProb: "earlyProbChart",
        absenteeProb: "absenteeProbChart",
      };
      Object.keys(refs).forEach((key) => {
        const el = this.$refs[refs[key]];
        if (el && !this.charts[key]) this.charts[key] = echarts.init(el);
      });
    },

    handlePredictionDimensionChange() {
      this.renderPredictionCharts();
    },

    buildProbLineOption(categories, data, color, seriesName) {
      const rotate = categories.length > 8 ? 28 : categories.length > 5 ? 18 : 0;
      const maxVal = Math.max(...data, 1);
      const axisMax = Math.min(25, Math.max(8, Math.ceil(maxVal / 2) * 2 + 2));
      const interval = axisMax <= 10 ? 2 : 5;
      return baseChartOption({
        animation: true,
        animationDuration: 400,
        tooltip: {
          trigger: "axis",
          formatter: (params) => {
            const p = params[0];
            return `${p.name}<br/>${seriesName}：<strong>${p.value}%</strong>`;
          },
        },
        grid: { left: "2%", right: "3%", top: "12%", bottom: rotate ? "18%" : "12%", containLabel: true },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: categories,
          axisLabel: { interval: 0, rotate, fontSize: 11, color: "#606266" },
          axisLine: { lineStyle: { color: "#E8E8E8" } },
          axisTick: { show: false },
        },
        yAxis: {
          type: "value",
          min: 0,
          max: axisMax,
          interval,
          axisLabel: { formatter: "{value}%", color: "#606266", fontSize: 11 },
          splitLine: { lineStyle: { color: "#F0F0F0" } },
        },
        series: [
          {
            name: seriesName,
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 8,
            lineStyle: { width: 2.5, color },
            itemStyle: { color, borderColor: "#fff", borderWidth: 2 },
            areaStyle: { color: `${color}18` },
            data,
          },
        ],
      });
    },

    renderPredictionCharts() {
      const dim = this.currentPredictionData;
      const categories = dim.categories || [];

      const lateChart = this.charts.lateProb;
      if (lateChart) {
        lateChart.setOption(
          this.buildProbLineOption(categories, dim.lateProb, PROB_CHART_COLORS.late, "迟到概率"),
          true
        );
      }
      const earlyChart = this.charts.earlyProb;
      if (earlyChart) {
        earlyChart.setOption(
          this.buildProbLineOption(categories, dim.earlyProb, PROB_CHART_COLORS.early, "早退概率"),
          true
        );
      }
      const absenteeChart = this.charts.absenteeProb;
      if (absenteeChart) {
        absenteeChart.setOption(
          this.buildProbLineOption(categories, dim.absenteeProb, PROB_CHART_COLORS.absentee, "旷工概率"),
          true
        );
      }
    },

    refreshSnapshot() {
      this.snapshot = buildWorkSaturationSnapshot(this.queryParams);
    },

    buildComboOption(categories, stats, colors, options = {}) {
      const { linkedIndex = -1, dimmedOpacity = 0.35 } = options;
      const maxDays = Math.max(...stats.map((d) => d.avgDays), 50);
      const daysMax = Math.ceil(maxDays / 50) * 50 + 50;
      return baseChartOption({
        animation: true,
        animationDuration: 350,
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        legend: legendBottomCenter(["平均出勤天数", "迟到率", "早退率"]),
        grid: { left: "2%", right: "4%", top: "8%", bottom: "14%", containLabel: true },
        xAxis: {
          type: "category",
          data: categories,
          axisLabel: { interval: 0, rotate: categories.length > 6 ? 28 : 0, fontSize: 11, color: "#606266" },
          axisLine: { lineStyle: { color: "#E8E8E8" } },
          axisTick: { show: false },
        },
        yAxis: [
          {
            type: "value",
            name: "天数",
            min: 0,
            max: daysMax,
            interval: Math.max(50, Math.round(daysMax / 5)),
            axisLabel: { color: "#606266", fontSize: 11 },
            splitLine: { lineStyle: { color: "#F0F0F0" } },
          },
          {
            type: "value",
            name: "比率",
            min: 0,
            max: 100,
            interval: 20,
            axisLabel: { formatter: "{value}%", color: "#606266", fontSize: 11 },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: "平均出勤天数",
            type: "bar",
            barMaxWidth: 36,
            itemStyle: {
              borderRadius: [2, 2, 0, 0],
              color: (params) => {
                if (linkedIndex >= 0 && params.dataIndex !== linkedIndex) {
                  return `rgba(250, 173, 20, ${dimmedOpacity})`;
                }
                return colors.bar;
              },
            },
            data: stats.map((d) => d.avgDays),
          },
          {
            name: "迟到率",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 2, color: colors.late },
            itemStyle: { color: colors.late },
            data: stats.map((d) => d.lateRate),
          },
          {
            name: "早退率",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 2, color: colors.early },
            itemStyle: { color: colors.early },
            data: stats.map((d) => d.earlyRate),
          },
        ],
      });
    },

    bindDeptChartClick() {
      const chart = this.charts.dept;
      if (!chart || this.deptClickBound) return;
      chart.on("click", (params) => {
        if (params.componentSubType !== "bar") return;
        const dept = this.snapshot.departmentStats[params.dataIndex];
        if (!dept) return;
        this.linkedDepartment = this.linkedDepartment === dept.name ? null : dept.name;
        this.renderDeptChart();
        this.renderEmpChart();
      });
      this.deptClickBound = true;
    },

    clearDepartmentLink() {
      this.linkedDepartment = null;
      this.renderDeptChart();
      this.renderEmpChart();
    },

    validateDateRange() {
      if (this.queryParams.startDate && this.queryParams.endDate) {
        if (this.queryParams.startDate > this.queryParams.endDate) {
          this.$message.warning("开始日期不能晚于结束日期");
          return false;
        }
      }
      return true;
    },

    applyLinkage(showToast = false) {
      if (!this.validateDateRange()) return;
      this.linkedDepartment = null;
      this.refreshSnapshot();
      this.renderAllCharts();
      if (showToast) this.$message.success("查询成功，下方图表已联动刷新");
    },

    handleFilterChange() {
      this.applyLinkage(false);
    },

    renderDeptChart() {
      const chart = this.charts.dept;
      if (!chart) return;
      const stats = this.snapshot.departmentStats;
      const linkedIndex = this.linkedDepartment
        ? stats.findIndex((d) => d.name === this.linkedDepartment)
        : -1;
      chart.setOption(
        this.buildComboOption(
          stats.map((d) => d.name.replace("部", "")),
          stats,
          DEPT_COLORS,
          { linkedIndex }
        ),
        true
      );
    },

    renderEmpChart() {
      const chart = this.charts.emp;
      if (!chart) return;
      const stats = this.displayEmployeeStats;
      if (!stats.length) {
        chart.setOption(
          baseChartOption({
            title: {
              text: "当前部门暂无员工数据",
              left: "center",
              top: "middle",
              textStyle: { color: "#909399", fontSize: 13, fontWeight: 400 },
            },
            xAxis: { show: false },
            yAxis: { show: false },
            series: [],
          }),
          true
        );
        return;
      }
      chart.setOption(
        this.buildComboOption(
          stats.map((e) => e.name),
          stats,
          EMP_COLORS
        ),
        true
      );
    },

    renderAllCharts() {
      if (this.subTab === "prediction") {
        this.renderPredictionCharts();
      } else {
        this.renderDeptChart();
        this.renderEmpChart();
      }
    },

    refreshVisibleCharts() {
      this.initCharts();
      this.renderAllCharts();
      this.$nextTick(() => this.resizeCharts());
    },

    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && !c.isDisposed() && c.resize());
    },

    handleQuery() {
      this.applyLinkage(true);
    },

    handleReset() {
      this.queryParams = { ...DEFAULT_SATURATION_QUERY };
      this.linkedDepartment = null;
      this.predictionDimension = "department";
      this.applyLinkage(false);
      this.$message.info("已重置查询条件");
    },

    openExportDialog() {
      this.selectedExportModules = this.exportModules.map((m) => m.key);
      this.syncExportCheckAll(this.selectedExportModules);
      this.exportDialogVisible = true;
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

    confirmExport() {
      if (!this.selectedExportModules.length) {
        this.$message.warning("请至少选择一个导出模块");
        return;
      }
      exportSaturationModules(this.selectedExportModules, this.snapshot, {
        predictionDimension: this.predictionDimension,
      });
      this.exportDialogVisible = false;
      this.$message.success(`已开始导出 ${this.selectedExportModules.length} 个模块明细，请留意浏览器下载`);
    },
  },
};
</script>

<style scoped>
.behavior-intelligence-page {
  min-height: calc(100vh - 100px);
  padding: 0 4px 20px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.page-body {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 0 16px 16px;
}

.sub-tabs {
  margin-bottom: 4px;
}

.sub-tabs >>> .el-tabs__nav-wrap::after {
  height: 1px;
  background: #f0f0f0;
}

.query-panel {
  padding: 12px 0 8px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 14px;
}

.linkage-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #606266;
  background: #f6fbff;
  border: 1px solid #d6ebff;
  border-radius: 4px;
}

.linkage-bar i {
  color: #1890ff;
  font-size: 14px;
}

.linkage-bar strong {
  color: #1890ff;
}

.linkage-hint {
  margin-left: 8px;
  color: #909399;
}

.section-filter-tip {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: #909399;
}

.linked-badge {
  color: #1890ff;
  font-weight: 500;
}

.chart-card.is-linked {
  border-color: #91d5ff;
  box-shadow: inset 3px 0 0 #1890ff;
}

.chart-box--clickable {
  cursor: pointer;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.query-actions {
  margin-left: auto;
}

.query-export {
  margin-left: 8px;
}

.date-sep {
  margin: 0 6px;
  color: #909399;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chart-card {
  padding: 14px 16px 12px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.chart-card__title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.chart-card__title--center {
  text-align: center;
  font-size: 15px;
  margin-bottom: 6px;
}

.chart-box {
  width: 100%;
  height: 340px;
}

.chart-box--lg {
  height: 380px;
}

.chart-box--md {
  height: 320px;
}

.chart-box--prediction {
  height: 280px;
}

.chart-card--prediction {
  padding-top: 12px;
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

@media (max-width: 768px) {
  .query-actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
