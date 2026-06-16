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

        <!-- 可滚动列表区域 -->
        <div class="scrollable-list">
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

    <!-- 考勤查看确认对话框 -->
    <el-dialog
      :title="'考勤查看确认 - ' + viewingGroupName"
      :visible.sync="viewDialogVisible"
      width="95%"
      top="3vh"
      @close="handleViewDialogClose"
    >
      <!-- 基本信息 -->
      <div class="attendance-info-header">
        <div class="info-item">
          <span class="label">考勤周期:</span>
          <span class="value">{{ viewingMonth }}月考勤</span>
        </div>
        <div class="info-item">
          <span class="label">考勤部门:</span>
          <span class="value">{{ viewingGroupName }}</span>
        </div>
        <div class="info-item">
          <span class="label">考勤人数:</span>
          <span class="value">{{ viewingMembers.length }}人</span>
        </div>
      </div>

      <!-- 考勤类型说明 -->
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <template slot="title">
          <div class="attendance-legend">
            <span class="legend-item">出勤记“√”</span>
            <span class="legend-item">出差记“Δ”</span>
            <span class="legend-item">年休假记“年”</span>
            <span class="legend-item">探亲假记“探”</span>
            <span class="legend-item">事假记“事”</span>
            <span class="legend-item">法定假记“法”</span>
            <span class="legend-item">病假记“病”</span>
            <span class="legend-item">流产假记“流”</span>
            <span class="legend-item">产假记“产”</span>
            <span class="legend-item">哺乳假记“哺”</span>
            <span class="legend-item">陪护假记“陪”</span>
            <span class="legend-item">节育假记“节”</span>
            <span class="legend-item">育儿假记“儿”</span>
            <span class="legend-item">父母护理假记“护”</span>
            <span class="legend-item">婚假记“婚”</span>
            <span class="legend-item">丧假记“丧”</span>
            <span class="legend-item">节假日加班记“加(节)”</span>
            <span class="legend-item">其他休假记“其他休假(休假类型)”</span>
            <span class="legend-item">补休假记“补”</span>
            <span class="legend-item">旷工记“旷”</span>
            <span class="legend-item">迟到记“迟”</span>
            <span class="legend-item">早退记“退”</span>
            <span class="legend-item">其他考勤记“其他考勤(考勤类型)”</span>
          </div>
        </template>
      </el-alert>

      <!-- 操作栏 -->
      <div class="toolbar">
        <el-input
          v-model="memberSearchKeyword"
          placeholder="请输入关键字查找姓名"
          size="small"
          prefix-icon="el-icon-search"
          style="width: 200px; margin-right: 12px;"
          clearable
        ></el-input>
        <el-button type="primary" size="small" icon="el-icon-search" @click="handleMemberQuery">
          查询
        </el-button>
        <el-button type="success" size="small" icon="el-icon-download" @click="handleExportAttendance">
          导出
        </el-button>
        <el-button
          type="warning"
          size="small"
          icon="el-icon-refresh"
          :loading="syncLoading"
          @click="handleSyncAttendance"
        >
          {{ syncLoading ? '同步中...' : '数据同步' }}
        </el-button>
        <span v-if="lastSyncTime" class="sync-time">最近同步：{{ lastSyncTime }}</span>
        <div class="status-indicators">
          <span class="indicator"><i class="dot abnormal-correct"></i>异常修正数据</span>
          <span class="indicator"><i class="dot abnormal"></i>异常数据</span>
          <span class="indicator"><i class="dot manual-correct"></i>手动修正数据</span>
        </div>
      </div>

      <!-- 考勤表格 -->
      <div
        class="attendance-table-wrapper"
        v-loading="syncLoading"
        element-loading-text="正在同步最新考勤数据..."
        element-loading-spinner="el-icon-loading"
      >
        <el-table
          ref="attendanceTable"
          :data="filteredViewingMembers"
          border
          stripe
          height="500"
          style="width: 100%;"
        >
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="80" align="center" fixed></el-table-column>
          <el-table-column prop="employeeId" label="员工编码" width="100" align="center"></el-table-column>
          
          <!-- 动态生成日期列 -->
          <el-table-column
            v-for="day in daysInMonth"
            :key="day"
            :label="String(day).padStart(2, '0')"
            min-width="40"
            align="center"
          >
            <template slot="header">
              <div class="date-header">
                <span>{{ day }}</span>
                <div class="am-pm">
                  <span>上</span>
                  <span>下</span>
                </div>
              </div>
            </template>
            <template slot-scope="scope">
              <div class="attendance-cell">
                <span :class="getCellClass(scope.row, day, 'am')">{{ getCellText(scope.row, day, 'am') }}</span>
                <span :class="getCellClass(scope.row, day, 'pm')">{{ getCellText(scope.row, day, 'pm') }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
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
      currentPage: 1,
      
      // 考勤查看对话框
      viewDialogVisible: false,
      viewingGroupName: '',
      viewingMonth: '',
      viewingMembers: [],
      memberSearchKeyword: '',
      viewingMemberCount: 0,
      syncLoading: false,
      lastSyncTime: '',
      syncTimer: null,
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
    },
    
    // 获取当前月份的天数
    daysInMonth() {
      if (!this.viewingMonth) return [];
      const [year, month] = this.viewingMonth.split('-').map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      return Array.from({ length: lastDay }, (_, i) => i + 1);
    },
    
    // 过滤查看的成员
    filteredViewingMembers() {
      if (!this.memberSearchKeyword) return this.viewingMembers;
      const keyword = this.memberSearchKeyword.toLowerCase();
      return this.viewingMembers.filter(member => 
        member.name.toLowerCase().includes(keyword) ||
        member.employeeId.toLowerCase().includes(keyword)
      );
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
      this.viewingGroupName = group.name;
      this.viewingMonth = this.selectedMonth || new Date().toISOString().slice(0, 7);
      this.viewingMemberCount = group.memberCount;
      this.lastSyncTime = '';

      this.viewingMembers = this.generateMockAttendanceData(group.memberCount);

      this.viewDialogVisible = true;
    },

    // 手动触发数据同步
    handleSyncAttendance() {
      if (this.syncLoading) return;

      this.syncLoading = true;
      if (this.syncTimer) clearTimeout(this.syncTimer);

      this.syncTimer = setTimeout(() => {
        this.viewingMembers = this.generateMockAttendanceData(this.viewingMemberCount);
        this.lastSyncTime = this.formatSyncTime(new Date());
        this.syncLoading = false;
        this.syncTimer = null;
        this.$message.success('考勤数据已同步至最新');
      }, 1500);
    },

    formatSyncTime(date) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    
    // 生成模拟考勤数据
    generateMockAttendanceData(count) {
      const attendanceTypes = ['√', 'Δ', '年', '探', '事', '法', '病', '流', '产', '哺', '陪', '节', '儿', '护', '婚', '丧', '加(节)', '补', '旷', '迟', '退'];
      
      // 常见中文姓氏
      const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金', '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟', '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯', '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵', '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向', '汤'];
      
      // 常见名字用字
      const nameChars = ['伟', '芳', '娜', '敏', '静', '秀英', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '华', '梅', '鑫', '玲', '飞', '桂兰', '英', '兰', '燕', '萍', '波', '浩', '芬', '建华', '建国', '建军', '红', '玉兰', '桂芳', '秀珍', '婷', '玉梅', '海', '毅', '俊', '峰', '健', '文', '辉', '龙', '兴', '亮', '志', '成', '建', '云', '风', '正', '义', '光', '民', '瑞', '祥', '克', '先', '思', '清', '庆', '树', '良', '友', '嘉', '德', '宝', '月', '雪', '荣', '根', '占', '忠', '有', '卫', '凤', '素', '翠', '锦', '玉', '春', '菊', '如', '惠', '珠', '爱', '枝', '巧', '大', '会', '小', '改', '子', '孝', '连', '广', '利', '南', '昌', '发', '全', '金', '学', '政', '一', '继', '群', '修', '永', '少', '汝', '怀', '士', '作', '伯', '从', '代', '绍', '汉', '定', '宪', '宜', '凡', '登', '科', '章', '进', '盛', '恩', '农', '颜', '时', '薄', '历', '水', '宾', '归', '海', '善', '富', '合', '满', '元', '现', '典', '翠', '花', '粉', '勤', '雁', '西', '东', '北', '京', '津', '沪', '重', '庆', '武', '汉', '南', '宁', '成', '都', '贵', '阳', '昆', '明', '拉', '萨', '西', '安', '兰', '州', '银', '川', '乌', '鲁', '木', '齐', '呼', '和', '浩', '特', '太', '原', '石', '家', '庄', '济', '南', '青', '岛', '烟', '台', '威', '海', '日', '照', '临', '沂', '淄', '博', '枣', '庄', '东', '营', '济', '宁', '泰', '安', '聊', '城', '德', '州', '滨', '州', '菏', '泽'];
      
      const members = [];
      
      for (let i = 1; i <= count; i++) {
        // 随机生成姓名：姓 + 名（1-2个字）
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const nameLength = Math.random() > 0.3 ? 2 : 1; // 70%概率双字名
        let givenName = '';
        for (let j = 0; j < nameLength; j++) {
          givenName += nameChars[Math.floor(Math.random() * nameChars.length)];
        }
        const fullName = surname + givenName;
        
        const member = {
          id: i,
          name: fullName,
          employeeId: `EMP${String(i).padStart(4, '0')}`,
          department: this.viewingGroupName.split('-')[0],
          attendance: {}
        };
        
        // 为每一天生成上午和下午的考勤记录
        const daysInMonth = new Date(
          parseInt(this.viewingMonth.split('-')[0]),
          parseInt(this.viewingMonth.split('-')[1]),
          0
        ).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          // 周末标记为休息
          const date = new Date(`${this.viewingMonth}-${String(day).padStart(2, '0')}`);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          
          if (isWeekend) {
            member.attendance[day] = { am: '休', pm: '休' };
          } else {
            // 随机生成考勤状态，大部分是出勤
            const rand = Math.random();
            let status;
            if (rand < 0.85) {
              status = '√'; // 85% 出勤
            } else if (rand < 0.90) {
              status = attendanceTypes[Math.floor(Math.random() * attendanceTypes.length)];
            } else {
              status = '√';
            }
            
            member.attendance[day] = { am: status, pm: status };
          }
        }
        
        members.push(member);
      }
      
      return members;
    },
    
    // 获取单元格文本
    getCellText(row, day, period) {
      if (!row.attendance || !row.attendance[day]) return '';
      return row.attendance[day][period] || '';
    },
    
    // 获取单元格样式类
    getCellClass(row, day, period) {
      const text = this.getCellText(row, day, period);
      if (!text) return '';
      
      // 根据考勤类型返回不同的样式类
      const classMap = {
        '√': 'attendance-normal',
        'Δ': 'attendance-business-trip',
        '年': 'attendance-annual',
        '探': 'attendance-family',
        '事': 'attendance-personal',
        '法': 'attendance-legal',
        '病': 'attendance-sick',
        '流': 'attendance-abortion',
        '产': 'attendance-maternity',
        '哺': 'attendance-nursing',
        '陪': 'attendance-accompany',
        '节': 'attendance-birth-control',
        '儿': 'attendance-childcare',
        '护': 'attendance-parent-care',
        '婚': 'attendance-wedding',
        '丧': 'attendance-funeral',
        '加(节)': 'attendance-overtime',
        '补': 'attendance-compensate',
        '旷': 'attendance-absent',
        '迟': 'attendance-late',
        '退': 'attendance-early-leave',
        '休': 'attendance-rest'
      };
      
      return classMap[text] || 'attendance-normal';
    },
    
    // 成员查询
    handleMemberQuery() {
      // 过滤逻辑已在 computed 中实现
      this.$message.info(`查询到 ${this.filteredViewingMembers.length} 人`);
    },
    
    // 导出考勤数据
    handleExportAttendance() {
      if (this.filteredViewingMembers.length === 0) {
        this.$message.warning('没有可导出的数据');
        return;
      }
      
      // 构建导出数据
      const exportData = this.filteredViewingMembers.map((member, index) => {
        const rowData = {
          '序号': index + 1,
          '姓名': member.name,
          '员工编码': member.employeeId,
          '部门': member.department
        };
        
        // 添加每天的考勤数据
        this.daysInMonth.forEach(day => {
          const attendance = member.attendance[day];
          if (attendance) {
            rowData[`${day}日-上`] = attendance.am;
            rowData[`${day}日-下`] = attendance.pm;
          }
        });
        
        return rowData;
      });
      
      // 使用 CSV 导出
      this.exportToCSV(exportData, `${this.viewingGroupName}_${this.viewingMonth}_考勤表.csv`);
      
      this.$message.success(`成功导出 ${exportData.length} 人的考勤数据`);
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
    
    // 关闭查看对话框
    handleViewDialogClose() {
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
        this.syncTimer = null;
      }
      this.syncLoading = false;
      this.lastSyncTime = '';
      this.viewingMemberCount = 0;
      this.memberSearchKeyword = '';
      this.viewingMembers = [];
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

.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.query-section {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 12px 16px;
  flex-shrink: 0;
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

/* 可滚动列表区域 - 核心！ */
.scrollable-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
  background-color: #f5f7fa;
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

/* 考勤查看对话框样式 */
.attendance-info-header {
  display: flex;
  gap: 40px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
}

.info-item .value {
  color: #303133;
  font-size: 14px;
}

.attendance-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  line-height: 1.8;
}

.legend-item {
  font-size: 12px;
  color: #606266;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.status-indicators {
  display: flex;
  gap: 20px;
  margin-left: auto;
}

.sync-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot.abnormal-correct {
  background-color: #67C23A;
}

.dot.abnormal {
  background-color: #F56C6C;
}

.dot.manual-correct {
  background-color: #409EFF;
}

.attendance-table-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.date-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
  font-size: 12px;
}

.am-pm {
  display: flex;
  gap: 4px;
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
}

.attendance-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 36px;
  justify-content: center;
}

.attendance-cell span {
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 2px;
  min-width: 20px;
  text-align: center;
}

/* 考勤状态样式 */
.attendance-normal {
  color: #67C23A;
  font-weight: 600;
}

.attendance-business-trip {
  color: #409EFF;
  font-weight: 600;
}

.attendance-annual,
.attendance-family,
.attendance-personal,
.attendance-legal,
.attendance-sick,
.attendance-abortion,
.attendance-maternity,
.attendance-nursing,
.attendance-accompany,
.attendance-birth-control,
.attendance-childcare,
.attendance-parent-care,
.attendance-wedding,
.attendance-funeral {
  color: #E6A23C;
  font-weight: 600;
}

.attendance-overtime {
  color: #909399;
  font-weight: 600;
}

.attendance-compensate {
  color: #606266;
  font-weight: 600;
}

.attendance-absent {
  color: #F56C6C;
  font-weight: 600;
  background-color: #fef0f0;
}

.attendance-late,
.attendance-early-leave {
  color: #F56C6C;
  font-weight: 600;
}

.attendance-rest {
  color: #909399;
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
