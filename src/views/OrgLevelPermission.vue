<template>
  <div class="org-level-container">
    <!-- 页面头部 -->
    <div class="page-header-wrapper">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">组织机构层级管理</h1>
          <p class="page-subtitle">
            查看各组织机构下的人员及其拥有的角色，了解权限分配情况。
          </p>
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

      <!-- 右侧人员和角色展示区域 -->
      <div class="main-panel">
        <div v-if="selectedOrgId" class="config-card">
          <!-- 卡片头部 -->
          <div class="card-header-row">
            <div class="card-title">
              <i class="el-icon-users"></i>
              <span>机构人员管理</span>
              <span class="org-name-tag">{{ orgName }}</span>
            </div>
            <div class="card-stats">
              <span class="stat-badge">
                <i class="el-icon-user"></i>
                <span>{{ userList.length }} 人</span>
              </span>
            </div>
          </div>

          <div class="config-content">
            <!-- 人员列表 -->
            <el-card class="info-section" body-style="padding: 0;">
              <div class="section-header">
                <i class="el-icon-user"></i>
                <span class="section-title">人员列表</span>
              </div>
              <div v-if="userList.length > 0" class="user-list-wrapper">
                <el-table
                  :data="currentPageUsers"
                  border
                  size="small"
                  max-height="100%"
                >
                  <el-table-column
                    prop="name"
                    label="人员姓名"
                    min-width="120"
                  />
                  <el-table-column
                    prop="username"
                    label="用户名"
                    min-width="120"
                  />
                  <el-table-column
                    prop="position"
                    label="职位"
                    min-width="120"
                  />
                  <el-table-column
                    prop="phone"
                    label="联系电话"
                    min-width="130"
                  />
                  <el-table-column label="所属角色" min-width="200">
                    <template slot-scope="{ row }">
                      <el-tag
                        v-for="role in row.roles"
                        :key="role.id"
                        type="info"
                        size="small"
                        class="role-tag"
                      >
                        {{ role.name }}
                      </el-tag>
                      <span v-if="row.roles.length === 0" class="empty-text"
                        >无角色</span
                      >
                    </template>
                  </el-table-column>
                </el-table>
                <!-- 分页组件 -->
                <div class="pagination-wrapper">
                  <el-pagination
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                    :current-page="pagination.currentPage"
                    :page-sizes="[10, 20, 50, 100]"
                    :page-size="pagination.pageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="userList.length"
                    background
                    size="small"
                  >
                  </el-pagination>
                </div>
              </div>
              <div v-else class="empty-content">
                <div class="empty-icon">
                  <i class="el-icon-user"></i>
                </div>
                <p>该机构暂无人员</p>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 未选择组织机构时的空状态 -->
        <div v-else class="empty-card">
          <el-empty description="请选择组织机构" class="custom-empty">
            <template #image>
              <i
                class="el-icon-office-building"
                style="font-size: 48px; color: #d9d9d9"
              ></i>
            </template>
            <template #description>
              <span>请选择组织机构</span>
              <p style="margin-top: 8px; font-size: 12px; color: #999">
                从左侧组织机构树中选择一个部门查看人员信息
              </p>
            </template>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 人员详情弹窗 -->
    <el-dialog
      title="人员详情"
      :visible.sync="userDetailVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border size="small" v-if="selectedUser">
        <el-descriptions-item label="姓名">{{
          selectedUser.name
        }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{
          selectedUser.username
        }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{
          selectedUser.position || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{
          selectedUser.phone || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="所属机构" :span="2">{{
          orgName
        }}</el-descriptions-item>
        <el-descriptions-item label="拥有角色" :span="2">
          <div class="detail-roles">
            <el-tag
              v-for="role in selectedUser.roles"
              :key="role.id"
              type="info"
              size="small"
            >
              {{ role.name }}
            </el-tag>
            <span v-if="selectedUser.roles.length === 0" class="empty-text"
              >无角色</span
            >
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { loadOrgTree } from "../utils/orgManagement";
import {
  filterOrgTreeForPermission,
  getOrgNodeName,
} from "../utils/permissionManagement";

// 模拟数据：组织机构人员
const generateOrgUsers = (orgId) => {
  const userTemplates = [
    {
      name: "张伟",
      username: "zhangwei",
      position: "部门经理",
      phone: "13800138001",
    },
    {
      name: "李娜",
      username: "lina",
      position: "业务主管",
      phone: "13800138002",
    },
    {
      name: "王强",
      username: "wangqiang",
      position: "技术专员",
      phone: "13800138003",
    },
    {
      name: "刘洋",
      username: "liuyang",
      position: "数据分析师",
      phone: "13800138004",
    },
    {
      name: "陈静",
      username: "chenjing",
      position: "管理员",
      phone: "13800138005",
    },
    {
      name: "李明",
      username: "liming",
      position: "项目经理",
      phone: "13800138006",
    },
    {
      name: "赵丽",
      username: "zhaoli",
      position: "系统运维",
      phone: "13800138007",
    },
    {
      name: "孙浩",
      username: "sunhao",
      position: "安全专员",
      phone: "13800138008",
    },
  ];

  const roleTemplates = [
    { id: "role-admin", name: "系统管理员" },
    { id: "role-manager", name: "部门管理员" },
    { id: "role-user", name: "普通用户" },
    { id: "role-data", name: "数据管理员" },
    { id: "role-security", name: "安全管理员" },
    { id: "role-audit", name: "审计员" },
  ];

  // 根据orgId生成不同数量的用户
  const userCount = (orgId % 8) + 2;
  const users = [];

  for (let i = 0; i < userCount; i++) {
    const template = userTemplates[i % userTemplates.length];
    // 为每个用户随机分配1-3个角色
    const roleCount = Math.floor(Math.random() * 3) + 1;
    const shuffledRoles = [...roleTemplates].sort(() => Math.random() - 0.5);
    const userRoles = shuffledRoles.slice(0, roleCount);

    users.push({
      id: `${orgId}-${i}`,
      ...template,
      roles: userRoles,
    });
  }

  return users;
};

// 缓存用户数据
const userCache = {};

export default {
  name: "OrgLevelPermission",
  data() {
    return {
      orgTree: [],
      orgKeyword: "",
      selectedOrgId: null,
      userList: [],
      tableHeight: 300,
      userDetailVisible: false,
      selectedUser: null,
      pagination: {
        currentPage: 1,
        pageSize: 10,
      },
    };
  },
  computed: {
    displayOrgTree() {
      return filterOrgTreeForPermission(this.orgTree, this.orgKeyword);
    },
    orgName() {
      return getOrgNodeName(this.selectedOrgId);
    },
    currentPageUsers() {
      const start =
        (this.pagination.currentPage - 1) * this.pagination.pageSize;
      const end = start + this.pagination.pageSize;
      return this.userList.slice(start, end);
    },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    const root = this.orgTree[0];
    if (root) {
      this.selectedOrgId = root.id;
      this.loadOrgUsers();
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
      this.tableHeight = Math.max(250, window.innerHeight - 480);
    },
    handleOrgClick(data) {
      this.selectedOrgId = data.id;
      this.loadOrgUsers();
    },
    loadOrgUsers() {
      // 重置分页
      this.pagination.currentPage = 1;
      // 从缓存获取或生成用户数据
      if (!userCache[this.selectedOrgId]) {
        userCache[this.selectedOrgId] = generateOrgUsers(this.selectedOrgId);
      }
      this.userList = userCache[this.selectedOrgId];
    },
    viewUserDetail(user) {
      this.selectedUser = user;
      this.userDetailVisible = true;
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
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

.card-stats {
  display: flex;
  gap: 12px;
}

.stat-badge {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: #f0f9ff;
  border-radius: 20px;
  font-size: 12px;
  color: #0ea5e9;
}

.stat-badge i {
  margin-right: 6px;
}

.config-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
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

/* 用户列表 */
.user-list-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.user-list-wrapper >>> .el-table {
  --el-table-header-text-color: #64748b;
  --el-table-row-hover-bg-color: #f8fafc;
  flex: 1;
}

/* 分页 */
.pagination-wrapper {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.pagination-wrapper >>> .el-pagination {
  --el-pagination-font-size: 12px;
}

.role-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.empty-text {
  color: #94a3b8;
  font-size: 12px;
}

.empty-content {
  padding: 40px;
  text-align: center;
}

.empty-content .empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content .empty-icon i {
  font-size: 32px;
  color: #cbd5e1;
}

.empty-content p {
  color: #94a3b8;
  margin: 0;
}

/* 人员详情弹窗 */
.detail-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
