<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">权限控制与分配</h2>
        <p class="page-desc">支持页面权限、操作权限、数据权限的精细化控制，管理员可为不同部门角色分配菜单与功能权限。</p>
      </div>
      <el-button type="primary" size="small" @click="saveAll">保存配置</el-button>
    </div>

    <section class="config-card">
      <div class="card-tools">
        <span class="form-label">选择角色</span>
        <el-select v-model="selectedRoleId" size="small" style="width: 220px" @change="loadDetail">
          <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
        </el-select>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="页面权限" name="page">
          <p class="tab-tip">控制角色可访问的功能页面（菜单）。</p>
          <el-tree
            ref="pageTree"
            :data="moduleTree"
            show-checkbox
            node-key="id"
            default-expand-all
            :default-checked-keys="detail.pageIds"
            :props="{ label: 'label', children: 'children' }"
          />
        </el-tab-pane>

        <el-tab-pane label="操作权限" name="operation">
          <p class="tab-tip">控制角色在各功能模块内可执行的操作（查看、新增、编辑、删除、导出）。</p>
          <el-table :data="operationRows" border size="small" max-height="480">
            <el-table-column prop="moduleName" label="功能模块" min-width="180" />
            <el-table-column v-for="op in operationTypes" :key="op.key" :label="op.label" width="90" align="center">
              <template slot-scope="{ row }">
                <el-checkbox
                  :value="hasOperation(row.moduleId, op.key)"
                  @change="(val) => setOperation(row.moduleId, op.key, val)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="数据权限" name="data">
          <p class="tab-tip">控制角色可访问的数据范围，与组织机构层级绑定。</p>
          <el-form label-width="100px" size="small" style="max-width: 480px">
            <el-form-item label="数据范围">
              <el-radio-group v-model="detail.dataScope">
                <el-radio v-for="o in dataScopeOptions" :key="o.value" :label="o.value">{{ o.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="说明">
              <ul class="scope-desc">
                <li><strong>全部数据</strong>：可查看系统全部组织与人员数据</li>
                <li><strong>本级及下级</strong>：仅可查看本机构及下级机构数据</li>
                <li><strong>仅本级</strong>：仅可查看本机构数据</li>
                <li><strong>仅本人</strong>：仅可查看与本人相关的数据</li>
              </ul>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script>
import {
  getRoles, getRolePermissionDetail, updateRolePermissionDetail,
  modulesToTreeOptions, SYSTEM_MODULE_TREE, OPERATION_TYPES, DATA_SCOPE_OPTIONS, getAllModuleLeaves,
} from "../utils/permissionManagement";

export default {
  name: "PermissionControl",
  data() {
    return {
      roles: [],
      selectedRoleId: null,
      activeTab: "page",
      moduleTree: modulesToTreeOptions(SYSTEM_MODULE_TREE),
      operationTypes: OPERATION_TYPES,
      dataScopeOptions: DATA_SCOPE_OPTIONS,
      detail: { pageIds: [], operations: {}, dataScope: "self_only" },
    };
  },
  computed: {
    operationRows() {
      return getAllModuleLeaves()
        .filter((m) => (this.detail.pageIds || []).includes(m.id))
        .map((m) => ({ moduleId: m.id, moduleName: m.name }));
    },
  },
  mounted() {
    this.roles = getRoles();
    if (this.roles.length) {
      this.selectedRoleId = this.roles[0].id;
      this.loadDetail();
    }
  },
  methods: {
    loadDetail() {
      this.detail = getRolePermissionDetail(this.selectedRoleId);
      this.$nextTick(() => {
        if (this.$refs.pageTree) this.$refs.pageTree.setCheckedKeys(this.detail.pageIds || []);
      });
    },
    hasOperation(moduleId, opKey) {
      const ops = this.detail.operations[moduleId] || [];
      return ops.includes(opKey);
    },
    setOperation(moduleId, opKey, enabled) {
      const ops = new Set(this.detail.operations[moduleId] || []);
      if (enabled) ops.add(opKey);
      else ops.delete(opKey);
      this.$set(this.detail.operations, moduleId, Array.from(ops));
    },
    saveAll() {
      const pageIds = this.$refs.pageTree ? this.$refs.pageTree.getCheckedKeys(true) : this.detail.pageIds;
      updateRolePermissionDetail(this.selectedRoleId, {
        pageIds,
        operations: this.detail.operations,
        dataScope: this.detail.dataScope,
      });
      this.detail.pageIds = pageIds;
      this.$message.success("权限配置已保存");
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.tab-tip { margin: 0 0 12px; font-size: 12px; color: #909399; }
.scope-desc { margin: 0; padding-left: 18px; font-size: 13px; color: #606266; line-height: 1.8; }
</style>
