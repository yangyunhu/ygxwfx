<template>
  <div class="perm-page org-level-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">组织机构层级分配</h2>
        <p class="page-desc">将权限配置与组织机构层级结合，支持多级自定义，各级负责人可为本级及下级配置功能模块访问范围。</p>
      </div>
    </div>

    <div class="perm-layout org-level-layout">
      <aside class="perm-sidebar">
        <div class="sidebar-head">组织机构树</div>
        <div class="sidebar-search">
          <el-input v-model="orgKeyword" placeholder="机构名称/编码" prefix-icon="el-icon-search" size="small" clearable />
        </div>
        <div class="sidebar-body">
          <el-tree
            ref="orgTree"
            :data="displayOrgTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleOrgClick"
          />
        </div>
      </aside>

      <main class="perm-main">
        <div v-if="selectedOrgId" class="perm-main-panel">
          <section class="org-config-section">
            <div class="card-title">机构权限配置 — {{ orgName }}</div>
            <el-form label-width="100px" size="small" class="org-form">
              <el-form-item label="继承上级">
                <el-switch v-model="form.inherit" active-text="是" inactive-text="否" @change="saveOrgConfig" />
              </el-form-item>
              <el-form-item label="数据范围">
                <el-select v-model="form.dataScope" style="width: 220px" @change="saveOrgConfig">
                  <el-option v-for="o in dataScopeOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="备注">
                <el-input v-model="form.remark" type="textarea" :rows="2" @blur="saveOrgConfig" />
              </el-form-item>
            </el-form>
          </section>

          <section class="module-config-section">
            <div class="card-tools">
              <span class="card-title module-title">功能模块授权</span>
              <el-button size="small" type="primary" plain :disabled="form.inherit" @click="setAllModules(true)">全部启用</el-button>
              <el-button size="small" :disabled="form.inherit" @click="setAllModules(false)">全部禁用</el-button>
            </div>
            <div class="module-table-wrap">
              <el-table :data="moduleRows" border size="small" height="100%">
                <el-table-column prop="name" label="功能模块" min-width="200" />
                <el-table-column prop="path" label="路由" min-width="180" show-overflow-tooltip />
                <el-table-column label="授权状态" width="120" align="center">
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
          </section>
        </div>
        <div v-else class="main-tip main-tip-fill">
          <i class="el-icon-office-building" />
          <p>请在左侧选择组织机构，配置层级权限</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { loadOrgTree } from "../utils/orgManagement";
import {
  getAllModuleLeaves, getOrgLevelPermission, updateOrgLevelPermission, updateOrgLevelModule,
  DATA_SCOPE_OPTIONS, filterOrgTreeForPermission, getOrgNodeName,
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
    };
  },
  computed: {
    displayOrgTree() { return filterOrgTreeForPermission(this.orgTree, this.orgKeyword); },
    orgName() { return getOrgNodeName(this.selectedOrgId); },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    const root = this.orgTree[0];
    if (root) {
      this.selectedOrgId = root.id;
      this.loadOrgConfig();
      this.$nextTick(() => this.$refs.orgTree && this.$refs.orgTree.setCurrentKey(this.selectedOrgId));
    }
  },
  methods: {
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

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.org-form {
  max-width: 560px;
}

.org-level-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);
  box-sizing: border-box;
}

.org-level-page .page-head {
  flex-shrink: 0;
}

.org-level-layout {
  flex: 1;
  min-height: 0;
  height: auto;
  align-items: stretch;
}

.org-level-layout.perm-layout {
  min-height: 0;
}

.org-level-layout .perm-sidebar {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
}

.org-level-layout .perm-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.org-level-layout .perm-main-panel {
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.org-config-section {
  flex-shrink: 0;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #ebeef5;
}

.module-config-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 16px 16px;
  overflow: hidden;
}

.module-config-section .card-tools {
  flex-shrink: 0;
}

.module-title {
  margin: 0;
  padding: 0;
  border: none;
}

.module-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.module-table-wrap >>> .el-table {
  height: 100% !important;
}

.main-tip-fill {
  flex: 1;
  min-height: 0;
  margin: 0;
}
</style>
