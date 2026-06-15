<template>
  <div class="attendance-statistics-container">
    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧组织树（与人员基本信息台账一致） -->
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input
            v-model="orgTreeKeyword"
            placeholder="关键字搜索"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="org-tree-wrap">
          <el-tree
            ref="orgTree"
            :data="filteredOrgTree"
            :props="treeProps"
            show-checkbox
            node-key="id"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            @check-change="handleTreeCheckChange"
            @node-click="handleOrgClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <!-- 右侧内容区 -->
      <div class="right-panel">
        <!-- 查询栏 -->
        <div class="query-bar">
          <el-form :inline="true" size="small">
            <el-form-item label="时间范围：">
              <el-date-picker
                v-model="queryParams.startDate"
                type="date"
                placeholder="开始日期"
                value-format="yyyy-MM-dd"
                style="width: 150px;"
              ></el-date-picker>
              <span style="margin: 0 8px;">-</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 150px;"
              ></el-date-picker>
            </el-form-item>
            
            <el-form-item label="是否含周末：">
              <el-select
                v-model="queryParams.includeWeekend"
                placeholder="请选择"
                style="width: 120px;"
              >
                <el-option label="含周末" value="include"></el-option>
                <el-option label="不含周末" value="exclude"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
              <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 导出按钮和提示 -->
        <div class="action-bar">
          <el-button type="success" icon="el-icon-download" @click="handleExport">导出</el-button>
          <el-alert
            title="注：导出可以选择按照“考勤组导出”和按照“人员明细”导出。"
            type="warning"
            :closable="false"
            show-icon
            style="flex: 1; margin-left: 16px;"
          ></el-alert>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrapper">
          <el-table
            :data="tableData"
            border
            stripe
            style="width: 100%"
            height="calc(100vh - 280px)"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <el-table-column prop="unit" label="单位" min-width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.unit }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="部门" min-width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.department }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="attendanceGroup" label="考勤组" min-width="120">
              <template slot-scope="scope">
                <span>{{ scope.row.attendanceGroup }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="shouldAttendanceDays" label="应出勤人日" width="120" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.shouldAttendanceDays || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="actualAttendanceDays" label="实际出勤人日" width="120" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.actualAttendanceDays || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fieldWorkDays" label="外勤人日" width="100" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.fieldWorkDays || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="absentDays" label="旷工人日" width="100" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.absentDays || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="onTimeDays" label="按时出勤人日" width="120" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.onTimeDays || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="lateDays" label="迟到人日" width="100" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.lateDays || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleViewDetail(scope.row)">
                  查看明细
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 25, 50]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
          >
          </el-pagination>
        </div>
      </div>
    </div>

    <!-- 查看明细对话框 -->
    <el-dialog
      :title="detailDialogTitle"
      :visible.sync="detailDialogVisible"
      width="85%"
      top="5vh"
      @close="handleDetailDialogClose"
    >
      <!-- 查询栏 -->
      <div class="dialog-query-bar">
        <el-form :inline="true" size="small">
          <el-form-item label="时间范围：">
            <el-date-picker
              v-model="detailQueryParams.startDate"
              type="date"
              placeholder="开始日期"
              value-format="yyyy-MM-dd"
              style="width: 150px;"
            ></el-date-picker>
            <span style="margin: 0 8px;">-</span>
            <el-date-picker
              v-model="detailQueryParams.endDate"
              type="date"
              placeholder="结束日期"
              value-format="yyyy-MM-dd"
              style="width: 150px;"
            ></el-date-picker>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleDetailQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleDetailReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 导出按钮 -->
      <div class="dialog-action-bar">
        <el-button type="primary" icon="el-icon-download" @click="handleExportDetail">自定义导出</el-button>
      </div>

      <!-- 人员列表表格 -->
      <div class="dialog-table-wrapper">
        <el-table
          :data="detailTableData"
          border
          stripe
          style="width: 100%"
          height="450px"
        >
          <el-table-column type="selection" width="55" align="center"></el-table-column>
          <el-table-column prop="order" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="name" label="姓名" width="100" align="center"></el-table-column>
          <el-table-column prop="shouldAttendanceDays" label="应出勤天数" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.shouldAttendanceDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="actualAttendanceDays" label="实际出勤天数" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.actualAttendanceDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fieldWorkDays" label="外勤天数" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.fieldWorkDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="leaveDays" label="请假天数" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.leaveDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="leaveType" label="请假（分类）" min-width="150">
            <template slot-scope="scope">
              <div v-if="scope.row.leaveType" style="line-height: 1.6;">
                <div v-for="(item, index) in scope.row.leaveType" :key="index" style="color: #409EFF;">
                  {{ item }}
                </div>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="absentDays" label="旷工天数" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.absentDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="onTimeDays" label="按时出勤天数" width="120" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.onTimeDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lateDays" label="迟到天数" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.lateDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="earlyLeaveDays" label="早退天数" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.earlyLeaveDays || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="attendanceRate" label="出勤率" width="100" align="center">
            <template slot-scope="scope">
              <span>{{ scope.row.attendanceRate || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">返回</el-button>
      </div>
    </el-dialog>

    <!-- 自定义导出对话框 -->
    <el-dialog
      title="自定义导出"
      :visible.sync="exportDialogVisible"
      width="50%"
      top="20vh"
      @close="handleExportDialogClose"
    >
      <div class="export-field-table">
        <table class="field-selection-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>应出勤天数</th>
              <th>实际出勤天数</th>
              <th>外勤天数</th>
              <th>请假天数</th>
              <th>病假</th>
            </tr>
            <tr>
              <td><el-checkbox v-model="exportFields.name"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.shouldAttendanceDays"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.actualAttendanceDays"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.fieldWorkDays"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.leaveDays"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.sickLeave"></el-checkbox></td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>旷工天数</th>
              <th>按时出勤天数</th>
              <th>事假</th>
              <th>年休假</th>
              <th>其他假期</th>
              <th>是否包含周末</th>
            </tr>
            <tr>
              <td><el-checkbox v-model="exportFields.absentDays"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.onTimeDays"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.personalLeave"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.annualLeave"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.otherLeave"></el-checkbox></td>
              <td><el-checkbox v-model="exportFields.includeWeekend"></el-checkbox></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button type="primary" icon="el-icon-download" @click="handleConfirmExport">确认导出</el-button>
        <el-button @click="exportDialogVisible = false">取消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { generateOrgTree } from "../utils/orgTree";

export default {
  name: "AttendanceStatistics",
  data() {
    return {
      // 组织树相关（与人员基本信息台账共用 orgTree 数据源）
      orgTreeKeyword: "",
      treeProps: { label: "name", children: "children" },
      orgTree: [],
      selectedOrg: "",
      
      // 查询参数
      queryParams: {
        startDate: '2025-05-05',
        endDate: '2025-05-05',
        includeWeekend: 'include'
      },
      
      // 表格数据
      tableData: [
        {
          unit: '单位1',
          department: '部门名称1',
          attendanceGroup: '考勤组A',
          shouldAttendanceDays: '',
          actualAttendanceDays: '',
          fieldWorkDays: '',
          absentDays: '',
          onTimeDays: '',
          lateDays: ''
        },
        {
          unit: '单位1',
          department: '部门名称1',
          attendanceGroup: '考勤组B',
          shouldAttendanceDays: '',
          actualAttendanceDays: '',
          fieldWorkDays: '',
          absentDays: '',
          onTimeDays: '',
          lateDays: ''
        },
        {
          unit: '单位1',
          department: '部门名称1',
          attendanceGroup: '考勤组C',
          shouldAttendanceDays: '',
          actualAttendanceDays: '',
          fieldWorkDays: '',
          absentDays: '',
          onTimeDays: '',
          lateDays: ''
        },
        {
          unit: '单位1',
          department: '部门名称2',
          attendanceGroup: '考勤组A',
          shouldAttendanceDays: '',
          actualAttendanceDays: '',
          fieldWorkDays: '',
          absentDays: '',
          onTimeDays: '',
          lateDays: ''
        },
        {
          unit: '单位1',
          department: '部门名称2',
          attendanceGroup: '考勤组B',
          shouldAttendanceDays: '',
          actualAttendanceDays: '',
          fieldWorkDays: '',
          absentDays: '',
          onTimeDays: '',
          lateDays: ''
        },
        {
          unit: '单位1',
          department: '部门名称2',
          attendanceGroup: '考勤组C',
          shouldAttendanceDays: '',
          actualAttendanceDays: '',
          fieldWorkDays: '',
          absentDays: '',
          onTimeDays: '',
          lateDays: ''
        }
      ],
      
      // 选中的行
      selectedRows: [],
      
      // 分页
      currentPage: 1,
      pageSize: 25,
      total: 100,
      
      // 查看明细对话框相关
      detailDialogVisible: false,       // 明细对话框显示状态
      detailDialogTitle: '',            // 对话框标题
      currentDetailData: {},            // 当前查看的考勤组信息
      detailTableData: [],              // 明细表格数据
      detailQueryParams: {              // 明细查询参数
        startDate: '2025-05-05',
        endDate: '2025-05-05'
      },
      
      // 自定义导出对话框相关
      exportDialogVisible: false,       // 导出对话框显示状态
      exportFields: {                   // 导出字段选择
        name: true,
        shouldAttendanceDays: false,
        actualAttendanceDays: false,
        fieldWorkDays: true,
        leaveDays: true,
        sickLeave: true,
        absentDays: false,
        onTimeDays: true,
        personalLeave: true,
        annualLeave: false,
        otherLeave: false,
        includeWeekend: true
      }
    };
  },
  
  mounted() {
    this.orgTree = generateOrgTree();
  },

  computed: {
    filteredOrgTree() {
      const kw = (this.orgTreeKeyword || "").trim();
      if (!kw) return this.orgTree;
      const filter = (nodes) =>
        nodes
          .map((n) => {
            const children = n.children ? filter(n.children) : [];
            const match = (n.name || "").includes(kw);
            if (match || children.length) {
              return { ...n, children: children.length ? children : n.children };
            }
            return null;
          })
          .filter(Boolean);
      return filter(this.orgTree);
    },
  },
  
  methods: {
    handleTreeCheckChange(data, checked, indeterminate) {
      console.log("树节点选中变化:", data, checked, indeterminate);
    },

    handleOrgClick(data) {
      this.selectedOrg = data.id === 1 ? "" : data.name;
      this.currentPage = 1;
      this.loadData();
    },

    resetOrgSelection() {
      this.selectedOrg = "";
      this.orgTreeKeyword = "";
      this.$nextTick(() => {
        if (this.$refs.orgTree) {
          this.$refs.orgTree.setCurrentKey(null);
          this.$refs.orgTree.setCheckedKeys([]);
        }
      });
    },
    
    // 查询
    handleQuery() {
      console.log('=== 查询 ===');
      console.log('查询参数:', this.queryParams);
      console.log('选中的组织节点:', this.$refs.orgTree.getCheckedNodes());
      
      this.$message.success('查询成功');
      // 这里调用后端API获取数据
    },
    
    // 重置
    handleReset() {
      console.log("=== 重置 ===");
      this.queryParams = {
        startDate: "",
        endDate: "",
        includeWeekend: "include",
      };
      this.resetOrgSelection();
      this.tableData = [];
      this.total = 0;
      this.currentPage = 1;
      this.$message.info("已重置查询条件");
    },
    
    // 导出
    handleExport() {
      console.log('=== 导出 ===');
      const checkedNodes = this.$refs.orgTree.getCheckedNodes();
      
      if (checkedNodes.length === 0) {
        this.$message.warning('请先选择要导出的组织节点');
        return;
      }
      
      this.$confirm('请选择导出方式：', '导出选项', {
        confirmButtonText: '按考勤组导出',
        cancelButtonText: '按人员明细导出',
        distinguishCancelAndClose: true,
        type: 'info'
      })
        .then(() => {
          this.$message.success('按考勤组导出功能待开发');
        })
        .catch(action => {
          if (action === 'cancel') {
            this.$message.success('按人员明细导出功能待开发');
          }
        });
    },
    
    // 查看明细
    handleViewDetail(row) {
      console.log('=== 查看明细 ===', row);
      
      // 保存当前考勤组信息
      this.currentDetailData = { ...row };
      
      // 设置对话框标题
      this.detailDialogTitle = `${row.unit}-${row.department}-${row.attendanceGroup}人员明细`;
      
      // 加载该考勤组的人员明细数据
      this.loadDetailData(row);
      
      // 打开对话框
      this.detailDialogVisible = true;
    },
    
    // 加载明细数据
    loadDetailData(row) {
      console.log('加载考勤组明细数据:', row);
      
      // 模拟数据 - 实际应该调用后端API
      const mockData = [
        {
          order: 1,
          name: '张三',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 20,
          fieldWorkDays: 2,
          leaveDays: 3,
          leaveType: ['年假：2天', '病假：1天'],
          absentDays: 0,
          onTimeDays: 18,
          lateDays: 2,
          earlyLeaveDays: 0,
          attendanceRate: '90.9%'
        },
        {
          order: 2,
          name: '李四',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 21,
          fieldWorkDays: 1,
          leaveDays: 0,
          leaveType: null,
          absentDays: 0,
          onTimeDays: 19,
          lateDays: 2,
          earlyLeaveDays: 0,
          attendanceRate: '95.5%'
        },
        {
          order: 3,
          name: '王五',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 18,
          fieldWorkDays: 3,
          leaveDays: 5,
          leaveType: ['事假：3天', '调休：2天'],
          absentDays: 0,
          onTimeDays: 16,
          lateDays: 2,
          earlyLeaveDays: 0,
          attendanceRate: '81.8%'
        },
        {
          order: 4,
          name: '赵六',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 15,
          fieldWorkDays: 0,
          leaveDays: 2,
          leaveType: ['病假：2天'],
          absentDays: 5,
          onTimeDays: 13,
          lateDays: 2,
          earlyLeaveDays: 0,
          attendanceRate: '68.2%'
        },
        {
          order: 5,
          name: '钱七',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 22,
          fieldWorkDays: 0,
          leaveDays: 0,
          leaveType: null,
          absentDays: 0,
          onTimeDays: 20,
          lateDays: 2,
          earlyLeaveDays: 0,
          attendanceRate: '100%'
        },
        {
          order: 6,
          name: '孙八',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 21,
          fieldWorkDays: 1,
          leaveDays: 0,
          leaveType: null,
          absentDays: 0,
          onTimeDays: 20,
          lateDays: 1,
          earlyLeaveDays: 0,
          attendanceRate: '95.5%'
        },
        {
          order: 7,
          name: '周九',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 20,
          fieldWorkDays: 0,
          leaveDays: 1,
          leaveType: ['事假：1天'],
          absentDays: 1,
          onTimeDays: 18,
          lateDays: 1,
          earlyLeaveDays: 0,
          attendanceRate: '90.9%'
        },
        {
          order: 8,
          name: '吴十',
          shouldAttendanceDays: 22,
          actualAttendanceDays: 22,
          fieldWorkDays: 0,
          leaveDays: 0,
          leaveType: null,
          absentDays: 0,
          onTimeDays: 21,
          lateDays: 1,
          earlyLeaveDays: 0,
          attendanceRate: '100%'
        }
      ];
      
      this.detailTableData = mockData;
    },
    
    // 获取状态类型（用于el-tag颜色）
    getStatusType(status) {
      const statusMap = {
        '出勤': 'success',    // 绿色
        '迟到': 'warning',    // 橙色
        '外勤': 'info',       // 蓝色
        '旷工': 'danger'      // 红色
      };
      return statusMap[status] || 'info';
    },
    
    // 明细查询
    handleDetailQuery() {
      console.log('=== 明细查询 ===');
      console.log('查询参数:', this.detailQueryParams);
      this.$message.success('查询成功');
      // 这里调用后端API重新加载数据
    },
    
    // 明细重置
    handleDetailReset() {
      console.log('=== 明细重置 ===');
      this.detailQueryParams = {
        startDate: '',
        endDate: ''
      };
      this.$message.info('已重置查询条件');
    },
    
    // 导出明细
    handleExportDetail() {
      console.log('=== 打开自定义导出对话框 ===');
      
      if (!this.currentDetailData.attendanceGroup) {
        this.$message.warning('请先选择要导出的考勤组');
        return;
      }
      
      // 打开导出字段选择对话框
      this.exportDialogVisible = true;
    },
    
    // 关闭导出对话框
    handleExportDialogClose() {
      console.log('=== 关闭导出对话框 ===');
      // 重置为默认选中状态
      this.exportFields = {
        name: true,
        shouldAttendanceDays: false,
        actualAttendanceDays: false,
        fieldWorkDays: true,
        leaveDays: true,
        sickLeave: true,
        absentDays: false,
        onTimeDays: true,
        personalLeave: true,
        annualLeave: false,
        otherLeave: false,
        includeWeekend: true
      };
    },
    
    // 确认导出
    handleConfirmExport() {
      console.log('=== 确认导出 ===');
      
      // 检查是否至少选择了一个字段
      const selectedFields = Object.keys(this.exportFields).filter(key => this.exportFields[key]);
      
      if (selectedFields.length === 0) {
        this.$message.warning('请至少选择一个导出字段');
        return;
      }
      
      console.log('选中的导出字段:', selectedFields);
      
      // 模拟导出成功
      this.$message.success(`已导出${selectedFields.length}个字段的数据`);
      this.exportDialogVisible = false;
      
      // 这里调用实际的导出逻辑，根据selectedFields筛选要导出的列
    },
    
    // 关闭明细对话框
    handleDetailDialogClose() {
      console.log('=== 关闭明细对话框 ===');
      this.detailDialogTitle = '';
      this.currentDetailData = {};
      this.detailTableData = [];
    },
    
    // 表格选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },
    
    // 每页条数变化
    handleSizeChange(val) {
      console.log('每页显示条数变化:', val);
      this.pageSize = val;
      this.currentPage = 1;
      this.loadData();
    },
    
    // 当前页变化
    handleCurrentChange(val) {
      console.log('当前页变化:', val);
      this.currentPage = val;
      this.loadData();
    },
    
    // 加载数据
    loadData() {
      console.log('=== 加载数据 ===');
      // 这里调用后端API获取数据
    }
  }
};
</script>

<style scoped>
.attendance-statistics-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.main-content {
  display: flex;
  flex: 1;
  padding: 12px 16px;
  gap: 12px;
  overflow: hidden;
  align-items: flex-start;
}

/* 左侧组织树（与人员基本信息台账 org-sidebar 一致） */
.org-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-self: stretch;
  max-height: calc(100vh - 84px);
}

.org-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.org-tree-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  overflow: hidden;
}

.tree-node i {
  margin-right: 6px;
  color: #909399;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 查询栏 */
.query-bar {
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

/* 操作栏 */
.action-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

/* 表格区域 */
.table-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 16px;
  text-align: right;
}

/* 明细对话框样式 */
.dialog-query-bar {
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 16px;
}

.dialog-action-bar {
  margin-bottom: 16px;
}

.dialog-table-wrapper {
  margin-top: 0;
}

/* 导出字段选择表格 */
.export-field-table {
  padding: 20px;
}

.field-selection-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dcdfe6;
}

.field-selection-table thead th,
.field-selection-table tbody th {
  background-color: #f5f7fa;
  padding: 12px 8px;
  text-align: center;
  font-weight: normal;
  color: #606266;
  border-right: 1px solid #dcdfe6;
  border-bottom: 1px solid #dcdfe6;
}

.field-selection-table thead td,
.field-selection-table tbody td {
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid #dcdfe6;
  border-bottom: 1px solid #dcdfe6;
}

.field-selection-table thead th:last-child,
.field-selection-table tbody th:last-child,
.field-selection-table thead td:last-child,
.field-selection-table tbody td:last-child {
  border-right: none;
}
</style>
