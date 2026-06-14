<template>
  <div class="abnormal-data-management">
    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" class="page-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="异常数据审批管理" name="approval"></el-tab-pane>
      <el-tab-pane label="异常数据台账信息" name="ledger"></el-tab-pane>
      <el-tab-pane label="异常数据预警查询" name="warning"></el-tab-pane>
    </el-tabs>

    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 查询条件 -->
      <div class="query-section">
        <el-form :inline="true" class="query-form">
          <el-form-item label="单位:">
            <el-select
              v-model="queryParams.unit"
              placeholder="请选择"
              size="small"
              style="width: 150px;"
              clearable
            >
              <el-option label="云南电网有限责任公司" value="yunnan"></el-option>
              <el-option label="昆明供电局" value="kunming"></el-option>
              <el-option label="曲靖供电局" value="qujing"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="部门:">
            <el-select
              v-model="queryParams.department"
              placeholder="请选择"
              size="small"
              style="width: 150px;"
              clearable
            >
              <el-option label="人力资源部" value="hr"></el-option>
              <el-option label="财务部" value="finance"></el-option>
              <el-option label="生产技术部" value="production"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="考勤组:">
            <el-select
              v-model="queryParams.attendanceGroup"
              placeholder="请选择"
              size="small"
              style="width: 150px;"
              clearable
            >
              <el-option label="人力资源部-干部管理科考勤组" value="group1"></el-option>
              <el-option label="人力资源部-薪酬绩效科考勤组" value="group2"></el-option>
              <el-option label="财务部考勤组" value="group3"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="状态:">
            <el-select
              v-model="queryParams.status"
              placeholder="请选择"
              size="small"
              style="width: 120px;"
              clearable
            >
              <el-option label="待确认" value="pending"></el-option>
              <el-option label="已确认" value="confirmed"></el-option>
              <el-option label="退回" value="returned"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围:">
            <el-date-picker
              v-model="queryParams.dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="起始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              size="small"
              style="width: 240px;"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">
              查询
            </el-button>
            <el-button icon="el-icon-refresh" size="small" @click="handleReset">
              重置
            </el-button>
            <el-button type="success" icon="el-icon-download" size="small" @click="handleExport">
              导出
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-label">流程发起数</div>
          <div class="stat-value">{{ stats.totalInitiated }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">待确认</div>
          <div class="stat-value pending">{{ stats.pending }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">流程闭环数</div>
          <div class="stat-value">{{ stats.totalClosed }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">已确认</div>
          <div class="stat-value confirmed">{{ stats.confirmed }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">退回</div>
          <div class="stat-value returned">{{ stats.returned }}</div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-wrapper">
        <el-table
          :data="tableData"
          border
          stripe
          height="calc(100vh - 380px)"
          style="width: 100%;"
        >
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">
              {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="processId" label="流程编号" width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="name" label="人员姓名" width="100" align="center"></el-table-column>
          <el-table-column prop="unit" label="所属单位" width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="department" label="所属部门" width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="team" label="班组" width="100" align="center"></el-table-column>
          <el-table-column prop="attendanceGroup" label="考勤组" width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="approvalTime" label="审批时间" width="120" align="center"></el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template slot-scope="scope">
              <el-tag
                :type="getStatusType(scope.row.status)"
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button
                v-if="scope.row.status === 'pending'"
                type="text"
                size="small"
                @click="handleProcess(scope.row)"
              >
                去处理
              </el-button>
              <el-button
                v-else-if="scope.row.status === 'returned'"
                type="text"
                size="small"
                @click="handleReapply(scope.row)"
              >
                重新
              </el-button>
              <el-button
                v-else
                type="text"
                size="small"
                @click="handleView(scope.row)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
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

    <!-- 异常处理对话框 -->
    <el-dialog
      :title="'异常处理 - ' + (processingRow ? processingRow.processId : '')"
      :visible.sync="processDialogVisible"
      width="70%"
      top="5vh"
      @close="handleProcessDialogClose"
    >
      <div class="process-dialog-content">
        <!-- 顶部操作按钮 -->
        <div class="dialog-header-actions">
          <el-button-group>
            <el-button size="small" icon="el-icon-back" @click="handleReturn">退回</el-button>
            <el-button type="primary" size="small" icon="el-icon-check" @click="handleSubmit">确认提交</el-button>
            <el-button size="small" icon="el-icon-back" @click="processDialogVisible = false">返回</el-button>
          </el-button-group>
        </div>

        <!-- 审批意见 -->
        <div class="section-block">
          <div class="section-title">
            <i class="el-icon-document"></i>
            <span>审批意见</span>
          </div>
          <el-input
            v-model="approvalForm.opinion"
            type="textarea"
            :rows="4"
            placeholder="请填写审批意见"
            maxlength="2000"
            show-word-limit
          ></el-input>
        </div>

        <!-- 基本信息 -->
        <div class="section-block">
          <div class="section-title">
            <i class="el-icon-info"></i>
            <span>基本信息</span>
          </div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="异常记录编号">
              {{ abnormalDetail.recordId }}
            </el-descriptions-item>
            <el-descriptions-item label="异常发生事件">
              {{ abnormalDetail.eventTime }}
            </el-descriptions-item>
            <el-descriptions-item label="异常详情">
              <el-tag size="small" type="warning">{{ abnormalDetail.detail }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 证明信息 -->
        <div class="section-block">
          <div class="section-title">
            <i class="el-icon-files"></i>
            <span>证明信息</span>
          </div>
          <el-form label-width="80px" size="small">
            <el-form-item label="异常说明:">
              <el-input
                v-model="abnormalDetail.description"
                type="textarea"
                :rows="3"
                disabled
                maxlength="2000"
                show-word-limit
              ></el-input>
            </el-form-item>
          </el-form>

          <!-- 证明材料 -->
          <div class="attachments-section">
            <div class="attachments-label">证明材料:</div>
            <div class="attachments-list">
              <div
                v-for="(file, index) in abnormalDetail.attachments"
                :key="index"
                class="attachment-item"
              >
                <div class="file-icon">
                  <i v-if="file.type === 'image'" class="el-icon-picture-outline"></i>
                  <i v-else-if="file.type === 'pdf'" class="el-icon-document"></i>
                  <i v-else class="el-icon-document"></i>
                </div>
                <div class="file-info">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-size">({{ file.size }})</div>
                </div>
                <div class="file-actions">
                  <el-button type="text" size="mini" @click="handleDownloadAttachment(file)">下载</el-button>
                  <el-button type="text" size="mini" @click="handlePreviewAttachment(file)">预览</el-button>
                  <el-button type="text" size="mini" style="color: #F56C6C;" @click="handleDeleteAttachment(index)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 审批记录 -->
        <div class="section-block">
          <div class="section-title">
            <i class="el-icon-tickets"></i>
            <span>审批记录</span>
          </div>
          <div class="approval-timeline">
            <div
              v-for="record in approvalRecords"
              :key="record.step"
              class="timeline-item"
            >
              <div class="timeline-step">
                <div class="step-number">{{ record.step }}</div>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <el-tag size="small" :type="getApprovalTagType(record.status)">{{ record.type }}</el-tag>
                  <span class="timeline-time">{{ record.time }}</span>
                </div>
                <div class="timeline-body">
                  <span class="info-item">申请人: {{ record.applicant }}</span>
                  <span class="info-item">所属部门: {{ record.department }}</span>
                  <span v-if="record.status === 'approved'" class="status-approved">
                    【通过】 审批意见: {{ record.opinion }}
                  </span>
                  <span v-else-if="record.status === 'submitted'" class="status-submitted">
                    已提交，等待审批
                  </span>
                  <span v-else class="status-pending">
                    待审批
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "AbnormalDataManagement",
  data() {
    return {
      activeTab: 'approval',
      queryParams: {
        unit: '',
        department: '',
        attendanceGroup: '',
        status: '',
        dateRange: []
      },
      stats: {
        totalInitiated: 791,
        pending: 95,
        totalClosed: 696,
        confirmed: 522,
        returned: 174
      },
      tableData: [],
      total: 0,
      pageSize: 10,
      currentPage: 1,

      // 异常处理对话框
      processDialogVisible: false,
      processingRow: null,
      approvalForm: {
        opinion: '',
        action: 'confirm' // confirm 或 return
      },
      // 异常详细信息
      abnormalDetail: {
        recordId: '',
        eventTime: '',
        detail: '',
        description: '',
        attachments: []
      },
      // 审批记录
      approvalRecords: []
    };
  },
  created() {
    this.loadData();
  },
  methods: {
    // 加载数据
    loadData() {
      // 模拟数据
      const mockData = [
        {
          id: 1,
          processId: 'GD202502150200000006',
          name: '张伟',
          unit: '云南电网有限责任公司',
          department: '人力资源部',
          team: '干部管理科',
          attendanceGroup: '人力资源部-干部管理科考勤组',
          approvalTime: '2025-02-15',
          status: 'pending'
        },
        {
          id: 2,
          processId: 'GD202502150200000005',
          name: '李芳',
          unit: '云南电网有限责任公司',
          department: '财务部',
          team: '会计核算科',
          attendanceGroup: '财务部考勤组',
          approvalTime: '2025-02-15',
          status: 'confirmed'
        },
        {
          id: 3,
          processId: 'GD202502150200000004',
          name: '王娜',
          unit: '云南电网有限责任公司',
          department: '生产技术部',
          team: '运行检修班',
          attendanceGroup: '生产技术部考勤组',
          approvalTime: '2025-02-14',
          status: 'confirmed'
        },
        {
          id: 4,
          processId: 'GD202502150200000003',
          name: '刘敏',
          unit: '云南电网有限责任公司',
          department: '人力资源部',
          team: '薪酬绩效科',
          attendanceGroup: '人力资源部-薪酬绩效科考勤组',
          approvalTime: '2025-02-14',
          status: 'confirmed'
        },
        {
          id: 5,
          processId: 'GD202502150200000002',
          name: '陈静',
          unit: '云南电网有限责任公司',
          department: '财务部',
          team: '资金管理科',
          attendanceGroup: '财务部考勤组',
          approvalTime: '2025-02-13',
          status: 'returned'
        },
        {
          id: 6,
          processId: 'GD202502150200000001',
          name: '杨洋',
          unit: '云南电网有限责任公司',
          department: '人力资源部',
          team: '干部管理科',
          attendanceGroup: '人力资源部-干部管理科考勤组',
          approvalTime: '2025-02-12',
          status: 'confirmed'
        }
      ];

      // 根据查询条件过滤
      let filtered = [...mockData];
      
      if (this.queryParams.unit) {
        filtered = filtered.filter(item => 
          item.unit.includes(this.getUnitName(this.queryParams.unit))
        );
      }
      
      if (this.queryParams.department) {
        filtered = filtered.filter(item => 
          item.department.includes(this.getDepartmentName(this.queryParams.department))
        );
      }
      
      if (this.queryParams.status) {
        filtered = filtered.filter(item => item.status === this.queryParams.status);
      }

      this.tableData = filtered;
      this.total = filtered.length;
    },

    // 获取单位名称
    getUnitName(value) {
      const map = {
        'yunnan': '云南电网',
        'kunming': '昆明供电局',
        'qujing': '曲靖供电局'
      };
      return map[value] || '';
    },

    // 获取部门名称
    getDepartmentName(value) {
      const map = {
        'hr': '人力资源',
        'finance': '财务',
        'production': '生产技术'
      };
      return map[value] || '';
    },

    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'confirmed': 'info',
        'returned': 'danger'
      };
      return typeMap[status] || 'info';
    },

    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        'pending': '待确认',
        'confirmed': '已确认',
        'returned': '退回'
      };
      return textMap[status] || status;
    },

    // 查询
    handleQuery() {
      this.currentPage = 1;
      this.loadData();
      this.$message.success('查询成功');
    },

    // 重置
    handleReset() {
      this.queryParams = {
        unit: '',
        department: '',
        attendanceGroup: '',
        status: '',
        dateRange: []
      };
      this.currentPage = 1;
      this.loadData();
      this.$message.info('已重置查询条件');
    },

    // 去处理
    handleProcess(row) {
      this.processingRow = row;
      
      // 模拟加载异常详细信息
      this.abnormalDetail = {
        recordId: row.processId,
        eventTime: `${row.approvalTime} 12:00`,
        detail: '缺卡',
        description: '该员工在2025-02-15上午9:00未打卡，下午18:00正常打卡。经核实，当天早上因交通拥堵导致迟到，已提前向部门主管报备。',
        attachments: [
          { name: '证明材料.png', size: '289KB', type: 'image' },
          { name: '证明材料.pptx', size: '289KB', type: 'pdf' },
          { name: '证明材料.docx', size: '289KB', type: 'word' }
        ]
      };

      // 模拟加载审批记录
      this.approvalRecords = [
        { step: 1, type: '提交审批', time: '2026-01-04 09:12:11', applicant: row.name, department: row.department, status: 'submitted', opinion: '' },
        { step: 2, type: '部门审批', time: '2026-01-04 09:12:11', applicant: '王二', department: row.department, status: 'approved', opinion: '同意' },
        { step: 3, type: '人资审批', time: '2026-01-04 09:12:11', applicant: row.name, department: row.department, status: 'approved', opinion: '同意' },
        { step: 4, type: '领导审批', time: '2026-01-04 09:12:11', applicant: row.name, department: row.department, status: 'pending', opinion: '' }
      ];

      // 重置表单
      this.approvalForm = {
        opinion: '',
        action: 'confirm'
      };

      this.processDialogVisible = true;
    },

    // 确认提交
    handleSubmit() {
      if (!this.approvalForm.opinion.trim()) {
        this.$message.warning('请填写审批意见');
        return;
      }

      const actionText = this.approvalForm.action === 'confirm' ? '确认' : '退回';
      
      this.$confirm(`确定要${actionText}该异常数据吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // TODO: 调用后端API提交审批结果
        this.$message.success(`${actionText}成功`);
        this.processDialogVisible = false;
        
        // 刷新列表
        this.loadData();
      }).catch(() => {
        this.$message.info('已取消操作');
      });
    },

    // 关闭对话框
    handleProcessDialogClose() {
      this.approvalForm = {
        opinion: '',
        action: 'confirm'
      };
      this.processingRow = null;
      this.abnormalDetail = {
        recordId: '',
        eventTime: '',
        detail: '',
        description: '',
        attachments: []
      };
      this.approvalRecords = [];
    },

    // 下载附件
    handleDownloadAttachment(file) {
      this.$message.info(`下载文件: ${file.name}`);
      // TODO: 实现文件下载逻辑
    },

    // 预览附件
    handlePreviewAttachment(file) {
      this.$message.info(`预览文件: ${file.name}`);
      // TODO: 实现文件预览逻辑
    },

    // 删除附件
    handleDeleteAttachment(index) {
      this.$confirm('确定要删除该附件吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.abnormalDetail.attachments.splice(index, 1);
        this.$message.success('删除成功');
      }).catch(() => {});
    },

    // 退回
    handleReturn() {
      this.approvalForm.action = 'return';
      this.$message.info('已选择退回操作，请填写审批意见后提交');
    },

    // 获取审批状态标签类型
    getApprovalTagType(status) {
      const typeMap = {
        'submitted': 'info',
        'approved': 'success',
        'pending': 'warning',
        'rejected': 'danger'
      };
      return typeMap[status] || 'info';
    },

    // 重新提交
    handleReapply(row) {
      this.$message.info(`重新提交流程: ${row.processId}`);
      // TODO: 打开重新提交对话框
    },

    // 查看详情
    handleView(row) {
      this.$message.info(`查看详情: ${row.processId}`);
      // TODO: 打开详情对话框
    },

    // 标签页切换
    handleTabClick(tab) {
      console.log('切换到标签页:', tab.name);
      // TODO: 根据不同标签页加载不同数据
      if (tab.name === 'approval') {
        // 异常数据审批管理
        this.loadData();
      } else if (tab.name === 'ledger') {
        // 异常数据台账信息
        this.loadLedgerData();
      } else if (tab.name === 'warning') {
        // 异常数据预警查询
        this.loadWarningData();
      }
    },

    // 加载台账数据
    loadLedgerData() {
      this.$message.info('加载异常数据台账信息');
      // TODO: 实现台账数据加载逻辑
    },

    // 加载预警数据
    loadWarningData() {
      this.$message.info('加载异常数据预警查询');
      // TODO: 实现预警数据加载逻辑
    },

    // 分页大小改变
    handleSizeChange(val) {
      this.pageSize = val;
      this.loadData();
    },

    // 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadData();
    },

    // 导出数据
    handleExport() {
      if (this.tableData.length === 0) {
        this.$message.warning('没有可导出的数据');
        return;
      }

      // 构建导出数据
      const exportData = this.tableData.map((row, index) => ({
        '序号': (this.currentPage - 1) * this.pageSize + index + 1,
        '流程编号': row.processId,
        '人员姓名': row.name,
        '所属单位': row.unit,
        '所属部门': row.department,
        '班组': row.team,
        '考勤组': row.attendanceGroup,
        '审批时间': row.approvalTime,
        '状态': this.getStatusText(row.status)
      }));

      // 使用 CSV 导出
      this.exportToCSV(exportData, `异常数据管理_${new Date().toISOString().slice(0, 10)}.csv`);

      this.$message.success(`成功导出 ${exportData.length} 条数据`);
    },

    // CSV 导出工具方法
    exportToCSV(data, filename) {
      if (!data || data.length === 0) return;

      const headers = Object.keys(data[0]);
      let csvContent = '\ufeff'; // BOM 标记，解决中文乱码
      csvContent += headers.join(',') + '\n';

      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))){
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });

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
    }
  }
};
</script>

<style scoped>
.abnormal-data-management {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部标签页 */
.page-tabs {
  background-color: #fff;
  padding: 0 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
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
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  min-height: 0;
}

/* 查询条件区域 */
.query-section {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.query-form {
  margin-bottom: 0;
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.stat-card {
  flex: 1;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-value.pending {
  color: #E6A23C;
}

.stat-value.confirmed {
  color: #67C23A;
}

.stat-value.returned {
  color: #F56C6C;
}

/* 表格区域 */
.table-wrapper {
  flex: 1;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
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

/* 异常处理对话框样式 */
.process-dialog-content {
  max-height: calc(85vh - 200px);
  overflow-y: auto;
  padding-right: 10px;
}

.dialog-header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.section-block {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409EFF;
}

.section-title i {
  color: #409EFF;
  font-size: 16px;
}

/* 证明材料区域 */
.attachments-section {
  margin-top: 12px;
}

.attachments-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.attachments-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
  min-width: 280px;
}

.attachment-item:hover {
  background-color: #ecf5ff;
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.file-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 4px;
  font-size: 20px;
  color: #409EFF;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.file-actions {
  display: flex;
  gap: 4px;
}

/* 审批记录时间轴 */
.approval-timeline {
  position: relative;
  padding-left: 20px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  position: relative;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 36px;
  bottom: -20px;
  width: 2px;
  background-color: #e4e7ed;
}

.timeline-step {
  flex-shrink: 0;
}

.step-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409EFF;
  color: #fff;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.timeline-time {
  font-size: 12px;
  color: #909399;
}

.timeline-body {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #606266;
}

.info-item {
  color: #606266;
}

.status-approved {
  color: #67C23A;
  font-weight: 500;
}

.status-submitted {
  color: #909399;
  font-style: italic;
}

.status-pending {
  color: #E6A23C;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 1400px) {
  .stats-cards {
    flex-wrap: wrap;
  }
  
  .stat-card {
    min-width: calc(33.33% - 11px);
  }
}

@media (max-width: 768px) {
  .stats-cards {
    flex-direction: column;
  }
  
  .stat-card {
    min-width: 100%;
  }
}
</style>
