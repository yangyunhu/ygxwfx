<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据修复记录</h2>
        <p class="page-desc">所有数据修复操作均有详细记录，并经过审批流程，确保修复准确性与可追溯性。</p>
      </div>
      <el-button size="small" icon="el-icon-download" @click="exportRecords">导出</el-button>
    </div>

    <div class="stats-row">
      <span>修复申请 <strong>{{ records.length }}</strong></span>
      <span>待审批 <strong>{{ pendingCount }}</strong></span>
      <span>已通过 <strong>{{ approvedCount }}</strong></span>
      <span>已驳回 <strong>{{ rejectedCount }}</strong></span>
    </div>

    <section class="config-card">
      <div class="card-tools">
        <el-select v-model="statusFilter" placeholder="审批状态" size="small" clearable style="width: 120px">
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-input v-model="keyword" placeholder="姓名/申请人/数据源" prefix-icon="el-icon-search" size="small" clearable style="width: 220px" />
      </div>

      <el-table :data="filteredRecords" border size="small" empty-text="暂无修复记录">
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="applyTime" label="申请时间" width="160" />
        <el-table-column prop="applicant" label="申请人" width="90" />
        <el-table-column prop="sourceName" label="数据源" min-width="140" show-overflow-tooltip />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="fieldLabel" label="修正字段" width="120" />
        <el-table-column label="修改前/后" min-width="200">
          <template slot-scope="{ row }">
            <span class="value-before">{{ row.beforeValue || "—" }}</span>
            <i class="el-icon-right" />
            <span class="value-after">{{ row.afterValue }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="statusType(row.status)" size="mini">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openDetail(row)">详情</el-button>
            <template v-if="row.status === 'pending'">
              <el-button type="text" size="small" @click="openApprove(row, true)">通过</el-button>
              <el-button type="text" size="small" class="danger-text" @click="openApprove(row, false)">驳回</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog :title="detailTitle" :visible.sync="showDetail" width="600px" append-to-body>
      <el-descriptions v-if="detailRow" :column="2" border size="small">
        <el-descriptions-item label="申请时间">{{ detailRow.applyTime }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detailRow.applicant }}</el-descriptions-item>
        <el-descriptions-item label="数据源">{{ detailRow.sourceName }}</el-descriptions-item>
        <el-descriptions-item label="校验规则">{{ detailRow.ruleName }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="人员ID">{{ detailRow.personId }}</el-descriptions-item>
        <el-descriptions-item label="修正字段">{{ detailRow.fieldLabel }}</el-descriptions-item>
        <el-descriptions-item label="审批状态">{{ statusLabel(detailRow.status) }}</el-descriptions-item>
        <el-descriptions-item label="修改前">{{ detailRow.beforeValue || "—" }}</el-descriptions-item>
        <el-descriptions-item label="修改后">{{ detailRow.afterValue }}</el-descriptions-item>
        <el-descriptions-item label="申请原因" :span="2">{{ detailRow.applyReason }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRow.approver" label="审批人">{{ detailRow.approver }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRow.approveTime" label="审批时间">{{ detailRow.approveTime }}</el-descriptions-item>
        <el-descriptions-item v-if="detailRow.approveRemark" label="审批意见" :span="2">{{ detailRow.approveRemark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog :title="approveTitle" :visible.sync="showApprove" width="480px" append-to-body>
      <el-form label-width="80px" size="small">
        <el-form-item label="审批意见">
          <el-input v-model="approveRemark" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showApprove = false">取消</el-button>
        <el-button :type="approvePass ? 'primary' : 'danger'" @click="confirmApprove">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getRepairRecords,
  approveRepair,
  rejectRepair,
  exportRepairCsv,
} from "../utils/dataRepairManagement";

export default {
  name: "DataRepairRecords",
  data() {
    return {
      records: [],
      statusFilter: "",
      keyword: "",
      showDetail: false,
      detailRow: null,
      showApprove: false,
      approveRow: null,
      approvePass: true,
      approveRemark: "",
    };
  },
  computed: {
    pendingCount() { return this.records.filter((r) => r.status === "pending").length; },
    approvedCount() { return this.records.filter((r) => r.status === "approved").length; },
    rejectedCount() { return this.records.filter((r) => r.status === "rejected").length; },
    filteredRecords() {
      const kw = this.keyword.trim().toLowerCase();
      return this.records.filter((r) => {
        const matchStatus = !this.statusFilter || r.status === this.statusFilter;
        const matchKw = !kw ||
          r.name.toLowerCase().includes(kw) ||
          r.applicant.toLowerCase().includes(kw) ||
          (r.sourceName && r.sourceName.toLowerCase().includes(kw));
        return matchStatus && matchKw;
      });
    },
    detailTitle() {
      return this.detailRow ? `修复详情 - ${this.detailRow.name}` : "修复详情";
    },
    approveTitle() {
      return this.approvePass ? "审批通过" : "审批驳回";
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.records = getRepairRecords();
    },
    statusType(s) {
      const map = { pending: "warning", approved: "success", rejected: "danger" };
      return map[s] || "info";
    },
    statusLabel(s) {
      const map = { pending: "待审批", approved: "已通过", rejected: "已驳回" };
      return map[s] || s;
    },
    openDetail(row) {
      this.detailRow = row;
      this.showDetail = true;
    },
    openApprove(row, pass) {
      this.approveRow = row;
      this.approvePass = pass;
      this.approveRemark = "";
      this.showApprove = true;
    },
    confirmApprove() {
      try {
        if (this.approvePass) {
          approveRepair(this.approveRow.id, "系统管理员", this.approveRemark);
          this.$message.success("审批已通过，数据已更新");
        } else {
          rejectRepair(this.approveRow.id, "系统管理员", this.approveRemark);
          this.$message.success("已驳回");
        }
        this.reload();
        this.showApprove = false;
      } catch (e) {
        this.$message.warning(e.message);
      }
    },
    exportRecords() {
      exportRepairCsv(this.filteredRecords, "数据修复记录.csv");
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.value-before { color: #f56c6c; }
.value-after { color: #67c23a; }
.el-icon-right { margin: 0 6px; color: #909399; }
.danger-text { color: #f56c6c; }
</style>
