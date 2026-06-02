<template>
  <div class="staff-post-page">
    <main class="staff-post-main">
      <div class="page-head">
        <div>
          <h2 class="page-title">人员与岗位关联配置</h2>
          <p class="page-desc">
            展示无感数据清洗后岗位类别/序列/名称缺失的人员，支持手动关联至人资岗位体系。
          </p>
        </div>
        <div class="head-actions">
          <el-button size="small" icon="el-icon-refresh" @click="rescanMissing">重新扫描</el-button>
          <el-button size="small" icon="el-icon-document" @click="showReference = true">
            岗位序列对照
          </el-button>
          <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">恢复默认</el-button>
        </div>
      </div>

      <div class="staff-post-main-scroll">
        <div class="stats-row">
          <div class="stat-card stat-pending">
            <span class="stat-num">{{ missingStats.pending }}</span>
            <span class="stat-label">待关联</span>
          </div>
          <div class="stat-card stat-linked">
            <span class="stat-num">{{ missingStats.resolved }}</span>
            <span class="stat-label">已手动关联</span>
          </div>
          <div class="stat-card stat-total">
            <span class="stat-num">{{ filteredPendingList.length }}</span>
            <span class="stat-label">本页记录合计</span>
          </div>
        </div>
        <section class="config-card">
          <div class="filter-row">
            <el-input
              v-model="pendingKeyword"
              placeholder="姓名 / 人员ID / 数据源"
              prefix-icon="el-icon-search"
              size="small"
              clearable
              class="filter-input"
              @keyup.enter.native="handleSearch"
            />
            <el-select v-model="pendingSource" placeholder="数据源" clearable size="small" style="width: 200px">
              <el-option v-for="s in pendingSourceOptions" :key="s" :label="s" :value="s" />
            </el-select>
            <el-select v-model="pendingStatus" placeholder="关联状态" size="small" style="width: 140px">
              <el-option label="待关联" value="pending" />
              <el-option label="已手动关联" value="resolved" />
              <el-option label="全部" value="all" />
            </el-select>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" @click="resetPendingFilter">重置</el-button>
          </div>
          <div class="action-row">
            <el-button
              type="primary"
              size="small"
              icon="el-icon-link"
              :disabled="!pendingSelectedRows.length"
              @click="openPendingAssignDialog"
            >
              批量关联（{{ pendingSelectedRows.length }}）
            </el-button>
            <span v-if="pendingSelectedRows.length" class="action-hint">
              已选 {{ pendingSelectedRows.length }} 条待关联记录
            </span>
            <span v-else class="action-hint muted">勾选待关联记录后点击批量关联，或在弹窗中选择目标岗位</span>
          </div>
          <el-table
            :data="filteredPendingList"
            border
            stripe
            size="small"
            empty-text="暂无岗位缺失人员"
            @selection-change="handlePendingSelectionChange"
          >
            <el-table-column type="selection" width="46" align="center" :selectable="pendingRowSelectable" />
            <el-table-column type="index" label="序号" width="55" />
            <el-table-column label="数据源" min-width="168" show-overflow-tooltip>
              <template slot-scope="{ row }">{{ formatSourceNames(row) }}</template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="90" show-overflow-tooltip />
            <el-table-column prop="personId" label="人员ID" width="100" show-overflow-tooltip />
            <el-table-column prop="orgName" label="组织机构" min-width="160" show-overflow-tooltip />
            <el-table-column label="原数据岗位" min-width="120" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span class="text-muted">{{ formatRawPost(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="关联岗位" min-width="160" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span :class="{ 'text-muted': !linkedPostLabel(row) }">{{ linkedPostLabel(row) || "—" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110" align="center">
              <template slot-scope="{ row }">
                <el-tag v-if="row.status === 'pending'" type="warning" size="mini">待关联</el-tag>
                <el-tag v-else type="success" size="mini">已手动关联</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center" fixed="right">
              <template slot-scope="{ row }">
                <el-button
                  v-if="row.status === 'pending'"
                  type="text"
                  size="small"
                  @click="openSinglePendingAssign(row)"
                >
                  关联岗位
                </el-button>
                <el-button v-if="row.status === 'resolved'" type="text" size="small" @click="openPendingDetail(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>
    </main>

    <el-dialog
      :title="pendingAssignTitle"
      :visible.sync="showPendingAssignDialog"
      width="520px"
      append-to-body
      @closed="resetPendingAssignForm"
    >
      <p class="assign-tip">为清洗后岗位信息缺失的人员指定人资岗位类别 → 岗位序列 → 具体岗位。</p>
      <el-form label-width="88px" size="small">
        <el-form-item v-if="pendingAssignRows.length === 1" label="人员">
          <span>{{ pendingAssignRows[0].name }}（{{ pendingAssignRows[0].personId }}）</span>
        </el-form-item>
        <el-form-item v-else label="调整人数">
          <span>{{ pendingAssignRows.length }} 人</span>
        </el-form-item>
        <el-form-item v-if="pendingAssignRows.length === 1" label="原数据岗位">
          <span class="text-muted">—</span>
        </el-form-item>
        <el-form-item label="目标岗位">
          <el-cascader
            v-model="pendingAssignCascader"
            :options="cascaderOptions"
            filterable
            clearable
            placeholder="岗位类别 / 岗位序列 / 岗位"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showPendingAssignDialog = false">取消</el-button>
        <el-button type="primary" :disabled="pendingAssignCascader.length < 3" @click="confirmPendingAssign">
          保存关联
        </el-button>
      </span>
    </el-dialog>

    <el-dialog title="已关联岗位信息" :visible.sync="showPendingDetail" width="560px" append-to-body>
      <el-descriptions v-if="pendingDetailRow" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ pendingDetailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="人员ID">{{ pendingDetailRow.personId }}</el-descriptions-item>
        <el-descriptions-item label="组织机构" :span="2">{{ pendingDetailRow.orgName }}</el-descriptions-item>
        <el-descriptions-item label="岗位类别">{{ pendingDetailRow.postCategory }}</el-descriptions-item>
        <el-descriptions-item label="岗位序列">{{ pendingDetailRow.postSequence }}</el-descriptions-item>
        <el-descriptions-item label="岗位名称">{{ pendingDetailRow.hrPostName }}</el-descriptions-item>
        <el-descriptions-item label="岗位编码">{{ pendingDetailRow.hrPostCode }}</el-descriptions-item>
        <el-descriptions-item label="关联时间">{{ pendingDetailRow.resolvedAt }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ pendingDetailRow.resolvedBy }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer">
        <el-button type="primary" @click="showPendingDetail = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="人资岗位类别与岗位序列对照"
      :visible.sync="showReference"
      width="720px"
      append-to-body
      class="reference-dialog"
    >
      <p class="reference-tip">以下为人资系统标准岗位类别与岗位序列对应关系。</p>
      <el-table :data="referenceRows" border size="small" :span-method="referenceSpanMethod">
        <el-table-column prop="category" label="岗位类别" width="140" />
        <el-table-column prop="sequence" label="岗位序列" min-width="280" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import {
  loadPositionTree,
  getCategorySequenceTableRows,
  toPostCascaderOptions,
  resetStaffPostRelationMap,
} from "../utils/positionRelation";
import {
  scanMissingPostPersonnel,
  countMissingPostStats,
  filterMissingPostList,
  getMissingPostSourceOptions,
  resolvePersonPostBinding,
  batchResolvePersonPostBindings,
  clearResolvedPostBindings,
} from "../utils/staffPostMissing";

export default {
  name: "StaffPostRelationConfig",
  data() {
    return {
      positionTree: [],
      scanResult: { pending: [], resolved: [], missingRowCount: 0, scannedAt: "" },
      pendingKeyword: "",
      pendingSource: "",
      pendingStatus: "pending",
      filterKeyword: "",
      filterSource: "",
      filterStatus: "pending",
      pendingSelectedRows: [],
      showPendingAssignDialog: false,
      pendingAssignTitle: "关联岗位",
      pendingAssignRows: [],
      pendingAssignCascader: [],
      showPendingDetail: false,
      pendingDetailRow: null,
      showReference: false,
      referenceRows: getCategorySequenceTableRows(),
    };
  },
  computed: {
    missingStats() {
      return countMissingPostStats(this.scanResult);
    },
    pendingSourceOptions() {
      return getMissingPostSourceOptions(this.scanResult);
    },
    pendingListAll() {
      const pending = (this.scanResult.pending || []).map((r) => ({ ...r, status: "pending" }));
      const resolved = (this.scanResult.resolved || []).map((r) => ({ ...r, status: "resolved" }));
      if (this.filterStatus === "pending") return pending;
      if (this.filterStatus === "resolved") return resolved;
      return [...pending, ...resolved];
    },
    filteredPendingList() {
      return filterMissingPostList(this.pendingListAll, {
        keyword: this.filterKeyword,
        source: this.filterSource,
        status: this.filterStatus === "all" ? "" : this.filterStatus,
      });
    },
    cascaderOptions() {
      return toPostCascaderOptions(this.positionTree);
    },
  },
  mounted() {
    this.positionTree = loadPositionTree();
    this.rescanMissing(false);
  },
  methods: {
    formatRawPost() {
      return "—";
    },
    formatSourceNames(row) {
      return (row.sourceNames || []).join("、") || "—";
    },
    linkedPostLabel(row) {
      if (row.status !== "resolved") return "";
      const parts = [row.postCategory, row.postSequence, row.hrPostName].filter(Boolean);
      return parts.length ? parts.join(" / ") : row.hrPostName || "";
    },
    handleSearch() {
      this.filterKeyword = this.pendingKeyword;
      this.filterSource = this.pendingSource;
      this.filterStatus = this.pendingStatus;
      this.$message.success(`查询成功，共 ${this.filteredPendingList.length} 条`);
    },
    resetPendingFilter() {
      this.pendingKeyword = "";
      this.pendingSource = "";
      this.pendingStatus = "pending";
      this.filterKeyword = "";
      this.filterSource = "";
      this.filterStatus = "pending";
    },
    rescanMissing(showMsg = true) {
      this.scanResult = scanMissingPostPersonnel();
      if (showMsg) {
        this.$message.success(`扫描完成，待关联 ${this.missingStats.pending} 人`);
      }
    },
    pendingRowSelectable(row) {
      return row.status === "pending";
    },
    handlePendingSelectionChange(rows) {
      this.pendingSelectedRows = rows;
    },
    openSinglePendingAssign(row) {
      this.pendingAssignRows = [row];
      this.pendingAssignTitle = `关联岗位 - ${row.name}`;
      this.pendingAssignCascader = [];
      this.showPendingAssignDialog = true;
    },
    openPendingAssignDialog() {
      if (!this.pendingSelectedRows.length) return;
      this.pendingAssignRows = [...this.pendingSelectedRows];
      this.pendingAssignTitle = `批量关联岗位（${this.pendingAssignRows.length} 人）`;
      this.pendingAssignCascader = [];
      this.showPendingAssignDialog = true;
    },
    resetPendingAssignForm() {
      this.pendingAssignRows = [];
      this.pendingAssignCascader = [];
    },
    confirmPendingAssign() {
      try {
        if (this.pendingAssignRows.length === 1) {
          resolvePersonPostBinding(
            this.pendingAssignRows[0],
            this.pendingAssignCascader,
            this.positionTree
          );
        } else {
          batchResolvePersonPostBindings(
            this.pendingAssignRows,
            this.pendingAssignCascader,
            this.positionTree
          );
        }
        this.rescanMissing(false);
        this.showPendingAssignDialog = false;
        this.pendingSelectedRows = [];
        this.$message.success("岗位关联已保存");
      } catch (err) {
        this.$message.warning(err.message || "保存失败");
      }
    },
    openPendingDetail(row) {
      this.pendingDetailRow = row;
      this.showPendingDetail = true;
    },
    referenceSpanMethod({ row, columnIndex }) {
      if (columnIndex === 0) {
        if (row.categoryRowspan) {
          return { rowspan: row.categoryRowspan, colspan: 1 };
        }
        return { rowspan: 0, colspan: 0 };
      }
      return { rowspan: 1, colspan: 1 };
    },
    handleReset() {
      this.$confirm("确定恢复默认人员岗位关联？将覆盖当前所有关联配置及待关联处理记录。", "恢复默认", {
        type: "warning",
      })
        .then(() => {
          resetStaffPostRelationMap();
          clearResolvedPostBindings();
          this.rescanMissing(false);
          this.pendingSelectedRows = [];
          this.$message.success("已恢复默认关联");
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.staff-post-page {
  height: calc(100vh - 60px);
  padding: 12px 16px;
  background: #eef1f6;
  box-sizing: border-box;
  overflow: hidden;
}

.staff-post-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.staff-post-main-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 16px 16px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #dcdfe6;
  padding: 12px 16px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.page-desc {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.head-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  flex: 1;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background: #fafafa;
}

.stat-num {
  display: block;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-pending .stat-num {
  color: #e6a23c;
}

.stat-linked .stat-num {
  color: #67c23a;
}

.stat-total .stat-num {
  color: #409eff;
}

.config-card {
  border: 1px solid #dcdfe6;
  padding: 14px 16px 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.filter-input {
  width: 220px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.action-hint {
  font-size: 12px;
  color: #606266;
}

.action-hint.muted {
  color: #909399;
}

.text-muted {
  color: #909399;
}

.assign-tip,
.reference-tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .staff-post-page {
    height: auto;
    overflow: visible;
  }

  .staff-post-main {
    min-height: 400px;
  }

  .stats-row {
    flex-direction: column;
  }
}
</style>
