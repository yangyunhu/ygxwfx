<template>
  <div class="employee-portrait-panel">
    <div class="panel-layout">
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input v-model="orgKeyword" placeholder="组织架构" prefix-icon="el-icon-search" size="small" clearable />
        </div>
        <div class="org-tree-wrap">
          <el-tree
            ref="orgTree"
            :data="filteredOrgTree"
            :props="treeProps"
            show-checkbox
            check-on-click-node
            node-key="id"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            @node-click="handleOrgClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <aside class="employee-sidebar">
        <div class="org-search">
          <el-input v-model="employeeKeyword" placeholder="员工姓名" prefix-icon="el-icon-search" size="small" clearable />
        </div>
        <div class="employee-list">
          <div
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="employee-item"
            :class="{ 'is-active': selectedEmployeeId === emp.id }"
            @click="selectEmployee(emp.id)"
          >
            {{ emp.name }}
          </div>
        </div>
      </aside>

      <div class="main-panel">
        <div class="main-panel__scroll">
          <div class="toolbar-row">
            <span class="unit-path">单位信息：{{ profile.unitPath }}</span>
            <div class="toolbar-row__actions">
              <span class="toolbar-label">年度：</span>
              <el-select v-model="queryYear" size="small" style="width: 110px">
                <el-option v-for="o in yearOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
              <el-button type="primary" size="small" icon="el-icon-search" @click="refreshProfile">查询</el-button>
            </div>
          </div>

          <div class="profile-card">
            <div class="profile-card__avatar"><i class="el-icon-user-solid" /></div>
            <div class="profile-card__info">
              <div class="profile-card__name-row">
                <span class="profile-card__name">{{ profile.name }}</span>
                <span class="profile-card__grade">信用等级：{{ profile.creditGrade }}</span>
              </div>
              <div class="profile-card__tags">
                <el-tag size="mini" type="success">工号：{{ profile.empNo }}</el-tag>
                <el-tag size="mini" type="info">部门：{{ profile.dept }}</el-tag>
                <el-tag size="mini" type="warning">岗位：{{ profile.position }}</el-tag>
                <el-tag size="mini">入职：{{ profile.joinDate }}</el-tag>
              </div>
            </div>
          </div>

          <div class="score-overview">
            <div class="score-overview__total">
              信用总分：<strong>{{ profile.totalScore }}</strong> / {{ profile.maxScore }}
            </div>
            <div class="score-overview__cards">
              <div class="metric-card">单位平均分：<strong>{{ profile.unitAvg }}</strong></div>
              <div class="metric-card">部门平均分：<strong>{{ profile.deptAvg }}</strong></div>
              <div class="metric-card">个人在单位排名：<strong>{{ profile.unitRank }}</strong></div>
            </div>
          </div>

          <div class="chart-row">
            <section class="chart-block">
              <h4 class="block-title">信用维度分析</h4>
              <div ref="dimensionChart" class="chart-box" />
            </section>
            <section class="chart-block">
              <h4 class="block-title">信用评级变化情况</h4>
              <div ref="trendChart" class="chart-box" />
            </section>
          </div>

          <section class="behavior-section">
            <h4 class="block-title">行为明细</h4>
            <div class="behavior-timeline">
              <div
                v-for="item in profile.behaviors"
                :key="item.id"
                class="behavior-item"
                :class="`behavior-item--${item.tone}`"
              >
                <div class="behavior-item__dot" />
                <div class="behavior-item__content">
                  <div class="behavior-item__time">{{ item.time }}</div>
                  <div class="behavior-item__type">{{ item.type }}</div>
                  <div class="behavior-item__desc">{{ item.desc }}</div>
                  <div class="behavior-item__score" :class="item.score >= 0 ? 'score-pos' : 'score-neg'">
                    {{ item.score >= 0 ? `+${item.score}` : item.score }} 分
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="bottom-row">
            <div class="risk-box">
              <div class="risk-box__title">风险预警</div>
              <div class="risk-box__level">{{ profile.risk.level }}</div>
              <div class="risk-box__desc">{{ profile.risk.desc }}</div>
              <div class="risk-box__tip">建议：{{ profile.risk.suggestion }}</div>
            </div>
            <div class="stat-box">
              <div class="stat-box__title">均值对比</div>
              <div class="compare-bar">
                <div class="compare-bar__row">
                  <span>本人</span>
                  <div class="compare-bar__track"><div class="compare-bar__fill compare-bar__fill--self" :style="{ width: `${profile.compare.self}%` }" /></div>
                  <span>{{ profile.compare.self }}</span>
                </div>
                <div class="compare-bar__row">
                  <span>部门</span>
                  <div class="compare-bar__track"><div class="compare-bar__fill compare-bar__fill--dept" :style="{ width: `${profile.compare.dept}%` }" /></div>
                  <span>{{ profile.compare.dept }}</span>
                </div>
              </div>
            </div>
            <div class="stat-box">
              <div class="stat-box__title">同级排名</div>
              <div class="peer-rank">第 <strong>{{ profile.peerRank.rank }}</strong> 名 / 共 {{ profile.peerRank.total }} 人</div>
            </div>
            <div class="stat-box stat-box--wide">
              <div class="stat-box__title">部门等级分布</div>
              <div class="grade-dist">
                <div v-for="g in profile.deptGradeDist" :key="g.grade" class="grade-dist__item">
                  <span>{{ g.grade }}级</span>
                  <div class="grade-dist__bar"><div :style="{ width: `${g.percent}%` }" /></div>
                  <span>{{ g.percent }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer-actions">
            <el-button type="primary" size="small" @click="$message.info('查看详情')">查看详情</el-button>
            <el-button type="primary" size="small" plain @click="$message.success('报告导出中')">导出报告</el-button>
            <el-button size="small" @click="refreshProfile">刷新评分</el-button>
            <el-button size="small" @click="$message.info('备注记录')">备注记录</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption } from "../utils/chartTheme";
import {
  YEAR_OPTIONS,
  getProfileOrgTree,
  getEmployeeList,
  getEmployeeProfile,
} from "../utils/creditProfileData";

export default {
  name: "EmployeeCreditPortraitPanel",
  props: {
    panelActive: { type: Boolean, default: true },
  },
  data() {
    return {
      orgTree: getProfileOrgTree(),
      orgKeyword: "",
      employeeKeyword: "",
      treeProps: { label: "name", children: "children" },
      selectedEmployeeId: 1,
      queryYear: "2026",
      yearOptions: YEAR_OPTIONS,
      profile: getEmployeeProfile(1),
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    filteredOrgTree() {
      return this.filterTree(this.orgKeyword);
    },
    filteredEmployees() {
      return getEmployeeList(this.employeeKeyword);
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
    selectedEmployeeId(id) {
      this.profile = getEmployeeProfile(id);
      this.$nextTick(() => this.renderCharts());
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
    filterTree(keyword) {
      const kw = (keyword || "").trim();
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
    handleOrgClick() {},
    selectEmployee(id) {
      this.selectedEmployeeId = id;
    },
    refreshProfile() {
      this.profile = getEmployeeProfile(this.selectedEmployeeId);
      this.renderCharts();
      this.$message.success("已刷新评分");
    },
    initCharts(force = false) {
      const refs = { dimension: "dimensionChart", trend: "trendChart" };
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
      this.renderDimensionChart();
      this.renderTrendChart();
    },
    renderDimensionChart() {
      const chart = this.charts.dimension;
      if (!chart) return;
      const { dims, values } = this.profile.dimensionRadar;
      chart.setOption(
        baseChartOption({
          tooltip: {},
          radar: {
            indicator: dims.map((name) => ({ name, max: 100 })),
            center: ["50%", "55%"],
            radius: "68%",
            axisName: { fontSize: 11, color: "#606266" },
            splitArea: { areaStyle: { color: ["rgba(24,144,255,0.02)", "rgba(24,144,255,0.06)"] } },
          },
          series: [{
            type: "radar",
            data: [{
              value: values,
              areaStyle: { color: "rgba(24,144,255,0.25)" },
              lineStyle: { color: "#1890FF", width: 2 },
              itemStyle: { color: "#1890FF" },
            }],
          }],
        }),
        true
      );
      chart.resize();
    },
    renderTrendChart() {
      const chart = this.charts.trend;
      if (!chart) return;
      const { months, scores } = this.profile.ratingTrend;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          grid: { left: "3%", right: "4%", bottom: "8%", top: "12%", containLabel: true },
          xAxis: { type: "category", data: months },
          yAxis: { type: "value", min: 60, max: 90 },
          series: [{
            type: "line",
            smooth: true,
            data: scores,
            symbolSize: 8,
            lineStyle: { color: "#1890FF", width: 2 },
            itemStyle: { color: "#1890FF" },
            areaStyle: { color: "rgba(24,144,255,0.12)" },
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
.employee-portrait-panel {
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
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
  min-height: 0;
}

.employee-sidebar {
  width: 160px;
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

.org-tree-wrap,
.employee-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 4px;
}

.employee-item {
  padding: 10px 12px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  margin: 2px 6px;
}

.employee-item:hover { background: #f5f7fa; }
.employee-item.is-active { background: #e6f7ff; color: #1890ff; font-weight: 500; }

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

.profile-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 14px;
}

.profile-card__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
}

.profile-card__name-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.profile-card__name { font-size: 18px; font-weight: 600; color: #303133; }
.profile-card__grade { font-size: 16px; color: #1890ff; font-weight: 500; }
.profile-card__tags { display: flex; flex-wrap: wrap; gap: 8px; }

.score-overview {
  margin-bottom: 14px;
  padding: 12px 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.score-overview__total {
  font-size: 15px;
  color: #303133;
  margin-bottom: 10px;
}

.score-overview__total strong { font-size: 22px; color: #1890ff; }
.score-overview__cards { display: flex; flex-wrap: wrap; gap: 12px; }

.metric-card {
  flex: 1;
  min-width: 140px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.metric-card strong { color: #303133; font-size: 16px; }

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

.chart-box { height: 240px; width: 100%; }

.behavior-section {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 14px;
}

.behavior-timeline { display: flex; flex-direction: column; gap: 12px; }

.behavior-item {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 4px;
  border-left: 3px solid #1890ff;
  background: #fafafa;
}

.behavior-item--positive { border-left-color: #52c41a; background: #f6ffed; }
.behavior-item--negative { border-left-color: #f5222d; background: #fff1f0; }
.behavior-item--neutral { border-left-color: #1890ff; background: #e6f7ff; }

.behavior-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  margin-top: 6px;
  flex-shrink: 0;
}

.behavior-item__time { font-size: 12px; color: #909399; }
.behavior-item__type { font-size: 13px; font-weight: 500; color: #303133; margin: 2px 0; }
.behavior-item__desc { font-size: 13px; color: #606266; }
.behavior-item__score { font-size: 13px; font-weight: 600; margin-top: 4px; }

.score-pos { color: #52c41a; }
.score-neg { color: #f5222d; }

.bottom-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.risk-box {
  border: 1px solid #ffccc7;
  background: #fff2f0;
  border-radius: 4px;
  padding: 12px;
}

.risk-box__title { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.risk-box__level { font-size: 16px; color: #f5222d; font-weight: 600; margin-bottom: 4px; }
.risk-box__desc, .risk-box__tip { font-size: 12px; color: #606266; line-height: 1.6; }

.stat-box {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  background: #fafbfc;
}

.stat-box--wide { grid-column: span 1; }
.stat-box__title { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 8px; }

.compare-bar__row {
  display: grid;
  grid-template-columns: 36px 1fr 28px;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
}

.compare-bar__track {
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.compare-bar__fill { height: 100%; border-radius: 5px; }
.compare-bar__fill--self { background: #1890ff; }
.compare-bar__fill--dept { background: #52c41a; }

.peer-rank { font-size: 14px; color: #606266; }
.peer-rank strong { font-size: 24px; color: #1890ff; }

.grade-dist__item {
  display: grid;
  grid-template-columns: 28px 1fr 36px;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.grade-dist__bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.grade-dist__bar div { height: 100%; background: #1890ff; border-radius: 4px; }

.footer-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 4px;
}

@media (max-width: 1200px) {
  .chart-row { grid-template-columns: 1fr; }
  .bottom-row { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 992px) {
  .panel-layout { flex-direction: column; overflow: auto; }
  .org-sidebar, .employee-sidebar { width: 100%; height: 240px; }
  .main-panel { min-height: 600px; }
}
</style>
