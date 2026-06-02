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
            <el-select v-model="queryStatus" placeholder="请选择" size="small" clearable class="filter-select">
              <el-option label="启用" value="enabled" />
              <el-option label="停用" value="disabled" />
            </el-select>
          </div>
        </div>
        <div class="role-actions">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">新增</el-button>
          <el-button size="small" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
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
        <el-table-column prop="name" label="角色名称" min-width="160" show-overflow-tooltip />
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
        <el-table-column prop="dataScopeLabel" label="角色数据范围" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="150" align="center" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" class="action-link" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" size="small" class="action-link danger-link" @click="handleDelete(row)">删除</el-button>
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
      <el-form ref="roleForm" :model="form" :rules="rules" label-width="88px" size="small" class="role-edit-form">
        <el-form-item label="角色名称" prop="name" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="数据范围" prop="dataScopeType" required>
          <el-select v-model="form.dataScopeType" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in dataScopeOptions" :key="item.value" :label="item.label" :value="item.value">
              <div class="data-scope-option">
                <span class="data-scope-label">{{ item.label }}</span>
                <span v-if="item.desc" class="data-scope-desc">{{ item.desc }}</span>
              </div>
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
        dataScopeType: "ALL",
      },
      rules: {
        name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
        dataScopeType: [{ required: true, message: "请选择数据范围", trigger: "change" }],
      },
      editingRow: null,
    };
  },
  computed: {
    filteredRoles() {
      const kw = this.filterName.trim().toLowerCase();
      return this.roles.filter((r) => {
        const matchName = !kw || r.name.toLowerCase().includes(kw) || (r.code || "").toLowerCase().includes(kw);
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
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.roles = getRoles();
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
        row.dataScopeLabel = row.dataScopeLabel || getRoleDataScopeLabel(row.dataScopeType);
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
        dataScopeType: "ALL",
      };
      this.showForm = true;
    },
    openEdit(row) {
      this.formMode = "edit";
      this.editingId = row.id;
      this.editingRow = row;
      this.form = {
        name: row.name,
        dataScopeType: row.dataScopeType || "ALL",
      };
      if (this.form.dataScopeType === "REPORTER") this.form.dataScopeType = "SELF";
      if (this.form.dataScopeType === "CURRENT_ORG") this.form.dataScopeType = "CURRENT_ORG_CHILD";
      if (this.form.dataScopeType === "LOCAL_ORG_HQ") this.form.dataScopeType = "ASSIGNED_ORG_CHILD";
      this.showForm = true;
    },
    resetForm() {
      if (this.$refs.roleForm) this.$refs.roleForm.resetFields();
    },
    submitForm() {
      this.$refs.roleForm.validate((ok) => {
        if (!ok) return;
        const payload = {
          name: this.form.name,
          dataScopeType: this.form.dataScopeType,
          dataScopeLabel: getRoleDataScopeLabel(this.form.dataScopeType),
        };
        try {
          if (this.formMode === "create") {
            createRole({
              ...payload,
              code: `ROLE_${Date.now()}`,
              enabled: true,
            });
          } else {
            updateRole(this.editingId, {
              ...payload,
              code: this.editingRow?.code,
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
      this.$confirm(`确定删除角色「${row.name}」？`, "删除角色", { type: "warning" })
        .then(() => {
          deleteRole(row.id);
          this.reload();
          this.$message.success("已删除");
        })
        .catch(() => {});
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

.role-edit-dialog .el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label:before {
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
</style>
