<template>
  <div class="major-category-page employee-ledger-page">
    <div class="page-layout page-layout--single">
      <main class="main-panel">
        <section class="query-panel">
          <div class="query-panel-head">
            <div>
              <span class="query-title">专业分类</span>
              <p class="panel-desc">
                根据员工专业背景进行分类，便于人员管理与培训安排。选择左侧专业后可查看基本信息、关联员工数及员工明细。
              </p>
            </div>
          </div>

          <div class="stats-row">
            <span class="stat-item">共 <strong>{{ stats.total }}</strong> 项</span>
            <span class="stat-item">叶子节点 <strong>{{ stats.leaves }}</strong></span>
            <span class="stat-item">关联员工 <strong>{{ employees.length }}</strong></span>
          </div>
        </section>

        <section class="split-panel">
          <aside class="category-sidebar">
            <div class="org-search">
              <el-input
                v-model="treeKeyword"
                placeholder="搜索专业分类"
                prefix-icon="el-icon-search"
                size="small"
                clearable
              />
            </div>
            <div class="org-tree-wrap">
              <el-tree
                ref="categoryTree"
                :data="displayTree"
                :props="treeProps"
                node-key="id"
                highlight-current
                default-expand-all
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
              >
                <span slot-scope="{ node, data }" class="tree-node">
                  <i :class="nodeIcon(data)" />
                  <span class="tree-label">{{ node.label }}</span>
                </span>
              </el-tree>
            </div>
          </aside>

          <div class="detail-panel">
            <template v-if="selectedNode">
              <div class="detail-head">
                <h3 class="detail-title">{{ selectedNode.name }}</h3>
                <div class="detail-actions">
                  <el-button
                    size="mini"
                    type="primary"
                    plain
                    :disabled="!selectedEmployeeCount"
                    @click="openEmployeeDialog(selectedNode)"
                  >
                    查看员工（{{ selectedEmployeeCount }}）
                  </el-button>
                </div>
              </div>

              <el-descriptions :column="2" border size="small" class="detail-desc">
                <el-descriptions-item label="专业名称">{{ selectedNode.name }}</el-descriptions-item>
                <el-descriptions-item label="专业编码">{{ selectedNode.code || "—" }}</el-descriptions-item>
                <el-descriptions-item label="上级分类">
                  {{ parentCategoryName }}
                </el-descriptions-item>
                <el-descriptions-item label="层级">
                  {{ levelLabel(selectedNode.level) }}
                </el-descriptions-item>
                <el-descriptions-item label="完整路径" :span="2">
                  {{ selectedPath }}
                </el-descriptions-item>
                <el-descriptions-item label="关联员工数">
                  <span class="employee-count">{{ selectedEmployeeCount }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="排序">{{ selectedNode.sort }}</el-descriptions-item>
                <el-descriptions-item label="说明">{{ selectedNode.remark || "—" }}</el-descriptions-item>
              </el-descriptions>

              <div class="list-section">
                <div class="list-head">
                  <span>{{ listSectionTitle }}（{{ listRows.length }}）</span>
                </div>
                <div class="table-container table-hscroll-viewport">
                  <el-table :data="listRows" border size="small" empty-text="暂无数据">
                    <el-table-column prop="sort" label="排序" width="70" align="center" />
                    <el-table-column prop="name" label="专业名称" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="code" label="专业编码" width="100" show-overflow-tooltip />
                    <el-table-column prop="parentName" label="上级分类" width="140" show-overflow-tooltip />
                    <el-table-column label="关联员工数" width="110" align="center">
                      <template slot-scope="{ row }">
                        <el-button
                          type="text"
                          size="small"
                          :disabled="!row.employeeCount"
                          @click="openEmployeeDialogById(row.id, row.name)"
                        >
                          {{ row.employeeCount }}
                        </el-button>
                      </template>
                    </el-table-column>
                    <el-table-column prop="remark" label="说明" min-width="120" show-overflow-tooltip />
                    <el-table-column label="操作" width="80" align="center" fixed="right">
                      <template slot-scope="{ row }">
                        <el-button type="text" size="small" @click="handleRowView(row)">查看</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </template>

            <div v-else class="detail-empty">
              <i class="el-icon-folder-opened" />
              <p>请在左侧选择专业分类，查看基本信息与关联员工</p>
            </div>
          </div>
        </section>
      </main>
    </div>

    <el-dialog
      :title="employeeDialogTitle"
      :visible.sync="showEmployeeDialog"
      width="1180px"
      top="6vh"
      append-to-body
      class="employee-dialog"
    >
      <div class="employee-dialog-head">
        <div class="employee-dialog-tip">
          共 {{ employeeDialogList.length }} 名员工归属该专业（含下级专业）
        </div>
        <el-button
          size="small"
          icon="el-icon-download"
          :disabled="!employeeDialogList.length"
          @click="exportEmployeeDialog"
        >
          导出
        </el-button>
      </div>
      <el-table :data="employeeDialogList" border size="small" max-height="560" empty-text="暂无关联员工">
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="name" label="姓名" width="90" show-overflow-tooltip />
        <el-table-column prop="employeeCode" label="员工编码" width="110" show-overflow-tooltip />
        <el-table-column prop="gender" label="性别" width="55" align="center" />
        <el-table-column prop="deptPath" label="部门路径" min-width="240" show-overflow-tooltip />
        <el-table-column prop="postName" label="岗位名称" width="120" show-overflow-tooltip />
        <el-table-column prop="majorCategory" label="专业分类" min-width="280" show-overflow-tooltip />
        <el-table-column prop="employeeStatus" label="员工状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-tag type="primary" size="mini" effect="plain">{{ row.employeeStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="openEmployeeDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog
      :title="employeeDetailTitle"
      :visible.sync="showEmployeeDetail"
      width="640px"
      append-to-body
    >
      <el-descriptions v-if="employeeDetailRow" :column="2" border size="small">
        <el-descriptions-item label="姓名">{{ employeeDetailRow.name }}</el-descriptions-item>
        <el-descriptions-item label="员工编码">{{ employeeDetailRow.employeeCode }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ employeeDetailRow.gender }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ employeeDetailRow.age }}</el-descriptions-item>
        <el-descriptions-item label="单位" :span="2">{{ employeeDetailRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="部门路径" :span="2">{{ employeeDetailRow.deptPath }}</el-descriptions-item>
        <el-descriptions-item label="岗位名称">{{ employeeDetailRow.postName }}</el-descriptions-item>
        <el-descriptions-item label="岗位类别">{{ employeeDetailRow.postCategory }}</el-descriptions-item>
        <el-descriptions-item label="专业分类" :span="2">{{ employeeDetailRow.majorCategory }}</el-descriptions-item>
        <el-descriptions-item label="入本单位时间">{{ employeeDetailRow.joinDate }}</el-descriptions-item>
        <el-descriptions-item label="用工形式">{{ employeeDetailRow.employmentType }}</el-descriptions-item>
        <el-descriptions-item label="员工状态">{{ employeeDetailRow.employeeStatus }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ employeeDetailRow.phone }}</el-descriptions-item>
        <el-descriptions-item label="学历">{{ employeeDetailRow.education }}</el-descriptions-item>
        <el-descriptions-item label="政治面貌">{{ employeeDetailRow.politicalStatus }}</el-descriptions-item>
      </el-descriptions>
      <span slot="footer">
        <el-button type="primary" @click="showEmployeeDetail = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getEmployeeBasicList, exportEmployeeCsv } from "../utils/employeeLedger";
import {
  loadMajorCategoryTree,
  filterMajorCategoryTree,
  countMajorCategoryStats,
  findMajorCategoryNode,
  getMajorCategoryPath,
  getParentCategoryName,
  countEmployeesForCategory,
  getEmployeesForCategory,
  getCategoryListRows,
  getMajorLevelLabel,
} from "../utils/majorCategory";

export default {
  name: "MajorCategory",
  data() {
    return {
      tree: [],
      employees: [],
      treeKeyword: "",
      treeProps: { label: "name", children: "children" },
      selectedId: "",
      showEmployeeDialog: false,
      employeeDialogTitle: "",
      employeeDialogCategoryName: "",
      employeeDialogList: [],
      showEmployeeDetail: false,
      employeeDetailRow: null,
    };
  },
  computed: {
    displayTree() {
      return filterMajorCategoryTree(this.tree, this.treeKeyword);
    },
    stats() {
      return countMajorCategoryStats(this.tree);
    },
    selectedNode() {
      if (!this.selectedId) return null;
      const found = findMajorCategoryNode(this.tree, this.selectedId);
      return found ? found.node : null;
    },
    selectedPath() {
      return this.selectedId ? getMajorCategoryPath(this.selectedId, this.tree) : "";
    },
    parentCategoryName() {
      return this.selectedId ? getParentCategoryName(this.selectedId, this.tree) : "—";
    },
    selectedEmployeeCount() {
      return countEmployeesForCategory(this.selectedId, this.employees, this.tree);
    },
    hasChildCategories() {
      return Boolean(this.selectedNode && this.selectedNode.children && this.selectedNode.children.length);
    },
    listSectionTitle() {
      return this.hasChildCategories ? "下级专业" : "本专业";
    },
    listRows() {
      return getCategoryListRows(this.selectedNode, this.employees, this.tree);
    },
    employeeDetailTitle() {
      return this.employeeDetailRow
        ? `${this.employeeDetailRow.name} - 员工基本信息`
        : "员工基本信息";
    },
  },
  mounted() {
    this.reloadTree();
    this.employees = getEmployeeBasicList();
  },
  methods: {
    reloadTree() {
      this.tree = loadMajorCategoryTree();
      if (this.selectedId && !findMajorCategoryNode(this.tree, this.selectedId)) {
        this.selectedId = "";
      }
      if (!this.selectedId && this.tree.length) {
        this.selectById(this.tree[0].id);
      }
    },
    levelLabel(level) {
      return getMajorLevelLabel(level);
    },
    nodeIcon(data) {
      if (data.children && data.children.length) return "el-icon-folder";
      return "el-icon-document";
    },
    handleNodeClick(data) {
      this.selectedId = data.id;
    },
    selectById(id) {
      this.selectedId = id;
      this.$nextTick(() => {
        const tree = this.$refs.categoryTree;
        if (tree) tree.setCurrentKey(id);
      });
    },
    handleRowView(row) {
      const found = findMajorCategoryNode(this.tree, row.id);
      if (found && found.node.children && found.node.children.length) {
        this.selectById(row.id);
        return;
      }
      this.openEmployeeDialogById(row.id, row.name);
    },
    openEmployeeDialog(node) {
      if (!node) return;
      this.openEmployeeDialogById(node.id, node.name);
    },
    openEmployeeDialogById(id, name) {
      this.employeeDialogTitle = `${name} - 关联员工`;
      this.employeeDialogCategoryName = name;
      this.employeeDialogList = getEmployeesForCategory(id, this.employees, this.tree);
      this.showEmployeeDialog = true;
    },
    exportEmployeeDialog() {
      if (!this.employeeDialogList.length) {
        this.$message.warning("没有可导出的数据");
        return;
      }
      const safeName = (this.employeeDialogCategoryName || "关联员工").replace(/[\\/:*?"<>|]/g, "_");
      exportEmployeeCsv(this.employeeDialogList, `${safeName}_关联员工_${Date.now()}.csv`);
      this.$message.success(`导出成功，共 ${this.employeeDialogList.length} 条`);
    },
    openEmployeeDetail(row) {
      this.employeeDetailRow = row;
      this.showEmployeeDetail = true;
    },
  },
};
</script>

<style scoped>
.major-category-page {
  min-height: calc(100vh - 60px);
  padding: 12px 16px;
  background: #f0f2f5;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
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
  align-items: flex-start;
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

.table-container {
  width: 100%;
}

.table-hscroll-viewport {
  overflow-x: auto;
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

.page-layout--single {
  display: block;
}

.panel-desc {
  font-size: 12px;
  color: #909399;
  margin: 6px 0 0;
  line-height: 1.5;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.stat-item strong {
  color: #303133;
  margin: 0 2px;
}

.split-panel {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-height: 480px;
}

.category-sidebar {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 220px);
  position: sticky;
  top: 0;
}

.detail-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
  gap: 12px;
}

.detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex-shrink: 0;
}

.detail-empty {
  text-align: center;
  padding: 48px 16px;
  color: #909399;
}

.detail-empty i {
  font-size: 48px;
  margin-bottom: 12px;
  display: block;
}

.detail-desc {
  margin-bottom: 16px;
}

.employee-count {
  color: #409eff;
  font-weight: 600;
  font-size: 16px;
}

.list-section {
  margin-top: 8px;
}

.list-head {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.employee-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
}

.employee-dialog-tip {
  font-size: 13px;
  color: #606266;
}

.employee-dialog >>> .el-dialog__body {
  padding-top: 12px;
}

.major-category-page .query-panel-head {
  align-items: flex-start;
}
</style>
