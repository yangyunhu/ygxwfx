<template>
  <div class="work-hour-analysis">
    <el-tabs v-model="subTab" class="sub-tabs">
      <el-tab-pane label="工时分析" name="analysis" />
      <el-tab-pane label="工时与专业的统计分布" name="distribution" />
    </el-tabs>

    <div v-show="subTab === 'analysis'" class="sub-tab-body">
      <section class="chart-section chart-section--flat">
        <el-form :inline="true" size="small" class="section-form section-form--compact">
          <el-form-item label="时间范围：">
            <el-date-picker v-model="dashboardQuery.startDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
            <span class="date-sep">~</span>
            <el-date-picker v-model="dashboardQuery.endDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleDashboardQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetDashboardQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </section>

      <div class="kpi-row kpi-row--3">
        <div v-for="item in kpiItems" :key="item.key" class="kpi-card">
          <div class="kpi-card__value">
            {{ item.value }}<span v-if="item.suffix" class="kpi-card__unit">{{ item.suffix }}</span>
          </div>
          <div class="kpi-card__label">{{ item.label }}</div>
          <div v-if="item.desc" class="kpi-card__desc">{{ item.desc }}</div>
        </div>
      </div>

      <section class="chart-section">
        <h3 class="section-title"><span class="section-dot" />各地市平均工时对比</h3>
        <div ref="cityAvgChart" class="chart-box" />
      </section>

      <section class="chart-section">
        <div class="section-header-row">
          <h3 class="section-title section-title--plain">各单位累计工时&amp;培训工时分布情况</h3>
          <div class="section-header__controls">
            <span class="control-label">专业分类：</span>
            <el-cascader
              v-model="hoursDistProfessionalPath"
              :options="professionalCategoryOptions"
              :props="professionalCascaderProps"
              size="small"
              clearable
              filterable
              placeholder="选择专业分类"
              class="filter-cascader--professional"
              @change="handleHoursDistProfessionalChange"
            />
          </div>
        </div>
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="时间：">
            <el-date-picker v-model="hoursDistQuery.startDate" type="date" placeholder="开始日期" value-format="yyyy-MM-dd" style="width: 140px" />
            <span class="date-sep">~</span>
            <el-date-picker v-model="hoursDistQuery.endDate" type="date" placeholder="结束日期" value-format="yyyy-MM-dd" style="width: 140px" />
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleHoursDistQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetHoursDistQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div ref="unitHoursDistChart" class="chart-box" />
      </section>

      <div class="chart-grid-2">
        <section class="chart-section">
          <div class="section-header-row">
            <h3 class="section-title section-title--plain">专业与作业工时相关性</h3>
            <el-button type="primary" size="small" plain icon="el-icon-download" @click="handleSpecialtyCorrExport">导出明细</el-button>
          </div>
          <el-form :inline="true" size="small" class="section-form">
            <el-form-item label="专业：">
              <el-select v-model="specialtyCorrQuery.specialty" placeholder="请选择" style="width: 120px">
                <el-option v-for="opt in specialtyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间：">
              <el-date-picker v-model="specialtyCorrQuery.startDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
              <span class="date-sep">~</span>
              <el-date-picker v-model="specialtyCorrQuery.endDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
            </el-form-item>
            <el-form-item class="section-form__actions">
              <el-button type="primary" icon="el-icon-search" @click="handleSpecialtyCorrQuery">查询</el-button>
              <el-button icon="el-icon-refresh" @click="resetSpecialtyCorrQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div ref="specialtyCorrChart" class="chart-box chart-box--radar" />
        </section>
        <section class="chart-section">
          <h3 class="section-title"><span class="section-dot" />技能类全量岗位序列累计工时</h3>
          <div ref="cumulativeRadarChart" class="chart-box chart-box--radar-skill" />
        </section>
      </div>

      <section class="chart-section">
        <h3 class="section-title"><span class="section-dot" />岗位分类与工时相关性</h3>
        <div ref="postCategoryChart" class="chart-box" />
      </section>

      <section class="chart-section">
        <h3 class="section-title"><span class="section-dot" />岗位分类工时趋势</h3>
        <div class="trend-chart-grid">
          <div class="trend-chart-item">
            <p class="chart-subtitle"><span class="chart-subtitle__dot chart-subtitle__dot--skill" />技能类</p>
            <div ref="trendSkillChart" class="chart-box chart-box--trend" />
          </div>
          <div class="trend-chart-item">
            <p class="chart-subtitle"><span class="chart-subtitle__dot chart-subtitle__dot--prof" />专业技术类</p>
            <div ref="trendProfChart" class="chart-box chart-box--trend" />
          </div>
          <div class="trend-chart-item trend-chart-item--wide">
            <p class="chart-subtitle"><span class="chart-subtitle__dot chart-subtitle__dot--mgmt" />管理类</p>
            <div ref="trendMgmtChart" class="chart-box chart-box--trend chart-box--trend-wide" />
          </div>
        </div>
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
import { baseChartOption, legendTopCenter, legendBottomCenter, withAlpha, PROTOTYPE_COLORS } from "../utils/chartTheme";
import { UNIT_OPTIONS } from "../utils/behaviorOverviewData";
import {
  SPECIALTY_OPTIONS,
  DEFAULT_UNIT_HOURS_DIST_QUERY,
  DEFAULT_DISTRIBUTION_QUERY,
  DIST_STATS_UNIT_OPTIONS,
  DIST_STATS_SPECIALTY_OPTIONS,
  buildSpecialtyWorkCorrelation,
  generateSpecialtyStatsRows,
  filterSpecialtyStatsRows,
  unitLabel,
  specialtyLabel,
  SPECIALTY_RADAR_INDICATORS,
  DEFAULT_SPECIALTY_CORR_QUERY,
} from "../utils/workHourAnalysisData";
import {
  DEFAULT_DASHBOARD_QUERY,
  buildHourAnalysisKpi,
  buildCityAvgHoursChart,
  buildCumulativeSpecialtyRadar,
  buildPostCategoryBarChart,
  buildPostCategoryTrendCharts,
} from "../utils/workHourAnalysisDashboardData";
import { buildWorkHoursDistributionData } from "../utils/unitAttendanceComparisonData";
import {
  professionalToCascaderOptions,
  DEFAULT_PROFESSIONAL_PATH,
} from "../utils/professionalClassification";
import { downloadTableWithLog } from "../utils/exportLogger";

const TREND_CHART_THEMES = {
  skill: { names: ["变电", "配电"], colors: ["#1890FF", "#13C2C2"] },
  professional: { names: ["营销", "方式"], colors: ["#FA8C16", "#597EF7"] },
  management: { names: ["人资", "党群"], colors: ["#52C41A", "#9254DE"] },
};

function hexToRgba(hex, alpha) {
  const h = (hex || "").replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildTrendSeries(name, data, color) {
  return {
    name,
    type: "line",
    smooth: 0.38,
    connectNulls: true,
    symbol: "circle",
    symbolSize: 7,
    showSymbol: false,
    lineStyle: {
      width: 2.5,
      color,
      shadowColor: hexToRgba(color, 0.25),
      shadowBlur: 8,
      shadowOffsetY: 4,
    },
    itemStyle: { color, borderColor: "#fff", borderWidth: 2 },
    emphasis: {
      focus: "series",
      scale: true,
      showSymbol: true,
      itemStyle: { shadowBlur: 10, shadowColor: hexToRgba(color, 0.35) },
    },
    areaStyle: {
      color: {
        type: "linear",
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: hexToRgba(color, 0.28) },
          { offset: 1, color: hexToRgba(color, 0.03) },
        ],
      },
    },
    data,
  };
}

function calcTrendYAxis(seriesA, seriesB) {
  const all = [...seriesA, ...seriesB].filter((v) => v != null);
  const minVal = Math.min(...all);
  const maxVal = Math.max(...all);
  const yMin = Math.max(0, Math.floor((minVal - 25) / 20) * 20);
  const yMax = Math.ceil((maxVal + 20) / 20) * 20;
  const span = yMax - yMin;
  const interval = span <= 80 ? 20 : span <= 160 ? 40 : 50;
  return { min: yMin, max: yMax, interval };
}

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
      dashboardQuery: { ...DEFAULT_DASHBOARD_QUERY },
      dashboardKpi: buildHourAnalysisKpi(DEFAULT_DASHBOARD_QUERY),
      cityAvgData: buildCityAvgHoursChart(DEFAULT_DASHBOARD_QUERY),
      cumulativeRadarData: buildCumulativeSpecialtyRadar(DEFAULT_DASHBOARD_QUERY),
      postCategoryData: buildPostCategoryBarChart(DEFAULT_DASHBOARD_QUERY),
      postTrendData: buildPostCategoryTrendCharts(DEFAULT_DASHBOARD_QUERY),
      specialtyCorrQuery: { ...DEFAULT_SPECIALTY_CORR_QUERY },
      hoursDistQuery: { ...DEFAULT_UNIT_HOURS_DIST_QUERY },
      hoursDistProfessionalPath: [...DEFAULT_PROFESSIONAL_PATH],
      professionalCascaderProps: { checkStrictly: true, expandTrigger: "hover" },
      distQuery: { ...DEFAULT_DISTRIBUTION_QUERY },
      distAllRows: generateSpecialtyStatsRows(),
      distCurrentPage: 1,
      distPageSize: 10,
      specialtyCorrData: buildSpecialtyWorkCorrelation(DEFAULT_SPECIALTY_CORR_QUERY),
      hoursDistData: buildWorkHoursDistributionData(
        DEFAULT_UNIT_HOURS_DIST_QUERY,
        DEFAULT_PROFESSIONAL_PATH
      ),
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
    professionalCategoryOptions() {
      return professionalToCascaderOptions();
    },
    kpiItems() {
      const k = this.dashboardKpi;
      return [
        { key: "attendance", label: "出勤工时", value: k.attendanceHours, suffix: "h", desc: "人均日出勤工时" },
        { key: "total", label: "出勤总工时", value: k.totalAttendanceHoursDisplay, suffix: "h", desc: "统计区间累计" },
        { key: "saturation", label: "饱和工时", value: k.saturationHoursDisplay, suffix: "h", desc: "饱和标准累计" },
      ];
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
        [
          "cityAvgChart",
          "unitHoursDistChart",
          "specialtyCorrChart",
          "cumulativeRadarChart",
          "postCategoryChart",
          "trendSkillChart",
          "trendProfChart",
          "trendMgmtChart",
        ].forEach((refName) => {
          const el = this.$refs[refName];
          if (el) this.resizeObserver.observe(el);
        });
      });
    },
    initCharts(forceReinit = false) {
      const refs = {
        cityAvg: "cityAvgChart",
        unitHoursDist: "unitHoursDistChart",
        specialtyCorr: "specialtyCorrChart",
        cumulativeRadar: "cumulativeRadarChart",
        postCategory: "postCategoryChart",
        trendSkill: "trendSkillChart",
        trendProf: "trendProfChart",
        trendMgmt: "trendMgmtChart",
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
    refreshDashboardData() {
      this.dashboardKpi = buildHourAnalysisKpi(this.dashboardQuery);
      this.cityAvgData = buildCityAvgHoursChart(this.dashboardQuery);
      this.cumulativeRadarData = buildCumulativeSpecialtyRadar(this.dashboardQuery);
      this.postCategoryData = buildPostCategoryBarChart(this.dashboardQuery);
      this.postTrendData = buildPostCategoryTrendCharts(this.dashboardQuery);
    },
    handleDashboardQuery() {
      this.refreshDashboardData();
      this.renderDashboardCharts();
    },
    resetDashboardQuery() {
      this.dashboardQuery = { ...DEFAULT_DASHBOARD_QUERY };
      this.refreshDashboardData();
      this.renderDashboardCharts();
    },
    refreshHoursDistData() {
      this.hoursDistData = buildWorkHoursDistributionData(
        this.hoursDistQuery,
        this.hoursDistProfessionalPath
      );
    },
    refreshSpecialtyCorrData() {
      this.specialtyCorrData = buildSpecialtyWorkCorrelation(this.specialtyCorrQuery);
    },
    handleSpecialtyCorrQuery() {
      this.refreshSpecialtyCorrData();
      this.renderSpecialtyCorrChart();
    },
    resetSpecialtyCorrQuery() {
      this.specialtyCorrQuery = { ...DEFAULT_SPECIALTY_CORR_QUERY };
      this.refreshSpecialtyCorrData();
      this.renderSpecialtyCorrChart();
    },
    handleSpecialtyCorrExport() {
      const sp = this.specialtyCorrData;
      const headers = ["序号", "专业维度", "作业工时(h)", "出勤工时(h)", "筛选专业", "时间范围"];
      const period = `${this.specialtyCorrQuery.startDate} ~ ${this.specialtyCorrQuery.endDate}`;
      const specLabel = specialtyLabel(this.specialtyCorrQuery.specialty);
      const rows = SPECIALTY_RADAR_INDICATORS.map((ind, i) => [
        i + 1,
        ind.name,
        sp.work[i],
        sp.attend[i],
        specLabel,
        period,
      ]);
      downloadTableWithLog({
        headers,
        rows,
        format: "csv",
        baseFilename: "专业与作业工时相关性",
        meta: {
          moduleCode: "hour_specialty_correlation",
          moduleName: "专业与作业工时相关性",
          moduleGroup: "员工工作饱和度分析",
          searchCriteria: { specialty: specLabel, period },
        },
      });
      this.$message.success(`已导出 ${rows.length} 条记录`);
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
    handleHoursDistQuery() {
      this.refreshHoursDistData();
      this.renderUnitHoursDistChart();
    },
    resetHoursDistQuery() {
      this.hoursDistQuery = { ...DEFAULT_UNIT_HOURS_DIST_QUERY };
      this.hoursDistProfessionalPath = [...DEFAULT_PROFESSIONAL_PATH];
      this.refreshHoursDistData();
      this.renderUnitHoursDistChart();
    },
    handleHoursDistProfessionalChange() {
      this.refreshHoursDistData();
      this.renderUnitHoursDistChart();
    },
    renderAllCharts() {
      this.renderDashboardCharts();
      this.renderUnitHoursDistChart();
      this.renderSpecialtyCorrChart();
    },
    renderDashboardCharts() {
      this.renderCityAvgChart();
      this.renderCumulativeRadarChart();
      this.renderPostCategoryChart();
      this.renderPostTrendCharts();
    },
    renderCityAvgChart() {
      const chart = this.charts.cityAvg;
      if (!chart) return;
      const { categories, values, provincialAvg } = this.cityAvgData;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: legendTopCenter(["平均工时", "全省平均工时"]),
          grid: { left: "2%", right: "3%", top: "14%", bottom: "16%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: 35, fontSize: 11 },
          },
          yAxis: { type: "value", min: 0, max: 220, interval: 40 },
          series: [
            {
              name: "平均工时",
              type: "bar",
              barMaxWidth: 28,
              itemStyle: { color: "#1890FF", borderRadius: [3, 3, 0, 0] },
              data: values,
            },
            {
              name: "全省平均工时",
              type: "line",
              symbol: "none",
              lineStyle: { type: "dashed", color: "#FA8C16", width: 2 },
              markLine: {
                silent: true,
                symbol: "none",
                lineStyle: { color: "#FA8C16", type: "dashed" },
                label: { formatter: `全省平均 ${provincialAvg}h`, color: "#FA8C16" },
                data: [{ yAxis: provincialAvg }],
              },
              data: [],
            },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderCumulativeRadarChart() {
      const chart = this.charts.cumulativeRadar;
      if (!chart) return;
      const { dims, labels, values } = this.cumulativeRadarData;
      const maxVal = Math.max(...values, 80);
      chart.setOption(
        baseChartOption({
          tooltip: {
            trigger: "item",
            formatter: (p) => {
              const idx = labels.indexOf(p.name);
              const fullName = idx >= 0 ? dims[idx] : p.name;
              return `${fullName}<br/>累计工时：<strong>${p.value} h</strong>`;
            },
          },
          legend: legendBottomCenter(["累计工时"]),
          radar: {
            indicator: labels.map((name) => ({ name, max: maxVal + 12 })),
            radius: "58%",
            center: ["50%", "48%"],
            startAngle: 90,
            splitNumber: 4,
            axisName: { color: "#606266", fontSize: 9, lineHeight: 13 },
            splitArea: { areaStyle: { color: ["#fff", "#FAFAFA"] } },
            axisLine: { lineStyle: { color: "#E8E8E8" } },
            splitLine: { lineStyle: { color: "#F0F0F0" } },
          },
          series: [{
            type: "radar",
            symbol: "circle",
            symbolSize: 4,
            data: [{
              value: values,
              name: "累计工时",
              lineStyle: { color: "#1890FF", width: 2 },
              itemStyle: { color: "#1890FF", borderColor: "#fff", borderWidth: 1 },
              areaStyle: { color: withAlpha("#1890FF", 0.22) },
            }],
          }],
        }),
        true
      );
      chart.resize();
    },
    renderPostCategoryChart() {
      const chart = this.charts.postCategory;
      if (!chart) return;
      const { categories, management, professional, skill } = this.postCategoryData;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: legendTopCenter(["管理类", "专业技术类", "技能类"]),
          grid: { left: "2%", right: "2%", top: "14%", bottom: "16%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            axisLabel: { interval: 0, rotate: 35, fontSize: 10 },
          },
          yAxis: { type: "value", min: 0, max: 240, interval: 40 },
          series: [
            { name: "管理类", type: "bar", barMaxWidth: 12, itemStyle: { color: "#1890FF" }, data: management },
            { name: "专业技术类", type: "bar", barMaxWidth: 12, itemStyle: { color: "#52C41A" }, data: professional },
            { name: "技能类", type: "bar", barMaxWidth: 12, itemStyle: { color: "#FAAD14" }, data: skill },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderPostTrendCharts() {
      this.renderSingleTrendChart("trendSkill", "skill");
      this.renderSingleTrendChart("trendProf", "professional");
      this.renderSingleTrendChart("trendMgmt", "management");
    },
    renderSingleTrendChart(chartKey, dataKey) {
      const chart = this.charts[chartKey];
      if (!chart) return;
      const theme = TREND_CHART_THEMES[dataKey];
      const { categories } = this.postTrendData;
      const pair = this.postTrendData[dataKey];
      const yAxis = calcTrendYAxis(pair.seriesA, pair.seriesB);

      chart.setOption(
        baseChartOption({
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "line",
              lineStyle: { color: "#D9D9D9", type: "dashed" },
            },
            formatter: (params) => {
              const title = params[0]?.axisValue || "";
              const rows = params
                .map(
                  (p) =>
                    `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:4px">
                      <span>${p.marker}${p.seriesName}</span>
                      <strong style="color:#303133">${p.value} h</strong>
                    </div>`
                )
                .join("");
              return `<div style="font-weight:600;color:#303133;margin-bottom:2px">${title}</div>${rows}`;
            },
          },
          legend: {
            ...legendBottomCenter(theme.names),
            icon: "roundRect",
            itemWidth: 16,
            itemHeight: 4,
            itemGap: 24,
          },
          grid: { left: "3%", right: "3%", top: "12%", bottom: "16%", containLabel: true },
          xAxis: {
            type: "category",
            boundaryGap: false,
            data: categories,
            axisLine: { lineStyle: { color: "#E8E8E8" } },
            axisTick: { show: false },
            axisLabel: { interval: 0, rotate: 35, fontSize: 10, color: "#606266", hideOverlap: true },
          },
          yAxis: {
            type: "value",
            min: yAxis.min,
            max: yAxis.max,
            interval: yAxis.interval,
            name: "工时(h)",
            nameTextStyle: { color: "#909399", fontSize: 11, padding: [0, 0, 0, -8] },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#909399", fontSize: 10 },
            splitLine: { lineStyle: { color: "#F0F2F5", type: "dashed" } },
          },
          series: [
            buildTrendSeries(theme.names[0], pair.seriesA, theme.colors[0]),
            buildTrendSeries(theme.names[1], pair.seriesB, theme.colors[1]),
          ],
        }),
        true
      );
      chart.resize();
    },
    renderUnitHoursDistChart() {
      const chart = this.charts.unitHoursDist;
      if (!chart) return;
      const { categories, workHours, trainingHours } = this.hoursDistData;

      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: { data: ["累计工时", "培训工时"], top: 0, left: "center" },
          grid: { left: "2%", right: "2%", top: "14%", bottom: "12%", containLabel: true },
          xAxis: {
            type: "category",
            data: categories,
            boundaryGap: false,
            axisLabel: { interval: 0, rotate: 35, fontSize: 11 },
          },
          yAxis: { type: "value", min: 0 },
          series: [
            {
              name: "累计工时",
              type: "line",
              smooth: false,
              symbol: "none",
              lineStyle: { width: 0 },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(245, 34, 45, 0.55)" },
                    { offset: 1, color: "rgba(245, 34, 45, 0.08)" },
                  ],
                },
              },
              itemStyle: { color: "#F5222D" },
              label: { show: true, position: "top", fontSize: 10, color: "#F5222D" },
              data: workHours,
            },
            {
              name: "培训工时",
              type: "line",
              smooth: false,
              symbol: "none",
              lineStyle: { width: 0 },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(250, 173, 20, 0.6)" },
                    { offset: 1, color: "rgba(250, 173, 20, 0.05)" },
                  ],
                },
              },
              itemStyle: { color: "#FAAD14" },
              label: { show: true, position: "top", fontSize: 10, color: "#FAAD14" },
              data: trainingHours,
            },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderSpecialtyCorrChart() {
      const chart = this.charts.specialtyCorr;
      if (!chart) return;
      const sp = this.specialtyCorrData;
      const maxVal = Math.max(...sp.work, ...sp.attend, 120);
      const indicators = SPECIALTY_RADAR_INDICATORS.map((ind) => ({
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

.section-title--plain {
  margin: 0;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.section-header__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.filter-cascader--professional {
  width: 320px;
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

.chart-section--flat {
  padding-bottom: 4px;
  box-shadow: none;
}

.section-form--compact {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

.kpi-row--3 {
  grid-template-columns: repeat(3, 1fr);
}

.kpi-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.kpi-card__value {
  font-size: 26px;
  font-weight: 600;
  color: #1890ff;
  line-height: 1.2;
}

.kpi-card__unit {
  font-size: 14px;
  font-weight: 500;
  margin-left: 2px;
}

.kpi-card__label {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.kpi-card__desc {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.chart-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  width: 100%;
  min-width: 0;
}

.trend-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.trend-chart-item {
  min-width: 0;
  padding: 12px 14px 6px;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 55%);
  border: 1px solid #eef2f7;
  border-radius: 6px;
}

.trend-chart-item:last-child {
  grid-column: 1 / -1;
}

.trend-chart-item--wide {
  padding-bottom: 10px;
}

.chart-subtitle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  text-align: left;
}

.chart-subtitle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chart-subtitle__dot--skill {
  background: linear-gradient(135deg, #1890ff, #13c2c2);
}

.chart-subtitle__dot--prof {
  background: linear-gradient(135deg, #fa8c16, #597ef7);
}

.chart-subtitle__dot--mgmt {
  background: linear-gradient(135deg, #52c41a, #9254de);
}

.chart-box--trend {
  height: 268px;
}

.chart-box--trend-wide {
  height: 288px;
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

.chart-box--sm {
  height: 240px;
}

.chart-box--radar {
  height: 340px;
}

.chart-box--radar-skill {
  height: 400px;
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

@media (max-width: 1200px) {
  .kpi-row,
  .kpi-row--3 {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-grid-2 {
    grid-template-columns: 1fr;
  }

  .trend-chart-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .section-form__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
