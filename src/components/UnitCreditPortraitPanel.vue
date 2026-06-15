<template>
  <div class="unit-portrait-panel">
    <div class="panel-layout">
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input v-model="orgKeyword" placeholder="组织架构" prefix-icon="el-icon-search" size="small" clearable />
        </div>
        <div class="org-tree-wrap">
          <el-tree
            :data="filteredOrgTree"
            :props="treeProps"
            show-checkbox
            check-on-click-node
            node-key="id"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <div class="main-panel">
        <div class="main-panel__scroll">
          <div class="toolbar-row">
            <span class="unit-path">单位信息：{{ summary.unitPath }}</span>
            <div class="toolbar-row__actions">
              <span class="toolbar-label">年度：</span>
              <el-select v-model="queryYear" size="small" style="width: 110px">
                <el-option v-for="o in yearOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
              <el-button type="primary" size="small" icon="el-icon-search" @click="handleQuery">查询</el-button>
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-card__label">员工总数</div>
              <div class="summary-card__value">{{ summary.employeeCount }}</div>
            </div>
            <div class="summary-card summary-card--danger">
              <div class="summary-card__label">本期总扣分</div>
              <div class="summary-card__value">{{ summary.totalDeduct }}</div>
            </div>
            <div class="summary-card summary-card--primary">
              <div class="summary-card__label">平均分</div>
              <div class="summary-card__value">{{ summary.avgScore }}</div>
            </div>
            <div class="summary-card">
              <div class="summary-card__label">扣分最多TOP3专业</div>
              <div class="summary-card__value summary-card__value--sm">{{ summary.topDeductProfessions }}</div>
            </div>
          </div>

          <div class="chart-row">
            <section class="chart-block">
              <h4 class="block-title">信用等级分布</h4>
              <div ref="gradeChart" class="chart-box chart-box--donut" />
            </section>
            <section class="chart-block">
              <h4 class="block-title">专业类别扣分分布</h4>
              <div ref="specialtyChart" class="chart-box" />
            </section>
          </div>

          <section class="table-section">
            <h4 class="block-title">下级单位信用排行榜</h4>
            <el-table :data="rankingRows" border stripe size="small" header-cell-class-name="table-header">
              <el-table-column prop="rank" label="排名" width="70" align="center" />
              <el-table-column prop="name" label="单位/部门" min-width="120" />
              <el-table-column prop="employeeCount" label="员工数" width="90" align="center" />
              <el-table-column prop="totalScore" label="总分" width="90" align="center" />
              <el-table-column prop="avgScore" label="平均分" width="90" align="center" />
              <el-table-column prop="gradeDist" label="等级分布" min-width="140" show-overflow-tooltip />
              <el-table-column label="趋势" width="80" align="center">
                <template slot-scope="scope">
                  <i v-if="scope.row.trend === 'up'" class="el-icon-top trend-up" />
                  <i v-else-if="scope.row.trend === 'down'" class="el-icon-bottom trend-down" />
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="$message.info(`查看：${scope.row.name}`)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section class="table-section">
            <h4 class="block-title">加扣分明细</h4>
            <el-form :inline="true" size="small" class="filter-form">
              <el-form-item label="专业：">
                <el-select v-model="detailQuery.profession" style="width: 110px">
                  <el-option v-for="o in professionFilter" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="类型：">
                <el-select v-model="detailQuery.scoreType" style="width: 110px">
                  <el-option v-for="o in scoreTypeFilter" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="月份：">
                <el-select v-model="detailQuery.month" style="width: 110px">
                  <el-option v-for="o in monthFilter" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="small" icon="el-icon-search" @click="detailPage = 1">查询</el-button>
                <el-button size="small" icon="el-icon-refresh" @click="resetDetailQuery">重置</el-button>
              </el-form-item>
            </el-form>
            <el-table :data="pagedDetailRows" border stripe size="small" header-cell-class-name="table-header">
              <el-table-column prop="time" label="时间" width="110" align="center" />
              <el-table-column prop="dept" label="单位/部门" width="120" />
              <el-table-column prop="person" label="人员" width="90" align="center" />
              <el-table-column prop="desc" label="事项描述" min-width="180" show-overflow-tooltip />
              <el-table-column prop="profession" label="专业类别" width="100" align="center" />
              <el-table-column label="分值" width="80" align="center">
                <template slot-scope="scope">
                  <span :class="scope.row.score >= 0 ? 'score-pos' : 'score-neg'">
                    {{ scope.row.score >= 0 ? `+${scope.row.score}` : scope.row.score }}
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-wrap">
              <el-pagination
                :current-page="detailPage"
                :page-sizes="[5, 10, 20]"
                :page-size="detailPageSize"
                layout="total, sizes, prev, pager, next"
                :total="filteredDetailRows.length"
                @size-change="(v) => { detailPageSize = v; detailPage = 1; }"
                @current-change="(v) => { detailPage = v; }"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption, legendBottomCenter } from "../utils/chartTheme";
import {
  YEAR_OPTIONS,
  getProfileOrgTree,
  getUnitSummary,
  getUnitGradeDistribution,
  getUnitSpecialtyDeduct,
  getUnitRankingRows,
  getUnitScoreDetailRows,
  filterScoreDetailRows,
  PROFESSION_FILTER,
  SCORE_TYPE_FILTER,
  MONTH_FILTER,
} from "../utils/creditProfileData";

export default {
  name: "UnitCreditPortraitPanel",
  props: {
    panelActive: { type: Boolean, default: true },
  },
  data() {
    return {
      orgTree: getProfileOrgTree(),
      orgKeyword: "",
      treeProps: { label: "name", children: "children" },
      queryYear: "2026",
      yearOptions: YEAR_OPTIONS,
      summary: getUnitSummary(),
      rankingRows: getUnitRankingRows(),
      detailAllRows: getUnitScoreDetailRows(),
      detailQuery: { profession: "all", scoreType: "all", month: "all" },
      detailPage: 1,
      detailPageSize: 5,
      professionFilter: PROFESSION_FILTER,
      scoreTypeFilter: SCORE_TYPE_FILTER,
      monthFilter: MONTH_FILTER,
      gradeData: getUnitGradeDistribution(),
      specialtyData: getUnitSpecialtyDeduct(),
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    filteredOrgTree() {
      const kw = (this.orgKeyword || "").trim();
      if (!kw) return this.orgTree;
      const filter = (nodes) =>
        nodes
          .map((n) => {
            const children = n.children ? filter(n.children) : [];
            const match = (n.name || "").includes(kw);
            if (match || children.length) {
              return { ...n, children: children.length ? children : n.children };
            }
            return null;
          })
          .filter(Boolean);
      return filter(this.orgTree);
    },
    filteredDetailRows() {
      return filterScoreDetailRows(this.detailAllRows, this.detailQuery);
    },
    pagedDetailRows() {
      const s = (this.detailPage - 1) * this.detailPageSize;
      return this.filteredDetailRows.slice(s, s + this.detailPageSize);
    },
  },
  watch: {
    panelActive(val) {
      if (val) {
        this.$nextTick(() => {
          this.initCharts(true);
          this.resizeCharts();
        });
      }
    },
  },
  mounted() {
    this.resizeHandler = () => this.resizeCharts();
    window.addEventListener("resize", this.resizeHandler);
    if (this.panelActive) {
      this.$nextTick(() => this.initCharts(true));
    }
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
    this.charts = {};
  },
  methods: {
    handleQuery() {
      this.$message.success(`已查询 ${this.queryYear} 年度数据`);
    },
    resetDetailQuery() {
      this.detailQuery = { profession: "all", scoreType: "all", month: "all" };
      this.detailPage = 1;
    },
    initCharts(force = false) {
      const refs = { grade: "gradeChart", specialty: "specialtyChart" };
      Object.entries(refs).forEach(([key, refName]) => {
        const el = this.$refs[refName];
        if (!el) return;
        if (force && this.charts[key]) {
          this.charts[key].dispose();
          this.charts[key] = null;
        }
        if (!this.charts[key]) this.charts[key] = echarts.init(el);
      });
      this.renderCharts();
    },
    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
    renderCharts() {
      this.renderGradeChart();
      this.renderSpecialtyChart();
    },
    renderGradeChart() {
      const chart = this.charts.grade;
      if (!chart) return;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "item", formatter: "{b}<br/>{c}人 ({d}%)" },
          legend: {
            ...legendBottomCenter(this.gradeData.map((d) => d.name)),
            bottom: 0,
          },
          series: [{
            type: "pie",
            radius: ["42%", "68%"],
            center: ["50%", "45%"],
            label: { formatter: "{b}\n{d}%", fontSize: 11 },
            data: this.gradeData.map((d) => ({
              name: d.name,
              value: d.value,
              itemStyle: { color: d.color },
            })),
          }],
        }),
        true
      );
      chart.resize();
    },
    renderSpecialtyChart() {
      const chart = this.charts.specialty;
      if (!chart) return;
      const names = this.specialtyData.map((d) => d.name).reverse();
      const values = this.specialtyData.map((d) => d.value).reverse();
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
          grid: { left: "3%", right: "8%", bottom: "6%", top: "8%", containLabel: true },
          xAxis: { type: "value" },
          yAxis: { type: "category", data: names },
          series: [{
            type: "bar",
            data: values,
            barWidth: 16,
            itemStyle: { color: "#1890FF", borderRadius: [0, 4, 4, 0] },
          }],
        }),
        true
      );
      chart.resize();
    },
  },
};
</script>

<style scoped>
.unit-portrait-panel {
  height: 100%;
  min-height: 0;
}

.panel-layout {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.org-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
  min-height: 0;
}

.org-search {
  flex-shrink: 0;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
}

.org-tree-wrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 4px;
}

.tree-node { display: flex; align-items: center; font-size: 13px; }
.tree-node i { margin-right: 6px; color: #909399; }
.tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.main-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
}

.main-panel__scroll {
  height: 100%;
  overflow-y: auto;
  padding: 14px 16px;
  box-sizing: border-box;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.unit-path { font-size: 13px; color: #606266; }
.toolbar-row__actions { display: flex; align-items: center; gap: 8px; }
.toolbar-label { font-size: 13px; color: #606266; }

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.summary-card {
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafbfc;
}

.summary-card--danger .summary-card__value { color: #f5222d; }
.summary-card--primary .summary-card__value { color: #1890ff; }

.summary-card__label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.summary-card__value { font-size: 24px; font-weight: 600; color: #303133; }
.summary-card__value--sm { font-size: 16px; font-weight: 500; }

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.chart-block {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 12px 4px;
}

.block-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.chart-box { height: 260px; width: 100%; }
.chart-box--donut { height: 280px; }

.table-section {
  margin-bottom: 16px;
}

.filter-form { margin-bottom: 10px; }

>>> .table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.pagination-wrap { margin-top: 10px; text-align: right; }

.score-pos { color: #52c41a; font-weight: 500; }
.score-neg { color: #f5222d; font-weight: 500; }
.trend-up { color: #52c41a; font-weight: bold; }
.trend-down { color: #f5222d; font-weight: bold; }

@media (max-width: 1200px) {
  .summary-cards { grid-template-columns: repeat(2, 1fr); }
  .chart-row { grid-template-columns: 1fr; }
}

@media (max-width: 992px) {
  .panel-layout { flex-direction: column; overflow: auto; }
  .org-sidebar { width: 100%; height: 260px; }
  .main-panel { min-height: 600px; }
}
</style>
