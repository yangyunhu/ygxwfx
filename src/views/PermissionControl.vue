<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">权限控制与分配</h2>
        <p class="page-desc">
          展示各角色的页面权限、操作权限、数据权限配置，配置结果与功能模块权限分配保持一致。
        </p>
      </div>
    </div>

    <section class="config-card">
      <div class="card-tools">
        <span class="form-label">选择角色</span>
        <el-select
          v-model="selectedRoleId"
          size="small"
          style="width: 220px"
          @change="loadDetail"
        >
          <el-option
            v-for="r in roles"
            :key="r.id"
            :label="r.name"
            :value="r.id"
          />
        </el-select>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="页面权限" name="page">
          <p class="tab-tip">
            展示角色可访问的功能页面（菜单），配置由功能模块权限分配统一管理。
          </p>
          <el-tree
            ref="pageTree"
            :data="filteredModuleTree"
            node-key="id"
            default-expand-all
            :props="{ label: 'label', children: 'children' }"
            disabled
          />
        </el-tab-pane>

        <el-tab-pane label="操作权限" name="operation">
          <p class="tab-tip">配置角色在各功能模块内可执行的操作。</p>
          <el-table :data="operationRows" border size="small" max-height="480">
            <el-table-column
              prop="moduleName"
              label="功能模块"
              min-width="180"
            />
            <el-table-column
              v-for="op in operationTypes"
              :key="op.key"
              :label="op.label"
              width="90"
              align="center"
            >
              <template slot-scope="{ row }">
                <el-checkbox
                  :value="hasOperation(row.moduleId, op.key)"
                  @change="
                    (checked) => toggleOperation(row.moduleId, op.key, checked)
                  "
                />
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 12px; text-align: right">
            <el-button size="small" type="primary" @click="saveOperations"
              >保存配置</el-button
            >
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据权限" name="data">
          <p class="tab-tip">
            展示角色可访问的数据范围，配置由功能模块权限分配统一管理。
          </p>
          <div class="data-scope-list">
            <div
              v-for="option in roleDataScopeOptions"
              :key="option.value"
              class="scope-option"
              :class="{ 'is-selected': detail.dataScope === option.value }"
            >
              <div class="scope-radio">
                <div class="radio-outer">
                  <div
                    class="radio-inner"
                    v-if="detail.dataScope === option.value"
                  ></div>
                </div>
              </div>
              <div class="scope-info">
                <div class="scope-name">{{ option.label }}</div>
                <div
                  class="scope-desc"
                  v-if="getScopeDescription(option.value)"
                >
                  {{ getScopeDescription(option.value) }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
  </div>
</template>

<script>
import {
  getRolesFromApp,
  getRolePermissionConfig,
  modulesToTreeOptions,
  SYSTEM_MODULE_TREE,
  OPERATION_TYPES,
  ROLE_DATA_SCOPE_OPTIONS,
  getAllModuleLeaves,
} from "../utils/permissionManagement";
import {
  getAppRoles,
  DEFAULT_SELECTED_APP_ID,
} from "../utils/modulePermissionAllocation";

export default {
  name: "PermissionControl",
  data() {
    return {
      roles: [],
      selectedRoleId: null,
      activeTab: "page",
      moduleTree: modulesToTreeOptions(SYSTEM_MODULE_TREE),
      operationTypes: OPERATION_TYPES,
      roleDataScopeOptions: ROLE_DATA_SCOPE_OPTIONS,
      detail: { pageIds: [], operations: {}, dataScope: "CURRENT_ORG_CHILD" },
    };
  },
  computed: {
    // 只显示角色已授权的模块树
    filteredModuleTree() {
      if (!this.detail.pageIds || this.detail.pageIds.length === 0) {
        return [];
      }

      // 过滤模块树，只保留已授权的节点
      function filterTree(nodes, authorizedIds) {
        return nodes
          .map((node) => {
            const isLeaf = !node.children || node.children.length === 0;
            const isAuthorized = authorizedIds.includes(node.id);

            if (isLeaf) {
              return isAuthorized ? node : null;
            }

            const filteredChildren = filterTree(
              node.children || [],
              authorizedIds,
            );
            if (filteredChildren.length > 0) {
              return { ...node, children: filteredChildren };
            }

            return isAuthorized ? { ...node, children: [] } : null;
          })
          .filter((node) => node !== null);
      }

      return filterTree(this.moduleTree, this.detail.pageIds);
    },
    operationRows() {
      return getAllModuleLeaves()
        .filter((m) => (this.detail.pageIds || []).includes(m.id))
        .map((m) => ({ moduleId: m.id, moduleName: m.name }));
    },
    currentDataScopeLabel() {
      const scope = this.detail.dataScope;
      const scopeMap = {
        CURRENT_ORG_CHILD: "当前组织及下级",
        ASSIGNED_ORG_CHILD: "指定组织及下级",
        ALL: "全省/全系统数据，无组织限制",
        SELF: "只展示当前登录人的数据",
      };
      return scopeMap[scope] || "未配置";
    },
  },
  mounted() {
    // 从模块权限分配中获取角色列表
    this.roles = getAppRoles(DEFAULT_SELECTED_APP_ID);
    if (this.roles.length) {
      this.selectedRoleId = this.roles[0].id;
      this.loadDetail();
    }
  },
  methods: {
    loadDetail() {
      // 从模块权限分配中获取角色的权限配置
      this.detail = getRolePermissionConfig(this.selectedRoleId);
      this.$nextTick(() => {
        if (this.$refs.pageTree)
          this.$refs.pageTree.setCheckedKeys(this.detail.pageIds || []);
      });
    },
    hasOperation(moduleId, opKey) {
      const ops = this.detail.operations[moduleId] || [];
      return ops.includes(opKey);
    },
    getScopeDescription(value) {
      const descriptions = {
        CURRENT_ORG_CHILD: "仅可查看当前组织及下级组织数据",
        ASSIGNED_ORG_CHILD: "仅可查看指定组织及下级组织数据",
        ALL: "可查看系统全部组织与人员数据",
        SELF: "仅可查看与本人相关的数据",
      };
      return descriptions[value] || "";
    },
    toggleOperation(moduleId, opKey, checked) {
      if (!this.detail.operations[moduleId]) {
        this.$set(this.detail.operations, moduleId, []);
      }
      const ops = this.detail.operations[moduleId];
      if (checked) {
        if (!ops.includes(opKey)) {
          ops.push(opKey);
        }
      } else {
        const index = ops.indexOf(opKey);
        if (index > -1) {
          ops.splice(index, 1);
        }
      }
    },
    saveOperations() {
      const {
        updateRolePermissionDetail,
      } = require("../utils/permissionManagement");
      updateRolePermissionDetail(this.selectedRoleId, this.detail);
      this.$message.success("操作权限配置已保存");
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.tab-tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: #909399;
}
.scope-desc {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

/* 数据权限展示区域样式 */
.data-scope-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scope-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.scope-option.is-selected {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.scope-radio {
  flex-shrink: 0;
  padding-top: 2px;
}

.radio-outer {
  width: 16px;
  height: 16px;
  border: 2px solid #c0c4cc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.scope-option.is-selected .radio-outer {
  border-color: #409eff;
}

.radio-inner {
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
}

.scope-info {
  flex: 1;
}

.scope-name {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.scope-option.is-selected .scope-name {
  color: #409eff;
  font-weight: 600;
}

.scope-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
</style>
