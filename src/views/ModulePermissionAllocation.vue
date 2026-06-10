<template>
  <div class="module-perm-page">
    <div class="module-perm-layout">
      <main class="app-main">
        <div class="page-info">
          <span class="page-info-label">当前系统应用：</span>
          <span class="page-info-value">{{ currentAppName }}</span>
        </div>
        <div class="main-toolbar">
          <el-input
            v-model="roleQueryKeyword"
            placeholder="请输入角色名称或描述关键字查询"
            size="small"
            clearable
            class="role-search"
            @keyup.enter.native="handleRoleSearch"
          />
          <div class="main-actions">
            <el-button size="small" @click="openCreateRole">新增角色</el-button>
            <el-button
              size="small"
              :disabled="!selectedRows.length"
              @click="batchDeleteRoles"
              >删除角色</el-button
            >
          </div>
        </div>

        <el-table
          ref="roleTable"
          :data="pagedRoles"
          border
          size="small"
          class="role-table"
          empty-text="暂无角色"
          row-key="id"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column
            prop="name"
            label="角色名称"
            min-width="140"
            show-overflow-tooltip
          >
            <template slot-scope="{ row }">
              <el-button
                type="text"
                class="role-name-link"
                @click="openPermissionDialog(row)"
              >
                {{ row.name }}
              </el-button>
            </template>
          </el-table-column>
          <el-table-column
            prop="description"
            label="描述"
            min-width="120"
            show-overflow-tooltip
          >
            <template slot-scope="{ row }">{{
              row.description || ""
            }}</template>
          </el-table-column>
          <el-table-column
            prop="appName"
            label="所属系统应用"
            min-width="160"
            show-overflow-tooltip
          />
          <el-table-column
            prop="creator"
            label="创建人"
            width="120"
            show-overflow-tooltip
          />
          <el-table-column
            prop="createDate"
            label="创建日期"
            width="120"
            align="center"
          />
          <el-table-column
            label="操作"
            width="110"
            align="center"
            fixed="right"
          >
            <template slot-scope="{ row }">
              <i
                class="op-icon op-setting el-icon-setting"
                title="功能配置"
                @click="openPermissionDialog(row)"
              />
              <i
                class="op-icon op-delete el-icon-close"
                title="删除"
                @click="deleteSingleRole(row)"
              />
              <i
                class="op-icon op-perm el-icon-document"
                title="关联人员"
                @click="openRolePersonnelDialog(row)"
              />
            </template>
          </el-table-column>
        </el-table>

        <div class="main-pager">
          <div class="pager-left">
            <span class="pager-total">共{{ filteredRoles.length }}条记录</span>
            <span class="pager-label">每页显示</span>
            <span
              v-for="size in pageSizeOptions"
              :key="size"
              class="page-size-item"
              :class="{ active: pageSize === size }"
              @click="changePageSize(size)"
            >
              {{ size }}
            </span>
          </div>
          <el-pagination
            small
            layout="prev, pager, next, jumper"
            :total="filteredRoles.length"
            :current-page.sync="currentPage"
            :page-size="pageSize"
          />
        </div>
      </main>
    </div>

    <el-dialog
      :visible.sync="showRoleForm"
      width="680px"
      top="8vh"
      append-to-body
      custom-class="app-role-form-dialog"
      :close-on-click-modal="false"
      :show-close="true"
      @closed="resetRoleForm"
    >
      <div slot="title" class="app-role-dialog-header">
        <span class="app-role-dialog-title">{{ roleFormTitle }}</span>
        <div class="app-role-dialog-actions">
          <el-button size="small" type="primary" @click="submitRoleForm">保存</el-button>
        </div>
      </div>

      <el-form
        ref="roleForm"
        :model="roleForm"
        :rules="roleRules"
        label-width="140px"
        size="small"
        class="app-role-form"
      >
        <el-form-item label="角色名称:" prop="name" required>
          <el-select
            v-model="roleForm.name"
            placeholder="请选择角色类型"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="opt in roleNameOptions"
              :key="opt"
              :label="opt"
              :value="opt"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述:" prop="description" class="desc-form-item">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="6"
            :maxlength="descMaxLength"
            resize="none"
            style="width: 100%"
          />
          <div class="desc-counter">
            (您还能输入<span class="desc-remain">{{ descRemain }}</span>个字符)
          </div>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog
      :visible.sync="showPermissionDialog"
      width="980px"
      top="6vh"
      append-to-body
      custom-class="role-perm-assign-dialog"
      :close-on-click-modal="false"
      @opened="onPermDialogOpened"
      @closed="onPermDialogClosed"
    >
      <div slot="title" class="role-perm-dialog-title">
        给角色 ({{ permissionRole ? permissionRole.name : "" }}) 分配权限
      </div>

      <div class="role-perm-dialog-layout">
        <main class="role-perm-right full-width">
          <div class="role-perm-right-toolbar">
            <span />
            <div class="role-perm-right-actions">
              <el-button size="small" type="primary" @click="savePermConfig"
                >保存</el-button
              >
              <el-button size="small" @click="showPermissionDialog = false"
                >关闭</el-button
              >
            </div>
          </div>
          <div class="resource-table-head">资源名称</div>
          <div class="resource-tree-wrap">
            <div v-if="canShowResourceTree" class="resource-list">
              <el-checkbox-group
                v-model="checkedResourceIds"
                @change="handleResourceCheck"
              >
                <div
                  v-for="item in currentResourceLeaves"
                  :key="item.id"
                  class="resource-item"
                >
                  <el-checkbox :label="item.id">{{ item.name }}</el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
            <div v-else class="resource-empty">
              请先选择角色，右侧显示对应资源列表
            </div>
          </div>
        </main>
      </div>
    </el-dialog>

    <el-dialog
      :visible.sync="showPersonnelDialog"
      width="1120px"
      top="6vh"
      append-to-body
      custom-class="role-personnel-dialog"
      :close-on-click-modal="false"
      @closed="onPersonnelDialogClosed"
    >
      <div slot="title" class="role-personnel-title">
        角色（{{ personnelRole ? personnelRole.name : "" }}）关联的人员信息
      </div>

      <div class="personnel-toolbar">
        <div class="personnel-filters">
          <div class="personnel-filter-item">
            <span class="personnel-filter-label">关键字：</span>
            <el-input
              v-model="personnelKeyword"
              placeholder="请输入姓名、全拼、简拼关键字查询"
              size="small"
              clearable
              class="personnel-keyword-input"
              @keyup.enter.native="handlePersonnelSearch"
            />
          </div>
          <div class="personnel-filter-item">
            <span class="personnel-filter-label">组织：</span>
            <el-input
              v-model="personnelOrgLabel"
              placeholder=""
              size="small"
              readonly
              class="personnel-org-input"
            >
              <el-button
                slot="append"
                icon="el-icon-share"
                @click="showOrgPicker = true"
              />
            </el-input>
          </div>
        </div>
        <div class="personnel-actions">
          <el-button size="small" @click="handlePersonnelSearch"
            >查询</el-button
          >
          <el-button
            size="small"
            :disabled="!selectedPersonnel.length"
            @click="batchDeletePersonnel"
          >
            删除关联人员
          </el-button>
        </div>
      </div>

      <el-table
        ref="personnelTable"
        :data="pagedPersonnel"
        border
        size="small"
        class="personnel-table"
        empty-text="暂无关联人员"
        row-key="id"
        max-height="420"
        @selection-change="handlePersonnelSelection"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column
          prop="name"
          label="姓名"
          width="90"
          show-overflow-tooltip
        />
        <el-table-column
          prop="account"
          label="账号"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="registerDate"
          label="注册日期"
          width="110"
          align="center"
        >
          <template slot-scope="{ row }">{{ row.registerDate || "" }}</template>
        </el-table-column>
        <el-table-column
          prop="createDate"
          label="创建日期"
          width="110"
          align="center"
        />
        <el-table-column
          prop="orgFullPath"
          label="所属组织全路径"
          min-width="320"
          show-overflow-tooltip
        />
        <el-table-column
          prop="expiryDate"
          label="到期日期"
          width="110"
          align="center"
        >
          <template slot-scope="{ row }">{{ row.expiryDate || "" }}</template>
        </el-table-column>
      </el-table>

      <div class="personnel-pager">
        <div class="pager-left">
          <span class="pager-total"
            >共{{ filteredPersonnel.length }}条记录</span
          >
          <span class="pager-label">每页显示</span>
          <span
            v-for="size in personnelPageSizeOptions"
            :key="size"
            class="page-size-item"
            :class="{ active: personnelPageSize === size }"
            @click="changePersonnelPageSize(size)"
          >
            {{ size }}
          </span>
        </div>
        <el-pagination
          small
          layout="prev, pager, next, jumper"
          :total="filteredPersonnel.length"
          :current-page.sync="personnelCurrentPage"
          :page-size="personnelPageSize"
        />
      </div>
    </el-dialog>

    <el-dialog
      title="选择组织"
      :visible.sync="showOrgPicker"
      width="420px"
      append-to-body
    >
      <el-tree
        :data="orgTree"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        highlight-current
        default-expand-all
        @node-click="handleOrgPick"
      />
      <span slot="footer">
        <el-button size="small" @click="clearOrgFilter">清空</el-button>
        <el-button size="small" type="primary" @click="showOrgPicker = false"
          >确定</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  SYSTEM_APPLICATION_TREE,
  filterApplicationTree,
  getAppRoles,
  getAppName,
  createAppRole,
  updateAppRole,
  deleteAppRole,
  deleteAppRoles,
  DEFAULT_SELECTED_APP_ID,
  PERMISSION_DIALOG_APP_TREE,
  PROJECT_FUNCTION_TREE,
  filterAuthorizedAppTree,
  getAllProjectFunctionIds,
  getDefaultRolePermissionIds,
  getRolePersonnel,
  deleteRolePersonnel,
} from "../utils/modulePermissionAllocation";
import {
  getModuleAllocation,
  updateModuleAllocation,
} from "../utils/permissionManagement";
import { loadOrgTree } from "../utils/orgManagement";

export default {
  name: "ModulePermissionAllocation",
  data() {
    return {
      appTree: SYSTEM_APPLICATION_TREE,
      appTreeKeyword: "",
      selectedAppId: DEFAULT_SELECTED_APP_ID,
      treeProps: { label: "name", children: "children" },
      roles: [],
      roleQueryKeyword: "",
      roleFilterKeyword: "",
      selectedRows: [],
      currentPage: 1,
      pageSize: 10,
      pageSizeOptions: [10, 20, 30],
      showRoleForm: false,
      roleFormMode: "create",
      editingRoleId: null,
      roleForm: {
        name: "",
        description: "",
      },
      roleNameOptions: [
        "业务管理员",
        "单位负责人",
        "审核人员",
        "看板查看用户",
        "普通员工",
      ],
      descMaxLength: 250,
      roleRules: {
        name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
      },
      showPermissionDialog: false,
      permissionRole: null,
      allocation: {},
      permissionRoleKey: "",
      permAppKeyword: "",
      onlyAuthorizedApps: false,
      selectedPermNavId: "nav-ygxwfx-func",
      permAppTree: PERMISSION_DIALOG_APP_TREE,
      resourceTree: PROJECT_FUNCTION_TREE,
      checkedResourceIds: [],
      syncingResourceTree: false,
      showPersonnelDialog: false,
      personnelRole: null,
      personnelList: [],
      personnelKeyword: "",
      personnelFilterKeyword: "",
      personnelOrgLabel: "",
      personnelOrgFilter: "",
      personnelCurrentPage: 1,
      personnelPageSize: 10,
      personnelPageSizeOptions: [10, 20, 30],
      selectedPersonnel: [],
      showOrgPicker: false,
      orgTree: [],
    };
  },
  computed: {
    displayPermAppTree() {
      const filtered = filterApplicationTree(
        this.permAppTree,
        this.permAppKeyword,
      );
      return filterAuthorizedAppTree(
        filtered,
        this.onlyAuthorizedApps,
        this.getEnabledLeafIds(),
      );
    },
    canShowResourceTree() {
      return (
        this.selectedPermNavId === "nav-ygxwfx-func" ||
        this.selectedPermNavId === DEFAULT_SELECTED_APP_ID
      );
    },
    currentResourceTree() {
      return this.canShowResourceTree ? this.resourceTree : [];
    },
    currentResourceList() {
      const list = [];
      function walk(nodes, level = 0) {
        (nodes || []).forEach((node) => {
          if (node.children && node.children.length) {
            list.push({ id: node.id, name: node.name, level, isGroup: true });
            walk(node.children, level + 1);
          } else {
            list.push({ id: node.id, name: node.name, level, isGroup: false });
          }
        });
      }
      walk(this.resourceTree || []);
      return list;
    },
    currentResourceLeaves() {
      return this.currentResourceList.filter((i) => !i.isGroup);
    },
    displayAppTree() {
      return filterApplicationTree(this.appTree, this.appTreeKeyword);
    },
    currentAppName() {
      return getAppName(this.selectedAppId) || "—";
    },
    filteredRoles() {
      const kw = this.roleFilterKeyword.trim().toLowerCase();
      return this.roles.filter((r) => {
        if (!kw) return true;
        return (
          (r.name || "").toLowerCase().includes(kw) ||
          (r.description || "").toLowerCase().includes(kw)
        );
      });
    },
    pagedRoles() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredRoles.slice(start, start + this.pageSize);
    },
    roleFormTitle() {
      return this.roleFormMode === "create" ? "新增角色" : "编辑角色";
    },
    descRemain() {
      const len = (this.roleForm.description || "").length;
      return Math.max(0, this.descMaxLength - len);
    },
    filteredPersonnel() {
      const kw = this.personnelFilterKeyword.trim().toLowerCase();
      const org = this.personnelOrgFilter.trim();
      return this.personnelList.filter((p) => {
        const matchKw =
          !kw ||
          (p.name || "").toLowerCase().includes(kw) ||
          (p.account || "").toLowerCase().includes(kw);
        const matchOrg = !org || (p.orgFullPath || "").includes(org);
        return matchKw && matchOrg;
      });
    },
    pagedPersonnel() {
      const start = (this.personnelCurrentPage - 1) * this.personnelPageSize;
      return this.filteredPersonnel.slice(
        start,
        start + this.personnelPageSize,
      );
    },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    this.reloadRoles();
    this.allocation = getModuleAllocation();
    this.$nextTick(() => {
      if (this.$refs.appTree)
        this.$refs.appTree.setCurrentKey(this.selectedAppId);
    });
  },
  methods: {
    reloadRoles() {
      this.roles = getAppRoles(this.selectedAppId);
    },
    handleAppClick(data) {
      if (!data.isApp) return;
      this.selectedAppId = data.id;
      this.roleQueryKeyword = "";
      this.roleFilterKeyword = "";
      this.currentPage = 1;
      this.selectedRows = [];
      this.reloadRoles();
    },
    handleRoleSearch() {
      this.roleFilterKeyword = this.roleQueryKeyword;
      this.currentPage = 1;
    },
    changePageSize(size) {
      this.pageSize = size;
      this.currentPage = 1;
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    openCreateRole() {
      if (!this.selectedAppId) {
        this.$message.warning("请先选择系统应用");
        return;
      }
      this.roleFormMode = "create";
      this.editingRoleId = null;
      this.roleForm = { name: "", description: "" };
      this.showRoleForm = true;
    },
    openEditRole(row) {
      this.roleFormMode = "edit";
      this.editingRoleId = row.id;
      this.roleForm = { name: row.name, description: row.description || "" };
      this.showRoleForm = true;
    },
    resetRoleForm() {
      if (this.$refs.roleForm) this.$refs.roleForm.resetFields();
    },
    submitRoleForm() {
      this.$refs.roleForm.validate((ok) => {
        if (!ok) return;
        try {
          if (this.roleFormMode === "create") {
            createAppRole(this.selectedAppId, this.roleForm);
          } else {
            updateAppRole(
              this.selectedAppId,
              this.editingRoleId,
              this.roleForm,
            );
          }
          this.reloadRoles();
          this.showRoleForm = false;
          this.$message.success("保存成功");
        } catch (e) {
          this.$message.warning(e.message);
        }
      });
    },
    deleteSingleRole(row) {
      this.$confirm(`确定删除角色「${row.name}」？`, "删除角色", {
        type: "warning",
      })
        .then(() => {
          deleteAppRole(this.selectedAppId, row.id);
          this.reloadRoles();
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    batchDeleteRoles() {
      if (!this.selectedRows.length) return;
      this.$confirm(
        `确定删除选中的 ${this.selectedRows.length} 个角色？`,
        "删除角色",
        { type: "warning" },
      )
        .then(() => {
          deleteAppRoles(
            this.selectedAppId,
            this.selectedRows.map((r) => r.id),
          );
          this.reloadRoles();
          this.selectedRows = [];
          this.$message.success("删除成功");
        })
        .catch(() => {});
    },
    handleImportRoles() {
      // handleImportRoles removed
    },
    openPermissionDialog(row) {
      this.permissionRole = row;
      this.permissionRoleKey = `app-role:${row.id}`;
      this.allocation = getModuleAllocation();
      this.ensureDefaultPermissions(row);
      this.permAppKeyword = "";
      this.onlyAuthorizedApps = false;
      this.selectedPermNavId = "nav-ygxwfx-func";
      this.showPermissionDialog = true;
      this.$nextTick(() => this.syncResourceListChecked());
    },
    ensureDefaultPermissions(row) {
      const key = this.permissionRoleKey;
      const leaves = getAllProjectFunctionIds();
      const map = this.allocation[key] || {};
      const hasAny = leaves.some((id) => map[id]);
      if (hasAny) return;
      const defaults = getDefaultRolePermissionIds(row.id);
      defaults.forEach((id) => updateModuleAllocation(key, id, true));
      this.allocation = getModuleAllocation();
    },
    onPermDialogOpened() {
      this.syncResourceListChecked();
      this.$nextTick(() => {
        if (this.$refs.permAppTree)
          this.$refs.permAppTree.setCurrentKey(this.selectedPermNavId);
      });
    },
    onPermDialogClosed() {
      this.permissionRole = null;
      this.permissionRoleKey = "";
      this.selectedPermNavId = "nav-ygxwfx-func";
    },
    handlePermNavClick(data) {
      if (data.isResource || data.id === DEFAULT_SELECTED_APP_ID) {
        this.selectedPermNavId = data.isResource
          ? data.id
          : DEFAULT_SELECTED_APP_ID;
        this.$nextTick(() => this.syncResourceListChecked());
      }
    },
    getEnabledLeafIds() {
      const key = this.permissionRoleKey;
      if (!key) return [];
      const map = this.allocation[key] || {};
      return getAllProjectFunctionIds().filter((id) => map[id]);
    },
    syncResourceListChecked() {
      this.checkedResourceIds = this.getEnabledLeafIds();
    },
    handleResourceCheck() {
      if (!this.permissionRoleKey) return;
      const checked = new Set(this.checkedResourceIds || []);
      getAllProjectFunctionIds().forEach((id) => {
        updateModuleAllocation(this.permissionRoleKey, id, checked.has(id));
      });
      this.allocation = getModuleAllocation();
    },
    savePermConfig() {
      this.$message.success("权限配置已保存");
    },
    // exportPermJson removed
    openRolePersonnelDialog(row) {
      this.personnelRole = row;
      this.personnelList = getRolePersonnel(row.id, row.name);
      this.personnelKeyword = "";
      this.personnelFilterKeyword = "";
      this.personnelOrgLabel = "";
      this.personnelOrgFilter = "";
      this.personnelCurrentPage = 1;
      this.personnelPageSize = 10;
      this.selectedPersonnel = [];
      this.showPersonnelDialog = true;
    },
    onPersonnelDialogClosed() {
      this.personnelRole = null;
      this.personnelList = [];
      this.selectedPersonnel = [];
    },
    handlePersonnelSearch() {
      this.personnelFilterKeyword = this.personnelKeyword;
      this.personnelCurrentPage = 1;
    },
    changePersonnelPageSize(size) {
      this.personnelPageSize = size;
      this.personnelCurrentPage = 1;
    },
    handlePersonnelSelection(rows) {
      this.selectedPersonnel = rows;
    },
    handleOrgPick(data) {
      this.personnelOrgFilter = data.name;
      this.personnelOrgLabel = data.name;
    },
    clearOrgFilter() {
      this.personnelOrgFilter = "";
      this.personnelOrgLabel = "";
      this.showOrgPicker = false;
    },
    batchDeletePersonnel() {
      if (!this.personnelRole || !this.selectedPersonnel.length) return;
      this.$confirm(
        `确定删除选中的 ${this.selectedPersonnel.length} 名关联人员？`,
        "删除关联人员",
        {
          type: "warning",
        },
      )
        .then(() => {
          deleteRolePersonnel(
            this.personnelRole.id,
            this.selectedPersonnel.map((p) => p.id),
          );
          this.personnelList = getRolePersonnel(
            this.personnelRole.id,
            this.personnelRole.name,
          );
          this.selectedPersonnel = [];
          this.$message.success("删除成功");
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.module-perm-page {
  min-height: calc(100vh - 60px);
  background: #eef1f6;
  padding: 12px 16px 20px;
}

.module-perm-layout {
  display: flex;
  gap: 12px;
  min-height: calc(100vh - 100px);
}

.app-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
}

.sidebar-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.sidebar-tree {
  flex: 1;
  overflow: auto;
  padding: 8px 6px 12px;
}

.app-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 24px);
  font-size: 13px;
}

.app-tree-node i {
  color: #e6a23c;
  flex-shrink: 0;
}

.app-tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-main {
  flex: 1;
  min-width: 0;
  background: #fff;
  border: 1px solid #dcdfe6;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
}

.page-info {
  margin-bottom: 12px;
  color: #606266;
  font-size: 13px;
}

.page-info-label {
  margin-right: 6px;
}

.page-info-value {
  color: #409eff;
  font-weight: 600;
}

.main-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.role-search {
  width: 320px;
}

.main-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-table {
  width: 100%;
}

.role-table >>> .el-table__header th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.role-name-link {
  padding: 0;
  color: #409eff;
}

/* 调整新增/编辑角色表单的标签与控件对齐 */
.app-role-form .el-form-item {
  display: grid;
  grid-template-columns: 140px minmax(360px, 1fr);
  align-items: center;
}
.app-role-form .el-form-item__label {
  text-align: left;
  padding: 0 12px 0 0;
}
/* 描述为多行时将标签顶部对齐 */
.app-role-form .el-form-item.desc-form-item {
  align-items: start;
}
.app-role-form .el-form-item.desc-form-item .el-form-item__label {
  padding-top: 6px;
}

/* 弹窗自定义样式美化 */
.app-role-form-dialog .el-dialog__header {
  padding: 14px 20px;
  border-bottom: 1px solid #eef1f6;
}
.app-role-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.app-role-dialog-title {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}
.app-role-dialog-actions .el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}
.app-role-form-dialog .el-dialog__body {
  padding: 16px 24px 22px;
}
.app-role-form .el-form-item__label {
  width: auto;
  text-align: right;
  padding-right: 16px;
}
.app-role-form .el-form-item__content {
  width: 360px;
}
.app-role-form .el-input--textarea {
  width: 100%;
}
.app-role-form .el-input--textarea textarea {
  min-height: 140px;
}
.app-role-form .desc-counter {
  grid-column: 2 / 3;
  margin-top: 8px;
  color: #909399;
  white-space: nowrap;
}
.app-role-form .desc-form-item .el-form-item__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.app-role-form .el-input--textarea {
  width: 100%;
}
.app-role-form .el-textarea__inner,
.app-role-form textarea {
  width: 100% !important;
  min-height: 140px;
  box-sizing: border-box;
}
.app-role-form .desc-form-item .el-form-item__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.app-role-form .desc-counter {
  margin-top: 8px;
  color: #909399;
}
.app-role-form .desc-form-item .el-input--textarea,
.app-role-form .desc-form-item .el-textarea__inner,
.app-role-form .desc-form-item textarea {
  width: 360px !important;
  box-sizing: border-box;
}
.app-role-form .el-form-item__content > .el-select,
.app-role-form .el-form-item__content > .el-input {
  width: 100%;
}

/* 强制表单使用两列网格，确保标签与控件左对齐、宽度一致 */
.app-role-form .el-form-item {
  display: grid !important;
  grid-template-columns: 140px 360px !important;
  grid-column-gap: 12px !important;
  align-items: center !important;
}
.app-role-form .el-form-item__label {
  grid-column: 1 / 2 !important;
  justify-self: end !important;
  align-self: center !important;
  text-align: right !important;
  padding: 0 !important;
}
.app-role-form .el-form-item__content {
  grid-column: 2 / 3 !important;
}
.app-role-form .el-form-item.desc-form-item .el-form-item__label {
  align-self: start !important;
  padding-top: 8px !important;
}
.app-role-form .el-form-item__content > .el-select,
.app-role-form .el-form-item__content > .el-input {
  width: 100% !important;
}

/* 强制表单宽度并左对齐，防止表单在弹窗中居中 */
.app-role-form {
  width: 520px !important;
  margin: 0 !important;
}
.app-role-form .el-form-item__content > .el-select {
  display: block !important;
}

.pager-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.pager-total {
  margin-right: 4px;
}

.pager-label {
  margin-left: 4px;
}

.page-size-item {
  padding: 2px 6px;
  cursor: pointer;
  border-radius: 2px;
}

.page-size-item.active {
  color: #409eff;
  font-weight: 600;
}

.role-perm-dialog-layout {
  display: flex;
  gap: 0;
  min-height: 480px;
  border: 1px solid #e4e7ed;
}

.role-perm-right.full-width {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  width: 100%;
}

.perm-app-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  max-width: calc(100% - 24px);
}

.perm-app-tree-node i {
  color: #e6a23c;
  flex-shrink: 0;
}

.role-perm-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.role-perm-right-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.role-perm-right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-table-head {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.resource-tree-wrap {
  flex: 1;
  overflow: auto;
  padding: 10px 14px 14px;
}

.resource-list {
  padding: 6px 8px;
}

.resource-item {
  padding: 6px 8px 6px 0;
}

.resource-group {
  padding: 8px 6px;
}

.resource-group-label {
  color: #606266;
  font-size: 13px;
  font-weight: 600;
}

.resource-empty {
  padding: 60px 20px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.personnel-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.personnel-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.personnel-filter-item {
  display: flex;
  align-items: center;
}

.personnel-filter-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.personnel-keyword-input {
  width: 280px;
}

.personnel-org-input {
  width: 220px;
}

.personnel-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.personnel-table {
  width: 100%;
}

.personnel-table >>> .el-table__header th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.personnel-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 8px;
}
</style>

<style>
.role-personnel-dialog .el-dialog__header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.role-personnel-dialog .el-dialog__body {
  padding: 14px 16px 16px;
}

.role-personnel-dialog .el-dialog__footer {
  display: none;
}

.role-personnel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>

<style>
.role-perm-assign-dialog .el-dialog__header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.role-perm-assign-dialog .el-dialog__body {
  padding: 16px;
}

.role-perm-assign-dialog .el-dialog__footer {
  display: none;
}

.role-perm-dialog-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.role-perm-assign-dialog .el-tree-node__content {
  height: 30px;
}
</style>

<style>
.app-role-form-dialog .el-dialog__header {
  padding: 12px 16px 10px;
  border-bottom: 1px solid #ebeef5;
}

.app-role-form-dialog .el-dialog__headerbtn {
  top: 14px;
  right: 14px;
}

.app-role-form-dialog .el-dialog__body {
  padding: 24px 28px 28px;
}

.app-role-form-dialog .el-dialog__footer {
  display: none;
}

.app-role-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 28px;
}

.app-role-dialog-title {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.app-role-dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-role-dialog-actions .el-button {
  min-width: 56px;
  padding: 7px 15px;
}

.app-role-form .el-form-item__label {
  color: #606266;
  font-weight: 400;
  padding-right: 8px;
}

.app-role-form
  .el-form-item.is-required:not(.is-no-asterisk)
  > .el-form-item__label:before {
  color: #f56c6c;
  margin-right: 2px;
}

.app-role-form .desc-form-item {
  margin-bottom: 0;
}

.app-role-form .desc-counter {
  margin-top: 6px;
  text-align: right;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.app-role-form .desc-remain {
  color: #f56c6c;
}
</style>
