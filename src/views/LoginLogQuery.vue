<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">查询功能</h2>
        <p class="page-desc">系统支持按时间段、用户名、登录终端、登录 IP 地址等多种条件组合查询登录日志。</p>
      </div>
      <el-button size="small" icon="el-icon-download" :disabled="!resultList.length" @click="exportResult">导出结果</el-button>
    </div>

    <login-log-retention-alert />

    <section class="config-card query-bar-card">
      <el-form :model="query" label-width="88px" size="small" class="query-form" @submit.native.prevent="handleSearch">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="时间段">
              <el-date-picker
                v-model="query.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="用户名">
              <el-input
                v-model="query.username"
                placeholder="用户名或姓名"
                clearable
                @keyup.enter.native="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="登录终端">
              <el-select v-model="query.terminal" placeholder="全部终端" clearable style="width: 100%">
                <el-option v-for="t in terminalOptions" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="登录IP">
              <el-input
                v-model="query.ip"
                placeholder="IP 地址"
                clearable
                @keyup.enter.native="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="用户账号">
              <el-input
                v-model="query.account"
                placeholder="邮箱账号"
                clearable
                @keyup.enter.native="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="部门名称">
              <el-input
                v-model="query.deptName"
                placeholder="部门名称"
                clearable
                @keyup.enter.native="handleSearch"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="query-form-actions">
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
        </div>
      </el-form>
      <div v-if="searched" class="query-summary">
        查询结果 <strong>{{ resultList.length }}</strong> 条
        <span v-if="searchLabel" class="query-label">（{{ searchLabel }}）</span>
      </div>
    </section>

    <section class="config-card login-log-card">
      <div class="table-scroll">
        <login-log-table
          :data="pagedList"
          :page="page"
          :page-size="pageSize"
          :empty-text="searched ? '未查询到符合条件的日志' : '请设置条件后点击查询'"
        />
      </div>
      <login-log-pager
        :total="resultList.length"
        :page.sync="page"
        :page-size.sync="pageSize"
        :page-sizes="[10, 20, 30]"
        @size-change="page = 1"
      />
    </section>
  </div>
</template>

<script>
import LoginLogRetentionAlert from "../components/LoginLogRetentionAlert.vue";
import LoginLogTable from "../components/LoginLogTable.vue";
import LoginLogPager from "../components/LoginLogPager.vue";
import querySearchMixin from "../mixins/querySearchMixin";
import {
  loadLoginLogs,
  filterLoginLogs,
  paginateLogs,
  exportLoginLogsCsv,
  formatSearchCriteria,
  createEmptyLogQuery,
  TERMINAL_OPTIONS,
} from "../utils/loginLog";

export default {
  name: "LoginLogQuery",
  components: { LoginLogRetentionAlert, LoginLogTable, LoginLogPager },
  mixins: [querySearchMixin],
  data() {
    return {
      allLogs: [],
      resultList: [],
      searched: false,
      searchLabel: "",
      terminalOptions: TERMINAL_OPTIONS,
      query: createEmptyLogQuery(),
      page: 1,
      pageSize: 20,
    };
  },
  computed: {
    pagedList() {
      return paginateLogs(this.resultList, this.page, this.pageSize).list;
    },
  },
  mounted() {
    this.allLogs = loadLoginLogs();
    this.runDefaultQuery(true);
  },
  methods: {
    runDefaultQuery(silent) {
      this.searched = true;
      this.applyQuery(silent);
    },
    applyQuery(silent) {
      this.resultList = filterLoginLogs(this.allLogs, this.query);
      this.searchLabel = formatSearchCriteria(this.query);
      this.page = 1;
      if (!silent && !this.resultList.length) {
        this.$message.info("未查询到符合条件的日志");
      }
    },
    handleSearch() {
      if (!this.query.dateRange || this.query.dateRange.length !== 2) {
        this.$message.warning("请选择查询时间段");
        return;
      }
      this.searched = true;
      this.applyQuery(false);
    },
    handleReset() {
      this.query = createEmptyLogQuery();
      this.runDefaultQuery(true);
    },
    exportResult() {
      exportLoginLogsCsv(this.resultList, "登录日志查询结果.csv", {
        moduleName: "查询功能",
        searchCriteria: this.searchLabel,
      });
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.query-bar-card {
  padding: 14px 16px 12px;
}

.query-form {
  margin-bottom: 0;
}

.query-form >>> .el-form-item {
  margin-bottom: 12px;
}

.query-form-actions {
  display: flex;
  gap: 8px;
  padding-left: 88px;
  margin-bottom: 4px;
}

.query-summary {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #606266;
}

.query-summary strong {
  color: #409eff;
}

.query-label {
  color: #909399;
  margin-left: 4px;
}

.login-log-card {
  padding-top: 12px;
}

.table-scroll {
  overflow-x: auto;
}

@media (max-width: 768px) {
  .query-form-actions {
    padding-left: 0;
  }
}
</style>
