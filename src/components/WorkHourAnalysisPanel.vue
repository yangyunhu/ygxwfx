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
      <section class="stats-section">
        <el-form :inline="true" size="small" class="section-form section-form--stats">
          <el-form-item label="单位：">
            <el-select v-model="distQuery.unit" placeholder="请选择" style="width: 160px">
              <el-option
                v-for="opt in distUnitOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="专业：">
            <el-select v-model="distQuery.specialty" placeholder="请选择" style="width: 140px">
              <el-option
                v-for="opt in distSpecialtyOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" plain icon="el-icon-upload2" @click="handleDistExport">导出</el-button>
            <el-button type="primary" icon="el-icon-search" @click="handleDistQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetDistQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="stats-table-wrap">
          <el-table
            :data="pagedDistTableData"
            border
            stripe
            size="small"
            header-cell-class-name="stats-table-header"
          >
            <el-table-column type="index" label="序号" width="70" align="center" :index="distIndexMethod" />
            <el-table-column prop="unit" label="单位" min-width="130" show-overflow-tooltip />
            <el-table-column prop="specialty" label="专业" min-width="120" show-overflow-tooltip />
            <el-table-column prop="totalHours" label="工时总计" width="110" align="center" />
            <el-table-column prop="avgHours" label="工时平均值" width="110" align="center">
              <template slot-scope="scope">
                {{ formatStatNumber(scope.row.avgHours) }}
              </template>
            </el-table-column>
            <el-table-column prop="medianHours" label="工时中位数" width="110" align="center">
              <template slot-scope="scope">
                {{ formatStatNumber(scope.row.medianHours) }}
              </template>
            </el-table-column>
            <el-table-column prop="stdDev" label="工时标准差" width="110" align="center">
              <template slot-scope="scope">
                {{ formatStatNumber(scope.row.stdDev) }}
              </template>
            </el-table-column>
            <el-table-column prop="dispersion" label="离散度" width="100" align="center">
              <template slot-scope="scope">
                {{ formatStatNumber(scope.row.dispersion) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="stats-pagination">
          <el-pagination
            :current-page="distCurrentPage"
            :page-sizes="[10, 25, 50]"
            :page-size="distPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredDistTableData.length"
            @size-change="handleDistSizeChange"
            @current-change="handleDistPageChange"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption, legendTopCenter } from "../utils/chartTheme";
import { UNIT_OPTIONS } from "../utils/behaviorOverviewData";
import {
  SPECIALTY_OPTIONS,
  DEFAULT_HOUR_ANALYSIS_QUERY,
  DEFAULT_UNIT_DEPT_QUERY,
  DEFAULT_DISTRIBUTION_QUERY,
  DIST_STATS_UNIT_OPTIONS,
  DIST_STATS_SPECIALTY_OPTIONS,
  buildHourTypeByCity,
  buildSpecialtyHourDiff,
  generateSpecialtyStatsRows,
  filterSpecialtyStatsRows,
  unitLabel,
} from "../utils/workHourAnalysisData";
import { downloadTableWithLog } from "../utils/exportLogger";

const HOUR_TYPE_COLORS = {
  businessTrip: "#1890FF",
  training: "#FAAD14",
  attendance: "#13C2C2",
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
      distUnitOptions: DIST_STATS_UNIT_OPTIONS,
      distSpecialtyOptions: DIST_STATS_SPECIALTY_OPTIONS,
      typeQuery: { ...DEFAULT_HOUR_ANALYSIS_QUERY },
      unitDeptQuery: { ...DEFAULT_UNIT_DEPT_QUERY },
      distQuery: { ...DEFAULT_DISTRIBUTION_QUERY },
      distAllRows: generateSpecialtyStatsRows(),
      distCurrentPage: 1,
      distPageSize: 10,
      typeData: buildHourTypeByCity(DEFAULT_HOUR_ANALYSIS_QUERY),
      unitDeptData: buildSpecialtyHourDiff(DEFAULT_UNIT_DEPT_QUERY),
      charts: {},
      resizeHandler: null,
      resizeObserver: null,
    };
  },
  computed: {
    filteredDistTableData() {
      return filterSpecialtyStatsRows(this.distAllRows, this.distQuery);
    },
    pagedDistTableData() {
      const start = (this.distCurrentPage - 1) * this.distPageSize;
      return this.filteredDistTableData.slice(start, start + this.distPageSize);
    },
  },
  watch: {
    panelActive(val) {
      if (val && this.subTab === "analysis") this.ensureChartsReady();
    },
    subTab(val) {
      if (!this.panelActive) return;
      if (val === "analysis") this.ensureChartsReady();
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
        ["typeChart", "unitDeptChart"].forEach((refName) => {
          const el = this.$refs[refName];
          if (el) this.resizeObserver.observe(el);
        });
      });
    },
    initCharts(forceReinit = false) {
      const refs = {
        type: "typeChart",
        unitDept: "unitDeptChart",
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
    formatStatNumber(val) {
      if (val == null || val === "") return "-";
      return Number(val).toFixed(1).replace(/\.0$/, "");
    },
    distIndexMethod(index) {
      return (this.distCurrentPage - 1) * this.distPageSize + index + 1;
    },
    handleDistQuery() {
      this.distCurrentPage = 1;
    },
    resetDistQuery() {
      this.distQuery = { ...DEFAULT_DISTRIBUTION_QUERY };
      this.distCurrentPage = 1;
    },
    handleDistSizeChange(val) {
      this.distPageSize = val;
      this.distCurrentPage = 1;
    },
    handleDistPageChange(val) {
      this.distCurrentPage = val;
    },
    handleDistExport() {
      const source = this.filteredDistTableData;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      const headers = [
        "序号",
        "单位",
        "专业",
        "工时总计",
        "工时平均值",
        "工时中位数",
        "工时标准差",
        "离散度",
      ];
      const rows = source.map((row, idx) => [
        idx + 1,
        row.unit,
        row.specialty,
        row.totalHours,
        this.formatStatNumber(row.avgHours),
        this.formatStatNumber(row.medianHours),
        this.formatStatNumber(row.stdDev),
        this.formatStatNumber(row.dispersion),
      ]);
      downloadTableWithLog({
        headers,
        rows,
        format: "csv",
        baseFilename: "工时与专业统计分布",
        meta: {
          moduleCode: "hour_specialty_stats",
          moduleName: "工时与专业的统计分布",
          moduleGroup: "员工工作饱和度分析",
          searchCriteria: {
            unit: unitLabel(this.distQuery.unit),
            specialty: this.distQuery.specialty === "all" ? "全部专业" : this.distQuery.specialty,
          },
        },
      });
      this.$message.success(`已导出 ${rows.length} 条记录`);
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
    renderAllCharts() {
      this.renderTypeChart();
      this.renderUnitDeptChart();
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

.stats-section {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px 16px 16px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.section-form--stats {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.stats-table-wrap {
  width: 100%;
  min-width: 0;
}

.stats-section >>> .stats-table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.stats-pagination {
  margin-top: 14px;
  text-align: right;
}

@media (max-width: 768px) {
  .section-form__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
