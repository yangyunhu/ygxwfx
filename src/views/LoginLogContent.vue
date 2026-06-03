<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">日志内容</h2>
        <p class="page-desc">记录并展示用户登录详细信息，包括部门、账号、访问时间、浏览器及终端环境等。</p>
      </div>
      <el-button size="small" icon="el-icon-download" @click="exportLogs">导出</el-button>
    </div>

    <login-log-retention-alert />

    <section class="config-card login-log-card">
      <div class="card-toolbar">
        <span class="toolbar-meta">日志总数 <strong>{{ logs.length }}</strong></span>
      </div>
      <div class="table-scroll">
        <login-log-table
          :data="pagedList"
          :page="page"
          :page-size="pageSize"
          empty-text="暂无登录日志"
        />
      </div>
      <login-log-pager
        :total="logs.length"
        :page.sync="page"
        :page-size.sync="pageSize"
        :page-sizes="[10, 20, 30]"
      />
    </section>
  </div>
</template>

<script>
import LoginLogRetentionAlert from "../components/LoginLogRetentionAlert.vue";
import LoginLogTable from "../components/LoginLogTable.vue";
import LoginLogPager from "../components/LoginLogPager.vue";
import {
  loadLoginLogs,
  paginateLogs,
  exportLoginLogsCsv,
} from "../utils/loginLog";

export default {
  name: "LoginLogContent",
  components: { LoginLogRetentionAlert, LoginLogTable, LoginLogPager },
  data() {
    return {
      logs: [],
      page: 1,
      pageSize: 20,
    };
  },
  computed: {
    pagedList() {
      return paginateLogs(this.logs, this.page, this.pageSize).list;
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.logs = loadLoginLogs();
    },
    exportLogs() {
      exportLoginLogsCsv(this.logs, "登录日志内容.csv", {
        moduleName: "日志内容",
        searchCriteria: "全部日志",
      });
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.login-log-card {
  padding-top: 12px;
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.toolbar-meta {
  font-size: 13px;
  color: #606266;
}

.toolbar-meta strong {
  color: #409eff;
  margin: 0 2px;
}

.table-scroll {
  overflow-x: auto;
}
</style>
