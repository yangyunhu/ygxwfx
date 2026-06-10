<template>
  <div class="org-level-container">
    <!-- 页面头部 -->
    <div class="page-header-wrapper">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">组织机构层级管理</h1>
          <p class="page-subtitle">功能模块权限配置与组织机构层级相结合，支持多级自定义设置，确保不同层级业务人员只能访问其权限范围内的功能模块。</p>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧组织机构树 -->
      <div class="side-panel">
        <div class="panel-card">
          <div class="panel-header">
            <i class="el-icon-office-building panel-icon"></i>
            <span class="panel-title">组织机构树</span>
          </div>

          <!-- 搜索框 -->
          <div class="search-wrapper">
            <el-input
              v-model="orgKeyword"
              placeholder="搜索机构名称/编码"
              prefix-icon="el-icon-search"
              clearable
              size="small"
            ></el-input>
          </div>

          <!-- 树结构 -->
          <div class="tree-wrapper">
            <el-tree
              ref="orgTree"
              :data="displayOrgTree"
              :props="{ label: 'name', children: 'children' }"
              node-key="id"
              highlight-current
              default-expand-all
              :expand-on-click-node="false"
              class="org-tree"
              @node-click="handleOrgClick"
            >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <i :class="['el-icon-folder', 'node-icon']"></i>
                <span class="node-label">{{ node.label }}</span>
              </span>
            </el-tree>
          </div>
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="main-panel">
        <div v-if="selectedOrgId" class="config-card">
          <!-- 卡片头部 -->
          <div class="card-header-row">
            <div class="card-title">
              <i class="el-icon-settings"></i>
              <span>机构权限配置</span>
              <span class="org-name-tag">{{ orgName }}</span>
            </div>
          </div>

          <div class="config-content">
            <!-- 机构基本配置 -->
            <el-card class="config-section" body-style="padding: 16px;">
              <div class="section-header">
                <i class="el-icon-user"></i>
                <span class="section-title">基本配置</span>
              </div>
              <el-form label-width="120px" size="small" class="config-form">
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="继承上级权限">
                      <el-switch
                        v-model="form.inherit"
                        active-text="是"
                        inactive-text="否"
                        @change="saveOrgConfig"
                      />
                      <span class="form-hint">启用后将自动继承上级机构的权限配置</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="数据访问范围">
                      <el-select
                        v-model="form.dataScope"
                        style="width: 100%"
                        @change="saveOrgConfig"
                        :disabled="form.inherit"
                      >
                        <el-option
                          v-for="o in dataScopeOptions"
                          :key="o.value"
                          :label="o.label"
                          :value="o.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="备注说明">
                  <el-input
                    v-model="form.remark"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入备注信息"
                    @blur="saveOrgConfig"
                    :disabled="form.inherit"
                  />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 功能模块授权 -->
            <el-card class="config-section" body-style="padding: 0;">
              <div class="section-header">
                <i class="el-icon-menu"></i>
                <span class="section-title">功能模块授权</span>
                <div class="section-actions">
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    :disabled="form.inherit"
                    @click="setAllModules(true)"
                  >
                    <i class="el-icon-check"></i>
                    全部启用
                  </el-button>
                  <el-button
                    size="small"
                    :disabled="form.inherit"
                    @click="setAllModules(false)"
                  >
                    <i class="el-icon-close"></i>
                    全部禁用
                  </el-button>
                </div>
              </div>
              <div class="module-table-wrapper">
                <el-table
                  :data="moduleRows"
                  border
                  size="small"
                  :height="tableHeight"
                >
                  <el-table-column
                    prop="name"
                    label="功能模块"
                    min-width="220"
                  />
                  <el-table-column
                    prop="path"
                    label="路由路径"
                    min-width="200"
                    show-overflow-tooltip
                  />
                  <el-table-column
                    label="授权状态"
                    width="140"
                    align="center"
                  >
                    <template slot-scope="{ row }">
                      <el-switch
                        :value="isModuleEnabled(row.id)"
                        :disabled="form.inherit"
                        @change="(val) => toggleModule(row.id, val)"
                      />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 未选择组织机构时的空状态 -->
        <div v-else class="empty-card">
          <el-empty description="请选择组织机构" class="custom-empty">
            <template #image>
              <i class="el-icon-office-building" style="font-size: 48px; color: #d9d9d9;"></i>
            </template>
            <template #description>
              <span>请选择组织机构</span>
              <p style="margin-top: 8px; font-size: 12px; color: #999;">从左侧组织机构树中选择一个部门或单位进行权限配置</p>
            </template>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loadOrgTree } from "../utils/orgManagement";
import {
  getAllModuleLeaves,
  getOrgLevelPermission,
  updateOrgLevelPermission,
  updateOrgLevelModule,
  DATA_SCOPE_OPTIONS,
  filterOrgTreeForPermission,
  getOrgNodeName,
} from "../utils/permissionManagement";

export default {
  name: "OrgLevelPermission",
  data() {
    return {
      orgTree: [],
      orgKeyword: "",
      selectedOrgId: null,
      form: { inherit: true, dataScope: "self_and_children", modules: {}, remark: "" },
      dataScopeOptions: DATA_SCOPE_OPTIONS,
      moduleRows: getAllModuleLeaves(),
      tableHeight: 300,
    };
  },
  computed: {
    displayOrgTree() {
      return filterOrgTreeForPermission(this.orgTree, this.orgKeyword);
    },
    orgName() {
      return getOrgNodeName(this.selectedOrgId);
    },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    const root = this.orgTree[0];
    if (root) {
      this.selectedOrgId = root.id;
      this.loadOrgConfig();
      this.$nextTick(() => {
        if (this.$refs.orgTree) {
          this.$refs.orgTree.setCurrentKey(this.selectedOrgId);
        }
      });
    }
    this.updateTableHeight();
    window.addEventListener("resize", this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateTableHeight);
  },
  methods: {
    updateTableHeight() {
      this.tableHeight = Math.max(300, window.innerHeight - 500);
    },
    handleOrgClick(data) {
      this.selectedOrgId = data.id;
      this.loadOrgConfig();
    },
    loadOrgConfig() {
      const cfg = getOrgLevelPermission(this.selectedOrgId);
      this.form = {
        inherit: cfg.inherit !== false,
        dataScope: cfg.dataScope || "self_and_children",
        modules: { ...(cfg.modules || {}) },
        remark: cfg.remark || "",
      };
    },
    saveOrgConfig() {
      updateOrgLevelPermission(this.selectedOrgId, {
        inherit: this.form.inherit,
        dataScope: this.form.dataScope,
        remark: this.form.remark,
        modules: this.form.modules,
      });
      this.$message.success("机构权限配置已保存");
    },
    isModuleEnabled(moduleId) {
      if (this.form.inherit) return true;
      return this.form.modules[moduleId] !== false;
    },
    toggleModule(moduleId, enabled) {
      updateOrgLevelModule(this.selectedOrgId, moduleId, enabled);
      this.form.modules[moduleId] = enabled;
      this.form.inherit = false;
      this.$message.success(enabled ? "已授权" : "已取消授权");
    },
    setAllModules(enabled) {
      this.moduleRows.forEach((m) => {
        this.form.modules[m.id] = enabled;
        updateOrgLevelModule(this.selectedOrgId, m.id, enabled);
      });
      this.form.inherit = false;
      this.$message.success(enabled ? "已全部启用" : "已全部禁用");
    },
  },
};
</script>

<style scoped>
/* 页面容器 */
.org-level-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 页面头部 */
.page-header-wrapper {
  background: #409eff;
  padding: 24px 32px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left .page-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.header-left .page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  max-width: 800px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  min-height: 0;
}

/* 左侧面板 */
.side-panel {
  width: 320px;
  flex-shrink: 0;
  height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

.panel-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.panel-icon {
  font-size: 18px;
  margin-right: 10px;
}

.search-wrapper {
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.search-wrapper >>> .el-input__inner {
  border-radius: 8px;
}

.tree-wrapper {
  padding: 8px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.org-tree {
  background: transparent;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.node-icon {
  margin-right: 8px;
  font-size: 14px;
  color: #909399;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

/* 右侧主面板 */
.main-panel {
  flex: 1;
  min-width: 0;
  height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
}

.config-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.config-card >>> .el-card__body {
  padding: 0;
  margin: 0;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.card-title i {
  margin-right: 8px;
  color: #409eff;
}

.org-name-tag {
  margin-left: 12px;
  padding: 4px 12px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: normal;
}

.config-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  margin: -16px;
  margin-bottom: 16px;
  border-radius: 12px 12px 0 0;
}

.section-header i {
  margin-right: 8px;
  color: #409eff;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.section-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.config-form {
  margin: 0;
}

.form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.module-table-wrapper {
  max-height: 400px;
  overflow: hidden;
}

.module-table-wrapper >>> .el-table {
  --el-table-header-text-color: #64748b;
  --el-table-row-hover-bg-color: #f8fafc;
}

/* 空状态卡片 */
.empty-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-empty {
  text-align: center;
}
</style>
