<template>
  <div class="org-management-page">
    <div class="org-mgmt-layout">
      <!-- 左侧组织树 -->
      <aside class="org-mgmt-sidebar">
        <div class="sidebar-search">
          <el-input
            v-model="searchKeyword"
            placeholder="机构名称/编码/首字母拼音"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="sidebar-filter">
          <el-select v-model="unitLevelFilter" placeholder="请选择单位层级" size="small" clearable style="width: 100%">
            <el-option
              v-for="opt in unitLevelOptions"
              :key="opt.value + opt.label"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div class="sidebar-tree">
          <el-tree
            ref="orgTree"
            :data="displayTree"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            :current-node-key="selectedId"
            @node-click="handleNodeClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <!-- 右侧详情 -->
      <main class="org-mgmt-main">
        <template v-if="orgDetail">
          <div class="detail-toolbar">
            <h2 class="detail-title">{{ orgDetail.displayTitle }}</h2>
            <div class="toolbar-actions">
              <el-dropdown trigger="click" @command="handleExport">
                <el-button size="small" icon="el-icon-download">
                  导出 <i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="detail">导出机构详情</el-dropdown-item>
                  <el-dropdown-item command="tree">导出组织树</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
          </div>

          <div class="org-mgmt-main-scroll">
          <section class="info-section">
            <div class="section-bar">
              <i class="el-icon-office-building" />
              <span>所在单位信息</span>
            </div>
            <div class="info-grid">
              <div
                v-for="field in unitInfoFields"
                :key="field.key"
                class="info-item"
                :class="{ 'info-item--span3': field.span === 3 }"
              >
                <span class="info-label">{{ field.label }}</span>
                <span class="info-value">{{ orgDetail.unitInfo[field.key] || "—" }}</span>
              </div>
            </div>
          </section>

          <section class="info-section">
            <div class="section-bar">
              <i class="el-icon-tickets" />
              <span>基本信息</span>
            </div>
            <div class="info-grid">
              <div
                v-for="field in basicInfoFields"
                :key="field.key"
                class="info-item"
                :class="{ 'info-item--span3': field.span === 3 }"
              >
                <span class="info-label">{{ field.label }}</span>
                <span class="info-value">{{ orgDetail.basicInfo[field.key] || "—" }}</span>
              </div>
            </div>
          </section>

          <section class="info-section">
            <div class="section-bar">
              <i class="el-icon-paperclip" />
              <span>附件（请示、批复等过程文件）</span>
            </div>
            <div class="attachment-wrap">
              <el-table
                v-if="orgDetail.attachments.length"
                :data="orgDetail.attachments"
                border
                size="small"
                empty-text="暂无附件"
              >
                <el-table-column type="index" label="序号" width="55" align="center" />
                <el-table-column prop="name" label="文件名称" min-width="240" show-overflow-tooltip />
                <el-table-column prop="type" label="文件类型" width="100" align="center" />
                <el-table-column prop="uploadTime" label="上传时间" width="160" />
              </el-table>
              <div v-else class="attachment-empty">暂无附件</div>
            </div>
          </section>
          </div>
        </template>

        <div v-else class="main-empty">
          <i class="el-icon-office-building" />
          <p>请在左侧选择组织机构</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import {
  loadOrgTree,
  filterOrgManagementTree,
  findOrgManagementNode,
  buildOrgDetail,
  exportOrgDetailCsv,
  UNIT_LEVEL_OPTIONS,
  UNIT_INFO_FIELDS,
  BASIC_INFO_FIELDS,
  flattenOrgManagementTree,
} from "../utils/orgManagement";

export default {
  name: "OrgManagement",
  data() {
    return {
      orgTree: [],
      searchKeyword: "",
      unitLevelFilter: "",
      unitLevelOptions: UNIT_LEVEL_OPTIONS,
      treeProps: { label: "name", children: "children" },
      selectedId: 130,
      unitInfoFields: UNIT_INFO_FIELDS,
      basicInfoFields: BASIC_INFO_FIELDS,
    };
  },
  computed: {
    displayTree() {
      return filterOrgManagementTree(this.orgTree, this.searchKeyword, this.unitLevelFilter);
    },
    orgDetail() {
      const found = findOrgManagementNode(this.orgTree, this.selectedId);
      return found ? buildOrgDetail(found, this.orgTree) : null;
    },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    this.$nextTick(() => {
      const tree = this.$refs.orgTree;
      if (tree) tree.setCurrentKey(this.selectedId);
    });
  },
  methods: {
    handleNodeClick(data) {
      this.selectedId = data.id;
    },
    handleExport(cmd) {
      if (cmd === "detail") {
        if (!this.orgDetail) return;
        const safeName = this.orgDetail.displayTitle.replace(/[\\/:*?"<>|()（）]/g, "_").slice(0, 40);
        exportOrgDetailCsv(this.orgDetail, `${safeName}_${Date.now()}.csv`);
        this.$message.success("导出成功");
        return;
      }
      const flat = flattenOrgManagementTree(this.orgTree);
      const headers = ["机构名称", "机构编码", "层级"];
      const lines = flat.map(({ node }) => [node.name, node.code, node.unitLevel]);
      const csv = [headers, ...lines]
        .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `组织树_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.$message.success("组织树导出成功");
    },
  },
};
</script>

<style scoped>
.org-management-page {
  height: calc(100vh - 60px);
  padding: 12px 16px;
  background: #eef1f6;
  box-sizing: border-box;
  overflow: hidden;
}

.org-mgmt-layout {
  display: flex;
  align-items: stretch;
  height: 100%;
  min-height: 0;
  gap: 0;
}

.org-mgmt-sidebar {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.sidebar-search,
.sidebar-filter {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.sidebar-filter {
  padding-top: 0;
}

.sidebar-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 6px 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  overflow: hidden;
}

.tree-node i {
  margin-right: 6px;
  color: #409eff;
  flex-shrink: 0;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-mgmt-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-left: none;
}

.org-mgmt-main-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.detail-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 12px 16px;
}

.detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.info-section {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.info-section:last-child {
  border-bottom: none;
}

.section-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(90deg, #d9ecff 0%, #ecf5ff 100%);
  border-bottom: 1px solid #d9ecff;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-bar i {
  color: #409eff;
  font-size: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  padding: 4px 0 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  min-height: 36px;
  padding: 8px 16px;
  border-bottom: 1px dashed #ebeef5;
  font-size: 13px;
  line-height: 1.5;
}

.info-item--span3 {
  grid-column: 1 / -1;
}

.info-label {
  width: 132px;
  flex-shrink: 0;
  color: #909399;
  padding-right: 8px;
}

.info-value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.attachment-wrap {
  padding: 12px 16px 16px;
}

.attachment-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
  background: #fafafa;
  border: 1px dashed #e4e7ed;
}

.main-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.main-empty i {
  font-size: 48px;
  margin-bottom: 12px;
  color: #c0c4cc;
}

@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .org-management-page {
    height: auto;
    overflow: visible;
  }

  .org-mgmt-layout {
    flex-direction: column;
    height: auto;
  }

  .org-mgmt-sidebar {
    width: 100%;
    max-height: 280px;
    border-right: 1px solid #dcdfe6;
  }

  .org-mgmt-main {
    border-left: 1px solid #dcdfe6;
    min-height: 400px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .detail-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<style>
.org-management-page .el-tree-node__content {
  height: 32px;
}

.org-management-page .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
  background-color: #ecf5ff;
  color: #409eff;
}
</style>
