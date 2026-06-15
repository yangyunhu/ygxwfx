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

    <!-- 地图 + TOP5 -->
    <div class="warning-top-grid">
      <section class="chart-card chart-card--map" :class="{ 'is-county': mapDrill.level === 'county' }">
        <div class="chart-card__header chart-card__header--map">
          <div class="map-header-main">
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
            <span v-if="mapDrill.level === 'province'" class="map-drill-tip">点击地市下钻查看县区</span>
          </div>
          <div class="map-legend">
            <span class="map-legend__label">旷工人次</span>
            <div v-for="item in mapLevels" :key="item.label" class="map-legend__item">
              <span class="map-legend__color" :style="{ background: item.color }" />
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
        <div ref="mapChart" v-loading="mapLoading" class="map-chart" />
      </section>

      <div class="warning-top5-col">
        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">迟到预警 TOP5</h3>
          </div>
          <div ref="lateTopChart" class="top5-chart" />
          <div class="top5-table-wrap">
            <el-table :data="warningSnapshot.lateTop5" border size="mini" class="top5-table">
              <el-table-column prop="rank" label="排名" width="48" align="center" />
              <el-table-column prop="unitShort" label="单位" min-width="72" show-overflow-tooltip />
              <el-table-column prop="department" label="部门" min-width="64" show-overflow-tooltip />
              <el-table-column prop="count" label="迟到" width="48" align="center" />
              <el-table-column prop="status" label="状态" width="68" align="center">
                <template slot-scope="{ row }">
                  <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>

        <section class="chart-card">
          <div class="chart-card__header">
            <h3 class="chart-card__title">早退预警 TOP5</h3>
          </div>
          <div ref="earlyTopChart" class="top5-chart" />
          <div class="top5-table-wrap">
            <el-table :data="warningSnapshot.earlyTop5" border size="mini" class="top5-table">
              <el-table-column prop="rank" label="排名" width="48" align="center" />
              <el-table-column prop="unitShort" label="单位" min-width="72" show-overflow-tooltip />
              <el-table-column prop="department" label="部门" min-width="64" show-overflow-tooltip />
              <el-table-column prop="count" label="早退" width="48" align="center" />
              <el-table-column prop="status" label="状态" width="68" align="center">
                <template slot-scope="{ row }">
                  <span :class="['status-text', statusClass(row.status)]">{{ row.status }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>
      </div>
    </div>

    <!-- 异常变化情况 -->
    <section class="chart-card">
      <div class="chart-card__header">
        <h3 class="chart-card__title">异常变化情况</h3>
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
        <h3 class="chart-card__title">全省异常预警明细</h3>
        <el-button type="primary" size="mini" plain icon="el-icon-download" @click="handleExportDetail">
          导出
        </el-button>
      </div>
      <el-table :data="pagedDetailTable" border stripe size="small" class="detail-table">
        <el-table-column type="index" :index="detailIndex" label="序号" width="60" align="center" />
        <el-table-column prop="unit" label="单位" min-width="120" show-overflow-tooltip />
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
  buildWarningSnapshot,
  ABNORMAL_CHANGE_COLORS,
  buildWarningDetailExportRows,
  WARNING_DETAIL_EXPORT_HEADERS,
} from "../utils/warningOverviewData";
import { ABSENTEE_MAP_LEVELS, registerYunnanMap } from "../utils/yunnanGeo";
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
      warningSnapshot: buildWarningSnapshot(DEFAULT_WARNING_QUERY, "unit"),
      mapLevels: ABSENTEE_MAP_LEVELS,
      mapDrill: {
        level: "province",
        unitKey: null,
        unitName: "",
        mapName: "yunnan",
        mapData: [],
      },
      mapLoading: false,
      mapClickBound: false,
      charts: {},
      detailPage: 1,
      detailPageSize: 10,
      inited: false,
      mapResizeObserver: null,
      windowResizeHandler: null,
    };
  },
  computed: {
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
            this.handleMapContainerResize();
          }
        });
      }
    },
  },
  mounted() {
    this.windowResizeHandler = () => {
      if (this.inited) this.handleMapContainerResize();
    };
    window.addEventListener("resize", this.windowResizeHandler);
    if (this.active) {
      this.$nextTick(() => this.initCharts());
    }
  },
  beforeDestroy() {
    if (this.mapResizeObserver) this.mapResizeObserver.disconnect();
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
      this.warningSnapshot = buildWarningSnapshot(this.warningQuery, this.changeMode);
    },

    initCharts() {
      registerYunnanMap(echarts);
      const refs = {
        map: "mapChart",
        lateTop: "lateTopChart",
        earlyTop: "earlyTopChart",
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
        this.handleMapContainerResize();
      });
      this.mapResizeObserver.observe(this.$refs.mapChart);
    },

    getMapGeoLayout() {
      const el = this.$refs.mapChart;
      const w = el ? el.clientWidth : 600;
      const h = el ? el.clientHeight : 480;
      const ratio = w / Math.max(h, 1);
      const isCounty = this.mapDrill.level === "county";
      let sidePad = isCounty ? "6%" : "7%";
      if (w < 360) sidePad = isCounty ? "10%" : "14%";
      else if (w < 480) sidePad = isCounty ? "8%" : "11%";
      else if (w < 620) sidePad = isCounty ? "7%" : "9%";
      return {
        left: sidePad,
        right: sidePad,
        top: ratio > 1.15 ? "10%" : "8%",
        bottom: ratio > 1.15 ? "8%" : "6%",
        aspectScale: isCounty ? 0.92 : ratio > 1.25 ? 0.78 : ratio > 1.05 ? 0.84 : 0.88,
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
      const geoLayout = this.getMapGeoLayout();
      this.charts.map.setOption({
        geo: { ...geoLayout, map: this.mapDrill.mapName },
      });
      this.resizeCharts();
    },

    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },

    refreshCharts() {
      this.rebuildSnapshot();
      if (this.mapDrill.level === "province") {
        this.mapDrill.mapName = "yunnan";
        this.mapDrill.mapData = [];
      }
      this.renderMapChart();
      this.renderTopChart("lateTop", this.warningSnapshot.lateTop5, "#FA8C16");
      this.renderTopChart("earlyTop", this.warningSnapshot.earlyTop5, "#1890FF");
      this.renderAbnormalChangeChart();
      this.$nextTick(() => {
        this.resizeCharts();
        // 地图容器高度随右侧 TOP5 拉伸后需二次 resize
        setTimeout(() => this.resizeCharts(), 80);
      });
    },

    renderMapChart() {
      const chart = this.charts.map;
      if (!chart) return;
      const data = this.getCurrentMapData();
      const mapName = this.mapDrill.mapName;
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
              return `<div style="font-weight:600;">${label}</div><div style="margin-top:4px;">旷工人次：<strong>${p.value || 0}</strong></div>`;
            },
          },
          visualMap: {
            type: "piecewise",
            show: false,
            pieces: [
              { min: 50, color: "#F5222D" },
              { min: 20, max: 49, color: "#FA8C16" },
              { min: 5, max: 19, color: "#FFC53D" },
              { max: 4, color: "#FFF1B8" },
            ],
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
              itemStyle: {
                areaColor: "#FFD666",
                borderColor: "#fff",
                borderWidth: 2,
                shadowBlur: 8,
                shadowColor: "rgba(0,0,0,0.12)",
              },
            },
            itemStyle: {
              areaColor: "#FFF1B8",
              borderColor: "#fff",
              borderWidth: 1.5,
            },
          },
          series: [
            {
              type: "map",
              map: mapName,
              geoIndex: 0,
              selectedMode: false,
              data: data.map((d) => ({
                name: d.name,
                value: d.value,
                fullName: d.fullName,
              })),
            },
          ],
        },
        true
      );
    },

    async handleMapClick(params) {
      if (this.mapDrill.level !== "province") return;
      const regionName = params.name;
      const unitKey = resolveUnitKeyByRegionName(regionName);
      if (!unitKey) {
        this.$message.warning("暂不支持该地区下钻");
        return;
      }
      await this.drillToCounty(unitKey, regionName);
    },

    async drillToCounty(unitKey, regionName) {
      const meta = getUnitMetaByKey(unitKey);
      if (!meta) return;

      const parentRow = this.warningSnapshot.mapData.find((d) => d.name === meta.shortName);
      const parentValue = parentRow ? parentRow.value : 20;

      this.mapLoading = true;
      try {
        const countyMap = await loadCountyMap(echarts, unitKey);
        const countyData = buildCountyMapData(
          countyMap.counties,
          parentValue,
          this.warningSnapshot.factor
        );
        this.mapDrill = {
          level: "county",
          unitKey,
          unitName: meta.shortName,
          mapName: countyMap.mapName,
          mapData: countyData,
        };
        this.renderMapChart();
        this.$nextTick(() => this.handleMapContainerResize());
        this.$message.success(`已进入${meta.shortName}县区视图`);
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
      };
      this.renderMapChart();
      this.$nextTick(() => this.handleMapContainerResize());
    },

    renderTopChart(key, list, color) {
      const chart = this.charts[key];
      if (!chart) return;
      const names = list.map((d) => d.unit.replace("供电局", "")).reverse();
      const values = list.map((d) => d.count).reverse();
      chart.setOption(
        {
          grid: { left: "4%", right: "8%", top: "4%", bottom: "4%", containLabel: true },
          xAxis: {
            type: "value",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: "#F0F0F0" } },
            axisLabel: { fontSize: 10, color: "#909399" },
          },
          yAxis: {
            type: "category",
            data: names,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { fontSize: 10, color: "#606266" },
          },
          series: [
            {
              type: "bar",
              data: values,
              barWidth: 12,
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
      const seriesNames = ["迟到", "早退", "在岗证据不足", "旷工"];
      const datasets = [ac.late, ac.early, ac.evidence, ac.absentee];
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
            itemGap: 20,
            textStyle: { fontSize: 11, color: "#606266" },
          },
          grid: { left: "2%", right: "4%", top: "6%", bottom: "12%", containLabel: true },
          xAxis: {
            type: "value",
            min: 0,
            max: 60,
            interval: 10,
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
            itemStyle: { color: ABNORMAL_CHANGE_COLORS[name] },
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
      this.drillToProvince();
      this.refreshCharts();
      this.$message.success("查询成功，异常预警数据已刷新");
    },

    handleReset() {
      this.warningQuery = { ...DEFAULT_WARNING_QUERY };
      this.changeMode = "unit";
      this.detailPage = 1;
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

.warning-top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  min-width: 0;
}

.chart-card--map {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.chart-card--map .map-chart {
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 420px;
  height: 100%;
}

.chart-card__header--map {
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-bottom: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.map-header-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.map-breadcrumb {
  display: flex;
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

.chart-card--map:not(.is-county) .map-chart {
  cursor: pointer;
}

.warning-top5-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.top5-table-wrap {
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 14px;
  margin-left: auto;
  font-size: 11px;
  color: #606266;
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
  height: 140px;
  width: 100%;
  margin-bottom: 8px;
}

.top5-table >>> .el-table th {
  background: #fafafa;
  padding: 6px 0;
  font-size: 12px;
}

.top5-table >>> .el-table td {
  padding: 5px 0;
  font-size: 12px;
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

@media (max-width: 1400px) {
  .warning-top-grid {
    grid-template-columns: 1fr;
  }

  .chart-card--map .map-chart {
    min-height: 460px;
  }
}

@media (max-width: 1200px) {
  .map-chart {
    min-height: 420px;
  }

  .chart-card__header--map {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-legend {
    margin-left: 0;
  }
}
</style>
