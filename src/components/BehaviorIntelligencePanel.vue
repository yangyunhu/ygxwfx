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
          <el-form-item label="时间：">
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
            <span class="linkage-hint">切换单位/时间后下方图表自动联动刷新；点击部门柱图可筛选员工维度</span>
          </span>
          <el-button v-if="linkedDepartment" type="text" size="mini" @click="clearDepartmentLink">
            清除部门联动
          </el-button>
        </div>
      </section>

      <div v-show="subTab === 'basic'" class="tab-content">
        <section v-if="activeModule === 'saturation'" class="summary-strip">
          <div v-for="item in summaryItems" :key="item.key" class="summary-card">
            <div class="summary-card__label">{{ item.label }}</div>
            <div class="summary-card__value" :class="item.valueClass">
              {{ item.value }}<span v-if="item.suffix" class="summary-card__suffix">{{ item.suffix }}</span>
            </div>
          </div>
        </section>

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
        <section class="prediction-kpi">
          <div class="kpi-card">
            <div class="kpi-card__label">平均预测饱和度</div>
            <div class="kpi-card__value is-primary">{{ snapshot.prediction.avgForecast }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__label">模型预测准确率</div>
            <div class="kpi-card__value is-success">{{ snapshot.prediction.modelAccuracy }}%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card__label">高风险预警</div>
            <div class="kpi-card__value is-danger">{{ snapshot.prediction.riskAlerts.length }}</div>
          </div>
        </section>

        <section class="chart-card">
          <h3 class="chart-card__title">工作饱和度趋势与预测</h3>
          <div ref="trendChart" class="chart-box chart-box--md" />
        </section>

        <div class="prediction-grid">
          <section class="chart-card">
            <h3 class="chart-card__title">部门饱和度预测</h3>
            <el-table :data="snapshot.prediction.forecastTable" border stripe size="small">
              <el-table-column type="index" label="序号" width="55" align="center" />
              <el-table-column prop="dimension" label="部门" min-width="110" show-overflow-tooltip />
              <el-table-column prop="currentSaturation" label="当前饱和度" width="100" align="center">
                <template slot-scope="{ row }">{{ row.currentSaturation }}%</template>
              </el-table-column>
              <el-table-column prop="forecastSaturation" label="预测饱和度" width="100" align="center">
                <template slot-scope="{ row }">
                  <span :class="saturationClass(row.forecastSaturation)">{{ row.forecastSaturation }}%</span>
                </template>
              </el-table-column>
              <el-table-column prop="trend" label="趋势" width="70" align="center">
                <template slot-scope="{ row }">
                  <span :class="row.trend === '上升' ? 'trend-up' : 'trend-down'">{{ row.trend }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="riskLevel" label="风险" width="70" align="center">
                <template slot-scope="{ row }">
                  <el-tag :type="riskTagType(row.riskLevel)" size="mini">{{ row.riskLevel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="suggestion" label="建议" min-width="160" show-overflow-tooltip />
            </el-table>
          </section>

          <section class="chart-card">
            <h3 class="chart-card__title">高风险员工预警</h3>
            <div v-if="snapshot.prediction.riskAlerts.length" class="alert-list">
              <div
                v-for="(item, idx) in snapshot.prediction.riskAlerts"
                :key="idx"
                class="alert-item"
                :class="item.level === '高风险' ? 'is-danger' : 'is-warning'"
              >
                <div class="alert-item__head">
                  <span class="alert-item__name">{{ item.name }}</span>
                  <el-tag :type="item.level === '高风险' ? 'danger' : 'warning'" size="mini">{{ item.level }}</el-tag>
                </div>
                <div class="alert-item__meta">{{ item.department }} · 饱和度 {{ item.saturation }}%</div>
                <div class="alert-item__msg">{{ item.message }}</div>
              </div>
            </div>
            <el-empty v-else description="当前筛选条件下暂无高风险预警" :image-size="72" />
          </section>
        </div>
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
} from "../utils/workSaturationData";
import {
  SATURATION_BASIC_EXPORT_MODULES,
  SATURATION_PREDICTION_EXPORT_MODULES,
  exportSaturationModules,
} from "../utils/workSaturationExport";

const DEPT_COLORS = { bar: "#FAAD14", late: "#52C41A", early: "#EB2F96" };
const EMP_COLORS = { bar: "#1890FF", late: "#722ED1", early: "#69C0FF" };

export default {
  name: "BehaviorIntelligencePanel",
  props: {
    activeModule: {
      type: String,
      default: "model",
      validator: (v) => ["model", "saturation"].includes(v),
    },
  },
  data() {
    return {
      subTab: "basic",
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
      const parts = [this.snapshot.unitLabel, this.snapshot.periodLabel];
      if (this.linkedDepartment) parts.push(this.linkedDepartment);
      const tabLabel = this.subTab === "prediction" ? "预测分析" : "基本统计指标";
      parts.push(tabLabel);
      return parts.join(" · ");
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
    summaryItems() {
      const s = this.snapshot.summary;
      return [
        { key: "days", label: "平均出勤天数", value: s.avgDays, suffix: "天" },
        { key: "late", label: "平均迟到率", value: s.avgLateRate, suffix: "%", valueClass: "is-warning" },
        { key: "early", label: "平均早退率", value: s.avgEarlyRate, suffix: "%", valueClass: "is-info" },
        { key: "sat", label: "平均工作饱和度", value: s.avgSaturation, suffix: "%", valueClass: "is-primary" },
      ];
    },
  },
  watch: {
    subTab() {
      this.$nextTick(() => this.refreshVisibleCharts());
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
      const refs = { dept: "deptChart", emp: "empChart", trend: "trendChart" };
      Object.keys(refs).forEach((key) => {
        const el = this.$refs[refs[key]];
        if (el && !this.charts[key]) this.charts[key] = echarts.init(el);
      });
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

    renderTrendChart() {
      const chart = this.charts.trend;
      if (!chart) return;
      const p = this.snapshot.prediction;
      chart.setOption(
        baseChartOption({
          animation: false,
          tooltip: { trigger: "axis" },
          legend: legendBottomCenter(["实际饱和度", "预测饱和度"]),
          grid: { left: "2%", right: "3%", top: "10%", bottom: "14%", containLabel: true },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: p.months,
            axisLine: { lineStyle: { color: "#E8E8E8" } },
            axisTick: { show: false },
          },
          yAxis: {
            type: "value",
            min: 50,
            max: 100,
            interval: 10,
            axisLabel: { formatter: "{value}%", color: "#606266" },
            splitLine: { lineStyle: { color: "#F0F0F0" } },
          },
          series: [
            {
              name: "实际饱和度",
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { width: 2, color: "#1890FF" },
              itemStyle: { color: "#1890FF" },
              areaStyle: { color: "rgba(24,144,255,0.08)" },
              data: p.actualSaturation,
            },
            {
              name: "预测饱和度",
              type: "line",
              smooth: true,
              symbol: "circle",
              symbolSize: 6,
              lineStyle: { width: 2, type: "dashed", color: "#FA8C16" },
              itemStyle: { color: "#FA8C16" },
              data: p.predictedSaturation,
            },
          ],
        }),
        true
      );
    },

    renderAllCharts() {
      this.renderDeptChart();
      this.renderEmpChart();
      this.renderTrendChart();
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
      this.applyLinkage(false);
      this.$message.info("已重置查询条件");
    },

    saturationClass(val) {
      if (val >= 88) return "sat-high";
      if (val >= 75) return "sat-mid";
      return "sat-low";
    },

    riskTagType(level) {
      const map = { 高: "danger", 中: "warning", 低: "success" };
      return map[level] || "info";
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
      exportSaturationModules(this.selectedExportModules, this.snapshot);
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

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 14px 16px;
  background: linear-gradient(135deg, #f7f9fc 0%, #fff 100%);
  border: 1px solid #eef2f7;
  border-radius: 4px;
}

.summary-card__label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.summary-card__value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.summary-card__value.is-primary {
  color: #1890ff;
}

.summary-card__value.is-warning {
  color: #fa8c16;
}

.summary-card__value.is-info {
  color: #722ed1;
}

.summary-card__suffix {
  font-size: 13px;
  font-weight: 400;
  margin-left: 2px;
  color: #909399;
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

.prediction-kpi {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 16px;
  background: #fafbfc;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  text-align: center;
}

.kpi-card__label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.kpi-card__value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
}

.kpi-card__value.is-primary {
  color: #1890ff;
}

.kpi-card__value.is-success {
  color: #52c41a;
}

.kpi-card__value.is-danger {
  color: #f5222d;
}

.prediction-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 14px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.alert-item {
  padding: 10px 12px;
  border-radius: 4px;
  border-left: 3px solid #faad14;
  background: #fffbe6;
}

.alert-item.is-danger {
  border-left-color: #f5222d;
  background: #fff1f0;
}

.alert-item.is-warning {
  border-left-color: #fa8c16;
  background: #fff7e6;
}

.alert-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.alert-item__name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.alert-item__meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.alert-item__msg {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.sat-high {
  color: #f5222d;
  font-weight: 600;
}

.sat-mid {
  color: #fa8c16;
  font-weight: 600;
}

.sat-low {
  color: #52c41a;
  font-weight: 600;
}

.trend-up {
  color: #f5222d;
}

.trend-down {
  color: #52c41a;
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

@media (max-width: 1200px) {
  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .prediction-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .summary-strip,
  .prediction-kpi {
    grid-template-columns: 1fr;
  }

  .query-actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
