<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">角色层级管理</h2>
        <p class="page-desc">按组织机构层级管理角色上下级关系，确保不同层级用户只能访问授权范围内的资源。</p>
      </div>
      <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">恢复默认</el-button>
    </div>

    <div class="perm-layout">
      <aside class="perm-sidebar">
        <div class="sidebar-head">角色层级树</div>
        <div class="sidebar-body">
          <el-tree
            ref="roleTree"
            :data="hierarchyTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i class="el-icon-user-solid" />
              <span class="tree-label">{{ node.label }}</span>
              <span class="tree-tag">{{ data.level }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <main class="perm-main">
        <template v-if="selectedRole">
          <section class="config-card">
            <div class="card-title">当前角色</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="角色名称">{{ selectedRole.name }}</el-descriptions-item>
              <el-descriptions-item label="角色编码">{{ selectedRole.code }}</el-descriptions-item>
              <el-descriptions-item label="角色层级">{{ selectedRole.level }}</el-descriptions-item>
              <el-descriptions-item label="组织范围">{{ selectedRole.orgScope }}</el-descriptions-item>
              <el-descriptions-item label="上级角色">{{ parentName }}</el-descriptions-item>
              <el-descriptions-item label="同级排序">{{ selectedRole.sort }}</el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="config-card">
            <div class="card-title">调整上级角色</div>
            <div class="form-row">
              <span class="form-label">目标上级</span>
              <el-select v-model="targetParentId" clearable placeholder="无上级（顶级角色）" size="small" style="width: 280px">
                <el-option v-for="r in parentOptions" :key="r.id" :label="r.name" :value="r.id" />
              </el-select>
              <el-button type="primary" size="small" @click="applyParent">应用调整</el-button>
            </div>
          </section>

          <section class="config-card">
            <div class="card-title">同级顺序</div>
            <div class="form-row">
              <el-button size="small" icon="el-icon-top" @click="moveOrder('up')">上移</el-button>
              <el-button size="small" icon="el-icon-bottom" @click="moveOrder('down')">下移</el-button>
            </div>
            <el-table :data="siblingRows" border size="small">
              <el-table-column prop="sort" label="排序" width="70" align="center" />
              <el-table-column prop="name" label="角色名称" min-width="160" />
              <el-table-column prop="level" label="层级" width="90" />
              <el-table-column label="标识" width="80" align="center">
                <template slot-scope="{ row }">
                  <el-tag v-if="row.id === selectedRole.id" size="mini" type="primary">当前</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </template>
        <div v-else class="main-tip">
          <i class="el-icon-user" />
          <p>请在左侧选择角色，调整层级与顺序</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import {
  getRoles, buildRoleHierarchyTree, updateRoleParent, moveRoleOrder, resetPermissionState,
} from "../utils/permissionManagement";

export default {
  name: "RoleHierarchy",
  data() {
    return {
      roles: [],
      selectedId: null,
      targetParentId: null,
    };
  },
  computed: {
    hierarchyTree() { return buildRoleHierarchyTree(this.roles); },
    selectedRole() { return this.roles.find((r) => r.id === this.selectedId) || null; },
    parentName() {
      if (!this.selectedRole || !this.selectedRole.parentId) return "—";
      const p = this.roles.find((r) => r.id === this.selectedRole.parentId);
      return p ? p.name : "—";
    },
    parentOptions() {
      return this.roles.filter((r) => r.id !== this.selectedId);
    },
    siblingRows() {
      if (!this.selectedRole) return [];
      return this.roles
        .filter((r) => r.parentId === this.selectedRole.parentId)
        .sort((a, b) => a.sort - b.sort);
    },
  },
  watch: {
    selectedId(val) {
      const role = this.roles.find((r) => r.id === val);
      this.targetParentId = role ? role.parentId : null;
    },
  },
  mounted() {
    this.reload();
    if (this.roles.length) {
      this.selectedId = this.roles[0].id;
      this.$nextTick(() => this.$refs.roleTree && this.$refs.roleTree.setCurrentKey(this.selectedId));
    }
  },
  methods: {
    reload() { this.roles = getRoles(); },
    handleNodeClick(data) { this.selectedId = data.id; },
    applyParent() {
      try {
        updateRoleParent(this.selectedId, this.targetParentId);
        this.reload();
        this.$message.success("上级角色已调整");
      } catch (e) { this.$message.warning(e.message); }
    },
    moveOrder(dir) {
      try {
        moveRoleOrder(this.selectedId, dir);
        this.reload();
        this.$message.success(dir === "up" ? "已上移" : "已下移");
      } catch (e) { this.$message.warning(e.message); }
    },
    handleReset() {
      this.$confirm("确定恢复默认角色层级？", "恢复默认", { type: "warning" })
        .then(() => {
          resetPermissionState();
          this.reload();
          this.selectedId = this.roles[0] ? this.roles[0].id : null;
          this.$message.success("已恢复默认");
        }).catch(() => {});
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
