<template>
  <div class="attendance-group-management">
    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" class="page-tabs">
      <el-tab-pane label="考勤组管理" name="group-management"></el-tab-pane>
    </el-tabs>

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

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 查询条件 -->
        <div class="query-section">
          <el-form :inline="true" class="query-form">
            <el-form-item label="考勤组名称:">
              <el-input
                v-model="searchGroupName"
                placeholder="请输入考勤组名称"
                size="small"
                clearable
                style="width: 200px;"
              ></el-input>
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
          <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddGroup">
            新增考勤组
          </el-button>
          <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGroups" :disabled="selectedGroups.length === 0">
            删除
          </el-button>
          <el-button type="success" icon="el-icon-download" size="small" @click="handleExportGroups">
            导出
          </el-button>
        </div>

        <!-- 标题 -->
        <div class="section-title">考勤组列表</div>

        <!-- 可滚动列表区域 -->
        <div class="scrollable-list">
          <div
            v-for="(group, index) in filteredAttendanceGroups"
            :key="index"
            class="attendance-card"
          >
            <div class="card-header">
              <el-checkbox v-model="group.checked" @change="handleCheckboxChange(group)"></el-checkbox>
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
                <el-button type="primary" size="mini" @click="handleEditGroup(group)">
                  编辑
                </el-button>
                <el-button type="success" size="mini" @click="handleAssociateMembers(group)">
                  关联人员
                </el-button>
                <el-button type="warning" size="mini" @click="handleViewMembers(group)">
                  查看成员
                </el-button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <el-empty
            v-if="filteredAttendanceGroups.length === 0"
            description="暂无考勤组数据，点击'新增考勤组'添加"
          ></el-empty>
        </div>

        <!-- 分页 - 固定在底部 -->
        <div class="pagination-wrapper" v-if="filteredAttendanceGroups.length > 0">
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

    <!-- 新增/编辑考勤组对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef" label-width="100px">
        <el-form-item label="考勤组名称:" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入考勤组名称"></el-input>
        </el-form-item>
        <el-form-item label="考勤类型:" prop="attendanceType">
          <el-select v-model="groupForm.attendanceType" placeholder="请选择考勤类型" style="width: 100%;">
            <el-option label="标准工时工作制" value="标准工时工作制"></el-option>
            <el-option label="综合计算工时制" value="综合计算工时制"></el-option>
            <el-option label="不定时工作制" value="不定时工作制"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门:" prop="department">
          <el-cascader
            v-model="groupForm.departmentPath"
            :options="orgCascaderOptions"
            :props="{ expandTrigger: 'hover', checkStrictly: true }"
            placeholder="请选择所属部门"
            style="width: 100%;"
            clearable
          ></el-cascader>
        </el-form-item>
        <el-form-item label="备注:">
          <el-input
            v-model="groupForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitGroup">确定</el-button>
      </div>
    </el-dialog>

    <!-- 关联人员对话框 -->
    <el-dialog
      title="关联人员"
      :visible.sync="associateDialogVisible"
      width="1100px"
      top="8vh"
      @close="handleAssociateDialogClose"
    >
      <div class="associate-wrapper">
        <!-- 左侧：可选人员列表 -->
        <div class="panel-left">
          <div class="panel-header">
            <span class="panel-title">可选人员</span>
            <el-input
              v-model="memberSearchKeyword"
              placeholder="搜索人员姓名或编号"
              size="small"
              prefix-icon="el-icon-search"
              style="width: 240px;"
              clearable
            ></el-input>
          </div>
          <div class="panel-body">
            <el-table
              ref="availableTable"
              :data="filteredAvailableMembers"
              height="420"
              border
              stripe
              highlight-current-row
              @selection-change="handleMemberSelectionChange"
            >
              <el-table-column type="selection" width="50" align="center"></el-table-column>
              <el-table-column prop="employeeId" label="员工编号" width="100" align="center"></el-table-column>
              <el-table-column prop="name" label="姓名" width="80" align="center"></el-table-column>
              <el-table-column prop="department" label="所属部门" show-overflow-tooltip></el-table-column>
              <el-table-column prop="position" label="岗位" width="100" align="center"></el-table-column>
            </el-table>
          </div>
          <div class="panel-footer">
            <span class="count-info">共 {{ filteredAvailableMembers.length }} 人</span>
          </div>
        </div>

        <!-- 中间：操作按钮 -->
        <div class="panel-center">
          <el-button 
            type="primary" 
            icon="el-icon-arrow-right" 
            @click="handleAddMembers"
            :disabled="selectedMembers.length === 0"
          >
            添加 &gt;
          </el-button>
          <el-button 
            type="danger" 
            icon="el-icon-arrow-left" 
            @click="handleRemoveMembers"
            :disabled="selectedToRemove.length === 0"
          >
            &lt; 移除
          </el-button>
        </div>

        <!-- 右侧：已选人员列表 -->
        <div class="panel-right">
          <div class="panel-header">
            <span class="panel-title">已选人员 ({{ currentGroupMembers.length }})</span>
          </div>
          <div class="panel-body">
            <el-table
              ref="selectedTable"
              :data="currentGroupMembers"
              height="420"
              border
              stripe
              highlight-current-row
              @selection-change="handleSelectedMembersChange"
            >
              <el-table-column type="selection" width="50" align="center"></el-table-column>
              <el-table-column prop="employeeId" label="员工编号" width="100" align="center"></el-table-column>
              <el-table-column prop="name" label="姓名" width="80" align="center"></el-table-column>
              <el-table-column prop="department" label="所属部门" show-overflow-tooltip></el-table-column>
              <el-table-column prop="position" label="岗位" width="100" align="center"></el-table-column>
            </el-table>
          </div>
          <div class="panel-footer">
            <span class="count-info">已选 {{ currentGroupMembers.length }} 人</span>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="associateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAssociation" icon="el-icon-check">保存</el-button>
      </div>
    </el-dialog>

    <!-- 查看成员对话框 -->
    <el-dialog
      title="考勤组成员列表"
      :visible.sync="viewMembersDialogVisible"
      width="800px"
    >
      <el-table :data="viewingMembers" border stripe>
        <el-table-column prop="employeeId" label="员工编号" width="120"></el-table-column>
        <el-table-column prop="name" label="姓名" width="100"></el-table-column>
        <el-table-column prop="department" label="所属部门" show-overflow-tooltip></el-table-column>
        <el-table-column prop="position" label="岗位" width="120"></el-table-column>
        <el-table-column prop="joinDate" label="加入日期" width="120"></el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewMembersDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "AttendanceGroupManagement",
  data() {
    return {
      activeTab: 'group-management',
      orgSearchKeyword: '',
      searchGroupName: '',
      treeProps: {
        label: 'label',
        children: 'children'
      },
      orgTreeData: [],
      selectedOrg: '',
      
      // 考勤组列表
      attendanceGroups: [],
      total: 0,
      pageSize: 10,
      currentPage: 1,
      selectedGroups: [],
      
      // 新增/编辑对话框
      dialogVisible: false,
      dialogTitle: '',
      isEditMode: false,
      editingGroupId: null,
      groupForm: {
        name: '',
        attendanceType: '',
        departmentPath: [],
        remark: ''
      },
      groupRules: {
        name: [
          { required: true, message: '请输入考勤组名称', trigger: 'blur' }
        ],
        attendanceType: [
          { required: true, message: '请选择考勤类型', trigger: 'change' }
        ],
        departmentPath: [
          { required: true, message: '请选择所属部门', trigger: 'change' }
        ]
      },
      
      // 关联人员对话框
      associateDialogVisible: false,
      currentEditingGroup: null,
      memberSearchKeyword: '',
      availableMembers: [],
      selectedMembers: [],        // 左侧表格选中的人员
      selectedToRemove: [],       // 右侧表格选中要移除的人员
      currentGroupMembers: [],
      
      // 查看成员对话框
      viewMembersDialogVisible: false,
      viewingMembers: []
    };
  },
  created() {
    this.loadOrgTree();
    this.loadAttendanceGroups();
    this.loadAllMembers();
  },
  computed: {
    // 递归过滤组织树节点
    filteredOrgTree() {
      const kw = (this.orgSearchKeyword || '').trim();
      if (!kw) return this.orgTreeData;
      
      const filter = (nodes) =>
        nodes
          .map((n) => {
            const children = n.children ? filter(n.children) : [];
            const match = (n.label || '').includes(kw);
            
            if (match || children.length) {
              return { 
                ...n, 
                children: children.length ? children : n.children 
              };
            }
            return null;
          })
          .filter(Boolean);
      
      return filter(this.orgTreeData);
    },
    
    // 级联选择器选项（从组织树转换）
    orgCascaderOptions() {
      const convertToCascader = (nodes) => {
        return nodes.map(node => ({
          value: node.id,
          label: node.label,
          children: node.children ? convertToCascader(node.children) : undefined
        }));
      };
      return convertToCascader(this.orgTreeData);
    },
    
    // 根据搜索条件过滤考勤组
    filteredAttendanceGroups() {
      let result = this.attendanceGroups;
      
      // 根据组织筛选
      if (this.selectedOrg) {
        result = result.filter(group => 
          group.department.includes(this.selectedOrg)
        );
      }
      
      // 根据名称搜索
      if (this.searchGroupName) {
        result = result.filter(group => 
          group.name.includes(this.searchGroupName)
        );
      }
      
      // 分页
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      
      this.total = result.length;
      return result.slice(start, end);
    },
    
    // 过滤可用人员
    filteredAvailableMembers() {
      if (!this.memberSearchKeyword) return this.availableMembers;
      
      const keyword = this.memberSearchKeyword.toLowerCase();
      return this.availableMembers.filter(member => 
        member.name.toLowerCase().includes(keyword) ||
        member.employeeId.toLowerCase().includes(keyword)
      );
    }
  },
  watch: {
    orgSearchKeyword(val) {
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
      // 模拟数据，实际应从后端获取 - 与员工出勤数据管理页面完全一致
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
    
    // 加载所有人员（模拟数据）
    loadAllMembers() {
      this.availableMembers = [
        { employeeId: 'EMP001', name: '张三', department: '人力资源部/干部管理科', position: '科长' },
        { employeeId: 'EMP002', name: '李四', department: '人力资源部/薪酬绩效科', position: '科员' },
        { employeeId: 'EMP003', name: '王五', department: '计划与财务部', position: '财务主管' },
        { employeeId: 'EMP004', name: '赵六', department: '市场营销部', position: '客户经理' },
        { employeeId: 'EMP005', name: '孙七', department: '生产技术部', position: '技术工程师' },
        { employeeId: 'EMP006', name: '周八', department: '系统运行部', position: '调度员' },
        { employeeId: 'EMP007', name: '吴九', department: '安全监管部', position: '安全专员' },
        { employeeId: 'EMP008', name: '郑十', department: '供应链管理部', position: '采购主管' },
        { employeeId: 'EMP009', name: '钱十一', department: '数字化部', position: '开发工程师' },
        { employeeId: 'EMP010', name: '陈十二', department: '基建部', position: '项目经理' }
      ];
    },
    
    // 加载考勤组列表
    loadAttendanceGroups() {
      this.attendanceGroups = [
        {
          id: 1,
          name: '人力资源部-干部管理科考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 8,
          department: '人力资源部/干部管理科',
          checked: false,
          members: [
            { employeeId: 'EMP001', name: '张三', department: '人力资源部/干部管理科', position: '科长', joinDate: '2024-01-15' }
          ]
        },
        {
          id: 2,
          name: '人力资源部-薪酬绩效科考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 6,
          department: '人力资源部/薪酬绩效科',
          checked: false,
          members: [
            { employeeId: 'EMP002', name: '李四', department: '人力资源部/薪酬绩效科', position: '科员', joinDate: '2024-02-20' }
          ]
        },
        {
          id: 3,
          name: '计划与财务部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 15,
          department: '计划与财务部',
          checked: false,
          members: [
            { employeeId: 'EMP003', name: '王五', department: '计划与财务部', position: '财务主管', joinDate: '2024-03-10' }
          ]
        },
        {
          id: 4,
          name: '市场营销部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 20,
          department: '市场营销部',
          checked: false,
          members: [
            { employeeId: 'EMP004', name: '赵六', department: '市场营销部', position: '客户经理', joinDate: '2024-04-05' }
          ]
        },
        {
          id: 5,
          name: '生产技术部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 18,
          department: '生产技术部',
          checked: false,
          members: [
            { employeeId: 'EMP005', name: '孙七', department: '生产技术部', position: '技术工程师', joinDate: '2024-05-12' }
          ]
        },
        {
          id: 6,
          name: '系统运行部考勤组',
          attendanceType: '综合计算工时制',
          memberCount: 25,
          department: '系统运行部',
          checked: false,
          members: [
            { employeeId: 'EMP006', name: '周八', department: '系统运行部', position: '调度员', joinDate: '2024-06-01' }
          ]
        },
        {
          id: 7,
          name: '安全监管部考勤组',
          attendanceType: '不定时工作制',
          memberCount: 12,
          department: '安全监管部',
          checked: false,
          members: [
            { employeeId: 'EMP007', name: '吴九', department: '安全监管部', position: '安全专员', joinDate: '2024-06-15' }
          ]
        },
        {
          id: 8,
          name: '供应链管理部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 16,
          department: '供应链管理部',
          checked: false,
          members: [
            { employeeId: 'EMP008', name: '郑十', department: '供应链管理部', position: '采购主管', joinDate: '2024-07-01' }
          ]
        },
        {
          id: 9,
          name: '数字化部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 22,
          department: '数字化部',
          checked: false,
          members: [
            { employeeId: 'EMP009', name: '钱十一', department: '数字化部', position: '开发工程师', joinDate: '2024-07-10' }
          ]
        },
        {
          id: 10,
          name: '基建部考勤组',
          attendanceType: '标准工时工作制',
          memberCount: 14,
          department: '基建部',
          checked: false,
          members: [
            { employeeId: 'EMP010', name: '陈十二', department: '基建部', position: '项目经理', joinDate: '2024-07-20' }
          ]
        }
      ];
    },
    
    // 点击组织节点
    handleOrgClick(data) {
      this.selectedOrg = data.id === 1 ? '' : data.label;
      this.currentPage = 1;
      this.$message.info(`已选择组织: ${data.label}`);
    },
    
    // 查询
    handleQuery() {
      this.currentPage = 1;
      this.$message.success('查询成功');
    },
    
    // 重置
    handleReset() {
      this.searchGroupName = '';
      this.orgSearchKeyword = '';
      this.selectedOrg = '';
      this.currentPage = 1;
      if (this.$refs.orgTree) {
        this.$refs.orgTree.setCurrentKey(null);
      }
      this.$message.info('已重置查询条件');
    },
    
    // 复选框变化
    handleCheckboxChange(group) {
      if (group.checked) {
        this.selectedGroups.push(group);
      } else {
        const index = this.selectedGroups.findIndex(g => g.id === group.id);
        if (index > -1) {
          this.selectedGroups.splice(index, 1);
        }
      }
    },
    
    // 新增考勤组
    handleAddGroup() {
      this.dialogTitle = '新增考勤组';
      this.isEditMode = false;
      this.editingGroupId = null;
      this.groupForm = {
        name: '',
        attendanceType: '',
        departmentPath: [],
        remark: ''
      };
      this.dialogVisible = true;
    },
    
    // 编辑考勤组
    handleEditGroup(group) {
      this.dialogTitle = '编辑考勤组';
      this.isEditMode = true;
      this.editingGroupId = group.id;
      this.groupForm = {
        name: group.name,
        attendanceType: group.attendanceType,
        departmentPath: [], // 实际应该根据部门路径设置
        remark: group.remark || ''
      };
      this.dialogVisible = true;
    },
    
    // 提交考勤组
    handleSubmitGroup() {
      this.$refs.groupFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditMode) {
            // 编辑模式
            const group = this.attendanceGroups.find(g => g.id === this.editingGroupId);
            if (group) {
              group.name = this.groupForm.name;
              group.attendanceType = this.groupForm.attendanceType;
              group.department = this.getDepartmentName(this.groupForm.departmentPath);
              group.remark = this.groupForm.remark;
              this.$message.success('考勤组更新成功');
            }
          } else {
            // 新增模式
            const newGroup = {
              id: Date.now(),
              name: this.groupForm.name,
              attendanceType: this.groupForm.attendanceType,
              memberCount: 0,
              department: this.getDepartmentName(this.groupForm.departmentPath),
              checked: false,
              remark: this.groupForm.remark,
              members: []
            };
            this.attendanceGroups.unshift(newGroup);
            this.$message.success('考勤组创建成功');
          }
          
          this.dialogVisible = false;
        }
      });
    },
    
    // 获取部门名称
    getDepartmentName(path) {
      if (!path || path.length === 0) return '';
      
      const findNode = (nodes, id) => {
        for (const node of nodes) {
          if (node.id === id) return node.label;
          if (node.children) {
            const found = findNode(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      
      return findNode(this.orgTreeData, path[path.length - 1]) || '';
    },
    
    // 删除考勤组
    handleDeleteGroups() {
      if (this.selectedGroups.length === 0) {
        this.$message.warning('请选择要删除的考勤组');
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedGroups.length} 个考勤组吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ids = this.selectedGroups.map(g => g.id);
        this.attendanceGroups = this.attendanceGroups.filter(g => !ids.includes(g.id));
        this.selectedGroups = [];
        this.$message.success('删除成功');
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    
    // 导出考勤组
    handleExportGroups() {
      // 如果有选中项，导出选中的；否则导出全部
      const groupsToExport = this.selectedGroups.length > 0 ? this.selectedGroups : this.filteredAttendanceGroups;
      
      if (groupsToExport.length === 0) {
        this.$message.warning('没有可导出的考勤组数据');
        return;
      }
      
      // 构建导出数据
      const exportData = groupsToExport.map(group => ({
        '考勤组名称': group.name,
        '考勤类型': group.attendanceType,
        '所属部门': group.department,
        '考勤组人数': group.memberCount + '人',
        '备注': group.remark || ''
      }));
      
      // 使用 Element UI 的 exportExcel 方法（需要安装 xlsx）
      // 这里使用简单的 CSV 导出作为示例
      this.exportToCSV(exportData, `考勤组列表_${new Date().toISOString().split('T')[0]}.csv`);
      
      this.$message.success(`成功导出 ${exportData.length} 条考勤组数据`);
    },
    
    // CSV 导出工具方法
    exportToCSV(data, filename) {
      if (!data || data.length === 0) return;
      
      // 获取表头
      const headers = Object.keys(data[0]);
      
      // 构建 CSV 内容
      let csvContent = '\ufeff'; // BOM 标记，解决中文乱码
      csvContent += headers.join(',') + '\n';
      
      // 添加数据行
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // 如果包含逗号或换行符，需要用引号包裹
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });
      
      // 创建 Blob 并下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    
    // 关联人员
    handleAssociateMembers(group) {
      this.currentEditingGroup = group;
      this.currentGroupMembers = [...(group.members || [])];
      this.associateDialogVisible = true;
    },
    
    // 人员选择变化（左侧表格）
    handleMemberSelectionChange(selection) {
      this.selectedMembers = selection;
    },
    
    // 已选人员选择变化（右侧表格）
    handleSelectedMembersChange(selection) {
      this.selectedToRemove = selection;
    },
    
    // 添加人员
    handleAddMembers() {
      if (this.selectedMembers.length === 0) {
        this.$message.warning('请选择要添加的人员');
        return;
      }
      
      // 检查是否已经存在
      const existingIds = this.currentGroupMembers.map(m => m.employeeId);
      const toAdd = this.selectedMembers.filter(m => !existingIds.includes(m.employeeId));
      
      if (toAdd.length === 0) {
        this.$message.warning('所选人员已在考勤组中');
        return;
      }
      
      // 添加到当前组
      toAdd.forEach(member => {
        this.currentGroupMembers.push({
          ...member,
          joinDate: new Date().toISOString().split('T')[0]
        });
      });
      
      this.$message.success(`成功添加 ${toAdd.length} 名人员`);
      this.selectedMembers = [];
    },
    
    // 移除人员
    handleRemoveMembers() {
      if (this.selectedToRemove.length === 0) {
        this.$message.warning('请在右侧表格中选择要移除的人员');
        return;
      }
      
      const ids = this.selectedToRemove.map(m => m.employeeId);
      this.currentGroupMembers = this.currentGroupMembers.filter(
        member => !ids.includes(member.employeeId)
      );
      
      this.$message.success(`成功移除 ${ids.length} 名人员`);
      this.selectedToRemove = [];
    },
    
    // 保存关联关系
    handleSaveAssociation() {
      if (this.currentEditingGroup) {
        this.currentEditingGroup.members = [...this.currentGroupMembers];
        this.currentEditingGroup.memberCount = this.currentGroupMembers.length;
        this.$message.success('人员关联保存成功');
      }
      this.associateDialogVisible = false;
    },
    
    // 查看成员
    handleViewMembers(group) {
      this.viewingMembers = group.members || [];
      this.viewMembersDialogVisible = true;
    },
    
    // 分页大小改变
    handleSizeChange(val) {
      this.pageSize = val;
    },
    
    // 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    
    // 对话框关闭
    handleDialogClose() {
      this.$refs.groupFormRef && this.$refs.groupFormRef.resetFields();
    },
    
    // 关联对话框关闭
    handleAssociateDialogClose() {
      this.selectedMembers = [];
      this.memberSearchKeyword = '';
    }
  }
};
</script>

<style scoped>
/* 使用标准布局模板 */
.attendance-group-management {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden;
}

/* 顶部标签页 */
.page-tabs {
  background-color: #fff;
  padding: 0 20px;
  border-bottom: 1px solid #e8e8e8;
}

.page-tabs >>> .el-tabs__header {
  margin-bottom: 0;
}

.page-tabs >>> .el-tabs__item {
  font-size: 14px;
  color: #606266;
}

.page-tabs >>> .el-tabs__item.is-active {
  color: #409EFF;
  font-weight: 500;
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

.query-section, .action-section, .section-title {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 16px;
}

.query-form {
  margin-bottom: 0;
}

/* 可滚动列表区域 */
.scrollable-list {
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
  gap: 8px;
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

/* 关联人员对话框样式 */
.associate-wrapper {
  display: flex;
  gap: 16px;
  align-items: stretch;
  padding: 10px 0;
}

.panel-left, .panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 2px solid #e4e7ed;
}

.panel-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.panel-body {
  flex: 1;
  padding: 12px;
  background-color: #f5f7fa;
}

.panel-footer {
  padding: 8px 16px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  text-align: right;
}

.count-info {
  font-size: 12px;
  color: #909399;
}

.panel-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  min-width: 120px;
  padding: 0 8px;
}

.panel-center .el-button {
  width: 100px;
  height: 36px;
}

.dialog-footer {
  text-align: right;
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
  
  .associate-wrapper {
    flex-direction: column;
  }
  
  .panel-center {
    flex-direction: row;
    justify-content: center;
    padding: 16px 0;
  }
}
</style>
