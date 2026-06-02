<template>
  <div class="org-relation-page">
    <main class="org-relation-main">
        <div class="page-head">

          <div>

            <h2 class="page-title">组织机构关联配置</h2>

            <p class="page-desc">

              仅展示<strong>源数据组织为空</strong>的无感数据记录，可手动关联至人资组织机构；源数据中已有内部组织机构（部门/班组）的记录不在此页展示。

            </p>

          </div>

          <div class="head-actions">
            <el-button size="small" icon="el-icon-refresh" @click="rescanRecords">重新扫描</el-button>
          </div>

        </div>



        <div class="org-relation-main-scroll">

          <div class="stats-row">

            <div class="stat-card stat-pending">

              <span class="stat-num">{{ stats.pending }}</span>

              <span class="stat-label">待关联</span>

            </div>

            <div class="stat-card stat-linked">

              <span class="stat-num">{{ stats.manual }}</span>

              <span class="stat-label">已手动关联</span>

            </div>

            <div class="stat-card stat-total">

              <span class="stat-num">{{ stats.total }}</span>

              <span class="stat-label">本页记录合计</span>

            </div>

          </div>



          <section class="config-card">

            <div class="filter-row">

              <el-input

                v-model="recordKeyword"

                placeholder="姓名 / 人员ID / 组织名称"

                prefix-icon="el-icon-search"

                size="small"

                clearable

                class="filter-input"

                @keyup.enter.native="handleSearch"

              />

              <el-select

                v-model="sourceFilter"

                placeholder="数据源"

                clearable

                size="small"

                style="width: 200px"

              >

                <el-option

                  v-for="s in sourceOptions"

                  :key="s.code"

                  :label="s.name"

                  :value="s.code"

                />

              </el-select>

              <el-select
                v-model="statusFilter"
                placeholder="关联状态"
                size="small"
                style="width: 140px"
              >
                <el-option label="待关联" value="pending" />
                <el-option label="已手动关联" value="linked" />
                <el-option label="全部" value="all" />
              </el-select>

              <el-button
                type="primary"
                icon="el-icon-search"
                size="small"
                :loading="searchLoading"
                @click="handleSearch"
              >
                查询
              </el-button>

              <el-button size="small" @click="resetFilter">重置</el-button>

            </div>



            <div class="action-row">

              <el-button

                type="primary"

                size="small"

                icon="el-icon-link"

                :disabled="!canOpenBatchAssign"

                @click="openBatchAssignDialog"
              >
                批量关联（{{ pendingSelectedRows.length }}）
              </el-button>

              <span v-if="pendingSelectedRows.length" class="action-hint">
                已选 {{ pendingSelectedRows.length }} 条待关联记录
              </span>
              <span v-else class="action-hint muted">勾选待关联记录后点击批量关联，或在弹窗中选择目标组织机构</span>

            </div>



            <div
              class="table-body-wrap"
              v-loading="searchLoading"
              element-loading-text="查询中..."
            >

            <el-table

              ref="recordTable"

              :data="pagedRows"

              border

              stripe

              size="small"

              row-key="id"

              @selection-change="onSelectionChange"

            >

              <el-table-column

                type="selection"

                width="46"

                align="center"

                :selectable="rowSelectable"

              />

              <el-table-column type="index" label="序号" width="55" :index="indexMethod" />

              <el-table-column prop="sourceName" label="数据源" width="168" show-overflow-tooltip />

              <el-table-column prop="name" label="姓名" width="90" />

              <el-table-column prop="personId" label="人员ID" width="100" show-overflow-tooltip />

              <el-table-column prop="recordDate" label="记录日期" width="110" />

              <el-table-column prop="rawOrgName" label="源数据组织" min-width="160" show-overflow-tooltip />

              <el-table-column prop="linkedOrgName" label="关联组织机构" min-width="160" show-overflow-tooltip>

                <template slot-scope="{ row }">

                  <span :class="{ 'text-muted': !row.linkedOrgName }">

                    {{ row.linkedOrgName || "—" }}

                  </span>

                </template>

              </el-table-column>

              <el-table-column prop="status" label="状态" width="110" align="center">

                <template slot-scope="{ row }">

                  <el-tag :type="row.statusType" size="mini">{{ row.status }}</el-tag>

                </template>

              </el-table-column>

              <el-table-column label="操作" width="140" align="center" fixed="right">

                <template slot-scope="{ row }">

                  <el-button
                    v-if="row.pending"
                    type="text"
                    size="small"
                    @click="openSingleAssign(row)"
                  >
                    关联机构
                  </el-button>
                  <el-button
                    v-if="row.fromManual"
                    type="text"
                    size="small"
                    @click="openLinkedDetail(row)"
                  >
                    查看
                  </el-button>

                  <el-button

                    v-if="row.fromManual"

                    type="text"

                    class="btn-danger"

                    @click="unlinkRow(row)"

                  >

                    取消关联

                  </el-button>

                </template>

              </el-table-column>

            </el-table>



            <div class="pagination-wrap">

              <el-pagination

                background

                layout="total, prev, pager, next, sizes"

                :total="filteredRows.length"

                :current-page.sync="currentPage"

                :page-size.sync="pageSize"

                :page-sizes="[10, 20, 50]"

              />

            </div>

            </div>

          </section>

        </div>
    </main>

    <el-dialog
      :title="assignDialogTitle"
      :visible.sync="showAssignDialog"
      width="540px"
      append-to-body
      @closed="resetAssignForm"
    >
      <p class="assign-tip">为源数据组织为空的记录指定目标组织机构，保存后写入关联配置。</p>
      <el-form label-width="96px" size="small">
        <el-form-item v-if="assignRows.length === 1" label="人员">
          <span>{{ assignRows[0].name }}（{{ assignRows[0].personId }}）</span>
        </el-form-item>
        <el-form-item v-else label="关联条数">
          <span>{{ assignRows.length }} 条</span>
        </el-form-item>
        <el-form-item v-if="assignRows.length === 1" label="数据源">
          <span>{{ assignRows[0].sourceName }}</span>
        </el-form-item>
        <el-form-item v-if="assignRows.length === 1" label="源数据组织">
          <span class="text-warn">{{ assignRows[0].rawOrgName || "—" }}</span>
        </el-form-item>
        <el-form-item label="目标机构">
          <el-cascader
            v-model="assignOrgCascader"
            :options="orgCascaderOptions"
            :props="orgCascaderProps"
            filterable
            clearable
            placeholder="请选择目标组织机构"
            style="width: 100%"
          />
          <p v-if="assignOrgPath" class="assign-path">完整路径：{{ assignOrgPath }}</p>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!assignOrgCascader.length" @click="confirmAssign">保存关联</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="已关联组织信息"
      :visible.sync="showLinkedDetail"
      width="560px"
      append-to-body
    >
      <el-descriptions v-if="linkedDetailRow" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ linkedDetailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="人员ID">{{ linkedDetailRow.personId }}</el-descriptions-item>
        <el-descriptions-item label="数据源">{{ linkedDetailRow.sourceName }}</el-descriptions-item>
        <el-descriptions-item label="记录日期">{{ linkedDetailRow.recordDate }}</el-descriptions-item>
        <el-descriptions-item label="源数据组织" :span="2">{{ linkedDetailRow.rawOrgName || "—" }}</el-descriptions-item>
        <el-descriptions-item label="关联组织机构">{{ linkedDetailRow.linkedOrgName }}</el-descriptions-item>
        <el-descriptions-item label="机构编码">{{ linkedDetailRow.linkedOrgCode || "—" }}</el-descriptions-item>
        <el-descriptions-item label="组织路径" :span="2">{{ linkedDetailOrgPath || "—" }}</el-descriptions-item>
        <el-descriptions-item label="关联时间">{{ linkedDetailRow.linkedAt || "—" }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ linkedDetailRow.linkedBy || "—" }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer">
        <el-button type="primary" @click="showLinkedDetail = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>



<script>

import {
  loadOrgTree,
  toParentSelectOptions,
  getOrgPath,
  resolveOrgNodeFromCascader,
} from "../utils/orgManagement";

import {
  loadAllSensingRecords,
  loadOrgAssociations,
  buildAssociationRows,
  filterAssociationRows,
  batchResolveOrgAssociations,
  resolveOrgAssociation,
  removeOrgAssociation,
  countAssociationStats,
  getSourceOptions,
} from "../utils/sensingOrgAssociation";



export default {

  name: "OrgRelationConfig",

  data() {

    return {

      orgTree: [],

      associations: {},

      allRecords: [],

      allRows: [],

      recordKeyword: "",

      sourceFilter: "",

      statusFilter: "pending",

      filterKeyword: "",

      filterSource: "",

      filterStatus: "pending",

      pendingSelectedRows: [],

      showAssignDialog: false,

      assignDialogTitle: "关联组织机构",

      assignRows: [],

      assignOrgCascader: [],

      showLinkedDetail: false,

      linkedDetailRow: null,

      orgCascaderProps: { checkStrictly: true, emitPath: true },

      currentPage: 1,

      pageSize: 20,

      sourceOptions: getSourceOptions(),
      searchLoading: false,
    };

  },

  computed: {

    filteredRows() {

      return filterAssociationRows(this.allRows, {
        keyword: this.filterKeyword,
        sourceCode: this.filterSource,
        status: this.filterStatus === "all" ? "" : this.filterStatus,
      });

    },

    pagedRows() {

      const start = (this.currentPage - 1) * this.pageSize;

      return this.filteredRows.slice(start, start + this.pageSize);

    },

    stats() {

      return countAssociationStats(this.allRows);

    },

    canOpenBatchAssign() {

      return this.pendingSelectedRows.length > 0;

    },

    orgCascaderOptions() {

      return toParentSelectOptions(this.orgTree);

    },

    assignOrgPath() {

      if (!this.assignOrgCascader.length) return "";

      const id = this.assignOrgCascader[this.assignOrgCascader.length - 1];

      return getOrgPath(this.orgTree, id);

    },

    linkedDetailOrgPath() {

      if (!this.linkedDetailRow?.linkedOrgId) return "";

      return getOrgPath(this.orgTree, this.linkedDetailRow.linkedOrgId);

    },

  },

  mounted() {

    this.reloadData();

  },

  methods: {

    reloadData() {

      this.orgTree = loadOrgTree();

      this.associations = loadOrgAssociations();

      this.allRecords = loadAllSensingRecords();

      this.allRows = buildAssociationRows(this.allRecords, this.associations, this.orgTree);

    },

    rescanRecords() {

      this.reloadData();

      this.pendingSelectedRows = [];

      const table = this.$refs.recordTable;

      if (table) table.clearSelection();

      this.$message.success(`扫描完成，待关联 ${this.stats.pending} 条`);

    },

    withSearchLoading(loadingKey, task, successMsg) {
      if (this[loadingKey]) return;
      this[loadingKey] = true;
      setTimeout(() => {
        task();
        this[loadingKey] = false;
        if (successMsg) {
          const msg = typeof successMsg === "function" ? successMsg() : successMsg;
          this.$message.success(msg);
        }
      }, 400);
    },

    handleSearch() {
      this.withSearchLoading(
        "searchLoading",
        () => {
          this.filterKeyword = this.recordKeyword;
          this.filterSource = this.sourceFilter;
          this.filterStatus = this.statusFilter;
          this.currentPage = 1;
        },
        () => `查询成功，共 ${this.filteredRows.length} 条`
      );
    },

    resetFilter() {

      this.recordKeyword = "";

      this.sourceFilter = "";

      this.statusFilter = "pending";
      this.filterKeyword = "";
      this.filterSource = "";
      this.filterStatus = "pending";

      this.currentPage = 1;

    },

    rowSelectable(row) {

      return row.pending;

    },

    onSelectionChange(rows) {

      this.pendingSelectedRows = (rows || []).filter((r) => r.pending);

    },

    indexMethod(index) {

      return (this.currentPage - 1) * this.pageSize + index + 1;

    },

    openSingleAssign(row) {

      this.assignRows = [row];

      this.assignDialogTitle = `关联组织机构 - ${row.name}`;

      this.assignOrgCascader = [];

      this.showAssignDialog = true;

    },

    openBatchAssignDialog() {

      if (!this.pendingSelectedRows.length) {

        this.$message.warning("请勾选待关联记录");

        return;

      }

      this.assignRows = [...this.pendingSelectedRows];

      this.assignDialogTitle = `批量关联组织机构（${this.assignRows.length} 条）`;

      this.assignOrgCascader = [];

      this.showAssignDialog = true;

    },

    resetAssignForm() {

      this.assignRows = [];

      this.assignOrgCascader = [];

    },

    confirmAssign() {

      try {

        const orgNode = resolveOrgNodeFromCascader(this.orgTree, this.assignOrgCascader);

        if (!orgNode) {

          this.$message.warning("请选择有效的目标组织机构");

          return;

        }

        if (this.assignRows.length === 1) {

          this.associations = resolveOrgAssociation(

            this.assignRows[0],

            orgNode,

            this.associations

          );

        } else {

          this.associations = batchResolveOrgAssociations(

            this.assignRows,

            orgNode,

            this.associations

          );

        }

        this.allRows = buildAssociationRows(this.allRecords, this.associations, this.orgTree);

        this.showAssignDialog = false;

        this.pendingSelectedRows = [];

        const table = this.$refs.recordTable;

        if (table) table.clearSelection();

        this.$message.success(`已关联 ${this.assignRows.length} 条记录至「${orgNode.name}」`);

      } catch (err) {

        this.$message.warning(err.message || "关联失败");

      }

    },

    openLinkedDetail(row) {

      this.linkedDetailRow = row;

      this.showLinkedDetail = true;

    },

    unlinkRow(row) {

      this.$confirm(`确定取消「${row.name}」的组织关联？`, "提示", { type: "warning" })

        .then(() => {

          this.associations = removeOrgAssociation(row.id, this.associations);

          this.allRows = buildAssociationRows(this.allRecords, this.associations, this.orgTree);

          this.$message.success("已取消关联");

        })

        .catch(() => {});

    },

  },

};

</script>



<style scoped>

.org-relation-page {

  height: calc(100vh - 60px);

  padding: 12px 16px;

  background: #eef1f6;

  box-sizing: border-box;

  overflow: hidden;

}

.org-relation-main {

  height: 100%;

  min-height: 0;

  display: flex;

  flex-direction: column;

  overflow: hidden;

  background: #fff;

  border: 1px solid #dcdfe6;

  border-radius: 4px;

}



.org-relation-main-scroll {

  flex: 1;

  min-height: 0;

  overflow: auto;

  padding: 12px 16px 16px;

}



.page-head {

  flex-shrink: 0;

  border-bottom: 1px solid #dcdfe6;

  padding: 12px 16px;

  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 12px;

}

.head-actions {

  flex-shrink: 0;

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

  color: #606266;

  line-height: 1.6;

  max-width: 920px;

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



.btn-danger {

  color: #f56c6c;

}

.assign-tip {

  margin: 0 0 12px;

  font-size: 12px;

  color: #909399;

}

.assign-path {

  margin: 6px 0 0;

  font-size: 12px;

  color: #606266;

}

.text-warn {

  color: #e6a23c;

}



.pagination-wrap {

  margin-top: 12px;

  display: flex;

  justify-content: flex-end;

}

@media (max-width: 768px) {

  .org-relation-page {

    height: auto;

    overflow: visible;

  }

  .org-relation-main {

    min-height: 400px;

  }

  .stats-row {

    flex-direction: column;

  }

}

</style>


