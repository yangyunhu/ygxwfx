<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据导出功能</h2>
        <p class="page-desc">系统自动记录各业务模块导出操作（CSV / Excel / TXT），便于审计与追溯。</p>
      </div>
      <el-button size="small" type="primary" plain @click="goQuery">导出记录查询</el-button>
    </div>

    <export-retention-alert />

    <div class="stats-row">
      <span>导出记录 <strong>{{ stats.total }}</strong></span>
      <span>今日导出 <strong>{{ stats.today }}</strong></span>
      <span>支持格式 <strong>CSV / Excel / TXT</strong></span>
    </div>

    <section class="config-card">
      <div class="card-head">
        <div class="card-title" style="margin:0;border:none;padding:0">最近导出记录</div>
        <el-button size="small" @click="reload">刷新</el-button>
      </div>
      <el-table :data="recentRecords" border size="small" empty-text="暂无导出记录">
        <el-table-column prop="exportTime" label="导出时间" width="160" />
        <el-table-column prop="moduleName" label="业务模块" min-width="150" />
        <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="90" />
      </el-table>
    </section>

    <section class="config-card">
      <div class="card-title">导出格式说明</div>
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="CSV">逗号分隔值文件，适用于 Excel 打开及数据交换（当前多数模块默认格式）</el-descriptions-item>
        <el-descriptions-item label="Excel">xlsx 格式，适用于复杂表格与多 Sheet 导出</el-descriptions-item>
        <el-descriptions-item label="TXT">纯文本格式，适用于日志类或简单列表导出</el-descriptions-item>
      </el-descriptions>
    </section>
  </div>
</template>

<script>
import ExportRetentionAlert from "../components/ExportRetentionAlert.vue";
import {
  loadExportRecords,
  countExportStats,
} from "../utils/exportRecordManagement";

export default {
  name: "DataExportFunction",
  components: { ExportRetentionAlert },
  data() {
    return {
      records: [],
      stats: countExportStats([]),
    };
  },
  computed: {
    recentRecords() {
      return this.records.slice(0, 15);
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.records = loadExportRecords();
      this.stats = countExportStats(this.records);
    },
    goQuery() {
      this.$router.push("/export-record-query");
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
