<template>
  <div class="role-user-page">
    <section class="role-user-panel">
      <div class="page-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="page-tab"
          :class="{ active: activeTab === tab.key }"
          @click="handleTabClick(tab)"
        >
          {{ tab.label }}
        </div>
      </div>

      <div class="search-bar">
        <el-input
          v-model="queryKeyword"
          placeholder="请输入角色名称"
          size="small"
          clearable
          class="search-input"
          @keyup.enter.native="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
        </el-input>
      </div>

      <el-table
        :data="pagedRoles"
        border
        size="small"
        class="role-user-table"
        empty-text="暂无角色"
        highlight-current-row
      >
        <el-table-column prop="sort" label="角色ID" width="90" align="center" />
        <el-table-column prop="name" label="角色名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="orgId" label="机构ID" width="120" align="center">
          <template slot-scope="{ row }">{{ row.orgId || "" }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip>
          <template slot-scope="{ row }">{{ row.remark || "" }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" class="action-link" @click="openLinkedUsers(row)">
              查看关联人员
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="role-user-pager">
        <div class="pager-left">
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
          background
          layout="total, prev, pager, next, jumper"
          :total="filteredRoles.length"
          :current-page.sync="currentPage"
          :page-size="pageSize"
          :page-sizes="pageSizeOptions"
        />
      </div>
    </section>

    <el-dialog
      title="关联人员信息"
      :visible.sync="showLinkedDialog"
      width="1400px"
      top="10vh"
      append-to-body
      custom-class="linked-users-dialog"
      :close-on-click-modal="false"
      @closed="closeLinkedDialog"
    >
      <div class="linked-toolbar">
        <el-input
          v-model="linkedQueryKeyword"
          placeholder="请输入用户名"
          size="small"
          clearable
          class="linked-search"
          @keyup.enter.native="handleLinkedSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleLinkedSearch" />
        </el-input>
        <div class="linked-actions">
          <el-button type="text" class="linked-action-btn" @click="openAddDialog">
            <i class="el-icon-plus" /> 添加关联人员
          </el-button>
          <el-button
            type="text"
            class="linked-action-btn linked-action-delete"
            :disabled="!selectedLinked.length"
            @click="batchRemove"
          >
            <i class="el-icon-close" /> 删除关联人员
          </el-button>
        </div>
      </div>

      <el-table
        ref="linkedTable"
        :data="pagedDialogUsers"
        border
        size="small"
        class="linked-user-table"
        empty-text="暂无人员"
        row-key="id"
        @selection-change="handleLinkedSelectionChange"
      >
        <el-table-column type="selection" width="48" align="center" reserve-selection />
        <el-table-column label="序号" width="70" align="center">
          <template slot-scope="{ $index }">{{ linkedIndexMethod($index) }}</template>
        </el-table-column>
        <el-table-column prop="name" label="用户名" width="120" show-overflow-tooltip />
        <el-table-column prop="orgUnit" label="所属单位" min-width="180" show-overflow-tooltip />
        <el-table-column prop="deptPath" label="部门" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orgFullPath" label="所属组织全路径" min-width="280" show-overflow-tooltip />
      </el-table>

      <div class="linked-pager">
        <div class="pager-left">
          <span class="pager-total">共{{ dialogUserList.length }}条</span>
          <span class="pager-label">每页显示</span>
          <span
            v-for="size in linkedPageSizeOptions"
            :key="size"
            class="page-size-item"
            :class="{ active: linkedPageSize === size }"
            @click="changeLinkedPageSize(size)"
          >
            {{ size }}
          </span>
          <span class="pager-suffix">条</span>
        </div>
        <el-pagination
          small
          layout="prev, pager, next, jumper"
          :total="dialogUserList.length"
          :current-page.sync="linkedCurrentPage"
          :page-size="linkedPageSize"
        />
      </div>
    </el-dialog>

    <el-dialog
      title="选择人员"
      :visible.sync="showAddDialog"
      width="1200px"
      top="5vh"
      append-to-body
      custom-class="pick-user-dialog"
      :close-on-click-modal="false"
      @closed="closeAddDialog"
    >
      <div class="pick-user-layout">
        <!-- 左侧：组织树 -->
        <section class="pick-user-left">
          <div class="pick-panel-header">
            <span class="pick-panel-title">组织结构</span>
          </div>
          <div class="pick-user-filter">
            <span class="pick-filter-label">组织结构</span>
            <el-select
              v-model="addOrgScope"
              size="small"
              class="pick-org-select"
              @change="handleAddOrgChange"
            >
              <el-option
                v-for="opt in pickerOrgOptions"
                :key="opt.id"
                :label="opt.name"
                :value="opt.id"
              />
            </el-select>
          </div>
          <div class="pick-user-search">
            <el-input
              v-model="addSearchKeyword"
              placeholder="输入名称、全拼、简拼查询"
              size="small"
              clearable
              prefix-icon="el-icon-search"
              @keyup.enter.native="handleAddSearch"
              @clear="handleAddSearch"
            />
          </div>
          <div class="pick-user-tree">
            <el-tree
              ref="pickerTree"
              :data="displayPickerTree"
              :props="pickerTreeProps"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              @node-click="handleOrgNodeClick"
            >
              <span slot-scope="{ node, data }" class="picker-tree-node">
                <i :class="data.nodeType === 'user' ? 'el-icon-user' : 'el-icon-share'" class="picker-node-icon" />
                <span class="picker-node-label" :title="node.label">{{ node.label }}</span>
              </span>
            </el-tree>
            <div v-if="!displayPickerTree.length" class="pick-user-empty">暂无可选组织</div>
          </div>
        </section>

        <!-- 中间：人员列表 -->
        <section class="pick-user-center">
          <div class="pick-panel-header">
            <span class="pick-panel-title">人员列表</span>
            <span class="pick-person-count">共 {{ currentOrgUsers.length }} 人</span>
          </div>
          <div class="pick-user-search">
            <el-input
              v-model="personSearchKeyword"
              placeholder="搜索人员姓名、ID"
              size="small"
              clearable
              prefix-icon="el-icon-search"
              @input="handlePersonSearch"
            />
          </div>
          <div class="pick-user-list">
            <div
              v-for="user in filteredPersonList"
              :key="user.id"
              class="pick-person-item"
              :class="{ selected: isUserPicked(user) }"
              @click="togglePickUser(user, !isUserPicked(user))"
            >
              <el-checkbox
                :value="isUserPicked(user)"
                class="pick-person-check"
                @input="(checked) => togglePickUser(user, checked)"
                @click.native.stop
              />
              <span class="pick-person-icon">👤</span>
              <div class="pick-person-info">
                <div class="pick-person-name">{{ user.name }}</div>
              </div>
            </div>
            <div v-if="!filteredPersonList.length" class="pick-user-empty">暂无人员数据</div>
          </div>
        </section>

        <!-- 右侧：已选人员 -->
        <section class="pick-user-right">
          <div class="pick-panel-header">
            <span class="pick-panel-title">已选：<span class="pick-count-highlight">{{ selectedPickUsers.length }}</span></span>
            <el-button
              type="text"
              class="pick-clear-btn"
              :disabled="!selectedPickUsers.length"
              @click="clearAllPicked"
            >
              全部清除
            </el-button>
          </div>
          <div class="pick-selected-list">
            <div
              v-for="user in selectedPickUsers"
              :key="user.id"
              class="pick-selected-item"
            >
              <span class="pick-person-icon">👤</span>
              <div class="pick-selected-info">
                <div class="pick-selected-name">{{ user.name }}</div>
              </div>
              <i class="el-icon-close pick-selected-remove" @click="removePickedUser(user)" />
            </div>
            <div v-if="!selectedPickUsers.length" class="pick-selected-empty">请从左侧选择人员</div>
          </div>
        </section>
      </div>

      <span slot="footer" class="linked-dialog-footer">
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedPickUsers.length" @click="confirmAddUsers">
          确定
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { loadOrgTree } from "../utils/orgManagement";
import {
  getRoles,
  getUsers,
  getUsersByRole,
  updateUserRoles,
} from "../utils/permissionManagement";

const ROOT_UNIT = "云南电网有限责任公司";
const ROOT_GROUP = "中国南方电网有限责任公司";

function findOrgPath(tree, orgId, path = []) {
  for (const node of tree || []) {
    const current = [...path, node.name];
    if (node.id === orgId) return current;
    if (node.children && node.children.length) {
      const found = findOrgPath(node.children, orgId, current);
      if (found) return found;
    }
  }
  return null;
}

function buildOrgFullPath(orgTree, orgId, deptPath) {
  const path = findOrgPath(orgTree, orgId);
  if (path && path.length) {
    return `\\${ROOT_GROUP}\\${path.join("\\")}`;
  }
  const dept = (deptPath || "").trim();
  if (dept) return `\\${ROOT_GROUP}\\${ROOT_UNIT}\\${dept}`;
  return `\\${ROOT_GROUP}\\${ROOT_UNIT}`;
}

function enrichUser(user, orgTree) {
  return {
    ...user,
    orgUnit: ROOT_UNIT,
    deptPath: findParentDeptName(orgTree, user.orgId, user.deptPath),
    orgFullPath: buildOrgFullPath(orgTree, user.orgId, user.deptPath),
  };
}

function getOrgSubtree(tree, orgId) {
  if (!orgId || orgId === 1) return tree;
  function find(nodes) {
    for (const node of nodes || []) {
      if (node.id === orgId) return [node];
      if (node.children && node.children.length) {
        const found = find(node.children);
        if (found) return found;
      }
    }
    return null;
  }
  return find(tree) || tree;
}

function findParentDeptName(tree, orgId, parentName = "") {
  for (const node of tree || []) {
    if (node.id === orgId) return parentName || node.name;
    if (node.children && node.children.length) {
      const nextParent = node.id === 1 ? parentName : node.name;
      const found = findParentDeptName(node.children, orgId, nextParent);
      if (found) return found;
    }
  }
  return "";
}

function matchUserKeyword(user, keyword) {
  const kw = (keyword || "").trim().toLowerCase();
  if (!kw) return true;
  const name = (user.name || "").toLowerCase();
  const username = (user.username || "").toLowerCase();
  const initials = name.replace(/\s/g, "");
  return name.includes(kw) || username.includes(kw) || initials.includes(kw);
}

function cloneOrgBranch(nodes) {
  return (nodes || []).map((node) => ({
    id: node.id,
    name: node.name,
    nodeType: "org",
    children: node.children ? cloneOrgBranch(node.children) : [],
  }));
}

function attachUsersToTree(nodes, users, orgTree) {
  return (nodes || []).map((node) => {
    const orgChildren = attachUsersToTree(node.children || [], users, orgTree);
    const userChildren = users
      .filter((user) => user.orgId === node.id)
      .map((user) => ({
        id: `pick-${user.id}`,
        name: `${user.name}（无）`,
        nodeType: "user",
        user: {
          ...user,
          parentDeptName: findParentDeptName(orgTree, user.orgId),
        },
        isLeaf: true,
      }));
    return { ...node, children: [...orgChildren, ...userChildren] };
  });
}

function pruneEmptyOrgNodes(nodes) {
  return (nodes || [])
    .map((node) => {
      if (node.nodeType === "user") return node;
      const children = pruneEmptyOrgNodes(node.children || []);
      if (!children.length && node.id !== 1) return null;
      return { ...node, children };
    })
    .filter(Boolean);
}

export default {
  name: "RoleUserAssociation",
  data() {
    return {
      tabs: [
        { key: "assign", label: "角色分配" },
        { key: "unit", label: "修改人员单位" },
        { key: "plan-unit", label: "周计划修改人员单位" },
        { key: "plan-org", label: "周计划修改人员机构" },
      ],
      activeTab: "assign",
      roles: [],
      users: [],
      orgTree: [],
      queryKeyword: "",
      filterKeyword: "",
      currentPage: 1,
      pageSize: 25,
      pageSizeOptions: [25, 50, 100],
      showLinkedDialog: false,
      currentRole: null,
      linkedQueryKeyword: "",
      linkedFilterKeyword: "",
      linkedCurrentPage: 1,
      linkedPageSize: 10,
      linkedPageSizeOptions: [10, 25, 50],
      selectedLinked: [],
      showAddDialog: false,
      addOrgScope: 1,
      addSearchKeyword: "",
      addSearchFilter: "",
      selectedPickUsers: [],
      pickerTreeProps: { label: "name", children: "children" },
      personSearchKeyword: "", // 人员搜索关键字
      currentOrgUsers: [], // 当前组织的人员列表
    };
  },
  computed: {
    filteredRoles() {
      const kw = this.filterKeyword.trim().toLowerCase();
      return this.roles.filter((r) => !kw || r.name.toLowerCase().includes(kw));
    },
    pagedRoles() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredRoles.slice(start, start + this.pageSize).map((r) => ({
        ...r,
        orgId: r.orgId || "",
      }));
    },
    linkedUsers() {
      if (!this.currentRole) return [];
      return getUsersByRole(this.currentRole.id).map((u) => enrichUser(u, this.orgTree));
    },
    dialogUserList() {
      const kw = this.linkedFilterKeyword.trim().toLowerCase();
      return this.linkedUsers.filter((u) => {
        if (!kw) return true;
        return (
          u.name.toLowerCase().includes(kw) ||
          u.username.toLowerCase().includes(kw)
        );
      });
    },
    pagedDialogUsers() {
      const start = (this.linkedCurrentPage - 1) * this.linkedPageSize;
      return this.dialogUserList.slice(start, start + this.linkedPageSize);
    },
    candidateUsers() {
      if (!this.currentRole) return [];
      return this.users
        .filter((u) => !(u.roleIds || []).includes(this.currentRole.id))
        .map((u) => enrichUser(u, this.orgTree));
    },
    pickerOrgOptions() {
      const root = (this.orgTree || [])[0];
      return root ? [{ id: root.id, name: root.name }] : [];
    },
    filteredPickUsers() {
      const kw = this.addSearchFilter.trim();
      return this.candidateUsers.filter((user) => matchUserKeyword(user, kw));
    },
    displayPickerTree() {
      // 左侧组织树：始终显示完整的组织结构，不根据选中节点过滤
      // 只过滤掉人员节点，保留纯组织层级
      const orgBranch = cloneOrgBranch(this.orgTree);
      return orgBranch;
    },
    // 中间人员列表：根据选中的组织加载人员
    filteredPersonList() {
      const kw = this.personSearchKeyword.trim().toLowerCase();
      return this.currentOrgUsers.filter((user) => {
        if (!kw) return true;
        return (
          (user.name || "").toLowerCase().includes(kw) ||
          (user.username || "").toLowerCase().includes(kw)
        );
      });
    },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    this.reload();
  },
  methods: {
    reload() {
      this.roles = getRoles();
      this.users = getUsers();
    },
    handleSearch() {
      this.filterKeyword = this.queryKeyword;
      this.currentPage = 1;
    },
    handleTabClick(tab) {
      if (tab.key !== "assign") {
        this.$message.info("当前演示仅开放「角色分配」");
        return;
      }
      this.activeTab = tab.key;
    },
    changePageSize(size) {
      this.pageSize = size;
      this.currentPage = 1;
    },
    openLinkedUsers(row) {
      this.currentRole = row;
      this.linkedQueryKeyword = "";
      this.linkedFilterKeyword = "";
      this.linkedCurrentPage = 1;
      this.linkedPageSize = 10;
      this.selectedLinked = [];
      this.showLinkedDialog = true;
      this.$nextTick(() => this.clearLinkedSelection());
    },
    closeLinkedDialog() {
      this.currentRole = null;
      this.linkedQueryKeyword = "";
      this.linkedFilterKeyword = "";
      this.selectedLinked = [];
      this.clearLinkedSelection();
    },
    handleLinkedSearch() {
      this.linkedFilterKeyword = this.linkedQueryKeyword;
      this.linkedCurrentPage = 1;
      this.selectedLinked = [];
      this.clearLinkedSelection();
    },
    changeLinkedPageSize(size) {
      this.linkedPageSize = size;
      this.linkedCurrentPage = 1;
    },
    linkedIndexMethod(index) {
      return (this.linkedCurrentPage - 1) * this.linkedPageSize + index + 1;
    },
    handleLinkedSelectionChange(rows) {
      this.selectedLinked = rows;
    },
    clearLinkedSelection() {
      this.$nextTick(() => {
        if (this.$refs.linkedTable) this.$refs.linkedTable.clearSelection();
      });
    },
    batchRemove() {
      if (!this.selectedLinked.length) return;
      this.$confirm(`确定删除 ${this.selectedLinked.length} 名关联人员？`, "删除关联人员", {
        type: "warning",
      })
        .then(() => {
          this.selectedLinked.forEach((user) => {
            const nextRoleIds = (user.roleIds || []).filter((id) => id !== this.currentRole.id);
            updateUserRoles(user.id, nextRoleIds);
          });
          this.reload();
          this.selectedLinked = [];
          this.clearLinkedSelection();
          this.$message.success("删除成功");
        })
        .catch(() => {});
    },
    openAddDialog() {
      this.addOrgScope = this.pickerOrgOptions[0] ? this.pickerOrgOptions[0].id : 1;
      this.addSearchKeyword = "";
      this.addSearchFilter = "";
      this.selectedPickUsers = [];
      this.personSearchKeyword = "";
      this.showAddDialog = true;
      
      // 初始化加载根组织的人员
      this.$nextTick(() => {
        this.loadOrgUsers(this.addOrgScope);
      });
    },
    closeAddDialog() {
      this.addSearchKeyword = "";
      this.addSearchFilter = "";
      this.selectedPickUsers = [];
    },
    handleAddOrgChange(orgId) {
      this.addSearchFilter = this.addSearchKeyword;
      // 只加载人员，不改变组织树显示
      this.loadOrgUsers(orgId);
    },
    // 加载组织下的人员
    loadOrgUsers(orgId) {
      if (!orgId) {
        this.currentOrgUsers = [];
        console.log('loadOrgUsers: orgId 为空');
        return;
      }
      
      console.log('loadOrgUsers 被调用，orgId:', orgId);
      console.log('currentRole:', this.currentRole);
      
      // 如果有 currentRole，从 candidateUsers 中筛选
      if (this.currentRole) {
        console.log('从 candidateUsers 筛选');
        this.currentOrgUsers = this.candidateUsers.filter((user) => user.orgId === orgId);
        console.log('candidateUsers 筛选结果:', this.currentOrgUsers.length);
        
        // 如果 candidateUsers 中没有数据，使用模拟数据作为后备
        if (this.currentOrgUsers.length === 0) {
          console.log('candidateUsers 为空，使用模拟数据');
          this.currentOrgUsers = this.generateMockUsers(orgId);
        }
      } else {
        // 如果没有 currentRole（直接打开弹窗），生成模拟数据
        console.log('生成模拟数据');
        this.currentOrgUsers = this.generateMockUsers(orgId);
      }
      
      console.log('加载后的人员数量:', this.currentOrgUsers.length);
      console.log('人员列表:', this.currentOrgUsers);
    },
    // 生成模拟用户数据
    generateMockUsers(orgId) {
      const mockUsers = [
        // 领导班子 (101) - 8人
        { id: `mock-1`, username: 'admin', name: '管理员', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-2`, username: 'user001', name: '张建国', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-3`, username: 'user002', name: '李明华', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-4`, username: 'user003', name: '王伟强', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-5`, username: 'user004', name: '刘志强', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-6`, username: 'user005', name: '陈晓东', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-7`, username: 'user006', name: '黄建华', orgId: 101, parentDeptName: '领导班子' },
        { id: `mock-8`, username: 'user007', name: '周永明', orgId: 101, parentDeptName: '领导班子' },
        
        // 南方电网公司出资企业专职董事监事 (102) - 6人
        { id: `mock-9`, username: 'user008', name: '赵文斌', orgId: 102, parentDeptName: '南方电网公司出资企业专职董事监事' },
        { id: `mock-10`, username: 'user009', name: '钱学军', orgId: 102, parentDeptName: '南方电网公司出资企业专职董事监事' },
        { id: `mock-11`, username: 'user010', name: '孙立平', orgId: 102, parentDeptName: '南方电网公司出资企业专职董事监事' },
        { id: `mock-12`, username: 'user011', name: '李国庆', orgId: 102, parentDeptName: '南方电网公司出资企业专职董事监事' },
        { id: `mock-13`, username: 'user012', name: '周德明', orgId: 102, parentDeptName: '南方电网公司出资企业专职董事监事' },
        { id: `mock-14`, username: 'user013', name: '吴正华', orgId: 102, parentDeptName: '南方电网公司出资企业专职董事监事' },
        
        // 免职未退休领导人员 (103) - 5人
        { id: `mock-15`, username: 'user014', name: '郑国强', orgId: 103, parentDeptName: '免职未退休领导人员' },
        { id: `mock-16`, username: 'user015', name: '王德胜', orgId: 103, parentDeptName: '免职未退休领导人员' },
        { id: `mock-17`, username: 'user016', name: '李建新', orgId: 103, parentDeptName: '免职未退休领导人员' },
        { id: `mock-18`, username: 'user017', name: '张明远', orgId: 103, parentDeptName: '免职未退休领导人员' },
        { id: `mock-19`, username: 'user018', name: '刘永胜', orgId: 103, parentDeptName: '免职未退休领导人员' },
        
        // 云南电网公司出资企业专职董事监事 (104) - 6人
        { id: `mock-20`, username: 'user019', name: '陈志强', orgId: 104, parentDeptName: '云南电网公司出资企业专职董事监事' },
        { id: `mock-21`, username: 'user020', name: '黄建国', orgId: 104, parentDeptName: '云南电网公司出资企业专职董事监事' },
        { id: `mock-22`, username: 'user021', name: '周文军', orgId: 104, parentDeptName: '云南电网公司出资企业专职董事监事' },
        { id: `mock-23`, username: 'user022', name: '吴立民', orgId: 104, parentDeptName: '云南电网公司出资企业专职董事监事' },
        { id: `mock-24`, username: 'user023', name: '徐德明', orgId: 104, parentDeptName: '云南电网公司出资企业专职董事监事' },
        { id: `mock-25`, username: 'user024', name: '孙正华', orgId: 104, parentDeptName: '云南电网公司出资企业专职董事监事' },
        
        // 管理类职员 (105) - 10人
        { id: `mock-26`, username: 'user025', name: '马超', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-27`, username: 'user026', name: '黄蓉', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-28`, username: 'user027', name: '林峰', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-29`, username: 'user028', name: '何静', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-30`, username: 'user029', name: '罗文', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-31`, username: 'user030', name: '梁明', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-32`, username: 'user031', name: '宋佳', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-33`, username: 'user032', name: '唐国强', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-34`, username: 'user033', name: '韩雪', orgId: 105, parentDeptName: '管理类职员' },
        { id: `mock-35`, username: 'user034', name: '冯磊', orgId: 105, parentDeptName: '管理类职员' },
        
        // 其他部门人员 (后续部门)
        { id: `mock-36`, username: 'user035', name: '曹文', orgId: 108, parentDeptName: '办公室' },
        { id: `mock-37`, username: 'user036', name: '邓华', orgId: 108, parentDeptName: '办公室' },
        { id: `mock-38`, username: 'user037', name: '许明', orgId: 110, parentDeptName: '人力资源部' },
        { id: `mock-39`, username: 'user038', name: '傅强', orgId: 110, parentDeptName: '人力资源部' },
        { id: `mock-40`, username: 'user039', name: '沈丽', orgId: 113, parentDeptName: '计划与财务部' },
        { id: `mock-41`, username: 'user040', name: '曾伟', orgId: 115, parentDeptName: '数字化部' },
        { id: `mock-42`, username: 'user041', name: '彭军', orgId: 118, parentDeptName: '新兴与国际业务部' },
        { id: `mock-43`, username: 'user042', name: '吕芳', orgId: 120, parentDeptName: '系统运行部' },
        { id: `mock-44`, username: 'user043', name: '苏敏', orgId: 122, parentDeptName: '安全监管部' },
        { id: `mock-45`, username: 'user044', name: '卢建', orgId: 125, parentDeptName: '党建工作部' },
      ];
      
      // 根据 orgId 筛选，如果是根节点（1），返回所有用户
      if (orgId === 1) {
        return mockUsers;
      }
      
      // 返回该组织及其子组织的人员
      return mockUsers.filter(user => {
        // 简化处理：如果 orgId 匹配或父部门包含该组织
        return user.orgId === orgId;
      });
    },
    // 处理人员搜索
    handlePersonSearch() {
      // 搜索时不需要额外处理，computed 会自动过滤
    },
    // 点击组织节点
    handleOrgNodeClick(nodeData) {
      // 只要是组织节点就加载人员（不包含用户ID的节点）
      if (nodeData.id && !String(nodeData.id).startsWith('pick-')) {
        console.log('点击组织节点:', nodeData.name, 'ID:', nodeData.id);
        this.loadOrgUsers(nodeData.id);
      }
    },
    handleAddSearch() {
      this.addSearchFilter = this.addSearchKeyword;
    },
    isUserPicked(user) {
      return this.selectedPickUsers.some((item) => item.id === user.id);
    },
    togglePickUser(user, checked) {
      if (checked) {
        if (!this.isUserPicked(user)) this.selectedPickUsers.push(user);
      } else {
        this.selectedPickUsers = this.selectedPickUsers.filter((item) => item.id !== user.id);
      }
    },
    removePickedUser(user) {
      this.selectedPickUsers = this.selectedPickUsers.filter((item) => item.id !== user.id);
    },
    clearAllPicked() {
      this.selectedPickUsers = [];
    },
    formatPickUserDept(user) {
      const dept = user.parentDeptName || user.deptPath || user.orgName || "无";
      return `${dept}/无`;
    },
    confirmAddUsers() {
      if (!this.currentRole || !this.selectedPickUsers.length) return;
      const count = this.selectedPickUsers.length;
      this.selectedPickUsers.forEach((user) => {
        const nextRoleIds = Array.from(new Set([...(user.roleIds || []), this.currentRole.id]));
        updateUserRoles(user.id, nextRoleIds);
      });
      this.reload();
      this.showAddDialog = false;
      this.selectedPickUsers = [];
      this.$message.success(`已添加 ${count} 名关联人员`);
    },
  },
};
</script>

<style scoped>
.role-user-page {
  min-height: calc(100vh - 60px);
  background: #eef1f6;
  padding: 12px 16px 20px;
}

.role-user-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  padding: 0 16px 12px;
}

.page-tabs {
  display: flex;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid #e4e7ed;
  margin: 0 -16px 14px;
  padding: 0 20px;
}

.page-tab {
  position: relative;
  padding: 14px 0 12px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  user-select: none;
}

.page-tab.active {
  color: #409eff;
  font-weight: 600;
}

.page-tab.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #409eff;
}

.search-bar {
  margin-bottom: 12px;
}

.search-input {
  width: 280px;
}

.search-input >>> .el-input-group__append {
  padding: 0 12px;
  background: #fff;
}

.role-user-table,
.linked-user-table {
  width: 100%;
}

.role-user-table >>> .el-table__header th,
.linked-user-table >>> .el-table__header th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.action-link {
  padding: 0;
  color: #409eff;
}

.role-user-pager,
.linked-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  padding-top: 8px;
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

.pager-suffix {
  margin-left: 2px;
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

.linked-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.linked-search {
  width: 280px;
}

.linked-search >>> .el-input-group__append {
  padding: 0 12px;
  background: #fff;
}

.linked-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.linked-action-btn {
  padding: 0;
  font-size: 13px;
  color: #409eff;
}

.linked-action-btn.is-disabled {
  color: #c0c4cc;
}

.linked-action-delete {
  color: #409eff;
}

.pick-user-layout {
  display: flex;
  gap: 12px;
  height: 500px;
  overflow: hidden;
}

.pick-user-left {
  width: 300px;
  flex-shrink: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.pick-user-center {
  flex: 1;
  min-width: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.pick-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  background: #fff;
}

.pick-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.pick-person-count {
  font-size: 13px;
  color: #909399;
}

.pick-count-highlight {
  color: #409eff;
  font-weight: 600;
  margin-left: 4px;
}

.pick-user-list {
  flex: 1;
  overflow: auto;
  padding: 8px 12px;
}

.pick-person-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.pick-person-item:hover {
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.pick-person-item.selected {
  background: #ecf5ff;
  border-color: #409eff;
}

.pick-person-check {
  flex-shrink: 0;
}

.pick-person-check >>> .el-checkbox__label {
  display: none;
}

.pick-person-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #909399;
}

.pick-person-info {
  flex: 1;
  min-width: 0;
}

.pick-person-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.pick-user-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.pick-filter-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #606266;
}

.pick-org-select {
  flex: 1;
}

.pick-user-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.pick-user-tree {
  flex: 1;
  overflow: auto;
  padding: 8px 6px 12px;
  min-height: 320px;
}

.pick-user-tree >>> .el-tree-node__content {
  height: 30px;
}

.picker-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 24px);
}

.picker-node-icon {
  flex-shrink: 0;
  font-size: 14px;
  color: #909399;
}

.picker-user-check {
  margin-right: 2px;
}

.picker-user-check >>> .el-checkbox__label {
  display: none;
}

.picker-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: #303133;
}

.pick-user-empty {
  padding: 40px 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.pick-user-right {
  width: 300px;
  flex-shrink: 0;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.pick-selected-list {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.pick-selected-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: all 0.2s;
}

.pick-selected-item:hover {
  background: #ecf5ff;
}

.pick-selected-info {
  flex: 1;
  min-width: 0;
}

.pick-selected-name {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.pick-selected-remove {
  flex-shrink: 0;
  cursor: pointer;
  color: #c0c4cc;
  font-size: 12px;
}

.pick-selected-remove:hover {
  color: #f56c6c;
}

.pick-selected-empty {
  padding: 40px 16px;
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
}
</style>

<style>
.pick-user-dialog .el-dialog__header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.pick-user-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.pick-user-dialog .el-dialog__body {
  padding: 16px;
  height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pick-user-dialog .el-dialog__footer {
  padding: 12px 16px 16px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.linked-users-dialog .el-dialog__header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.linked-users-dialog .el-dialog__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.linked-users-dialog .el-dialog__body {
  padding: 16px;
}

.linked-users-dialog .el-dialog__footer {
  padding: 12px 16px 16px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.linked-dialog-footer .el-button {
  min-width: 72px;
}
</style>
