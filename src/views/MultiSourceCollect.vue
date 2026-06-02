<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据汇集</h2>
        <p class="page-desc">整合无感数据源与接口接入数据，按人员ID关联排序。</p>
      </div>
      <div class="head-actions">
        <el-tag v-if="aggregated && aggregated.aggregatedAt" size="small" type="info">
          最近汇集：{{ formatAggregatedAt(aggregated.aggregatedAt) }}
        </el-tag>
      </div>
    </div>

    <div class="stats-row">
      <span>汇集记录 <strong>{{ stats.totalRows || 0 }}</strong></span>
      <span>人员 <strong>{{ stats.personCount || 0 }}</strong></span>
      <span>闸机 <strong>{{ stats.gateCount || 0 }}</strong></span>
      <span>食堂 <strong>{{ stats.canteenCount || 0 }}</strong></span>
      <span>线上源 <strong>{{ stats.onlineCount || 0 }}</strong></span>
      <span>API <strong>{{ stats.apiCount || 0 }}</strong></span>
    </div>

    <div class="agg-pane-toolbar">
      <el-button type="primary" size="small" icon="el-icon-refresh" :loading="aggregating" @click="runAggregate">
        执行数据汇集
      </el-button>
      <span class="agg-pane-hint">整合无感数据源与接口接入数据，按人员ID关联排序</span>
    </div>

    <section class="config-card agg-pane-card">
      <el-table
        :data="pagedPersonGroups"
        border
        stripe
        size="small"
        style="width: 100%"
        empty-text="请先执行数据汇集"
      >
        <el-table-column type="index" label="序号" width="55" :index="collectIndexMethod" />
        <el-table-column prop="personId" label="人员ID" width="100" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="orgName" label="组织机构" min-width="200" show-overflow-tooltip />
        <el-table-column prop="recordCount" label="轨迹条数" width="90" align="center" />
        <el-table-column prop="sources" label="数据来源" min-width="180" show-overflow-tooltip />
        <el-table-column prop="dateRange" label="日期范围" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="viewPerson(row)">查看轨迹</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :total="personGroups.length"
          :current-page.sync="collectPage"
          :page-size.sync="collectPageSize"
          :page-sizes="[10, 20, 50]"
        />
      </div>
    </section>
  </div>
</template>

<script>
import {
  loadAggregatedData,
  runMultiSourceAggregation,
  groupByPersonId,
  paginateRows,
} from "../utils/multiSourceAggregation";

export default {
  name: "MultiSourceCollect",
  data() {
    return {
      aggregated: null,
      aggregating: false,
      collectPage: 1,
      collectPageSize: 10,
    };
  },
  computed: {
    stats() {
      return (this.aggregated && this.aggregated.stats) || {};
    },
    personGroups() {
      if (!this.aggregated) return [];
      return groupByPersonId(this.aggregated.rows);
    },
    pagedPersonGroups() {
      return paginateRows(this.personGroups, this.collectPage, this.collectPageSize).list;
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.aggregated = loadAggregatedData();
    },
    runAggregate() {
      this.aggregating = true;
      setTimeout(() => {
        this.aggregated = runMultiSourceAggregation();
        this.aggregating = false;
        this.$message.success(`汇集完成：${this.aggregated.rows.length} 条轨迹记录`);
      }, 400);
    },
    viewPerson(row) {
      this.$router.push({
        path: "/multi-source-aggregation/display",
        query: { personId: row.personId, keyword: row.name },
      });
    },
    collectIndexMethod(index) {
      return (this.collectPage - 1) * this.collectPageSize + index + 1;
    },
    formatAggregatedAt(iso) {
      if (!iso) return "—";
      try {
        return iso.replace("T", " ").slice(0, 19);
      } catch (e) {
        return iso;
      }
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.head-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
.agg-pane-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.agg-pane-hint { font-size: 12px; color: #909399; }
.agg-pane-card { margin-bottom: 0; }
.pager { margin-top: 12px; text-align: right; }
</style>
