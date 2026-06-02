<template>
  <div class="employee-ledger-page">
    <div class="page-layout">
      <!-- 左侧组织树 -->
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input
            v-model="orgTreeKeyword"
            placeholder="关键字搜索"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="org-tree-wrap">
          <el-tree
            :data="filteredOrgTree"
            :props="treeProps"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            node-key="id"
            @node-click="handleOrgClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <!-- 右侧主区域 -->
      <main class="main-panel">
        <!-- 查询条件 -->
        <section class="query-panel">
          <div class="query-panel-head">
            <span class="query-title">查询条件</span>
            <div class="query-actions">
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">
                查询
              </el-button>
              <el-button size="small" @click="handleReset">清空</el-button>
              <el-button type="text" size="small" @click="queryExpanded = !queryExpanded">
                {{ queryExpanded ? "收起" : "展开" }}
                <i :class="queryExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
              </el-button>
            </div>
          </div>

          <div class="query-row">
            <span class="query-label">员工状态</span>
            <div class="tag-group">
              <span
                v-for="s in statusOptions"
                :key="s"
                class="filter-tag"
                :class="{ active: selectedStatuses.includes(s) }"
                @click="toggleStatus(s)"
              >
                {{ s }}
              </span>
            </div>
          </div>

          <div v-show="queryExpanded" class="query-body">
            <div class="query-row">
              <span class="query-label">姓名</span>
              <el-input
                v-model="nameKeyword"
                placeholder="可输入多个姓名，用逗号分隔"
                size="small"
                class="query-input-wide"
                clearable
              />
            </div>

            <div class="query-row">
              <span class="query-label">专业分类</span>
              <el-cascader
                v-model="selectedMajorCategoryId"
                :options="majorCategoryOptions"
                :props="cascaderProps"
                clearable
                filterable
                size="small"
                placeholder="选择专业分类"
                style="width: 360px"
                @change="currentPage = 1"
              />
            </div>

            <div class="query-row">
              <span class="query-label">岗位类别</span>
              <el-checkbox-group v-model="selectedPostCategories" size="small">
                <el-checkbox v-for="c in postCategoryOptions" :key="c" :label="c">
                  {{ c }}
                </el-checkbox>
              </el-checkbox-group>
            </div>

            <div class="query-row query-row-age">
              <span class="query-label">年龄</span>
              <div class="age-group">
                <el-checkbox-group v-model="selectedAgeRanges" size="small">
                  <el-checkbox
                    v-for="a in ageRangeOptions"
                    :key="a.label"
                    :label="a.label"
                  >
                    {{ a.label }}
                  </el-checkbox>
                </el-checkbox-group>
                <div class="age-custom">
                  <el-input
                    v-model.number="ageFrom"
                    size="mini"
                    placeholder="起"
                    class="age-input"
                  />
                  <span class="age-sep">-</span>
                  <el-input
                    v-model.number="ageTo"
                    size="mini"
                    placeholder="止"
                    class="age-input"
                  />
                  <el-button size="mini" @click="applyCustomAge">确认</el-button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 导出工具栏（仅查询导出，无编辑） -->
        <section class="toolbar">
          <el-button size="small" icon="el-icon-download" @click="exportList('员工基本信息台账')">
            导出
          </el-button>
          <span v-if="selectedRows.length" class="toolbar-tip">
            已选 {{ selectedRows.length }} 条（导出将优先使用已选数据）
          </span>
        </section>

        <!-- 数据表格 -->
        <section class="table-section">
          <div class="table-container table-hscroll-viewport">
            <el-table
              ref="dataTable"
              :data="pagedList"
              border
              stripe
              size="small"
              :fit="false"
              :style="{ width: tableScrollWidth + 'px' }"
              empty-text="暂无数据"
              @selection-change="handleSelectionChange"
              @cell-click="onCellClick"
            >
              <el-table-column type="selection" width="45" />
              <el-table-column type="index" label="序号" width="55" :index="indexMethod" />
              <el-table-column
                label="姓名"
                width="90"
                class-name="col-person-name"
                column-key="personName"
                show-overflow-tooltip
              >
                <template slot-scope="scope">
                  <span class="person-name-text">{{ scope.row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="employeeCode" label="员工编码" width="110" show-overflow-tooltip />
              <el-table-column prop="gender" label="性别" width="55" align="center" />
              <el-table-column prop="unit" label="单位" width="200" show-overflow-tooltip />
              <el-table-column prop="deptPath" label="部门路径" width="280" show-overflow-tooltip />
              <el-table-column prop="postName" label="岗位名称" width="120" show-overflow-tooltip />
              <el-table-column prop="majorCategory" label="专业分类" width="260" show-overflow-tooltip />
              <el-table-column prop="joinDate" label="入本单位时间" width="140" show-overflow-tooltip />
              <el-table-column prop="employmentType" label="用工形式" width="110" show-overflow-tooltip />
              <el-table-column prop="employeeStatus" label="员工状态" width="90" align="center">
                <template slot-scope="{ row }">
                  <el-tag type="primary" size="mini" effect="plain">{{ row.employeeStatus }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pagination-bar">
            <span class="total-text">共 {{ filteredList.length }} 条</span>
            <el-pagination
              :current-page.sync="currentPage"
              :page-size.sync="pageSize"
              :page-sizes="[10, 25, 50, 100]"
              :total="filteredList.length"
              layout="sizes, prev, pager, next, jumper"
              small
              @size-change="currentPage = 1"
            />
          </div>
        </section>
      </main>
    </div>

    <!-- 姓名点击查看详情（只读） -->
    <el-dialog
      :title="detailTitle"
      :visible.sync="showDetail"
      width="640px"
      append-to-body
      class="detail-dialog"
    >
      <el-descriptions v-if="detailRow" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ detailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="员工编码">{{ detailRow.employeeCode }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detailRow.gender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ detailRow.age }}</el-descriptions-item>
        <el-descriptions-item label="单位" :span="2">{{ detailRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="部门路径" :span="2">{{ detailRow.deptPath }}</el-descriptions-item>
        <el-descriptions-item label="岗位名称">{{ detailRow.postName }}</el-descriptions-item>
        <el-descriptions-item label="岗位类别">{{ detailRow.postCategory }}</el-descriptions-item>
        <el-descriptions-item label="专业分类" :span="2">{{ detailRow.majorCategory }}</el-descriptions-item>
        <el-descriptions-item label="入本单位时间">{{ detailRow.joinDate }}</el-descriptions-item>
        <el-descriptions-item label="用工形式">{{ detailRow.employmentType }}</el-descriptions-item>
        <el-descriptions-item label="员工状态">{{ detailRow.employeeStatus }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="学历">{{ detailRow.education }}</el-descriptions-item>
        <el-descriptions-item label="政治面貌">{{ detailRow.politicalStatus }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer">
        <el-button type="primary" @click="showDetail = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { generateOrgTree, matchOrgFilter } from "../utils/orgTree";
import {
  generateEmployeeBasicList,
  exportEmployeeCsv,
  EMPLOYEE_STATUS_OPTIONS,
  POST_CATEGORY_OPTIONS,
  AGE_RANGE_OPTIONS,
} from "../utils/employeeLedger";
import {
  loadMajorCategoryTree,
  toCascaderOptions,
  matchMajorCategoryFilter,
} from "../utils/majorCategory";

export default {
  name: "EmployeeBasicLedger",
  data() {
    return {
      list: [],
      orgTree: [],
      orgTreeKeyword: "",
      treeProps: { label: "name", children: "children" },
      selectedOrg: "",
      queryExpanded: true,
      nameKeyword: "",
      selectedStatuses: ["在岗"],
      selectedPostCategories: [],
      selectedMajorCategoryId: "",
      majorCategoryOptions: [],
      cascaderProps: { checkStrictly: true, emitPath: false },
      selectedAgeRanges: [],
      ageFrom: null,
      ageTo: null,
      customAgeActive: false,
      currentPage: 1,
      pageSize: 25,
      selectedRows: [],
      showDetail: false,
      detailRow: null,
      statusOptions: EMPLOYEE_STATUS_OPTIONS,
      postCategoryOptions: POST_CATEGORY_OPTIONS,
      ageRangeOptions: AGE_RANGE_OPTIONS,
    };
  },
  computed: {
    filteredOrgTree() {
      const kw = (this.orgTreeKeyword || "").trim();
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
    filteredList() {
      return this.list.filter((row) => this.matchRow(row));
    },
    pagedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredList.slice(start, start + this.pageSize);
    },
    tableScrollWidth() {
      return 45 + 55 + 90 + 110 + 55 + 200 + 280 + 120 + 260 + 140 + 110 + 90;
    },
    detailTitle() {
      return this.detailRow ? `${this.detailRow.name} - 员工基本信息` : "员工基本信息";
    },
  },
  watch: {
    currentPage() {
      this.refreshTableLayout();
    },
    pageSize() {
      this.refreshTableLayout();
    },
  },
  mounted() {
    this.orgTree = generateOrgTree();
    this.majorCategoryOptions = toCascaderOptions(loadMajorCategoryTree());
    this.list = generateEmployeeBasicList();
    this.refreshTableLayout();
  },
  methods: {
    refreshTableLayout() {
      this.$nextTick(() => {
        const table = this.$refs.dataTable;
        if (table && table.doLayout) table.doLayout();
      });
    },
    onCellClick(row, column) {
      if (column && (column.columnKey === "personName" || column.label === "姓名")) {
        this.openDetail(row);
      }
    },
    matchRow(row) {
      if (this.selectedOrg) {
        const orgMatch =
          matchOrgFilter(row.orgName, this.selectedOrg) ||
          matchOrgFilter(row.deptPath, this.selectedOrg);
        if (!orgMatch) return false;
      }
      if (this.selectedStatuses.length && !this.selectedStatuses.includes(row.employeeStatus)) {
        return false;
      }
      const names = (this.nameKeyword || "")
        .split(/[,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (names.length && !names.some((n) => (row.name || "").includes(n))) {
        return false;
      }
      if (
        this.selectedPostCategories.length &&
        !this.selectedPostCategories.includes(row.postCategory)
      ) {
        return false;
      }
      if (
        this.selectedMajorCategoryId &&
        !matchMajorCategoryFilter(row.majorCategory, this.selectedMajorCategoryId)
      ) {
        return false;
      }
      if (this.selectedAgeRanges.length) {
        const inRange = this.selectedAgeRanges.some((label) => {
          const opt = this.ageRangeOptions.find((a) => a.label === label);
          return opt && row.age >= opt.min && row.age <= opt.max;
        });
        if (!inRange) return false;
      }
      if (this.customAgeActive) {
        const from = this.ageFrom != null && this.ageFrom !== "" ? Number(this.ageFrom) : 0;
        const to = this.ageTo != null && this.ageTo !== "" ? Number(this.ageTo) : 999;
        if (row.age < from || row.age > to) return false;
      }
      return true;
    },
    toggleStatus(s) {
      const idx = this.selectedStatuses.indexOf(s);
      if (idx >= 0) {
        this.selectedStatuses.splice(idx, 1);
      } else {
        this.selectedStatuses.push(s);
      }
    },
    applyCustomAge() {
      this.customAgeActive = true;
      this.selectedAgeRanges = [];
      this.handleSearch();
    },
    handleOrgClick(data) {
      this.selectedOrg = data.id === 1 ? "" : data.name;
      this.currentPage = 1;
    },
    handleSearch() {
      this.currentPage = 1;
    },
    handleReset() {
      this.nameKeyword = "";
      this.selectedStatuses = ["在岗"];
      this.selectedPostCategories = [];
      this.selectedMajorCategoryId = "";
      this.selectedAgeRanges = [];
      this.ageFrom = null;
      this.ageTo = null;
      this.customAgeActive = false;
      this.selectedOrg = "";
      this.orgTreeKeyword = "";
      this.currentPage = 1;
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    indexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1;
    },
    openDetail(row) {
      this.detailRow = row;
      this.showDetail = true;
    },
    getExportRows() {
      return this.selectedRows.length ? this.selectedRows : this.filteredList;
    },
    exportList(prefix) {
      const rows = this.getExportRows();
      if (!rows.length) {
        this.$message.warning("没有可导出的数据");
        return;
      }
      exportEmployeeCsv(rows, `${prefix}_${Date.now()}.csv`);
      this.$message.success(`${prefix}导出成功，共 ${rows.length} 条`);
    },
  },
};
</script>

<style scoped>
.employee-ledger-page {
  min-height: calc(100vh - 60px);
  padding: 12px 16px;
  background: #f0f2f5;
  box-sizing: border-box;
}

.page-layout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 0;
}

.org-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.org-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.org-tree-wrap {
  flex: 1;
  overflow: auto;
  padding: 8px 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  overflow: hidden;
}

.tree-node i {
  margin-right: 6px;
  color: #909399;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.query-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.query-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.query-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.query-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  font-size: 13px;
}

.query-row:last-child {
  margin-bottom: 0;
}

.query-label {
  width: 72px;
  flex-shrink: 0;
  color: #606266;
  line-height: 28px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.filter-tag {
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  cursor: pointer;
  color: #606266;
  background: #fff;
  font-size: 12px;
  line-height: 1.4;
  user-select: none;
}

.filter-tag:hover {
  border-color: #409eff;
  color: #409eff;
}

.filter-tag.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.query-input-wide {
  max-width: 420px;
}

.query-body {
  border-top: 1px dashed #ebeef5;
  padding-top: 12px;
}

.age-group {
  flex: 1;
}

.age-custom {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.age-input {
  width: 72px;
}

.age-sep {
  color: #909399;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.toolbar-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.table-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.table-section .table-container {
  width: 100%;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.total-text {
  font-size: 13px;
  color: #606266;
}
</style>

<style>
.employee-ledger-page .el-table td.col-person-name .cell,
.employee-ledger-page .el-table td.col-person-name .person-name-text {
  color: #409eff !important;
  cursor: pointer !important;
  font-weight: 500;
  visibility: visible !important;
  opacity: 1 !important;
}

.employee-ledger-page .el-table td.col-person-name:hover .person-name-text {
  color: #66b1ff !important;
  text-decoration: underline;
}
</style>
