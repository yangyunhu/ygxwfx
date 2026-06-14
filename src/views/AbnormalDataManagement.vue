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
      <!-- 异常数据审批管理页签内容 -->
      <div v-if="activeTab === 'approval'" class="tab-content">
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
    <!-- 异常数据审批管理页签内容结束 -->

    <!-- 异常数据台账信息页签内容 -->
    <div v-if="activeTab === 'ledger'" class="tab-content ledger-tab">
      <!-- 可滚动内容容器 -->
      <div class="scrollable-content">
        <!-- 查询条件 -->
        <div class="query-section">
          <el-form :inline="true" class="query-form">
            <el-form-item label="单位:">
              <el-select
                v-model="ledgerQueryParams.unit"
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
                v-model="ledgerQueryParams.department"
                placeholder="请选择"
                size="small"
                style="width: 150px;"
                clearable
              >
                <el-option label="法规部" value="legal"></el-option>
                <el-option label="综合服务中心" value="service"></el-option>
                <el-option label="工会办" value="union"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="班组:">
              <el-select
                v-model="ledgerQueryParams.team"
                placeholder="请选择"
                size="small"
                style="width: 150px;"
                clearable
              >
                <el-option label="班组1" value="team1"></el-option>
                <el-option label="班组2" value="team2"></el-option>
                <el-option label="班组3" value="team3"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="异常类型:">
              <el-select
                v-model="ledgerQueryParams.abnormalType"
                placeholder="请选择"
                size="small"
                style="width: 150px;"
                clearable
              >
                <el-option label="迟到" value="late"></el-option>
                <el-option label="早退" value="early_leave"></el-option>
                <el-option label="旷工" value="absent"></el-option>
                <el-option label="缺卡" value="missing_card"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="人员姓名:">
              <el-input
                v-model="ledgerQueryParams.name"
                placeholder="请输入"
                size="small"
                style="width: 150px;"
                clearable
              ></el-input>
            </el-form-item>
            <el-form-item label="异常状态:">
              <el-select
                v-model="ledgerQueryParams.status"
                placeholder="请选择"
                size="small"
                style="width: 150px;"
                clearable
              >
                <el-option label="待确认" value="pending"></el-option>
                <el-option label="待审批" value="awaiting"></el-option>
                <el-option label="已确认" value="confirmed"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围:">
              <el-date-picker
                v-model="ledgerQueryParams.dateRange"
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
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleLedgerQuery">
                查询
              </el-button>
              <el-button icon="el-icon-refresh" size="small" @click="handleLedgerReset">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 操作按钮栏 -->
        <div class="action-bar">
          <el-button type="primary" icon="el-icon-download" size="small" @click="handleLedgerExport">
            导出
          </el-button>
        </div>

        <!-- 表格区域 -->
        <div class="table-container">
          <el-table
            ref="ledgerTable"
            :data="ledgerTableData"
            border
            stripe
            style="width: 100%;"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="50" align="center"></el-table-column>
            <el-table-column label="序号" width="60" align="center">
              <template slot-scope="scope">
                {{ (ledgerCurrentPage - 1) * ledgerPageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="name" label="人员姓名" width="100" align="center"></el-table-column>
            <el-table-column prop="unit" label="单位" width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="department" label="部门" width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="team" label="班组" width="100" align="center"></el-table-column>
            <el-table-column prop="abnormalType" label="异常类型" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" :type="getAbnormalTypeTag(scope.row.abnormalType)">
                  {{ getAbnormalTypeText(scope.row.abnormalType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="abnormalTime" label="异常时间" width="120" align="center"></el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag size="small" :type="getLedgerStatusType(scope.row.status)">
                  {{ getLedgerStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 分页 - 固定在底部 -->
      <div class="pagination-wrapper">
        <span class="total-text">共 {{ ledgerTotal }}条</span>
        <div class="page-size-selector">
          <span>每页显示：</span>
          <el-radio-group v-model="ledgerPageSize" size="small" @change="handleLedgerSizeChange">
            <el-radio-button :label="10">10</el-radio-button>
            <el-radio-button :label="25">25</el-radio-button>
            <el-radio-button :label="50">50</el-radio-button>
          </el-radio-group>
          <span>条</span>
        </div>
        <el-pagination
          background
          layout="prev, pager, next, jumper"
          :total="ledgerTotal"
          :page-size="ledgerPageSize"
          :current-page="ledgerCurrentPage"
          small
          @current-change="handleLedgerCurrentChange"
        ></el-pagination>
      </div>
    </div>
    <!-- 异常数据台账信息页签内容结束 -->

    <!-- 异常数据预警查询页签内容 -->
    <div v-if="activeTab === 'warning'" class="tab-content warning-tab">
      <!-- 可滚动内容容器 -->
      <div class="scrollable-content">
        <!-- 查询条件 -->
        <div class="query-section">
          <el-form :inline="true" class="query-form">
            <el-form-item label="单位:">
              <el-select
                v-model="warningQueryParams.unit"
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
            <el-form-item label="开始时间:">
              <el-date-picker
                v-model="warningQueryParams.startDate"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                size="small"
                style="width: 150px;"
              ></el-date-picker>
            </el-form-item>
            <el-form-item label="-">
              <span>截止时间:</span>
            </el-form-item>
            <el-form-item>
              <el-date-picker
                v-model="warningQueryParams.endDate"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                size="small"
                style="width: 150px;"
              ></el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleWarningQuery">
                查询
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 图表区域 -->
        <div class="charts-container">
          <!-- 左侧：异常数据分布情况 -->
          <div class="chart-panel left-panel">
            <div class="panel-header">
              <i class="el-icon-pie-chart"></i>
              <span class="panel-title">异常数据分布情况</span>
              <span class="link-text">点击联动</span>
            </div>
            <div class="chart-content">
              <!-- 环形图 -->
              <div ref="distributionChart" class="pie-chart"></div>
              
              <!-- 数据表格 -->
              <div class="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>类型：</th>
                      <th>迟到/早退</th>
                      <th>在岗证据不足/冲突</th>
                      <th>旷工</th>
                      <th>请假超时</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>占比：</td>
                      <td>20%</td>
                      <td>30%</td>
                      <td>40%</td>
                      <td>10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 右侧：迟到异常 -->
          <div class="chart-panel right-panel">
            <div class="panel-header">
              <i class="el-icon-warning-outline"></i>
              <span class="panel-title">{{ selectedAbnormalType }}</span>
              <a href="#" class="detail-link" @click.prevent="handleViewWarningDetail">查看数据明细 &gt;</a>
            </div>
            <div class="panel-body">
              <!-- 黄色提示框 -->
              <div class="alert-box">
                <p>注：该预警数据类型的预警方式为区间预警，区间值为xx-xx，异常数据在此范围内的人员包含在下述统计数据中</p>
              </div>
              
              <!-- 统计说明 -->
              <div class="stats-note">
                注：统计数据截止2025年5月25日
              </div>
              
              <!-- 柱状图 -->
              <div class="bar-chart-wrapper">
                <div class="unit-label">单位：次</div>
                <div ref="lateBarChart" class="bar-chart"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 异常数据预警查询页签内容结束 -->

    <!-- 主内容区域结束 -->
    </div>

    <!-- 预警数据详情对话框 -->
    <el-dialog
      title="预警数据详情"
      :visible.sync="warningDetailDialogVisible"
      width="90%"
      top="5vh"
      @close="handleWarningDetailDialogClose"
    >
      <div class="warning-detail-content">
        <!-- 查询条件 -->
        <div class="query-section">
          <el-form :inline="true" class="query-form">
            <el-form-item label="人员姓名:">
              <el-input
                v-model="warningDetailQueryParams.name"
                placeholder="请输入"
                size="small"
                style="width: 150px;"
                clearable
              ></el-input>
            </el-form-item>
            <el-form-item label="单位:">
              <el-select
                v-model="warningDetailQueryParams.unit"
                placeholder="请选择"
                size="small"
                style="width: 150px;"
                clearable
                filterable
              >
                <el-option label="云南电网有限责任公司" value="yunnan"></el-option>
                <el-option label="昆明供电局" value="kunming"></el-option>
                <el-option label="曲靖供电局" value="qujing"></el-option>
                <el-option label="玉溪供电局" value="yuxi"></el-option>
                <el-option label="红河供电局" value="honghe"></el-option>
                <el-option label="保山供电局" value="baoshan"></el-option>
                <el-option label="大理供电局" value="dali"></el-option>
                <el-option label="丽江供电局" value="lijiang"></el-option>
                <el-option label="普洱供电局" value="puer"></el-option>
                <el-option label="临沧供电局" value="lincang"></el-option>
                <el-option label="文山供电局" value="wenshan"></el-option>
                <el-option label="西双版纳供电局" value="xishuangbanna"></el-option>
                <el-option label="德宏供电局" value="dehong"></el-option>
                <el-option label="怒江供电局" value="nujiang"></el-option>
                <el-option label="迪庆供电局" value="diqing"></el-option>
                <el-option label="昭通供电局" value="zhaotong"></el-option>
                <el-option label="楚雄供电局" value="chuxiong"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围:">
              <el-date-picker
                v-model="warningDetailQueryParams.dateRange"
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
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleWarningDetailQuery">
                查询
              </el-button>
              <el-button icon="el-icon-refresh" size="small" @click="handleWarningDetailReset">
                重置
              </el-button>
              <el-button type="success" icon="el-icon-download" size="small" @click="handleWarningDetailExport">
                导出
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrapper">
          <el-table
            :data="warningDetailTableData"
            border
            stripe
            height="calc(100vh - 380px)"
            style="width: 100%;"
          >
            <el-table-column type="selection" width="50" align="center"></el-table-column>
            <el-table-column label="序号" width="60" align="center">
              <template slot-scope="scope">
                {{ (warningDetailCurrentPage - 1) * warningDetailPageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位名称" width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="department" label="部门" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="team" label="班组" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="name" label="姓名" width="100" align="center"></el-table-column>
            <el-table-column prop="abnormalType" label="异常类型" width="150" align="center">
              <template slot-scope="scope">
                <el-tag size="small" :type="getAbnormalTypeTag(scope.row.abnormalType)">
                  {{ scope.row.abnormalType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="warningCount" label="累计预警次数" width="120" align="center">
              <template slot-scope="scope">
                <span style="font-weight: bold; color: #F56C6C;">{{ scope.row.warningCount }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <span class="total-text">共 {{ warningDetailTotal }}条</span>
          <div class="page-size-selector">
            <span>每页显示：</span>
            <el-radio-group v-model="warningDetailPageSize" size="small" @change="handleWarningDetailSizeChange">
              <el-radio-button :label="10">10</el-radio-button>
              <el-radio-button :label="25">25</el-radio-button>
              <el-radio-button :label="50">50</el-radio-button>
            </el-radio-group>
            <span>条</span>
          </div>
          <el-pagination
            background
            layout="prev, pager, next, jumper"
            :total="warningDetailTotal"
            :page-size="warningDetailPageSize"
            :current-page="warningDetailCurrentPage"
            small
            @current-change="handleWarningDetailCurrentChange"
          ></el-pagination>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="warningDetailDialogVisible = false">返回</el-button>
      </div>
    </el-dialog>

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
import * as echarts from 'echarts';

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
      approvalRecords: [],

      // 台账信息相关数据
      ledgerQueryParams: {
        unit: '',
        department: '',
        team: '',
        abnormalType: '',
        name: '',
        status: '',
        dateRange: []
      },
      ledgerTableData: [],
      ledgerTotal: 0,
      ledgerPageSize: 25,
      ledgerCurrentPage: 1,
      selectedRows: [],

      // 预警查询相关数据
      warningQueryParams: {
        unit: '',
        department: '',
        team: '',
        abnormalType: '',
        name: '',
        status: '',
        dateRange: []
      },
      warningTableData: [],
      warningTotal: 0,
      warningPageSize: 25,
      warningCurrentPage: 1,
      
      // 图表实例
      pieChartInstance: null,
      barChartInstance: null,
      
      // 当前选中的异常类型（默认选中'迟到/早退'）
      selectedAbnormalType: '迟到/早退',
      
      // 各异常类型的月度数据
      monthlyDataByType: {
        '迟到/早退': [285, 250, 320, 310, 285],
        '在岗证据不足/冲突': [180, 200, 220, 190, 210],
        '旷工': [45, 50, 60, 55, 48],
        '请假超时': [30, 35, 40, 38, 42]
      },
      
      // 预警数据详情对话框
      warningDetailDialogVisible: false,
      warningDetailQueryParams: {
        name: '',
        unit: '',
        dateRange: []
      },
      warningDetailTableData: [],
      warningDetailTotal: 0,
      warningDetailPageSize: 25,
      warningDetailCurrentPage: 1
    };
  },
  created() {
    this.loadData();
    this.loadLedgerData();
    // 默认不加载预警数据，等用户切换到预警页签时再加载
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
        'legal': '法规部',
        'service': '综合服务中心',
        'union': '工会办'
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

    // 加载预警数据
    loadWarningData() {
      console.log('=== 开始加载预警数据 ===');
      console.log('查询参数:', this.warningQueryParams);
      
      // 模拟数据
      const mockDistributionData = [
        { value: 20, name: '迟到/早退' },
        { value: 30, name: '在岗证据不足/冲突' },
        { value: 40, name: '旷工' },
        { value: 10, name: '请假超时' }
      ];
      
      const mockLateData = [
        { month: '1月', count: 285 },
        { month: '2月', count: 250 },
        { month: '3月', count: 320 },
        { month: '4月', count: 310 },
        { month: '5月', count: 285 }
      ];
      
      this.warningTableData = mockDistributionData;
      this.warningTotal = mockLateData.reduce((sum, item) => sum + item.count, 0);
      
      // 延迟初始化图表，确保 DOM 已渲染
      this.$nextTick(() => {
        this.initPieChart();
        this.initBarChart();
      });
      
      this.$message.success('预警数据加载成功');
    },

    // 初始化环形图
    initPieChart() {
      if (!this.$refs.distributionChart) return;
      
      const chart = echarts.init(this.$refs.distributionChart);
      this.pieChartInstance = chart; // 保存实例
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: ['迟到/早退', '在岗证据不足/冲突', '旷工', '请假超时']
        },
        series: [
          {
            name: '异常数据分布',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}\n{d}%'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: true
            },
            data: [
              { value: 20, name: '迟到/早退', itemStyle: { color: '#5470C6' } },
              { value: 30, name: '在岗证据不足/冲突', itemStyle: { color: '#91CC75' } },
              { value: 40, name: '旷工', itemStyle: { color: '#FAC858' } },
              { value: 10, name: '请假超时', itemStyle: { color: '#EE6666' } }
            ]
          }
        ]
      };
      
      chart.setOption(option);
      
      // 添加点击事件监听
      chart.on('click', (params) => {
        console.log('点击了:', params.name);
        this.selectedAbnormalType = params.name;
        this.updateBarChart(params.name);
        this.$message.success(`已切换到【${params.name}】的月度数据`);
      });
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chart.resize();
      });
    },

    // 初始化柱状图
    initBarChart() {
      if (!this.$refs.lateBarChart) return;
      
      const chart = echarts.init(this.$refs.lateBarChart);
      this.barChartInstance = chart; // 保存实例
      
      // 根据当前选中的类型获取数据
      const currentData = this.monthlyDataByType[this.selectedAbnormalType] || [285, 250, 320, 310, 285];
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月'],
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            fontSize: 12,
            color: '#606266'
          }
        },
        yAxis: {
          type: 'value',
          max: 350,
          interval: 50,
          axisLabel: {
            fontSize: 12,
            color: '#606266'
          },
          splitLine: {
            lineStyle: {
              color: '#E4E7ED'
            }
          }
        },
        series: [
          {
            name: this.selectedAbnormalType,
            type: 'bar',
            barWidth: '50%',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#2378f7' },
                  { offset: 0.7, color: '#2378f7' },
                  { offset: 1, color: '#83bff6' }
                ])
              }
            },
            data: currentData
          }
        ]
      };
      
      chart.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chart.resize();
      });
    },

    // 更新柱状图（联动）
    updateBarChart(type) {
      if (!this.barChartInstance) return;
      
      const data = this.monthlyDataByType[type] || [285, 250, 320, 310, 285];
      
      // 根据不同类型设置不同的颜色
      let gradientColors;
      switch (type) {
        case '迟到/早退':
          gradientColors = ['#83bff6', '#188df0', '#188df0'];
          break;
        case '在岗证据不足/冲突':
          gradientColors = ['#a8e6cf', '#7bc97b', '#7bc97b'];
          break;
        case '旷工':
          gradientColors = ['#ffd3b6', '#ffaa80', '#ffaa80'];
          break;
        case '请假超时':
          gradientColors = ['#ffaaa5', '#ff6b6b', '#ff6b6b'];
          break;
        default:
          gradientColors = ['#83bff6', '#188df0', '#188df0'];
      }
      
      const option = {
        series: [
          {
            name: type,
            data: data,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: gradientColors[0] },
                { offset: 0.5, color: gradientColors[1] },
                { offset: 1, color: gradientColors[2] }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: gradientColors[1] },
                  { offset: 0.7, color: gradientColors[1] },
                  { offset: 1, color: gradientColors[0] }
                ])
              }
            }
          }
        ]
      };
      
      this.barChartInstance.setOption(option);
    },

    // ========== 台账信息相关方法 ==========

    // 加载台账数据
    loadLedgerData() {
      console.log('=== 开始加载台账数据 ===');
      console.log('查询参数:', this.ledgerQueryParams);
      
      // 模拟数据
      const mockData = [
        {
          id: 1,
          name: '张三',
          unit: '云南电网有限责任公司',
          department: '法规部',
          team: '班组1',
          abnormalType: 'late',
          abnormalTime: '2024-12-15',
          status: 'pending'
        },
        {
          id: 2,
          name: '李思',
          unit: '云南电网有限责任公司',
          department: '综合服务中心',
          team: '班组1',
          abnormalType: 'late',
          abnormalTime: '2024-12-15',
          status: 'awaiting'
        },
        {
          id: 3,
          name: '王武',
          unit: '云南电网有限责任公司',
          department: '综合服务中心',
          team: '班组1',
          abnormalType: 'late',
          abnormalTime: '2024-12-14',
          status: 'confirmed'
        },
        {
          id: 4,
          name: '王战',
          unit: '云南电网有限责任公司',
          department: '工会办',
          team: '班组1',
          abnormalType: 'late',
          abnormalTime: '2024-12-14',
          status: 'confirmed'
        }
      ];

      // 根据查询条件过滤
      let filtered = [...mockData];

      if (this.ledgerQueryParams.unit) {
        filtered = filtered.filter(item => 
          item.unit.includes(this.getUnitName(this.ledgerQueryParams.unit))
        );
      }

      if (this.ledgerQueryParams.department) {
        filtered = filtered.filter(item => 
          item.department.includes(this.getDepartmentName(this.ledgerQueryParams.department))
        );
      }

      if (this.ledgerQueryParams.name) {
        filtered = filtered.filter(item => 
          item.name.includes(this.ledgerQueryParams.name)
        );
      }

      if (this.ledgerQueryParams.abnormalType) {
        filtered = filtered.filter(item => item.abnormalType === this.ledgerQueryParams.abnormalType);
      }

      if (this.ledgerQueryParams.status) {
        filtered = filtered.filter(item => item.status === this.ledgerQueryParams.status);
      }

      this.ledgerTableData = filtered;
      this.ledgerTotal = filtered.length;
      
      console.log('台账数据加载完成');
      console.log('表格数据:', this.ledgerTableData);
      console.log('总数:', this.ledgerTotal);
      console.log('=== 台账数据加载结束 ===');
    },

    // 台账信息查询
    handleLedgerQuery() {
      this.ledgerCurrentPage = 1;
      this.loadLedgerData();
      this.$message.success('查询成功');
    },

    // 台账信息重置
    handleLedgerReset() {
      this.ledgerQueryParams = {
        unit: '',
        department: '',
        team: '',
        abnormalType: '',
        name: '',
        status: '',
        dateRange: []
      };
      this.ledgerCurrentPage = 1;
      this.loadLedgerData();
      this.$message.info('已重置查询条件');
    },

    // 台账信息导出
    handleLedgerExport() {
      if (this.ledgerTableData.length === 0) {
        this.$message.warning('没有可导出的数据');
        return;
      }

      // 构建导出数据
      const exportData = this.ledgerTableData.map((row, index) => ({
        '序号': (this.ledgerCurrentPage - 1) * this.ledgerPageSize + index + 1,
        '人员姓名': row.name,
        '单位': row.unit,
        '部门': row.department,
        '班组': row.team,
        '异常类型': this.getAbnormalTypeText(row.abnormalType),
        '异常时间': row.abnormalTime,
        '状态': this.getLedgerStatusText(row.status)
      }));

      // 使用 CSV 导出
      this.exportToCSV(exportData, `异常数据台账_${new Date().toISOString().slice(0, 10)}.csv`);

      this.$message.success(`成功导出 ${exportData.length} 条数据`);
    },

    // ========== 预警查询相关方法 ==========

    // 预警查询
    handleWarningQuery() {
      console.log('=== 开始预警查询 ===');
      console.log('查询参数:', this.warningQueryParams);
      
      // 重新加载图表数据
      this.loadWarningData();
    },

    // 预警重置
    handleWarningReset() {
      this.warningQueryParams = {
        unit: '',
        startDate: '',
        endDate: ''
      };
      this.loadWarningData();
      this.$message.info('已重置查询条件');
    },

    // 查看数据明细
    handleViewWarningDetail() {
      console.log('=== 查看预警数据详情 ===');
      console.log('当前选中类型:', this.selectedAbnormalType);
      
      this.warningDetailDialogVisible = true;
      this.warningDetailCurrentPage = 1;
      this.loadWarningDetailData();
    },

    // 加载预警详情数据
    loadWarningDetailData() {
      console.log('=== 开始加载预警详情数据 ===');
      console.log('查询参数:', this.warningDetailQueryParams);
      
      // 模拟数据 - 根据当前选中的异常类型生成对应数据
      const mockData = [
        { id: 1, unit: '曲靖供电局', department: '安监部', team: 'XX班组', name: '张三', abnormalType: this.selectedAbnormalType, warningCount: 23 },
        { id: 2, unit: '玉溪供电局', department: '财务部', team: 'XX班组', name: '李思', abnormalType: this.selectedAbnormalType, warningCount: 12 },
        { id: 3, unit: '昆明供电局', department: '安监部', team: 'XX班组', name: '王武', abnormalType: '在岗证据不足/冲突', warningCount: 8 },
        { id: 4, unit: '昆明供电局', department: '财务部', team: 'XX班组', name: '杜兰', abnormalType: '在岗证据不足/冲突', warningCount: 6 },
        { id: 5, unit: '昆明供电局', department: '安监部', team: 'XX班组', name: '李峰', abnormalType: '在岗证据不足/冲突', warningCount: 4 },
        { id: 6, unit: '昆明供电局', department: '财务部', team: 'XX班组', name: '张毅', abnormalType: '在岗证据不足/冲突', warningCount: 2 },
        { id: 7, unit: '昆明供电局', department: '办公室', team: 'XX班组', name: '张三', abnormalType: '请假超时', warningCount: 2 },
        { id: 8, unit: '红河供电局', department: '办公室', team: 'XX班组', name: '李思', abnormalType: '请假超时', warningCount: 2 },
        { id: 9, unit: '保山供电局', department: '办公室', team: 'XX班组', name: '王武', abnormalType: '请假超时', warningCount: 2 }
      ];
      
      // 根据查询条件过滤
      let filtered = [...mockData];
      
      if (this.warningDetailQueryParams.name) {
        filtered = filtered.filter(item => 
          item.name.includes(this.warningDetailQueryParams.name)
        );
      }
      
      if (this.warningDetailQueryParams.unit) {
        // 将value转换为显示名称进行匹配
        const unitMap = {
          'yunnan': '云南电网有限责任公司',
          'kunming': '昆明供电局',
          'qujing': '曲靖供电局',
          'yuxi': '玉溪供电局',
          'honghe': '红河供电局',
          'baoshan': '保山供电局',
          'dali': '大理供电局',
          'lijiang': '丽江供电局',
          'puer': '普洱供电局',
          'lincang': '临沧供电局',
          'wenshan': '文山供电局',
          'xishuangbanna': '西双版纳供电局',
          'dehong': '德宏供电局',
          'nujiang': '怒江供电局',
          'diqing': '迪庆供电局',
          'zhaotong': '昭通供电局',
          'chuxiong': '楚雄供电局'
        };
        const unitName = unitMap[this.warningDetailQueryParams.unit] || this.warningDetailQueryParams.unit;
        filtered = filtered.filter(item => 
          item.unit.includes(unitName)
        );
      }
      
      this.warningDetailTableData = filtered;
      this.warningDetailTotal = filtered.length;
      
      this.$message.success(`查询成功，共 ${filtered.length} 条数据`);
    },

    // 预警详情查询
    handleWarningDetailQuery() {
      this.warningDetailCurrentPage = 1;
      this.loadWarningDetailData();
    },

    // 预警详情重置
    handleWarningDetailReset() {
      this.warningDetailQueryParams = {
        name: '',
        unit: '',
        dateRange: []
      };
      this.warningDetailCurrentPage = 1;
      this.loadWarningDetailData();
      this.$message.info('已重置查询条件');
    },

    // 预警详情导出
    handleWarningDetailExport() {
      if (this.warningDetailTableData.length === 0) {
        this.$message.warning('没有可导出的数据');
        return;
      }

      // 构建导出数据
      const exportData = this.warningDetailTableData.map((row, index) => ({
        '序号': (this.warningDetailCurrentPage - 1) * this.warningDetailPageSize + index + 1,
        '单位名称': row.unit,
        '部门': row.department,
        '班组': row.team,
        '姓名': row.name,
        '异常类型': row.abnormalType,
        '累计预警次数': row.warningCount
      }));

      // 使用 CSV 导出
      this.exportToCSV(exportData, `预警数据详情_${this.selectedAbnormalType}_${new Date().toISOString().slice(0, 10)}.csv`);

      this.$message.success(`成功导出 ${exportData.length} 条数据`);
    },

    // 预警详情分页大小改变
    handleWarningDetailSizeChange(val) {
      this.warningDetailPageSize = val;
      this.loadWarningDetailData();
    },

    // 预警详情当前页改变
    handleWarningDetailCurrentChange(val) {
      this.warningDetailCurrentPage = val;
      this.loadWarningDetailData();
    },

    // 预警详情对话框关闭
    handleWarningDetailDialogClose() {
      console.log('=== 关闭预警数据详情对话框 ===');
      this.warningDetailQueryParams = {
        name: '',
        unit: '',
        dateRange: []
      };
      this.warningDetailTableData = [];
      this.warningDetailTotal = 0;
      this.warningDetailPageSize = 25;
      this.warningDetailCurrentPage = 1;
    },

    // 多选变化
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },

    // 台账分页大小改变
    handleLedgerSizeChange(val) {
      this.ledgerPageSize = val;
      this.loadLedgerData();
    },

    // 台账当前页改变
    handleLedgerCurrentChange(val) {
      this.ledgerCurrentPage = val;
      this.loadLedgerData();
    },

    // 获取异常类型标签
    getAbnormalTypeTag(type) {
      const typeMap = {
        'late': 'warning',
        'early_leave': 'danger',
        'absent': 'danger',
        'missing_card': 'info'
      };
      return typeMap[type] || 'info';
    },

    // 获取异常类型文本
    getAbnormalTypeText(type) {
      const textMap = {
        'late': '迟到',
        'early_leave': '早退',
        'absent': '旷工',
        'missing_card': '缺卡'
      };
      return textMap[type] || type;
    },

    // 获取台账状态标签类型
    getLedgerStatusType(status) {
      const typeMap = {
        'pending': 'warning',
        'awaiting': 'info',
        'confirmed': 'success'
      };
      return typeMap[status] || 'info';
    },

    // 获取台账状态文本
    getLedgerStatusText(status) {
      const textMap = {
        'pending': '待确认',
        'awaiting': '待审批',
        'confirmed': '已确认'
      };
      return textMap[status] || status;
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

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* 台账信息页签样式 */
.ledger-tab {
  display: flex;
  flex-direction: column;
}

.tab-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 台账信息页签样式 */
.ledger-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 可滚动内容容器 - 核心！*/
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 16px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.action-bar {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.table-container {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

/* 预警查询页签样式 */
.warning-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 图表容器 */
.charts-container {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

/* 图表面板 */
.chart-panel {
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  flex-shrink: 0;
}

.left-panel {
  flex: 1;
  min-width: 400px;
}

.right-panel {
  flex: 1.5;
  min-width: 500px;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-header i {
  font-size: 18px;
  color: #409EFF;
  margin-right: 8px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  flex: 1;
}

.link-text {
  font-size: 12px;
  color: #909399;
  cursor: pointer;
}

.detail-link {
  font-size: 12px;
  color: #409EFF;
  text-decoration: none;
}

.detail-link:hover {
  text-decoration: underline;
}

/* 左侧图表内容 */
.chart-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pie-chart {
  width: 100%;
  height: 300px;
}

/* 数据表格 */
.data-table {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: center;
  border: 1px solid #e4e7ed;
  font-size: 14px;
}

.data-table th {
  background-color: #f5f7fa;
  font-weight: bold;
  color: #606266;
}

.data-table td {
  color: #303133;
}

/* 右侧面板内容 */
.panel-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 黄色提示框 */
.alert-box {
  background-color: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  padding: 12px;
}

.alert-box p {
  margin: 0;
  font-size: 13px;
  color: #e6a23c;
  line-height: 1.6;
}

/* 统计说明 */
.stats-note {
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}

/* 柱状图包装器 */
.bar-chart-wrapper {
  margin-top: 16px;
}

.unit-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.bar-chart {
  width: 100%;
  height: 350px;
}

/* 预警数据详情对话框样式 */
.warning-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
