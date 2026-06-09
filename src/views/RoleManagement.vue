<template>
  <div class="role-mgmt-page">
    <section class="role-mgmt-panel">
      <div class="role-toolbar">
        <div class="role-filters">
          <div class="filter-item">
            <span class="filter-label">角色名称：</span>
            <el-input
              v-model="queryName"
              placeholder=""
              size="small"
              clearable
              class="filter-input"
              @keyup.enter.native="handleSearch"
            />
          </div>
          <div class="filter-item">
            <span class="filter-label">角色状态：</span>
            <el-select
              v-model="queryStatus"
              placeholder="请选择"
              size="small"
              clearable
              class="filter-select"
            >
              <el-option label="启用" value="enabled" />
              <el-option label="停用" value="disabled" />
            </el-select>
          </div>
        </div>
        <div class="role-actions">
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="openCreate"
            >新增</el-button
          >
          <el-button size="small" icon="el-icon-search" @click="handleSearch"
            >查询</el-button
          >
          <el-button
            size="small"
            icon="el-icon-refresh-left"
            @click="handleReset"
            >重置</el-button
          >
        </div>
      </div>

      <el-table
        :data="pagedRoles"
        border
        size="small"
        class="role-table"
        empty-text="暂无角色"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="序号" width="60" align="center">
          <template slot-scope="{ $index }">{{ indexMethod($index) }}</template>
        </el-table-column>
        <el-table-column
          prop="code"
          label="角色编码"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="角色名称"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="{ row }">
            <el-switch
              v-model="row.enabled"
              active-color="#13ce66"
              inactive-color="#dcdfe6"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="dataScopeLabel"
          label="角色数据范围"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column label="父级角色" width="150" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span v-if="row.parentId">{{
              getParentRoleName(row.parentId)
            }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column
          label="关联组织机构"
          min-width="200"
          show-overflow-tooltip
        >
          <template slot-scope="{ row }">
            <span v-if="row.orgIds && row.orgIds.length > 0">{{
              getOrgNamesByIds(row.orgIds)
            }}</span>
            <span v-else style="color: #909399">—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          width="150"
          align="center"
        />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button
              type="text"
              size="small"
              class="action-link"
              @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button
              type="text"
              size="small"
              class="action-link danger-link"
              @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="role-pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredRoles.length"
          :current-page.sync="currentPage"
          :page-size.sync="pageSize"
          :page-sizes="[10, 25, 50]"
        />
      </div>
    </section>

    <el-dialog
      :title="formTitle"
      :visible.sync="showForm"
      width="520px"
      append-to-body
      custom-class="role-edit-dialog"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="roleForm"
        :model="form"
        :rules="rules"
        label-width="88px"
        size="small"
        class="role-edit-form"
      >
        <el-form-item label="角色名称" prop="name" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code" required>
          <el-input
            v-model="form.code"
            placeholder="请输入角色编码，仅允许英文字母和下划线"
            :disabled="formMode === 'edit'"
          />
          <div class="form-tip">
            格式：仅允许英文字母和下划线，例如：ROLE_ADMIN
          </div>
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScopeType" required>
          <el-select
            v-model="form.dataScopeType"
            placeholder="请选择"
            style="width: 100%"
            @change="handleDataScopeChange"
          >
            <el-option
              v-for="item in dataScopeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <div class="data-scope-option">
                <span class="data-scope-label">{{ item.label }}</span>
                <span v-if="item.desc" class="data-scope-desc">{{
                  item.desc
                }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="父级角色" prop="parentId">
          <el-select
            v-model="form.parentId"
            placeholder="请选择父级角色（可选）"
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="role in parentRoleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="showOrgSelector"
          label="关联组织"
          prop="orgIds"
          required
        >
          <el-select
            v-model="form.orgIds"
            multiple
            filterable
            remote
            placeholder="请输入组织名称搜索，支持多选"
            :remote-method="searchOrg"
            :loading="orgLoading"
            style="width: 100%"
          >
            <el-option
              v-for="org in orgOptions"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            >
              <span style="float: left">{{ org.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">{{
                org.fullName
              }}</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="role-edit-footer">
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  ROLE_DATA_SCOPE_OPTIONS,
  getRoleDataScopeLabel,
} from "../utils/permissionManagement";
import { loadOrgTree } from "../utils/orgManagement";

export default {
  name: "RoleManagement",
  data() {
    return {
      roles: [],
      queryName: "",
      queryStatus: "",
      filterName: "",
      filterStatus: "",
      currentPage: 1,
      pageSize: 10,
      selectedRows: [],
      dataScopeOptions: ROLE_DATA_SCOPE_OPTIONS,
      showForm: false,
      formMode: "create",
      editingId: null,
      form: {
        name: "",
        code: "",
        dataScopeType: "ALL",
        orgIds: [],
        parentId: null,
      },
      rules: {
        name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
        code: [
          { required: true, message: "请输入角色编码", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error("请输入角色编码"));
              } else if (!/^[A-Za-z_]+$/.test(value)) {
                callback(new Error("角色编码只能包含英文字母和下划线"));
              } else {
                callback();
              }
            },
            trigger: "blur",
          },
        ],
        dataScopeType: [
          { required: true, message: "请选择数据范围", trigger: "change" },
        ],
      },
      editingRow: null,
      showOrgSelector: false,
      orgOptions: [],
      orgLoading: false,
      allOrgList: [],
      orgMap: {}, // 组织ID到名称的映射
    };
  },
  computed: {
    filteredRoles() {
      const kw = this.filterName.trim().toLowerCase();
      return this.roles.filter((r) => {
        const matchName =
          !kw ||
          r.name.toLowerCase().includes(kw) ||
          (r.code || "").toLowerCase().includes(kw);
        const matchStatus =
          !this.filterStatus ||
          (this.filterStatus === "enabled" && r.enabled) ||
          (this.filterStatus === "disabled" && !r.enabled);
        return matchName && matchStatus;
      });
    },
    pagedRoles() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredRoles.slice(start, start + this.pageSize);
    },
    formTitle() {
      return this.formMode === "create" ? "新增角色页面" : "编辑角色页面";
    },
    parentRoleOptions() {
      // 过滤掉当前正在编辑的角色，避免选择自己作为父级
      if (this.formMode === "edit" && this.editingId) {
        return this.roles.filter((r) => r.id !== this.editingId);
      }
      return this.roles;
    },
  },
  mounted() {
    this.reload();
    this.loadOrgMap();
  },
  methods: {
    reload() {
      this.roles = getRoles();
    },
    loadOrgMap() {
      try {
        const tree = loadOrgTree();
        this.orgMap = this.buildOrgMap(tree);
      } catch (e) {
        console.warn("加载组织映射失败", e);
      }
    },
    buildOrgMap(tree) {
      const map = {};
      const traverse = (nodes) => {
        nodes.forEach((node) => {
          map[node.id] = node.name;
          if (node.children && node.children.length > 0) {
            traverse(node.children);
          }
        });
      };
      traverse(tree);
      return map;
    },
    getOrgNamesByIds(orgIds) {
      if (!orgIds || orgIds.length === 0) return "—";
      const names = orgIds
        .map((id) => this.orgMap[id] || id)
        .filter((name) => name);
      return names.join("、");
    },
    getParentRoleName(parentId) {
      if (!parentId) return "—";
      const parentRole = this.roles.find((r) => r.id === parentId);
      return parentRole ? parentRole.name : "—";
    },
    indexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1;
    },
    handleSearch() {
      this.filterName = this.queryName;
      this.filterStatus = this.queryStatus;
      this.currentPage = 1;
    },
    handleReset() {
      this.queryName = "";
      this.queryStatus = "";
      this.filterName = "";
      this.filterStatus = "";
      this.currentPage = 1;
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    handleStatusChange(row, enabled) {
      try {
        updateRole(row.id, { enabled });
        row.dataScopeLabel =
          row.dataScopeLabel || getRoleDataScopeLabel(row.dataScopeType);
        this.$message.success(enabled ? "已启用" : "已停用");
      } catch (e) {
        row.enabled = !enabled;
        this.$message.warning(e.message);
      }
    },
    openCreate() {
      this.formMode = "create";
      this.editingId = null;
      this.editingRow = null;
      this.form = {
        name: "",
        code: "",
        dataScopeType: "ALL",
        orgIds: [],
        parentId: null,
      };
      this.showOrgSelector = false;
      this.showForm = true;
    },
    openEdit(row) {
      this.formMode = "edit";
      this.editingId = row.id;
      this.editingRow = row;
      this.form = {
        name: row.name,
        code: row.code || "",
        dataScopeType: row.dataScopeType || "ALL",
        orgIds: row.orgIds ? [...row.orgIds] : [],
        parentId: row.parentId || null,
      };
      if (this.form.dataScopeType === "REPORTER")
        this.form.dataScopeType = "SELF";
      if (this.form.dataScopeType === "CURRENT_ORG")
        this.form.dataScopeType = "CURRENT_ORG_CHILD";
      if (this.form.dataScopeType === "LOCAL_ORG_HQ")
        this.form.dataScopeType = "ASSIGNED_ORG_CHILD";
      this.showOrgSelector = this.form.dataScopeType === "ASSIGNED_ORG_CHILD";
      if (this.showOrgSelector && this.form.orgIds.length > 0) {
        this.loadAllOrgs();
      }
      this.showForm = true;
    },
    resetForm() {
      if (this.$refs.roleForm) this.$refs.roleForm.resetFields();
    },
    submitForm() {
      this.$refs.roleForm.validate((ok) => {
        if (!ok) return;

        // 如果选择了指定组织及下级，必须选择组织
        if (
          this.form.dataScopeType === "ASSIGNED_ORG_CHILD" &&
          (!this.form.orgIds || this.form.orgIds.length === 0)
        ) {
          this.$message.warning("请至少选择一个关联组织");
          return;
        }

        const payload = {
          name: this.form.name,
          code: this.form.code,
          dataScopeType: this.form.dataScopeType,
          dataScopeLabel: getRoleDataScopeLabel(this.form.dataScopeType),
          orgIds:
            this.form.orgIds && this.form.orgIds.length > 0
              ? [...this.form.orgIds]
              : null,
          parentId: this.form.parentId || null,
        };
        try {
          if (this.formMode === "create") {
            createRole({
              ...payload,
              enabled: true,
            });
          } else {
            updateRole(this.editingId, {
              ...payload,
              enabled: this.editingRow?.enabled !== false,
              remark: this.editingRow?.remark || "",
            });
          }
          this.reload();
          this.showForm = false;
          this.$message.success("保存成功");
        } catch (e) {
          this.$message.warning(e.message);
        }
      });
    },
    handleDelete(row) {
      this.$confirm(`确定删除角色「${row.name}」？`, "删除角色", {
        type: "warning",
      })
        .then(() => {
          deleteRole(row.id);
          this.reload();
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    handleDataScopeChange(value) {
      // 当选择"指定组织及下级"时显示组织选择器
      this.showOrgSelector = value === "ASSIGNED_ORG_CHILD";
      if (!this.showOrgSelector) {
        this.form.orgIds = [];
      } else {
        this.loadAllOrgs();
      }
    },
    loadAllOrgs() {
      this.orgLoading = true;
      try {
        const tree = loadOrgTree();
        this.allOrgList = this.flattenOrgTree(tree);
        this.orgOptions = this.allOrgList;
      } catch (e) {
        this.$message.warning("加载组织数据失败");
      } finally {
        this.orgLoading = false;
      }
    },
    flattenOrgTree(tree, parentName = "") {
      let result = [];
      tree.forEach((node) => {
        const fullName = parentName
          ? `${parentName} / ${node.name}`
          : node.name;
        result.push({
          id: node.id,
          name: node.name,
          fullName: fullName,
        });
        if (node.children && node.children.length > 0) {
          result = result.concat(this.flattenOrgTree(node.children, fullName));
        }
      });
      return result;
    },
    searchOrg(query) {
      if (query !== "") {
        this.orgLoading = true;
        setTimeout(() => {
          this.orgLoading = false;
          this.orgOptions = this.allOrgList.filter((org) => {
            return (
              org.name.toLowerCase().includes(query.toLowerCase()) ||
              org.fullName.toLowerCase().includes(query.toLowerCase())
            );
          });
        }, 200);
      } else {
        this.orgOptions = this.allOrgList;
      }
    },
  },
};
</script>

<style scoped>
.role-mgmt-page {
  min-height: calc(100vh - 60px);
  background: #eef1f6;
  padding: 12px 16px 20px;
}

.role-mgmt-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  padding: 14px 16px 12px;
}

.role-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.role-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  margin-right: 4px;
}

.filter-input {
  width: 180px;
}

.filter-select {
  width: 140px;
}

.role-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.role-table {
  width: 100%;
}

.role-table >>> .el-table__header th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.action-link {
  padding: 0 4px;
  color: #409eff;
}

.danger-link {
  color: #409eff;
}

.role-pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 8px;
}

.role-table >>> .el-switch {
  transform: scale(0.95);
}

.data-scope-option {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
  padding: 2px 0;
}

.data-scope-label {
  font-size: 13px;
  color: #303133;
}

.data-scope-desc {
  font-size: 12px;
  color: #909399;
}
</style>

<style>
.role-edit-dialog .el-dialog__header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.role-edit-dialog .el-dialog__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.role-edit-dialog .el-dialog__headerbtn {
  top: 14px;
}

.role-edit-dialog .el-dialog__body {
  padding: 28px 32px 12px;
}

.role-edit-dialog .el-form-item {
  margin-bottom: 22px;
}

.role-edit-dialog .el-form-item__label {
  color: #606266;
  font-weight: 400;
}

.role-edit-dialog
  .el-form-item.is-required:not(.is-no-asterisk)
  > .el-form-item__label:before {
  color: #f56c6c;
  margin-right: 2px;
}

.role-edit-dialog .el-input__inner,
.role-edit-dialog .el-select .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.role-edit-dialog .el-dialog__footer {
  padding: 12px 20px 18px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.role-edit-dialog .el-dialog__footer .el-button {
  min-width: 72px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
