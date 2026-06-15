<template>
  <div class="warning-overview">
    <!-- 查询栏 -->
    <section class="query-panel">
      <el-form :inline="true" size="small" class="query-form">
        <el-form-item label="日期范围：">
          <el-date-picker
            v-model="warningQuery.startDate"
            type="date"
            placeholder="起始日期"
            value-format="yyyy-MM-dd"
            style="width: 140px"
          />
          <span class="date-sep">-</span>
          <el-date-picker
            v-model="warningQuery.endDate"
            type="date"
            placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="单位：">
          <el-select v-model="warningQuery.unit" placeholder="请选择" style="width: 180px">
            <el-option
              v-for="opt in unitOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <!-- 地图 + TOP5：左大地图（中心）+ 右侧预警排名 -->
    <section class="chart-card chart-card--hero" :class="{ 'is-county': mapDrill.level === 'county' }">
      <div class="chart-card__header chart-card__header--map">
        <div class="map-toolbar">
          <div class="map-toolbar__primary">
            <h3 class="chart-card__title">各单位出勤数据横向对比</h3>
            <div class="map-breadcrumb">
              <span
                class="map-crumb"
                :class="{ 'is-link': mapDrill.level === 'county' }"
                @click="mapDrill.level === 'county' && drillToProvince()"
              >
                云南省
              </span>
              <template v-if="mapDrill.level === 'county'">
                <i class="el-icon-arrow-right map-crumb-sep" />
                <span class="map-crumb is-active">{{ mapDrill.unitName }}</span>
              </template>
            </div>
          </div>
          <el-radio-group
            v-model="mapMetric"
            size="mini"
            class="map-metric-tabs"
            @change="handleMapMetricChange"
          >
            <el-radio-button v-for="m in mapMetrics" :key="m.key" :label="m.key">
              {{ m.label }}
            </el-radio-button>
          </el-radio-group>
          <el-button
            type="success"
            size="mini"
            plain
            icon="el-icon-download"
            class="map-toolbar-export"
            @click="openExportDialog"
          >
            导出
          </el-button>
          <div class="map-legend map-legend--inline">
            <div v-for="item in mapLevels" :key="item.label" class="map-legend__item">
              <span class="map-legend__color" :style="{ background: item.color }" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
        <div class="map-meta">
          <span v-if="mapDrill.level === 'province'" class="map-drill-tip">
            点击地市下钻县区，联动右侧统计
          </span>
          <span v-else class="map-drill-tip">点击县区筛选明细</span>
          <span v-if="linkFilterLabel" class="map-link-tag">
            {{ linkFilterLabel }}
            <i class="el-icon-close map-link-clear" @click="clearRegionLink" />
          </span>
        </div>
      </div>

      <div class="warning-hero-grid">
        <div class="warning-hero-main">
          <div class="map-chart-wrap">
            <div ref="mapChart" v-loading="mapLoading" class="map-chart" />
          </div>

          <div class="hero-abnormal">
            <div class="hero-abnormal__header">
              <h4 class="hero-abnormal__title">
                异常变化情况
                <span v-if="linkFilterLabel" class="section-filter-tip">（{{ linkFilterLabel }}）</span>
              </h4>
              <el-radio-group v-model="changeMode" size="mini" @change="handleChangeMode">
                <el-radio-button label="unit">单位</el-radio-button>
                <el-radio-button label="department">部门</el-radio-button>
              </el-radio-group>
            </div>
            <div ref="abnormalChangeChart" class="hero-abnormal__chart" />
          </div>
        </div>

        <aside class="warning-top5-side">
          <section class="top5-panel" :class="{ 'is-linked': mapMetric === 'late' }">
            <div class="top5-panel__header">
              <h4 class="top5-panel__title">
                迟到预警 TOP5
                <span v-if="mapMetric === 'late'" class="linked-badge">联动</span>
              </h4>
            </div>
            <div ref="lateTopChart" class="top5-chart" />
            <div class="top5-table-wrap">
              <el-table :data="warningSnapshot.lateTop5" border size="mini" class="top5-table">
                <el-table-column prop="rank" label="排名" width="42" align="center" />
                <el-table-column prop="unitShort" :label="top5RegionLabel" min-width="52" show-overflow-tooltip />
                <el-table-column prop="department" label="部门" min-width="52" show-overflow-tooltip />
                <el-table-column prop="count" label="迟到" width="46" align="center" />
                <el-table-column prop="status" label="状态" min-width="62" align="center">
                  <template slot-scope="{ row }">
                    <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </section>

          <section class="top5-panel" :class="{ 'is-linked': mapMetric === 'early' }">
            <div class="top5-panel__header">
              <h4 class="top5-panel__title">
                早退预警 TOP5
                <span v-if="mapMetric === 'early'" class="linked-badge">联动</span>
              </h4>
            </div>
            <div ref="earlyTopChart" class="top5-chart" />
            <div class="top5-table-wrap">
              <el-table :data="warningSnapshot.earlyTop5" border size="mini" class="top5-table">
                <el-table-column prop="rank" label="排名" width="42" align="center" />
                <el-table-column prop="unitShort" :label="top5RegionLabel" min-width="52" show-overflow-tooltip />
                <el-table-column prop="department" label="部门" min-width="52" show-overflow-tooltip />
                <el-table-column prop="count" label="早退" width="46" align="center" />
                <el-table-column prop="status" label="状态" min-width="62" align="center">
                  <template slot-scope="{ row }">
                    <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </section>

          <section class="top5-panel" :class="{ 'is-linked': mapMetric === 'longAbsent' }">
            <div class="top5-panel__header">
              <h4 class="top5-panel__title">
                长期不在岗 TOP5
                <span v-if="mapMetric === 'longAbsent'" class="linked-badge">联动</span>
              </h4>
            </div>
            <div ref="longAbsentTopChart" class="top5-chart" />
            <div class="top5-table-wrap">
              <el-table :data="warningSnapshot.longAbsentTop5" border size="mini" class="top5-table">
                <el-table-column prop="rank" label="排名" width="42" align="center" />
                <el-table-column prop="unitShort" :label="top5RegionLabel" min-width="52" show-overflow-tooltip />
                <el-table-column prop="department" label="部门" min-width="52" show-overflow-tooltip />
                <el-table-column prop="count" label="不在岗" width="50" align="center" />
                <el-table-column prop="status" label="状态" min-width="62" align="center">
                  <template slot-scope="{ row }">
                    <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </section>
        </aside>
      </div>
    </section>

    <!-- 全省异常预警明细 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">
          全省异常预警明细
          <span class="section-filter-tip">（{{ currentMapMetric.abnormalType }} · {{ linkFilterLabel || "全省" }}）</span>
        </h3>
      </div>
      <el-table :data="pagedDetailTable" border stripe size="small" class="detail-table">
        <el-table-column type="index" :index="detailIndex" label="序号" width="60" align="center" />
        <el-table-column prop="unit" label="单位" min-width="120" show-overflow-tooltip />
        <el-table-column prop="county" label="县区" width="80" align="center" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" min-width="100" show-overflow-tooltip />
        <el-table-column prop="position" label="岗位" min-width="100" show-overflow-tooltip />
        <el-table-column prop="name" label="姓名" width="80" align="center" />
        <el-table-column prop="abnormalType" label="异常类型" width="120" align="center" />
        <el-table-column prop="times" label="次数" width="70" align="center" />
        <el-table-column prop="status" label="预警状态" width="100" align="center">
          <template slot-scope="{ row }">
            <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="detail-pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :total="warningSnapshot.detailTable.length"
          :page-size="detailPageSize"
          :current-page="detailPage"
          :page-sizes="[10, 20, 50]"
          @size-change="handleDetailSizeChange"
          @current-change="handleDetailPageChange"
        />
      </div>
    </section>

    <!-- 统计模块导出 -->
    <el-dialog
      title="导出异常预警明细"
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
        <div v-for="mod in exportModules" :key="mod.key" class="export-module-item">
          <el-checkbox :label="mod.key">{{ mod.label }}</el-checkbox>
          <span class="export-module-desc">{{ mod.desc }}</span>
        </div>
      </el-checkbox-group>
      <div slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          icon="el-icon-download"
          :disabled="!selectedExportCount"
          @click="confirmExportModules"
        >
          确认导出
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { UNIT_OPTIONS } from "../utils/behaviorOverviewData";
import {
  DEFAULT_WARNING_QUERY,
  MAP_METRICS,
  getMapMetricMeta,
  buildWarningSnapshot,
  ABNORMAL_CHANGE_COLORS,
} from "../utils/warningOverviewData";
import {
  exportWarningModules,
  WARNING_EXPORT_MODULES,
} from "../utils/warningOverviewExport";
import {
  getMapMetricConfig,
  fillMapSeriesData,
  registerYunnanMap,
} from "../utils/yunnanGeo";
import {
  resolveUnitKeyByRegionName,
  loadCountyMap,
  buildCountyMapData,
  getUnitMetaByKey,
} from "../utils/yunnanDrilldown";
export default {
  name: "WarningOverviewPanel",
  props: {
    active: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      unitOptions: UNIT_OPTIONS,
      warningQuery: { ...DEFAULT_WARNING_QUERY },
      changeMode: "unit",
      mapMetric: "late",
      mapMetrics: MAP_METRICS,
      linkContext: {
        unitKey: null,
        regionName: null,
        countyName: null,
      },
      selectedMapRegion: null,
      warningSnapshot: buildWarningSnapshot(DEFAULT_WARNING_QUERY, "unit", { mapMetric: "late" }),
      mapLevels: getMapMetricConfig("late").levels,
      mapDrill: {
        level: "province",
        unitKey: null,
        unitName: "",
        mapName: "yunnan",
        mapData: [],
        counties: [],
        parentValues: {},
      },
      mapLoading: false,
      mapClickBound: false,
      charts: {},
      detailPage: 1,
      detailPageSize: 10,
      inited: false,
      mapResizeObserver: null,
      mapResizeTimer: null,
      sidebarResizeTimer: null,
      lastMapLayoutKey: "",
      lastMapBoxSize: "",
      topChartSignatures: {},
      windowResizeHandler: null,
      exportDialogVisible: false,
      exportModules: WARNING_EXPORT_MODULES,
      selectedExportModules: [],
      exportCheckAll: false,
      exportIndeterminate: false,
    };
  },
  computed: {
    currentMapMetric() {
      return getMapMetricMeta(this.mapMetric);
    },
    linkFilterLabel() {
      const parts = [];
      if (this.linkContext.regionName) parts.push(this.linkContext.regionName);
      if (this.linkContext.countyName) parts.push(this.linkContext.countyName);
      return parts.length ? parts.join(" · ") : "";
    },
    top5RegionLabel() {
      return this.mapDrill.level === "county" ? "县区" : "单位";
    },
    pagedDetailTable() {
      const start = (this.detailPage - 1) * this.detailPageSize;
      return this.warningSnapshot.detailTable.slice(start, start + this.detailPageSize);
    },
    selectedExportCount() {
      return this.selectedExportModules.length;
    },
  },
  watch: {
    active(val) {
      if (val) {
        this.$nextTick(() => {
          if (!this.inited) {
            this.initCharts();
          } else {
            this.scheduleMapContainerResize();
          }
        });
      }
    },
  },
  mounted() {
    this.windowResizeHandler = () => {
      if (this.inited) {
        this.scheduleMapContainerResize();
        this.scheduleSidebarResize();
      }
    };
    window.addEventListener("resize", this.windowResizeHandler);
    if (this.active) {
      this.$nextTick(() => this.initCharts());
    }
  },
  beforeDestroy() {
    if (this.mapResizeObserver) this.mapResizeObserver.disconnect();
    if (this.mapResizeTimer) clearTimeout(this.mapResizeTimer);
    if (this.sidebarResizeTimer) clearTimeout(this.sidebarResizeTimer);
    if (this.windowResizeHandler) {
      window.removeEventListener("resize", this.windowResizeHandler);
    }
    Object.values(this.charts).forEach((c) => c && c.dispose());
  },
  methods: {
    statusClass(status) {
      const map = {
        预警中: "is-danger",
        处理中: "is-warning",
        已处理: "is-primary",
        提醒: "is-info",
      };
      return map[status] || "";
    },

    rebuildSnapshot() {
      this.warningSnapshot = buildWarningSnapshot(this.warningQuery, this.changeMode, {
        mapMetric: this.mapMetric,
        drillLevel: this.mapDrill.level,
        ...this.linkContext,
        countyList: this.mapDrill.counties || [],
        parentValues: this.mapDrill.parentValues || {},
      });
    },

    getLinkContextPayload() {
      return {
        mapMetric: this.mapMetric,
        ...this.linkContext,
        countyList: this.mapDrill.counties || [],
      };
    },

    applyRegionLink(unitKey, regionName, countyName = null) {
      this.linkContext = {
        unitKey: unitKey || null,
        regionName: regionName || null,
        countyName: countyName || null,
      };
      this.selectedMapRegion = countyName || regionName || null;
      this.detailPage = 1;
      this.topChartSignatures = {};
      this.rebuildSnapshot();
      this.renderLinkedCharts();
    },

    clearRegionLink() {
      if (this.mapDrill.level === "county" && this.linkContext.countyName) {
        this.linkContext = {
          ...this.linkContext,
          countyName: null,
        };
        this.selectedMapRegion = null;
      } else {
        this.linkContext = { unitKey: null, regionName: null, countyName: null };
        this.selectedMapRegion = null;
      }
      this.detailPage = 1;
      this.topChartSignatures = {};
      this.rebuildSnapshot();
      this.renderLinkedCharts();
    },

    handleMapMetricChange() {
      this.mapLevels = getMapMetricConfig(this.mapMetric).levels;
      this.topChartSignatures = {};
      if (this.mapDrill.level === "county" && this.mapDrill.counties.length) {
        this.mapDrill.mapData = buildCountyMapData(
          this.mapDrill.counties,
          this.mapDrill.parentValues[this.mapMetric] || 10,
          this.warningSnapshot.factor,
          this.mapMetric
        );
      }
      this.rebuildSnapshot();
      this.renderLinkedCharts();
    },

    initCharts() {
      registerYunnanMap(echarts);
      const refs = {
        map: "mapChart",
        lateTop: "lateTopChart",
        earlyTop: "earlyTopChart",
        longAbsentTop: "longAbsentTopChart",
        abnormalChange: "abnormalChangeChart",
      };
      Object.keys(refs).forEach((key) => {
        const el = this.$refs[refs[key]];
        if (el && !this.charts[key]) {
          this.charts[key] = echarts.init(el);
        }
      });
      if (this.charts.map && !this.mapClickBound) {
        this.charts.map.on("click", (params) => this.handleMapClick(params));
        this.mapClickBound = true;
      }
      this.inited = true;
      this.refreshCharts();
      this.bindMapResizeObserver();
    },

    bindMapResizeObserver() {
      if (typeof ResizeObserver === "undefined" || !this.$refs.mapChart) return;
      if (this.mapResizeObserver) this.mapResizeObserver.disconnect();
      this.mapResizeObserver = new ResizeObserver((entries) => {
        const entry = entries && entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        const sizeKey = `${Math.round(width)}x${Math.round(height)}`;
        if (!width || !height || sizeKey === this.lastMapBoxSize) return;
        this.lastMapBoxSize = sizeKey;
        this.scheduleMapContainerResize();
      });
      this.mapResizeObserver.observe(this.$refs.mapChart);
    },

    scheduleSidebarResize() {
      if (this.sidebarResizeTimer) clearTimeout(this.sidebarResizeTimer);
      this.sidebarResizeTimer = setTimeout(() => {
        this.sidebarResizeTimer = null;
        this.resizeSidebarCharts();
      }, 150);
    },

    scheduleMapContainerResize() {
      if (this.mapResizeTimer) clearTimeout(this.mapResizeTimer);
      this.mapResizeTimer = setTimeout(() => {
        this.mapResizeTimer = null;
        this.handleMapContainerResize();
      }, 150);
    },

    getMapLayoutKey() {
      const el = this.$refs.mapChart;
      const w = el ? Math.round(el.clientWidth) : 0;
      const h = el ? Math.round(el.clientHeight) : 0;
      const isCounty = this.mapDrill.level === "county";
      const sizeBase = Math.floor(Math.min(h * 0.96, w * (isCounty ? 0.9 : 0.86)));
      return `${this.mapDrill.mapName}|${this.mapDrill.level}|${w}x${h}|${sizeBase}`;
    },

    getMapGeoLayout() {
      const el = this.$refs.mapChart;
      const w = el ? el.clientWidth : 720;
      const h = el ? el.clientHeight : 520;
      const ratio = w / Math.max(h, 1);
      const isCounty = this.mapDrill.level === "county";
      const sizeBase = Math.floor(Math.min(h * 0.98, w * (isCounty ? 0.94 : 0.9)));

      return {
        layoutCenter: ["50%", "50%"],
        layoutSize: sizeBase,
        aspectScale: isCounty ? 0.92 : ratio > 1.35 ? 0.86 : 0.92,
      };
    },

    getCurrentMapData() {
      if (this.mapDrill.level === "county" && this.mapDrill.mapData.length) {
        return this.mapDrill.mapData;
      }
      return this.warningSnapshot.mapData;
    },

    handleMapContainerResize() {
      if (!this.charts.map || this.charts.map.isDisposed()) return;
      const layoutKey = this.getMapLayoutKey();
      if (layoutKey !== this.lastMapLayoutKey) {
        this.lastMapLayoutKey = layoutKey;
        const geoLayout = this.getMapGeoLayout();
        this.charts.map.setOption(
          {
            geo: { ...geoLayout, map: this.mapDrill.mapName },
          },
          { lazyUpdate: true, silent: true }
        );
      }
      this.charts.map.resize();
    },

    resizeSidebarCharts() {
      ["lateTop", "earlyTop", "longAbsentTop", "abnormalChange"].forEach((key) => {
        const chart = this.charts[key];
        if (chart && !chart.isDisposed()) chart.resize();
      });
    },

    resizeCharts() {
      this.handleMapContainerResize();
      this.resizeSidebarCharts();
    },

    refreshCharts() {
      this.topChartSignatures = {};
      this.rebuildSnapshot();
      if (this.mapDrill.level === "province") {
        this.mapDrill.mapName = "yunnan";
        this.mapDrill.mapData = [];
        this.mapDrill.counties = [];
        this.mapDrill.parentValues = {};
      }
      this.renderLinkedCharts();
      this.lastMapLayoutKey = "";
      this.lastMapBoxSize = "";
      this.$nextTick(() => {
        this.scheduleMapContainerResize();
        this.scheduleSidebarResize();
      });
    },

    renderLinkedCharts() {
      this.renderMapChart();
      this.renderTopChart("lateTop", this.warningSnapshot.lateTop5, "#1890FF");
      this.renderTopChart("earlyTop", this.warningSnapshot.earlyTop5, "#FA8C16");
      this.renderTopChart("longAbsentTop", this.warningSnapshot.longAbsentTop5, "#722ED1");
      this.renderAbnormalChangeChart();
    },

    renderMapChart() {
      const chart = this.charts.map;
      if (!chart) return;
      const mapName = this.mapDrill.mapName;
      const metricConfig = getMapMetricConfig(this.mapMetric);
      const metricMeta = this.currentMapMetric;
      const data = fillMapSeriesData(mapName, this.getCurrentMapData(), echarts);
      const geoLayout = this.getMapGeoLayout();
      const isCounty = this.mapDrill.level === "county";
      chart.setOption(
        {
          animation: false,
          tooltip: {
            trigger: "item",
            backgroundColor: "rgba(255,255,255,0.98)",
            borderColor: "#E8E8E8",
            borderWidth: 1,
            textStyle: { color: "#303133", fontSize: 12 },
            formatter: (p) => {
              const label = (p.data && p.data.fullName) || p.name;
              const val = p.value != null ? p.value : 0;
              return `<div style="font-weight:600;">${label}</div><div style="margin-top:4px;">${metricMeta.label}：<strong>${val}</strong> ${metricMeta.valueUnit}</div>`;
            },
          },
          visualMap: {
            type: "piecewise",
            show: false,
            pieces: metricConfig.pieces,
          },
          geo: {
            map: mapName,
            roam: false,
            ...geoLayout,
            label: {
              show: true,
              color: "#303133",
              fontSize: isCounty ? 9 : 10,
            },
            emphasis: {
              label: { show: true, color: "#303133", fontWeight: 600 },
              itemStyle: metricConfig.emphasisItemStyle,
            },
            itemStyle: metricConfig.geoItemStyle,
          },
          series: [
            {
              type: "map",
              map: mapName,
              geoIndex: 0,
              selectedMode: "single",
              select: {
                itemStyle: {
                  areaColor: metricConfig.emphasisItemStyle.areaColor,
                  borderColor: metricMeta.highlightColor,
                  borderWidth: 3,
                  shadowBlur: 10,
                  shadowColor: "rgba(24,144,255,0.25)",
                },
                label: { show: true, fontWeight: 700 },
              },
              data: data.map((d) => ({
                name: d.name,
                value: d.value != null ? d.value : 0,
                fullName: d.fullName,
                selected: this.selectedMapRegion === d.name,
              })),
            },
          ],
        },
        true
      );
    },

    async handleMapClick(params) {
      const regionName = params.name;
      if (this.mapDrill.level === "county") {
        this.applyRegionLink(this.mapDrill.unitKey, this.mapDrill.unitName, regionName);
        this.renderMapChart();
        return;
      }

      const unitKey = resolveUnitKeyByRegionName(regionName);
      if (!unitKey) {
        this.$message.warning("暂不支持该地区下钻");
        return;
      }
      this.applyRegionLink(unitKey, regionName);
      await this.drillToCounty(unitKey, regionName);
    },

    async drillToCounty(unitKey, regionName) {
      const meta = getUnitMetaByKey(unitKey);
      if (!meta) return;

      const parentValues = {};
      MAP_METRICS.forEach((m) => {
        const row = this.warningSnapshot.mapDataByMetric[m.key].find((d) => d.name === meta.shortName);
        parentValues[m.key] = row ? row.value : 10;
      });
      const parentValue = parentValues[this.mapMetric] || 10;

      this.mapLoading = true;
      try {
        const countyMap = await loadCountyMap(echarts, unitKey);
        const countyData = buildCountyMapData(
          countyMap.counties,
          parentValue,
          this.warningSnapshot.factor,
          this.mapMetric
        );
        this.mapDrill = {
          level: "county",
          unitKey,
          unitName: meta.shortName,
          mapName: countyMap.mapName,
          mapData: countyData,
          counties: countyMap.counties,
          parentValues,
        };
        this.selectedMapRegion = null;
        this.rebuildSnapshot();
        this.renderLinkedCharts();
        this.lastMapLayoutKey = "";
        this.$nextTick(() => this.scheduleMapContainerResize());
      } catch (err) {
        this.$message.error("县级地图加载失败，请稍后重试");
      } finally {
        this.mapLoading = false;
      }
    },

    drillToProvince() {
      if (this.mapDrill.level === "province") return;
      this.mapDrill = {
        level: "province",
        unitKey: null,
        unitName: "",
        mapName: "yunnan",
        mapData: [],
        counties: [],
        parentValues: {},
      };
      this.clearRegionLink();
      this.lastMapLayoutKey = "";
      this.renderMapChart();
      this.$nextTick(() => this.scheduleMapContainerResize());
    },

    renderTopChart(key, list, color) {
      const chart = this.charts[key];
      if (!chart || chart.isDisposed()) return;
      const names = list.map((d) => d.unitShort || d.unit.replace("供电局", "")).reverse();
      const values = list.map((d) => d.count).reverse();
      const signature = `${names.join(",")}|${values.join(",")}|${color}`;
      if (this.topChartSignatures[key] === signature) return;
      this.topChartSignatures[key] = signature;

      chart.setOption(
        {
          animation: false,
          grid: { left: 2, right: 28, top: 2, bottom: 2, containLabel: true },
          xAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
          },
          yAxis: {
            type: "category",
            data: names,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 11, color: "#606266", width: 48, overflow: "truncate" },
          },
          series: [
            {
              type: "bar",
              data: values,
              barWidth: 10,
              itemStyle: { color, borderRadius: [0, 2, 2, 0] },
              label: {
                show: true,
                position: "right",
                fontSize: 10,
                color: "#606266",
              },
            },
          ],
        },
        { replaceMerge: ["series"], lazyUpdate: true }
      );
    },

    renderAbnormalChangeChart() {
      const chart = this.charts.abnormalChange;
      if (!chart) return;
      const ac = this.warningSnapshot.abnormalChange;
      const seriesNames = ["迟到", "早退", "在岗证据不足", "旷工", "长期不在岗"];
      const datasets = [ac.late, ac.early, ac.evidence, ac.absentee, ac.longAbsent];
      const activeType = this.currentMapMetric.abnormalType;
      const maxVal = Math.max(...datasets.flat(), 10);
      const axisMax = Math.ceil(maxVal / 10) * 10 + 10;

      chart.setOption(
        {
          animation: false,
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
          },
          legend: {
            data: seriesNames,
            bottom: 0,
            left: "center",
            icon: "rect",
            itemWidth: 12,
            itemHeight: 8,
            itemGap: 16,
            textStyle: { fontSize: 11, color: "#606266" },
          },
          grid: { left: "2%", right: "4%", top: "6%", bottom: "20%", containLabel: true },
          xAxis: {
            type: "value",
            min: 0,
            max: axisMax,
            interval: Math.max(10, Math.round(axisMax / 6)),
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: "#F0F0F0" } },
            axisLabel: { fontSize: 10, color: "#909399" },
          },
          yAxis: {
            type: "category",
            data: ac.categories,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: "#606266" },
          },
          series: seriesNames.map((name, i) => ({
            name,
            type: "bar",
            stack: "abnormal",
            barMaxWidth: 16,
            itemStyle: {
              color: ABNORMAL_CHANGE_COLORS[name],
              opacity: name === activeType ? 1 : 0.35,
              borderColor: name === activeType ? ABNORMAL_CHANGE_COLORS[name] : "transparent",
              borderWidth: name === activeType ? 1 : 0,
            },
            data: datasets[i],
          })),
        },
        true
      );
    },

    handleQuery() {
      if (this.warningQuery.startDate && this.warningQuery.endDate) {
        if (this.warningQuery.startDate > this.warningQuery.endDate) {
          this.$message.warning("起始日期不能晚于结束日期");
          return;
        }
      }
      this.detailPage = 1;
      this.linkContext = { unitKey: null, regionName: null, countyName: null };
      this.selectedMapRegion = null;
      this.drillToProvince();
      this.refreshCharts();
      this.$message.success("查询成功，异常预警数据已刷新");
    },

    handleReset() {
      this.warningQuery = { ...DEFAULT_WARNING_QUERY };
      this.changeMode = "unit";
      this.mapMetric = "late";
      this.mapLevels = getMapMetricConfig("late").levels;
      this.detailPage = 1;
      this.linkContext = { unitKey: null, regionName: null, countyName: null };
      this.selectedMapRegion = null;
      this.drillToProvince();
      this.refreshCharts();
      this.$message.info("已重置查询条件");
    },

    handleChangeMode() {
      this.refreshCharts();
    },

    detailIndex(index) {
      return (this.detailPage - 1) * this.detailPageSize + index + 1;
    },

    handleDetailSizeChange(size) {
      this.detailPageSize = size;
      this.detailPage = 1;
    },

    handleDetailPageChange(page) {
      this.detailPage = page;
    },

    getExportContext() {
      return {
        queryParams: this.warningQuery,
        mapMetric: this.mapMetric,
        drillLevel: this.mapDrill.level,
        mapData: this.getCurrentMapData(),
        linkFilterLabel: this.linkFilterLabel,
        changeMode: this.changeMode,
      };
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

    confirmExportModules() {
      if (!this.selectedExportModules.length) {
        this.$message.warning("请至少选择一个统计模块");
        return;
      }
      exportWarningModules(
        this.selectedExportModules,
        this.warningSnapshot,
        this.getExportContext()
      );
      this.exportDialogVisible = false;
      this.$message.success(
        `已开始导出 ${this.selectedExportModules.length} 个统计模块明细，请留意浏览器下载`
      );
    },
  },
};
</script>

<style scoped>
.warning-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
}

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

.query-actions {
  margin-left: auto;
}

.date-sep {
  margin: 0 6px;
  color: #909399;
}

.chart-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
  padding: 12px 14px 14px;
}

.chart-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  min-height: 32px;
}

.chart-card__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.warning-top-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.chart-card--hero {
  padding-bottom: 12px;
}

.warning-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(400px, 500px);
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  min-height: 720px;
}

.warning-hero-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 100%;
}

.map-chart-wrap {
  flex: 1 1 auto;
  display: flex;
  min-width: 0;
  min-height: 480px;
  padding: 10px;
  background: linear-gradient(180deg, #f7f9fc 0%, #fff 100%);
  border: 1px solid #eef2f7;
  border-radius: 4px;
}

.chart-card--hero .map-chart {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 440px;
  height: 100%;
}

.hero-abnormal {
  flex: 0 0 auto;
  padding: 10px 12px 8px;
  background: #fafbfc;
  border: 1px solid #eef0f3;
  border-radius: 4px;
}

.hero-abnormal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.hero-abnormal__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.hero-abnormal__chart {
  height: 220px;
  width: 100%;
}

.warning-top5-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 720px;
}

.top5-panel {
  flex: 1 1 230px;
  display: flex;
  flex-direction: column;
  min-height: 230px;
  padding: 10px 12px 10px;
  background: #fafbfc;
  border: 1px solid #eef0f3;
  border-radius: 4px;
}

.top5-panel.is-linked {
  border-color: #91d5ff;
  background: #f6fbff;
  box-shadow: inset 3px 0 0 #1890ff;
}

.top5-panel__header {
  margin-bottom: 4px;
}

.map-toolbar-export {
  flex-shrink: 0;
}

.top5-panel__title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
}

.chart-card--map {
  padding-bottom: 10px;
}

.chart-card__header--map {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
  margin-bottom: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.map-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.map-toolbar__primary {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
}

.map-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-height: 20px;
}

.map-metric-tabs {
  flex-shrink: 0;
}

.map-metric-tabs >>> .el-radio-button__inner {
  padding: 5px 10px;
  font-size: 12px;
}

.map-link-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  color: #1890ff;
  background: #ecf5ff;
  border: 1px solid #b3d8ff;
  border-radius: 2px;
}

.map-link-clear {
  cursor: pointer;
  font-size: 12px;
}

.map-link-clear:hover {
  color: #f5222d;
}

.linked-badge {
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 500;
  color: #1890ff;
  background: #ecf5ff;
  border-radius: 2px;
  vertical-align: middle;
}

.chart-card.is-linked {
  border-color: #91d5ff;
  box-shadow: inset 3px 0 0 #1890ff;
}

.top5-panel.is-linked {
  border-color: #91d5ff;
  background: #f6fbff;
  box-shadow: inset 3px 0 0 #1890ff;
}

.section-filter-tip {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: #909399;
}

.map-header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.map-breadcrumb {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.map-crumb-sep {
  font-size: 10px;
  color: #c0c4cc;
}

.map-crumb.is-link {
  color: #1890ff;
  cursor: pointer;
}

.map-crumb.is-link:hover {
  text-decoration: underline;
}

.map-crumb.is-active {
  color: #303133;
  font-weight: 600;
}

.map-drill-tip {
  font-size: 11px;
  color: #909399;
}

.map-chart {
  cursor: default;
}

.chart-card--hero:not(.is-county) .map-chart {
  cursor: pointer;
}

.warning-top5-side .top5-chart {
  height: 96px;
  width: 100%;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin-left: auto;
  font-size: 11px;
  color: #606266;
}

.map-legend--inline {
  margin-left: auto;
}

.map-legend__label {
  font-weight: 600;
  color: #303133;
  margin-right: 2px;
}

.map-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  line-height: 1.4;
  white-space: nowrap;
}

.map-legend__color {
  width: 14px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.top5-chart {
  height: 88px;
  width: 100%;
  margin-bottom: 8px;
}

.top5-table-wrap {
  flex: 1;
  min-width: 0;
  min-height: 118px;
  overflow-x: auto;
}

.top5-panel .top5-table {
  width: 100%;
}

.top5-panel >>> .el-table__body-wrapper {
  overflow-y: hidden;
}

.top5-table >>> .el-table th {
  background: #ecf5ff;
  padding: 7px 0;
  font-size: 11px;
  font-weight: 600;
  color: #303133;
}

.top5-table >>> .el-table td {
  padding: 7px 0;
  font-size: 11px;
}

.top5-table >>> .el-table .cell {
  line-height: 18px;
  padding-left: 4px;
  padding-right: 4px;
}

.status-text {
  white-space: nowrap;
}

.chart-box--md {
  height: 320px;
  width: 100%;
}

.detail-table >>> .el-table th {
  background: #fafafa;
  font-weight: 600;
}

.detail-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.status-text.is-danger {
  color: #f5222d;
  font-weight: 500;
}

.status-text.is-warning {
  color: #fa8c16;
  font-weight: 500;
}

.status-text.is-primary {
  color: #1890ff;
  font-weight: 500;
}

.status-text.is-info {
  color: #909399;
}

@media (max-width: 1280px) {
  .warning-hero-grid {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .warning-top5-side {
    min-height: auto;
  }

  .top5-panel {
    min-height: 240px;
  }

  .map-chart-wrap {
    min-height: 380px;
  }

  .chart-card--hero .map-chart {
    min-height: 360px;
  }

  .hero-abnormal__chart {
    height: 260px;
  }

  .warning-top5-side {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    height: auto;
  }

  .top5-panel {
    flex: none;
  }

  .warning-top5-side .top5-chart {
    height: 88px;
  }
}

@media (max-width: 900px) {
  .map-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-legend--inline {
    margin-left: 0;
  }

  .warning-top5-side {
    grid-template-columns: 1fr;
  }

  .map-chart-wrap {
    min-height: 320px;
  }

  .chart-card--hero .map-chart {
    min-height: 300px;
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
