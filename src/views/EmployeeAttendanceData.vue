<template>
  <div class="attendance-data-management">
    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 左侧组织架构树 -->
      <aside class="left-panel">
        <div class="org-search">
          <el-input
            v-model="orgSearchKeyword"
            placeholder="关键字搜索"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          ></el-input>
        </div>
        <div class="tree-container">
          <el-tree
            ref="orgTree"
            :data="filteredOrgTree"
            :props="treeProps"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            node-key="id"
            @node-click="handleOrgClick"
          >
            <span slot-scope="{ node, data }" class="custom-tree-node">
              <i :class="data.icon || 'el-icon-folder'" class="tree-icon"></i>
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <div class="right-panel">
        <!-- 可滚动内容容器 -->
        <div class="scrollable-content">
          <!-- 查询条件 -->
          <div class="query-section">
            <el-form :inline="true" class="query-form">
              <el-form-item label="时间范围:">
                <el-date-picker
                  v-model="selectedMonth"
                  type="month"
                  placeholder="选择月份"
                  value-format="yyyy-MM"
                  size="small"
                  style="width: 180px;"
                ></el-date-picker>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">
                  查询
                </el-button>
                <el-button icon="el-icon-refresh" size="small" @click="handleReset">
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 操作按钮 -->
          <div class="action-section">
            <el-button type="primary" icon="el-icon-download" size="small" @click="handleExport">
              导出
            </el-button>
          </div>

          <!-- 考勤组信息标题 -->
          <div class="section-title">考勤组信息</div>

          <!-- 考勤组列表 -->
          <div class="attendance-list">
            <div
              v-for="(group, index) in attendanceGroups"
              :key="index"
              class="attendance-card"
            >
              <div class="card-header">
                <el-checkbox v-model="group.checked"></el-checkbox>
                <span class="group-name">{{ group.name }}</span>
              </div>
              <div class="card-content">
                <div class="info-row">
                  <span class="label">考勤类型:</span>
                  <span class="value">{{ group.attendanceType }}</span>
                </div>
                <div class="info-row">
                  <span class="label">考勤组人数:</span>
                  <span class="value">{{ group.memberCount }}人</span>
                </div>
                <div class="info-row">
                  <span class="label">所属部门:</span>
                  <span class="value">{{ group.department }}</span>
                </div>
                <div class="action-buttons">
                  <el-button type="primary" size="mini" @click="handleView(group)">
                    查看
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <el-empty
              v-if="attendanceGroups.length === 0"
              description="暂无考勤组数据"
            ></el-empty>
          </div>
        </div>

        <!-- 分页 - 固定在底部 -->
        <div class="pagination-wrapper" v-if="attendanceGroups.length > 0">
          <span class="total-text">共 {{ total }} 条</span>
          <el-pagination
            background
            layout="sizes, prev, pager, next, jumper"
            :total="total"
            :page-size="pageSize"
            :current-page="currentPage"
            :page-sizes="[10, 25, 50, 100]"
            small
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EmployeeAttendanceData",
  data() {
    return {
      orgSearchKeyword: '',
      selectedMonth: '',
      treeProps: {
        label: 'label',
        children: 'children'
      },
      orgTreeData: [],
      selectedOrg: '',
      attendanceGroups: [],
      total: 0,
      pageSize: 10,
      currentPage: 1
    };
  },
  created() {
    this.loadOrgTree();
    this.loadAttendanceGroups();
  },
  computed: {
    filteredOrgTree() {
      const kw = (this.orgSearchKeyword || '').trim();
      if (!kw) return this.orgTreeData;
      const filter = (nodes) =>
        nodes
          .map((n) => {
            const children = n.children ? filter(n.children) : [];
            const match = (n.label || '').includes(kw);
            if (match || children.length) {
              return { ...n, children: children.length ? children : n.children };
            }
            return null;
          })
          .filter(Boolean);
      return filter(this.orgTreeData);
    }
  },
  watch: {
    orgSearchKeyword(val) {
      // 搜索时自动展开匹配的节点
      this.$nextTick(() => {
        if (this.$refs.orgTree) {
          this.$refs.orgTree.filter(val);
        }
      });
    }
  },
  methods: {
    // 加载组织架构树
    loadOrgTree() {
      // 模拟数据，实际应从后端获取 - 按照图片一比一实现
      this.orgTreeData = [
        {
          id: 1,
          label: '云南电网有限责任公司',
          icon: 'el-icon-s-grid',
          children: [
            {
              id: 2,
              label: '领导班子',
              icon: 'el-icon-user-solid',
              children: [
                { id: 21, label: '南方电网公司出资企业专职董事...', icon: 'el-icon-user' },
                { id: 22, label: '免职退休待遇领导人员', icon: 'el-icon-user' },
                { id: 23, label: '云南电网公司出资企业专职董事...', icon: 'el-icon-user' }
              ]
            },
            {
              id: 3,
              label: '管理委员会',
              icon: 'el-icon-s-management',
              children: [
                { id: 31, label: '专家委员会', icon: 'el-icon-star-off' },
                { id: 32, label: '总师、副总师', icon: 'el-icon-star-off' }
              ]
            },
            {
              id: 4,
              label: '办公室（党委办公室、董事会办...', icon: 'el-icon-office-building'
            },
            {
              id: 5,
              label: '战略规划部',
              icon: 'el-icon-office-building'
            },
            {
              id: 6,
              label: '人力资源部',
              icon: 'el-icon-office-building',
              children: [
                { id: 61, label: '部门负责人', icon: 'el-icon-user' },
                { id: 62, label: '干部管理科', icon: 'el-icon-folder' },
                { id: 63, label: '干部监督科', icon: 'el-icon-folder' },
                { id: 64, label: '本部管理科', icon: 'el-icon-folder' },
                { id: 65, label: '人才管理科', icon: 'el-icon-folder' },
                { id: 66, label: '综合管理科', icon: 'el-icon-folder' },
                { id: 67, label: '劳动组织及用工管理科', icon: 'el-icon-folder' },
                { id: 68, label: '薪酬绩效科', icon: 'el-icon-folder' },
                { id: 69, label: '培训管理科', icon: 'el-icon-folder' }
              ]
            },
            {
              id: 7,
              label: '社会保险事业管理局',
              icon: 'el-icon-office-building'
            },
            {
              id: 8,
              label: '政策研究与企业架构部（全面深...', icon: 'el-icon-office-building'
            },
            {
              id: 9,
              label: '计划与财务部（云南电网资产运...', icon: 'el-icon-office-building'
            },
            {
              id: 10,
              label: '科技发展部',
              icon: 'el-icon-office-building'
            },
            {
              id: 11,
              label: '数字化部',
              icon: 'el-icon-office-building'
            },
            {
              id: 12,
              label: '市场营销部（客户服务部）',
              icon: 'el-icon-office-building'
            },
            {
              id: 13,
              label: '基建部',
              icon: 'el-icon-office-building'
            },
            {
              id: 14,
              label: '新兴与国际业务部',
              icon: 'el-icon-office-building'
            },
            {
              id: 15,
              label: '生产技术部',
              icon: 'el-icon-office-building'
            },
            {
              id: 16,
              label: '系统运行部（电力调度控制中...', icon: 'el-icon-office-building'
            },
            {
              id: 17,
              label: '供应链管理部',
              icon: 'el-icon-office-building'
            },
            {
              id: 18,
              label: '安全监管部（应急管理部）',
              icon: 'el-icon-office-building'
            },
            {
              id: 19,
              label: '审计部',
              icon: 'el-icon-office-building'
            },
            {
              id: 20,
              label: '法规部',
              icon: 'el-icon-office-building'
            },
            {
              id: 21,
              label: '党建工作部（企业文化部）',
              icon: 'el-icon-office-building'
            },
            {
              id: 22,
              label: '监督部（纪委办公室）',
              icon: 'el-icon-office-building'
            },
            {
              id: 23,
              label: '公司党委巡察工作领导小组办公室',
              icon: 'el-icon-office-building'
            },
            {
              id: 24,
              label: '公司党委巡察组',
              icon: 'el-icon-office-building'
            },
            {
              id: 25,
              label: '工会办公室（职工权益维护部）',
              icon: 'el-icon-office-building'
            }
          ]
        }
      ];
    },

    // 加载考勤组列表
    loadAttendanceGroups() {
      // 模拟数据，实际应从后端获取 - 根据云南电网组织架构
      const mockData = [
        {
          id: 1,
          name: '人力资源部-干部管理科考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 8,
          department: '人力资源部/干部管理科',
          checked: true
        },
        {
          id: 2,
          name: '人力资源部-薪酬绩效科考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 6,
          department: '人力资源部/薪酬绩效科',
          checked: false
        },
        {
          id: 3,
          name: '人力资源部-培训管理科考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 5,
          department: '人力资源部/培训管理科',
          checked: false
        },
        {
          id: 4,
          name: '计划与财务部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 15,
          department: '计划与财务部',
          checked: false
        },
        {
          id: 5,
          name: '市场营销部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 20,
          department: '市场营销部（客户服务部）',
          checked: false
        },
        {
          id: 6,
          name: '生产技术部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 18,
          department: '生产技术部',
          checked: false
        },
        {
          id: 7,
          name: '系统运行部考勤组',
          attendanceType: '综合计算工时制',
          memberCount: 25,
          department: '系统运行部（电力调度控制中心）',
          checked: false
        },
        {
          id: 8,
          name: '安全监管部考勤组',
          attendanceType: '不定时工作制',
          memberCount: 12,
          department: '安全监管部（应急管理部）',
          checked: false
        },
        {
          id: 9,
          name: '供应链管理部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 16,
          department: '供应链管理部',
          checked: false
        },
        {
          id: 10,
          name: '数字化部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 22,
          department: '数字化部',
          checked: false
        },
        {
          id: 11,
          name: '基建部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 14,
          department: '基建部',
          checked: false
        }
      ];

      // 如果选中了组织节点，则过滤该组织下的考勤组
      if (this.selectedOrg) {
        this.attendanceGroups = mockData.filter(group => 
          group.department.includes(this.selectedOrg)
        );
      } else {
        this.attendanceGroups = mockData;
      }
      
      this.total = this.attendanceGroups.length;
    },

    // 树节点过滤
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },

    // 点击组织节点
    handleOrgClick(data) {
      this.selectedOrg = data.id === 1 ? '' : data.label;
      console.log('选中的组织:', this.selectedOrg);
      // 根据选中的组织重新加载考勤组数据
      this.currentPage = 1;
      this.loadAttendanceGroups();
    },

    // 查询
    handleQuery() {
      this.currentPage = 1;
      this.loadAttendanceGroups();
      this.$message.success('查询成功');
    },

    // 重置
    handleReset() {
      this.selectedMonth = '';
      this.orgSearchKeyword = '';
      this.selectedOrg = '';
      this.currentPage = 1;
      if (this.$refs.orgTree) {
        this.$refs.orgTree.setCurrentKey(null);
      }
      this.loadAttendanceGroups();
      this.$message.info('已重置查询条件');
    },

    // 导出
    handleExport() {
      const selectedGroups = this.attendanceGroups.filter(g => g.checked);
      if (selectedGroups.length === 0) {
        this.$message.warning('请至少选择一个考勤组');
        return;
      }
      this.$message.success(`正在导出 ${selectedGroups.length} 个考勤组的数据`);
      // 实际导出逻辑
    },

    // 查看详情
    handleView(group) {
      this.$message.info(`查看考勤组: ${group.name}`);
      // 跳转到详情页或打开对话框
    },

    // 分页大小改变
    handleSizeChange(val) {
      this.pageSize = val;
      this.loadAttendanceGroups();
    },

    // 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadAttendanceGroups();
    }
  }
};
</script>

<style scoped>
.attendance-data-management {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden;
}

/* 主容器 */
.main-container {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0;
  min-height: 0;
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  min-width: 280px;
  flex-shrink: 0;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100%;
}

.org-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
  min-height: 0;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  overflow: hidden;
}

.tree-icon {
  margin-right: 6px;
  color: #909399;
  font-size: 14px;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 可滚动内容容器 */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  height: 0;
  background-color: #f5f7fa;
}

.query-section {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 16px;
}

.query-form {
  margin-bottom: 0;
}

.action-section {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 16px;
}

.section-title {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

/* 考勤组列表 */
.attendance-list {
  padding: 20px;
  max-height: calc(100vh - 380px);
  overflow-y: auto;
}

.attendance-card {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.attendance-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.group-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.card-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  align-items: center;
}

.info-row .label {
  color: #606266;
  font-size: 13px;
  margin-right: 8px;
}

.info-row .value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 分页 */
.pagination-wrapper {
  background: #fff;
  border-top: 1px solid #e4e7ed;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.total-text {
  font-size: 13px;
  color: #606266;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-container {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    min-width: 100%;
    max-height: 300px;
  }
}
</style>
