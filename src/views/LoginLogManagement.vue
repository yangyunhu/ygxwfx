<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">日志管理功能</h2>
        <p class="page-desc">支持日志清理、本地 CSV 备份与恢复。系统日志仅保留三年，到期自动清除。</p>
      </div>
      <div class="head-actions">
        <el-button size="small" icon="el-icon-delete" @click="handlePurgeExpired">清除超期日志</el-button>
        <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">恢复默认数据</el-button>
      </div>
    </div>

    <login-log-retention-alert />

    <div class="stats-row">
      <span>当前日志 <strong>{{ logs.length }}</strong> 条</span>
      <span>备份记录 <strong>{{ backups.length }}</strong> 条</span>
      <span>保留策略 <strong>{{ retention.years }} 年</strong></span>
    </div>

    <section class="config-card">
      <div class="card-title">日志清理</div>
      <p class="section-tip">可按日期范围删除历史日志，或一键清除超出保留期限的记录。删除前建议先执行备份。</p>
      <el-form label-width="88px" size="small" class="manage-form">
        <el-form-item label="清理范围">
          <el-radio-group v-model="cleanMode">
            <el-radio label="expired">超期日志（早于 {{ retention.cutoffDate }}）</el-radio>
            <el-radio label="range">指定时间段</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="cleanMode === 'range'"
            v-model="cleanRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="margin-left: 12px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="danger" plain size="small" icon="el-icon-delete" @click="handleClean">执行清理</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="config-card">
      <div class="card-title">当前日志概览</div>
      <div class="table-scroll">
        <login-log-table :data="pagedLogs" :page="logPage" :page-size="logPageSize" :show-actions="false" />
      </div>
      <login-log-pager
        :total="logs.length"
        :page.sync="logPage"
        :page-size.sync="logPageSize"
        :page-sizes="[10, 20, 30]"
      />
    </section>

    <section class="config-card">
      <div class="card-title">备份日志</div>
      <p class="section-tip">如需长期归档，请及时备份即将到期的历史日志。本地 CSV 备份适用于快速导出与恢复。</p>

      <el-form label-width="88px" size="small" class="manage-form">
        <el-form-item label="备份范围">
          <el-select v-model="backupScope" style="width: 160px">
            <el-option label="全部日志" value="all" />
            <el-option label="按时间段" value="range" />
          </el-select>
          <el-date-picker
            v-if="backupScope === 'range'"
            v-model="backupRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="margin-left: 10px"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="backupRemark" placeholder="可选" clearable style="width: 320px" />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="small"
            icon="el-icon-folder-checked"
            :loading="backingUp"
            @click="handleBackup"
          >
            执行本地备份
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="backups" border size="small" empty-text="暂无备份记录">
        <el-table-column prop="createdTime" label="备份时间" width="160" />
        <el-table-column prop="methodLabel" label="备份方式" width="160" />
        <el-table-column label="文件" min-width="200" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span>{{ row.filename || row.platformTaskId || "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="记录数" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'info'" size="mini">
              {{ row.method === "nw_damp" ? (row.platformStatus || "已归档") : "已完成" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="downloadBackup(row)">下载</el-button>
            <el-button v-if="row.method !== 'nw_damp'" type="text" size="small" @click="restoreBackup(row)">恢复</el-button>
            <el-button type="text" size="small" class="danger-text" @click="removeBackup(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script>
import LoginLogRetentionAlert from "../components/LoginLogRetentionAlert.vue";
import LoginLogTable from "../components/LoginLogTable.vue";
import LoginLogPager from "../components/LoginLogPager.vue";
import {
  loadLoginLogs,
  resetLoginLogs,
  filterLoginLogs,
  backupLoginLogs,
  getLoginLogBackups,
  restoreLoginLogBackup,
  deleteLoginLogBackup,
  downloadBackupRecord,
  paginateLogs,
  deleteLoginLogsByRange,
  purgeExpiredLoginLogs,
  getLogRetentionInfo,
} from "../utils/loginLog";

export default {
  name: "LoginLogManagement",
  components: { LoginLogRetentionAlert, LoginLogTable, LoginLogPager },
  data() {
    return {
      logs: [],
      backups: [],
      retention: getLogRetentionInfo(),
      backupScope: "all",
      backupRange: null,
      backupRemark: "",
      backingUp: false,
      logPage: 1,
      logPageSize: 10,
      cleanMode: "expired",
      cleanRange: null,
    };
  },
  computed: {
    pagedLogs() {
      return paginateLogs(this.logs, this.logPage, this.logPageSize).list;
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.logs = loadLoginLogs();
      this.backups = getLoginLogBackups();
      this.retention = getLogRetentionInfo();
    },
    handlePurgeExpired() {
      this.$confirm("确定清除所有超出三年保留期限的日志？", "清除超期日志", { type: "warning" })
        .then(() => {
          const { removed } = purgeExpiredLoginLogs();
          this.reload();
          this.$message.success(removed ? `已清除 ${removed} 条超期日志` : "当前无超期日志");
        })
        .catch(() => {});
    },
    handleClean() {
      if (this.cleanMode === "expired") {
        this.handlePurgeExpired();
        return;
      }
      if (!this.cleanRange || this.cleanRange.length !== 2) {
        this.$message.warning("请选择清理时间段");
        return;
      }
      this.$confirm(`确定删除 ${this.cleanRange[0]} 至 ${this.cleanRange[1]} 范围内的登录日志？`, "日志清理", { type: "warning" })
        .then(() => {
          const { removed } = deleteLoginLogsByRange(this.cleanRange);
          this.reload();
          this.$message.success(`已删除 ${removed} 条日志`);
        })
        .catch((e) => {
          if (e && e.message) this.$message.warning(e.message);
        });
    },
    getBackupData() {
      if (this.backupScope === "all") return this.logs;
      if (!this.backupRange || this.backupRange.length !== 2) {
        throw new Error("请选择备份时间段");
      }
      return filterLoginLogs(this.logs, { dateRange: this.backupRange });
    },
    handleBackup() {
      try {
        const data = this.getBackupData();
        if (!data.length) {
          this.$message.warning("没有可备份的日志");
          return;
        }
        this.backingUp = true;
        backupLoginLogs(data, this.backupRemark);
        this.reload();
        this.backupRemark = "";
        this.backingUp = false;
        this.$message.success("本地备份完成，CSV 文件已下载");
      } catch (e) {
        this.backingUp = false;
        this.$message.warning(e.message || "备份失败");
      }
    },
    downloadBackup(row) {
      downloadBackupRecord(row);
    },
    restoreBackup(row) {
      this.$confirm(`确定将日志恢复为 ${row.createdTime} 的备份（${row.count} 条）？当前日志将被覆盖。`, "恢复备份", { type: "warning" })
        .then(() => {
          restoreLoginLogBackup(row.id);
          this.reload();
          this.$message.success("已恢复");
        })
        .catch((e) => {
          if (e && e.message) this.$message.warning(e.message);
        });
    },
    removeBackup(row) {
      const name = row.filename || row.platformTaskId || "备份";
      this.$confirm(`确定删除备份记录「${name}」？`, "删除备份", { type: "warning" })
        .then(() => {
          deleteLoginLogBackup(row.id);
          this.reload();
          this.$message.success("备份记录已删除");
        }).catch(() => {});
    },
    handleReset() {
      this.$confirm("确定恢复默认登录日志数据？", "恢复默认", { type: "warning" })
        .then(() => {
          resetLoginLogs();
          this.reload();
          this.$message.success("已恢复默认");
        }).catch(() => {});
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.section-tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
}

.danger-text {
  color: #f56c6c;
}

.manage-form {
  max-width: 860px;
}

.table-scroll {
  overflow-x: auto;
}
</style>
