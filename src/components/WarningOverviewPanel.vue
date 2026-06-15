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
        <div class="map-chart-wrap">
          <div ref="mapChart" v-loading="mapLoading" class="map-chart" />
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
            <el-table :data="warningSnapshot.lateTop5" border size="mini" class="top5-table">
              <el-table-column prop="rank" label="#" width="32" align="center" />
              <el-table-column prop="unitShort" :label="top5RegionLabel" min-width="52" show-overflow-tooltip />
              <el-table-column prop="count" label="迟到" width="40" align="center" />
              <el-table-column prop="status" label="状态" min-width="56" align="center">
                <template slot-scope="{ row }">
                  <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section class="top5-panel" :class="{ 'is-linked': mapMetric === 'early' }">
            <div class="top5-panel__header">
              <h4 class="top5-panel__title">
                早退预警 TOP5
                <span v-if="mapMetric === 'early'" class="linked-badge">联动</span>
              </h4>
            </div>
            <div ref="earlyTopChart" class="top5-chart" />
            <el-table :data="warningSnapshot.earlyTop5" border size="mini" class="top5-table">
              <el-table-column prop="rank" label="#" width="32" align="center" />
              <el-table-column prop="unitShort" :label="top5RegionLabel" min-width="52" show-overflow-tooltip />
              <el-table-column prop="count" label="早退" width="40" align="center" />
              <el-table-column prop="status" label="状态" min-width="56" align="center">
                <template slot-scope="{ row }">
                  <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section class="top5-panel" :class="{ 'is-linked': mapMetric === 'longAbsent' }">
            <div class="top5-panel__header">
              <h4 class="top5-panel__title">
                长期不在岗 TOP5
                <span v-if="mapMetric === 'longAbsent'" class="linked-badge">联动</span>
              </h4>
            </div>
            <div ref="longAbsentTopChart" class="top5-chart" />
            <el-table :data="warningSnapshot.longAbsentTop5" border size="mini" class="top5-table">
              <el-table-column prop="rank" label="#" width="32" align="center" />
              <el-table-column prop="unitShort" :label="top5RegionLabel" min-width="52" show-overflow-tooltip />
              <el-table-column prop="count" label="不在岗" width="48" align="center" />
              <el-table-column prop="status" label="状态" min-width="56" align="center">
                <template slot-scope="{ row }">
                  <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </aside>
      </div>
    </section>

    <!-- 异常变化情况 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">
          异常变化情况
          <span v-if="linkFilterLabel" class="section-filter-tip">（{{ linkFilterLabel }}）</span>
        </h3>
        <el-radio-group v-model="changeMode" size="mini" @change="handleChangeMode">
          <el-radio-button label="unit">单位</el-radio-button>
          <el-radio-button label="department">部门</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="abnormalChangeChart" class="chart-box chart-box--md" />
    </section>

    <!-- 全省异常预警明细 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">
          全省异常预警明细
          <span class="section-filter-tip">（{{ currentMapMetric.abnormalType }} · {{ linkFilterLabel || "全省" }}）</span>
        </h3>
        <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleExportDetail">
          导出
        </el-button>
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
  buildWarningDetailExportRows,
  WARNING_DETAIL_EXPORT_HEADERS,
} from "../utils/warningOverviewData";
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
import { downloadTableWithLog } from "../utils/exportLogger";

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
      chartResizeTimer: null,
      lastMapLayoutKey: "",
      windowResizeHandler: null,
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
      if (this.inited) this.scheduleMapContainerResize();
    };
    window.addEventListener("resize", this.windowResizeHandler);
    if (this.active) {
      this.$nextTick(() => this.initCharts());
    }
  },
  beforeDestroy() {
    if (this.mapResizeObserver) this.mapResizeObserver.disconnect();
    if (this.mapResizeTimer) clearTimeout(this.mapResizeTimer);
    if (this.chartResizeTimer) clearTimeout(this.chartResizeTimer);
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
      this.rebuildSnapshot();
      this.renderLinkedCharts();
    },

    handleMapMetricChange() {
      this.mapLevels = getMapMetricConfig(this.mapMetric).levels;
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
      this.mapResizeObserver = new ResizeObserver(() => {
        // 仅 resize 图表，避免 setOption 触发尺寸循环
        this.scheduleChartResize();
      });
      this.mapResizeObserver.observe(this.$refs.mapChart);
    },

    scheduleChartResize() {
      if (this.chartResizeTimer) clearTimeout(this.chartResizeTimer);
      this.chartResizeTimer = setTimeout(() => {
        this.chartResizeTimer = null;
        this.resizeCharts();
      }, 120);
    },

    scheduleMapContainerResize() {
      if (this.mapResizeTimer) clearTimeout(this.mapResizeTimer);
      this.mapResizeTimer = setTimeout(() => {
        this.mapResizeTimer = null;
        this.handleMapContainerResize();
      }, 120);
    },

    getMapLayoutKey() {
      const el = this.$refs.mapChart;
      const w = el ? el.clientWidth : 0;
      const h = el ? el.clientHeight : 0;
      const geoLayout = this.getMapGeoLayout();
      return `${this.mapDrill.mapName}|${this.mapDrill.level}|${w}x${h}|${JSON.stringify(geoLayout)}`;
    },

    getMapGeoLayout() {
      const el = this.$refs.mapChart;
      const w = el ? el.clientWidth : 720;
      const h = el ? el.clientHeight : 480;
      const ratio = w / Math.max(h, 1);
      const isCounty = this.mapDrill.level === "county";
      const sizeBase = Math.floor(Math.min(h * 0.96, w * (isCounty ? 0.9 : 0.86)));

      return {
        layoutCenter: ["50%", "50%"],
        layoutSize: sizeBase,
        aspectScale: isCounty ? 0.88 : ratio > 1.6 ? 0.76 : 0.84,
      };
    },

    getCurrentMapData() {
      if (this.mapDrill.level === "county" && this.mapDrill.mapData.length) {
        return this.mapDrill.mapData;
      }
      return this.warningSnapshot.mapData;
    },

    handleMapContainerResize() {
      if (!this.charts.map) return;
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
      this.scheduleChartResize();
    },

    resizeCharts() {
      Object.values(this.charts).forEach((c) => {
        if (c && !c.isDisposed()) c.resize();
      });
    },

    refreshCharts() {
      this.rebuildSnapshot();
      if (this.mapDrill.level === "province") {
        this.mapDrill.mapName = "yunnan";
        this.mapDrill.mapData = [];
        this.mapDrill.counties = [];
        this.mapDrill.parentValues = {};
      }
      this.renderLinkedCharts();
      this.lastMapLayoutKey = "";
      this.$nextTick(() => {
        this.scheduleMapContainerResize();
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
      if (!chart) return;
      const names = list.map((d) => d.unitShort || d.unit.replace("供电局", "")).reverse();
      const values = list.map((d) => d.count).reverse();
      chart.setOption(
        {
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
        true
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
          grid: { left: "2%", right: "4%", top: "6%", bottom: "14%", containLabel: true },
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

    handleExportDetail() {
      const rows = buildWarningDetailExportRows(this.warningSnapshot.detailTable);
      if (!rows.length) {
        this.$message.warning("没有可导出的数据");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      downloadTableWithLog({
        headers: WARNING_DETAIL_EXPORT_HEADERS,
        rows,
        format: "csv",
        baseFilename: `全省异常预警明细_${stamp}`,
        meta: {
          moduleCode: "behavior-overview-warning-detail",
          moduleName: "员工行为总览-全省异常预警明细",
          moduleGroup: "员工出勤行为管理",
          rowCount: rows.length,
        },
      });
      this.$message.success(`已导出 ${rows.length} 条异常预警明细`);
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
  grid-template-columns: minmax(0, 1fr) minmax(340px, 420px);
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  min-height: 480px;
}

.map-chart-wrap {
  display: flex;
  min-width: 0;
  min-height: 480px;
  padding: 8px;
  background: linear-gradient(180deg, #f7f9fc 0%, #fff 100%);
  border: 1px solid #eef2f7;
  border-radius: 4px;
}

.chart-card--hero .map-chart {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 460px;
  height: 100%;
}

.warning-top5-side {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.top5-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 10px 8px;
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
  height: 72px;
  width: 100%;
  margin-bottom: 6px;
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
  height: 72px;
  width: 100%;
  margin-bottom: 6px;
}

.top5-panel .top5-table {
  flex: 1;
  min-height: 0;
}

.top5-table >>> .el-table th {
  background: #fafafa;
  padding: 4px 0;
  font-size: 11px;
}

.top5-table >>> .el-table td {
  padding: 3px 0;
  font-size: 11px;
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

  .map-chart-wrap {
    min-height: 400px;
  }

  .chart-card--hero .map-chart {
    min-height: 380px;
  }

  .warning-top5-side {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .warning-top5-side .top5-chart {
    height: 96px;
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
</style>
