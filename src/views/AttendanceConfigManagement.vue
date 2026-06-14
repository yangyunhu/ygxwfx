<template>
  <div class="attendance-config-management">
    <!-- 顶部标签页 -->
    <el-tabs v-model="activeTab" class="page-tabs" @tab-click="handleTabClick">
      <el-tab-pane label="出勤数据计算模型" name="calculation"></el-tab-pane>
      <el-tab-pane label="异常预警配置" name="warning"></el-tab-pane>
      <el-tab-pane label="打卡人员设置" name="punch"></el-tab-pane>
    </el-tabs>

    <!-- 主内容区域 -->
    <div class="main-container">
      <!-- 出勤数据计算模型页签内容 -->
      <div v-if="activeTab === 'calculation'" class="tab-content calculation-tab">
        <!-- 二级标签页：无感考勤规则 / 班次设置 -->
        <el-tabs v-model="subActiveTab" class="sub-tabs" @tab-click="handleSubTabClick">
          <el-tab-pane label="无感考勤规则" name="rules"></el-tab-pane>
          <el-tab-pane label="班次设置" name="shift"></el-tab-pane>
        </el-tabs>

        <!-- 无感考勤规则内容 -->
        <div v-if="subActiveTab === 'rules'" class="sub-tab-content">
        <!-- 操作按钮栏 -->
        <div class="action-bar">
          <el-button type="info" icon="el-icon-info" size="small" @click="handleShowRules">
            规则说明
          </el-button>
          <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAdd">
            新增
          </el-button>
          <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDelete">
            删除
          </el-button>
          <el-button type="warning" icon="el-icon-setting" size="small" @click="handleEdit">
            修改
          </el-button>
          <el-button type="success" icon="el-icon-check" size="small" @click="handleSave">
            保存
          </el-button>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrapper">
          <el-table
            :data="tableData"
            border
            stripe
            style="width: 100%"
            height="calc(100vh - 320px)"
            @selection-change="handleSelectionChange"
          >
            <el-table-column 
              type="selection" 
              width="55" 
              align="center"
              :selectable="isRowSelectable"
            ></el-table-column>
            <el-table-column prop="order" label="校验顺序" width="100" align="center"></el-table-column>
            <el-table-column prop="adjustment" label="顺序调整" width="100" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.order <= 3" class="adjust-text">—</span>
                <div v-else class="adjust-buttons">
                  <el-button 
                    type="text" 
                    icon="el-icon-arrow-up" 
                    size="small"
                    @click="handleMoveUp(scope.$index)"
                    :disabled="isFirstMovableRow(scope.$index)"
                  ></el-button>
                  <el-button 
                    type="text" 
                    icon="el-icon-arrow-down" 
                    size="small"
                    @click="handleMoveDown(scope.$index)"
                    :disabled="isLastMovableRow(scope.$index)"
                  ></el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="dataSource" label="数据来源" min-width="200">
              <template slot-scope="scope">
                <el-select
                  v-if="scope.row.editable && scope.row.order >= 4"
                  v-model="scope.row.dataSource"
                  placeholder="请选择数据源"
                  size="small"
                  filterable
                  clearable
                  @change="handleDataSourceChange(scope.row)"
                >
                  <el-option
                    v-for="item in dataSourceOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
                <span v-else>{{ scope.row.dataSource }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="logic" label="实现逻辑" min-width="300">
              <template slot-scope="scope">
                <span class="logic-text">{{ scope.row.logic }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="result" label="结果运用" min-width="180">
              <template slot-scope="scope">
                <span class="result-text">{{ scope.row.result }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 班次设置区域已移至独立页签 -->
        </div>

        <!-- 班次设置内容 -->
        <div v-if="subActiveTab === 'shift'" class="sub-tab-content shift-layout">
          <!-- 左侧组织树 -->
          <aside class="left-org-tree">
            <!-- 搜索框 -->
            <div class="org-search-box">
              <el-input
                v-model="orgSearchKeyword"
                placeholder="请输入"
                prefix-icon="el-icon-search"
                size="small"
                clearable
              ></el-input>
            </div>
            
            <!-- 树容器 -->
            <div class="tree-scroll-area">
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
          <div class="right-shift-content">
            <!-- 顶部查询栏 -->
            <div class="top-query-bar">
              <el-form :inline="true" class="query-form-inline">
                <el-form-item label="考勤组:">
                  <el-input
                    v-model="shiftQueryParams.groupName"
                    placeholder="请输入"
                    size="small"
                    style="width: 180px;"
                    clearable
                  ></el-input>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="el-icon-search" size="small" @click="handleShiftQuery">
                    查询
                  </el-button>
                  <el-button icon="el-icon-refresh" size="small" @click="handleShiftReset">
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 中间操作按钮 -->
            <div class="middle-action-bar">
              <el-button type="primary" size="small" @click="handleShiftSave">
                保存
              </el-button>
              <el-button type="success" icon="el-icon-plus" size="small" @click="handleShiftAdd">
                新增
              </el-button>
            </div>

            <!-- 底部数据表格 -->
            <div class="bottom-table-area">
              <el-table
                :data="shiftTableData"
                border
                stripe
                style="width: 100%"
                height="calc(100vh - 380px)"
                @selection-change="handleShiftSelectionChange"
              >
                <el-table-column type="selection" width="55" align="center"></el-table-column>
                <el-table-column prop="order" label="序号" width="80" align="center"></el-table-column>
                <el-table-column prop="groupName" label="考勤组名称" min-width="150">
                  <template slot-scope="scope">
                    <span>{{ scope.row.groupName || '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="attendanceMode" label="出勤模式选择" min-width="150">
                  <template slot-scope="scope">
                    <span>{{ getAttendanceModeLabel(scope.row.attendanceMode) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="timeSetting" label="时间设置" min-width="150">
                  <template slot-scope="scope">
                    <span>{{ scope.row.timeSetting || '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="shift" label="班次" min-width="150">
                  <template slot-scope="scope">
                    <span>{{ scope.row.shift || '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                  <template slot-scope="scope">
                    <el-button 
                      type="text" 
                      size="small" 
                      icon="el-icon-edit"
                      @click="handleShiftEditRow(scope.row)"
                    >
                      修改
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <!-- 分页 -->
              <div class="pagination-wrapper">
                <el-pagination
                  @size-change="handleShiftSizeChange"
                  @current-change="handleShiftCurrentChange"
                  :current-page="shiftCurrentPage"
                  :page-sizes="[10, 25, 50]"
                  :page-size="shiftPageSize"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="shiftTotal"
                >
                </el-pagination>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 异常预警配置页签内容 -->
      <div v-if="activeTab === 'warning'" class="tab-content warning-tab">
        <!-- 标题栏 -->
        <div class="section-header">
          <span class="section-title">配置预警项</span>
          <span class="section-subtitle">（根据提供信息进行填写-备注信息提示）</span>
        </div>

        <!-- 操作按钮栏 -->
        <div class="action-bar">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="handleWarningAddRow">
            新增
          </el-button>
          <el-button type="primary" size="small" @click="handleWarningSave">
            保存
          </el-button>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrapper">
          <el-table
            :data="warningTableData"
            border
            stripe
            style="width: 100%"
            height="calc(100vh - 280px)"
            @selection-change="handleWarningSelectionChange"
          >
            <el-table-column 
              type="selection" 
              width="55" 
              align="center"
            ></el-table-column>
            <el-table-column prop="order" label="序号" width="80" align="center"></el-table-column>
            <el-table-column prop="warningType" label="预警数据类型" min-width="200">
              <template slot-scope="scope">
                <span>{{ scope.row.warningType }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="thresholdLower" label="阈值区间（下限）" min-width="200">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.thresholdLower"
                  placeholder="请输入"
                  size="small"
                ></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="thresholdUpper" label="阈值区间（上线）" min-width="200">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.thresholdUpper"
                  placeholder="请输入"
                  size="small"
                ></el-input>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag :type="scope.row.status === '启用' ? 'success' : 'info'" size="small">
                  {{ scope.row.status || '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" align="center">
              <template slot-scope="scope">
                <el-button 
                  type="text" 
                  size="small" 
                  icon="el-icon-check"
                  @click="handleWarningEnableRow(scope.row)"
                >
                  启用
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  icon="el-icon-close"
                  @click="handleWarningDisableRow(scope.row)"
                >
                  停用
                </el-button>
                <el-button 
                  type="text" 
                  size="small" 
                  icon="el-icon-delete"
                  style="color: #f56c6c;"
                  @click="handleWarningDeleteRow(scope.row, scope.$index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>


      </div>

      <!-- 打卡人员设置页签内容 -->
      <div v-if="activeTab === 'punch'" class="tab-content punch-tab">
        <!-- 查询栏 -->
        <div class="query-bar">
          <el-form :inline="true" size="small">
            <el-form-item label="姓名：">
              <el-input
                v-model="punchQueryParams.name"
                placeholder="请输入"
                clearable
                style="width: 200px;"
              ></el-input>
            </el-form-item>
            
            <el-form-item label="月份：">
              <el-select
                v-model="punchQueryParams.month"
                placeholder="请选择"
                clearable
                style="width: 200px;"
              >
                <el-option label="2025-04" value="2025-04"></el-option>
                <el-option label="2025-03" value="2025-03"></el-option>
                <el-option label="2025-02" value="2025-02"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="数据类型：">
              <el-select
                v-model="punchQueryParams.dataType"
                placeholder="请选择"
                clearable
                style="width: 200px;"
              >
                <el-option label="全部" value="all"></el-option>
                <el-option label="正常打卡" value="normal"></el-option>
                <el-option label="异常打卡" value="abnormal"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="状态：">
              <el-select
                v-model="punchQueryParams.status"
                placeholder="请选择"
                clearable
                style="width: 200px;"
              >
                <el-option label="全部" value="all"></el-option>
                <el-option label="正在打卡" value="punching"></el-option>
                <el-option label="已结束" value="ended"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handlePunchQuery">
                查询
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 操作按钮栏 -->
        <div class="action-bar">
          <el-button type="primary" size="small" @click="handlePunchAdd">
            新增人员
          </el-button>
          <el-button type="primary" size="small" @click="handlePunchBatchSet">
            批量设置
          </el-button>
          <el-button type="primary" size="small" @click="handlePunchBatchCancel">
            批量取消
          </el-button>
        </div>

        <!-- 数据表格 -->
        <div class="table-wrapper">
          <el-table
            :data="punchTableData"
            border
            stripe
            style="width: 100%"
            height="calc(100vh - 380px)"
            @selection-change="handlePunchSelectionChange"
          >
            <el-table-column 
              type="selection" 
              width="55" 
              align="center"
            ></el-table-column>
            <el-table-column prop="order" label="序号" width="80" align="center"></el-table-column>
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
            <el-table-column prop="name" label="姓名" min-width="100">
              <template slot-scope="scope">
                <span>{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag 
                  :type="scope.row.status === '强制打卡' ? 'danger' : (scope.row.status === '已结束' ? 'success' : 'info')" 
                  size="small"
                >
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="timeRange" label="打卡时间" min-width="200">
              <template slot-scope="scope">
                <span>{{ scope.row.timeRange }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center">
              <template slot-scope="scope">
                <el-button 
                  type="text" 
                  size="small"
                  @click="handlePunchCancelLimit(scope.row)"
                >
                  取消打卡限制
                </el-button>
                <el-button 
                  type="text" 
                  size="small"
                  @click="handlePunchViewDetail(scope.row)"
                >
                  查看打卡情况
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            @size-change="handlePunchSizeChange"
            @current-change="handlePunchCurrentChange"
            :current-page="punchCurrentPage"
            :page-sizes="[10, 25, 50]"
            :page-size="punchPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="punchTotal"
          >
          </el-pagination>
        </div>
      </div>
    </div>
    <!-- 规则说明对话框 -->
    <el-dialog
      title="出勤配置管理规则说明"
      :visible.sync="rulesDialogVisible"
      width="60%"
      top="10vh"
    >
      <div class="rules-content">
        <h4>一、适用范围</h4>
        <p>本页面适用于二级单位、三级单位（含四级单位）管理员进行考勤配置管理。</p>
        
        <h4>二、校验规则</h4>
        <ul>
          <li><strong>强制校验项（序号1-3）：</strong>系统内置的强制校验顺序，不可在此页面进行增删改操作</li>
          <li><strong>可选校验项（序号4及以后）：</strong>至少需要选择一条数据进行校验</li>
          <li><strong>完整配置要求：</strong>必须满足“1-3强制校验 + 至少1条可选校验”的组合方式，才能生成完整的考勤数据</li>
        </ul>
        
        <h4>三、操作说明</h4>
        <ul>
          <li><strong>新增：</strong>点击新增按钮，列表自动增加一行可配置的数据项</li>
          <li><strong>删除：</strong>可选择并删除序号4及以后的自定义数据项</li>
          <li><strong>修改：</strong>可选择一条数据进行修改配置</li>
          <li><strong>保存：</strong>修改后页面会自动保存，也可手动点击保存按钮进行保存</li>
        </ul>
        
        <h4>四、数据来源配置</h4>
        <p>序号4及以后的数据项，可通过下拉选择器配置数据来源，数据源来自于“非业务模块”的数据源配置信息。</p>
        
        <h4>五、系统校验</h4>
        <p>系统会自动校验配置是否满足“1-3强制+至少1条可选”的要求，如不满足将弹出提示：“配置内容不满足要求”。</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="rulesDialogVisible = false">我知道了</el-button>
      </div>
    </el-dialog>

    <!-- 班次设置编辑对话框 -->
    <el-dialog
      :title="shiftEditType === 'add' ? '新增考勤组' : '修改考勤组'"
      :visible.sync="shiftEditDialogVisible"
      width="50%"
      top="10vh"
      @close="handleShiftEditDialogClose"
    >
      <el-form :model="shiftEditForm" label-width="120px" size="small">
        <el-form-item label="序号：">
          <span>{{ shiftEditForm.order }}</span>
        </el-form-item>
        
        <el-form-item label="考勤组名称：" required>
          <el-input
            v-model="shiftEditForm.groupName"
            placeholder="请输入考勤组名称"
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        
        <el-form-item label="出勤模式选择：" required>
          <el-select
            v-model="shiftEditForm.attendanceMode"
            placeholder="请选择出勤模式"
            style="width: 100%;"
          >
            <el-option label="业务班" value="business"></el-option>
            <el-option label="行政班" value="admin"></el-option>
            <el-option label="轮值班" value="rotation"></el-option>
            <el-option label="弹性班" value="flexible"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="时间设置：">
          <el-time-picker
            v-model="shiftEditForm.timeSetting"
            placeholder="请选择时间"
            value-format="HH:mm"
            format="HH:mm"
            style="width: 100%;"
          >
          </el-time-picker>
        </el-form-item>
        
        <el-form-item label="班次：">
          <el-input
            v-model="shiftEditForm.shift"
            placeholder="请输入班次（如：早班、晚班）"
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="shiftEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleShiftEditSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 异常预警配置新增对话框 -->
    <el-dialog
      title="新增预警项"
      :visible.sync="warningAddDialogVisible"
      width="50%"
      top="10vh"
      @close="handleWarningAddDialogClose"
    >
      <el-form :model="warningAddForm" label-width="120px" size="small">
        <el-form-item label="序号：">
          <span>{{ warningAddForm.order }}</span>
        </el-form-item>
        
        <el-form-item label="预警数据类型：" required>
          <el-input
            v-model="warningAddForm.warningType"
            placeholder="请输入预警数据类型"
            maxlength="50"
            show-word-limit
          ></el-input>
        </el-form-item>
        
        <el-form-item label="阈值区间（下限）：">
          <el-input
            v-model="warningAddForm.thresholdLower"
            placeholder="请输入下限值"
            maxlength="50"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="阈值区间（上线）：">
          <el-input
            v-model="warningAddForm.thresholdUpper"
            placeholder="请输入上限值"
            maxlength="50"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="状态：">
          <el-tag type="info" size="small">停用</el-tag>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="warningAddDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleWarningAddSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 打卡人员设置新增对话框 -->
    <el-dialog
      title="新增人员"
      :visible.sync="punchAddDialogVisible"
      width="60%"
      top="10vh"
      @close="handlePunchAddDialogClose"
    >
      <el-form :model="punchAddForm" label-width="120px" size="small">
        <el-form-item label="选择人员：" required>
          <el-select
            v-model="punchAddForm.selectedPerson"
            placeholder="请选择人员"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="person in personOptions"
              :key="person.value"
              :label="person.label"
              :value="person.value"
            >
              <span style="float: left;">{{ person.label }}</span>
              <span style="float: right; color: #909399; font-size: 12px;">
                {{ person.unit }} / {{ person.department }} / {{ person.attendanceGroup }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="强制打卡时间段：" required>
          <div style="display: flex; align-items: center; width: 100%;">
            <el-date-picker
              v-model="punchAddForm.startTime"
              type="datetime"
              placeholder="选择开始时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              format="yyyy-MM-dd HH:mm:ss"
              style="width: calc(50% - 20px);"
            >
            </el-date-picker>
            <span style="margin: 0 10px; white-space: nowrap;">至</span>
            <el-date-picker
              v-model="punchAddForm.endTime"
              type="datetime"
              placeholder="选择结束时间"
              value-format="yyyy-MM-dd HH:mm:ss"
              format="yyyy-MM-dd HH:mm:ss"
              style="width: calc(50% - 20px);"
            >
            </el-date-picker>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="punchAddDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePunchAddSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "AttendanceConfigManagement",
  data() {
    return {
      activeTab: "calculation",
      subActiveTab: "rules",  // 二级页签默认激活无感考勤规则
      rulesDialogVisible: false,
      dataSourceOptions: [
        { label: '南网智学培训数据', value: 'training' },
        { label: '商旅通出差数据', value: 'business_trip' },
        { label: '人资域休假台账数据闸机', value: 'vacation_gate' },
        { label: '门禁数据闸机', value: 'access_gate' },
        { label: '门禁数据数认平台登录记录', value: 'access_login' },
        { label: 'elink登录记录数认平台登录记录', value: 'elink_login' },
        { label: 'elink登录记录', value: 'elink' },
        { label: '/', value: '/' }
      ],
      
      // 组织树相关
      orgSearchKeyword: '',
      treeProps: {
        label: 'label',
        children: 'children'
      },
      orgTreeData: [],
      selectedOrg: '',
      
      // 班次设置相关
      shiftQueryParams: {
        groupName: ''
      },
      shiftEditDialogVisible: false,  // 编辑对话框显示状态
      shiftEditForm: {                // 编辑表单数据
        order: 0,
        groupName: '',
        attendanceMode: '',
        timeSetting: '',              // 单个时间点 HH:mm
        shift: ''
      },
      shiftEditType: 'add',           // 编辑类型：'add' 或 'edit'
      shiftTableData: [
        {
          order: 1,
          groupName: 'XXXXX',
          attendanceMode: 'business',
          timeSetting: '',
          shift: ''
        },
        {
          order: 2,
          groupName: 'XXXXX',
          attendanceMode: 'admin',
          timeSetting: '',
          shift: ''
        },
        {
          order: 3,
          groupName: '',
          attendanceMode: '',
          timeSetting: '',
          shift: ''
        },
        {
          order: 4,
          groupName: '',
          attendanceMode: '',
          timeSetting: '',
          shift: ''
        }
      ],
      shiftSelectedRows: [],
      shiftTotal: 100,
      shiftPageSize: 25,
      shiftCurrentPage: 1,
      
      // 打卡人员设置相关
      punchQueryParams: {                 // 查询参数
        name: '',
        month: '',
        dataType: '',
        status: ''
      },
      punchAddDialogVisible: false,       // 新增人员对话框显示状态
      punchAddForm: {                     // 新增人员表单数据
        selectedPerson: '',               // 选择的人员
        startTime: '',                    // 强制打卡开始时间
        endTime: ''                       // 强制打卡结束时间
      },
      personOptions: [                    // 人员选项列表
        { label: '张三', value: 'zhangsan', unit: '某某集团公司', department: '人力资源部', attendanceGroup: '行政班' },
        { label: '李四', value: 'lisi', unit: '某某集团公司', department: '技术部', attendanceGroup: '研发班' },
        { label: '王二', value: 'wanger', unit: '某某分公司', department: '财务部', attendanceGroup: '财务班' },
        { label: '赵五', value: 'zhaowu', unit: '某某分公司', department: '市场部', attendanceGroup: '市场班' },
        { label: '钱六', value: 'qianliu', unit: '某某子公司', department: '生产部', attendanceGroup: '生产班' }
      ],
      punchTableData: [                   // 表格数据
        {
          order: 1,
          unit: '单位名称',
          department: '部门名称',
          name: '张三',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 2,
          unit: '单位名称',
          department: '部门名称',
          name: '李四',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 3,
          unit: '单位名称',
          department: '部门名称',
          name: '王二',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 4,
          unit: '单位名称',
          department: '部门名称',
          name: '张三',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 5,
          unit: '单位名称',
          department: '部门名称',
          name: '李四',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 6,
          unit: '单位名称',
          department: '部门名称',
          name: '张三',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 7,
          unit: '单位名称',
          department: '部门名称',
          name: '李四',
          status: '强制打卡',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 8,
          unit: '单位名称',
          department: '部门名称',
          name: '王二',
          status: '已结束',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 9,
          unit: '单位名称',
          department: '部门名称',
          name: '张三',
          status: '已结束',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        },
        {
          order: 10,
          unit: '单位名称',
          department: '部门名称',
          name: '李四',
          status: '已结束',
          timeRange: '2025-4-16 09:00 ~ 2025-4-19 18:00'
        }
      ],
      punchSelectedRows: [],
      punchTotal: 100,
      punchPageSize: 25,
      punchCurrentPage: 1,
      
      // 异常预警配置相关
      warningAddDialogVisible: false,       // 新增对话框显示状态
      warningAddForm: {                     // 新增表单数据
        order: 0,
        warningType: '',
        thresholdLower: '',
        thresholdUpper: '',
        status: '停用'
      },
      warningTableData: [
        {
          order: 1,
          warningType: '在岗证据冲突',
          thresholdLower: '',
          thresholdUpper: '',
          status: '停用'
        },
        {
          order: 2,
          warningType: '迟到',
          thresholdLower: '',
          thresholdUpper: '',
          status: '停用'
        },
        {
          order: 3,
          warningType: '早退',
          thresholdLower: '',
          thresholdUpper: '',
          status: '停用'
        },
        {
          order: 4,
          warningType: '在岗证据不足',
          thresholdLower: '',
          thresholdUpper: '',
          status: '停用'
        },
        {
          order: 5,
          warningType: '旷工',
          thresholdLower: '',
          thresholdUpper: '',
          status: '停用'
        }
      ],
      warningSelectedRows: [],
      
      tableData: [
        {
          order: 1,
          adjustment: "—",
          dataSource: "南网智学培训数据",
          logic: "获取南网智学培训记录页面的培训时间和学员名单...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 2,
          adjustment: "—",
          dataSource: "商旅通出差数据",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 3,
          adjustment: "—",
          dataSource: "人资域休假台账数据闸机",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 4,
          adjustment: "↑↓",
          dataSource: "门禁数据闸机",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 5,
          adjustment: "↑↓",
          dataSource: "门禁数据闸机",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 6,
          adjustment: "↑↓",
          dataSource: "门禁数据数认平台登录记录",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 7,
          adjustment: "↑↓",
          dataSource: "elink登录记录数认平台登录记录",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 8,
          adjustment: "↑↓",
          dataSource: "elink登录记录",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        },
        {
          order: 9,
          adjustment: "↑↓",
          dataSource: "/",
          logic: "... ...",
          result: "输出至无感考勤表",
          editable: false
        }
      ],
      selectedRows: []
    };
  },
  created() {
    this.loadOrgTree();
  },
  computed: {
    // 递归过滤树节点
    filteredOrgTree() {
      const kw = (this.orgSearchKeyword || '').trim();
      if (!kw) return this.orgTreeData;
      
      const filter = (nodes) =>
        nodes
          .map((n) => {
            const children = n.children ? filter(n.children) : [];
            const match = (n.label || '').includes(kw);
            
            // 如果当前节点匹配或有子节点匹配，则保留
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
    }
  },
  methods: {
    // 标签页切换
    handleTabClick(tab) {
      console.log("切换一级标签页:", tab.name);
    },

    // 二级标签页切换
    handleSubTabClick(tab) {
      console.log("切换二级标签页:", tab.name);
      
      // 切换到班次设置时，加载组织树数据
      if (tab.name === 'shift') {
        this.$nextTick(() => {
          this.loadShiftData();
        });
      }
    },

    // 判断行是否可选择（序号1-3不可选择）
    isRowSelectable(row) {
      return row.order > 3;
    },

    // 判断是否是第一个可移动的行（序号4或数组中第一个order>3的行）
    isFirstMovableRow(index) {
      if (index === 0) return true; // 第一行不能上移
      
      // 找到前面最近的 order > 3 的行
      for (let i = index - 1; i >= 0; i--) {
        if (this.tableData[i].order > 3) {
          return false; // 前面有可移动的行，可以上移
        }
      }
      return true; // 前面没有可移动的行，不能上移
    },

    // 判断是否是最后一个可移动的行
    isLastMovableRow(index) {
      if (index === this.tableData.length - 1) return true; // 最后一行不能下移
      
      // 找到后面最近的 order > 3 的行
      for (let i = index + 1; i < this.tableData.length; i++) {
        if (this.tableData[i].order > 3) {
          return false; // 后面有可移动的行，可以下移
        }
      }
      return true; // 后面没有可移动的行，不能下移
    },

    // 上移
    handleMoveUp(index) {
      const currentRow = this.tableData[index];
      
      // 如果当前行是前3条，不允许移动
      if (currentRow.order <= 3) {
        this.$message.warning("前3条为强制项，不可调整顺序！");
        return;
      }
      
      // 找到上一个可移动的行
      let prevIndex = -1;
      for (let i = index - 1; i >= 0; i--) {
        if (this.tableData[i].order > 3) {
          prevIndex = i;
          break;
        }
      }
      
      if (prevIndex === -1) {
        this.$message.warning("已经是第一个可调整顺序的项了！");
        return;
      }
      
      // 交换两行的位置
      const temp = this.tableData[index];
      this.$set(this.tableData, index, this.tableData[prevIndex]);
      this.$set(this.tableData, prevIndex, temp);
      
      // 重新计算序号
      this.recalculateOrders();
      
      this.$message.success("已上移");
    },

    // 下移
    handleMoveDown(index) {
      const currentRow = this.tableData[index];
      
      // 如果当前行是前3条，不允许移动
      if (currentRow.order <= 3) {
        this.$message.warning("前3条为强制项，不可调整顺序！");
        return;
      }
      
      // 找到下一个可移动的行
      let nextIndex = -1;
      for (let i = index + 1; i < this.tableData.length; i++) {
        if (this.tableData[i].order > 3) {
          nextIndex = i;
          break;
        }
      }
      
      if (nextIndex === -1) {
        this.$message.warning("已经是最后一个可调整顺序的项了！");
        return;
      }
      
      // 交换两行的位置
      const temp = this.tableData[index];
      this.$set(this.tableData, index, this.tableData[nextIndex]);
      this.$set(this.tableData, nextIndex, temp);
      
      // 重新计算序号
      this.recalculateOrders();
      
      this.$message.success("已下移");
    },

    // 重新计算序号（保持前3条不变，只调整4及以后的）
    recalculateOrders() {
      let newOrder = 4;
      this.tableData.forEach((row) => {
        if (row.order >= 4) {
          row.order = newOrder++;
        }
      });
    },

    // 新增
    handleAdd() {
      console.log('=== 新增配置项 ===');
      
      // 计算新的序号（从4开始）
      const maxOrder = this.tableData.length > 0 
        ? Math.max(...this.tableData.map(item => item.order)) 
        : 3;
      const newOrder = maxOrder + 1;
      
      // 添加新行
      const newRow = {
        order: newOrder,
        adjustment: '↑↓',
        dataSource: '',
        logic: '... ...',
        result: '输出至无感考勤表',
        editable: true
      };
      
      this.tableData.push(newRow);
      this.$message.success(`已新增第 ${newOrder} 条配置项，请配置数据来源`);
      
      // 自动滚动到表格底部
      this.$nextTick(() => {
        const table = this.$el.querySelector('.el-table__body-wrapper');
        if (table) {
          table.scrollTop = table.scrollHeight;
        }
      });
    },

    // 删除
    handleDelete() {
      if (this.selectedRows.length === 0) {
        this.$message.warning("请先选择要删除的数据");
        return;
      }
      
      // 检查是否有强制校验项（序号1-3）被选中
      const forcedItems = this.selectedRows.filter(row => row.order <= 3);
      if (forcedItems.length > 0) {
        const orders = forcedItems.map(row => row.order).join('、');
        this.$message.error(`序号${orders}为强制校验项，不可删除！`);
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 条数据吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          // 过滤掉选中的行
          const selectedOrders = this.selectedRows.map(row => row.order);
          this.tableData = this.tableData.filter(row => !selectedOrders.includes(row.order));
          
          // 重新排序序号（只调整序号4及以后的）
          let newOrder = 4;
          this.tableData.forEach((row) => {
            if (row.order >= 4) {
              row.order = newOrder++;
            }
          });
          
          this.$message.success("删除成功");
          this.validateConfig(); // 删除后自动校验
        })
        .catch(() => {});
    },

    // 修改
    handleEdit() {
      if (this.selectedRows.length !== 1) {
        this.$message.warning("请选择一条数据进行修改");
        return;
      }
      
      const selectedRow = this.selectedRows[0];
      
      // 检查是否为强制校验项
      if (selectedRow.order <= 3) {
        this.$message.warning("序号1-3为强制校验项，不可修改！");
        return;
      }
      
      // 设置为可编辑状态
      this.$set(selectedRow, 'editable', true);
      this.$message.info("已进入编辑模式，请修改数据来源");
    },

    // 保存
    handleSave() {
      console.log('=== 手动保存配置 ===');
      
      // 先进行校验
      if (!this.validateConfig()) {
        return;
      }
      
      // 模拟保存操作
      this.$message.success("保存成功");
      
      // 这里可以调用后端 API 保存配置
      // this.saveConfigToBackend();
    },

    // 显示规则说明
    handleShowRules() {
      this.rulesDialogVisible = true;
    },

    // 数据源变化处理
    handleDataSourceChange(row) {
      console.log('数据源变更:', row);
      // 数据源变更后自动保存
      this.autoSaveConfig();
    },

    // 自动保存配置
    autoSaveConfig() {
      console.log('=== 自动保存配置 ===');
      
      // 先进行校验
      if (!this.validateConfig()) {
        return;
      }
      
      // 模拟自动保存
      this.$message({
        message: '配置已自动保存',
        type: 'success',
        duration: 1500
      });
      
      // 这里可以调用后端 API 保存配置
      // this.saveConfigToBackend();
    },

    // 校验配置是否满足要求
    validateConfig() {
      console.log('=== 开始校验配置 ===');
      
      // 检查是否存在序号1-3的强制校验项
      const forcedItems = this.tableData.filter(row => row.order <= 3);
      if (forcedItems.length < 3) {
        this.$alert('配置内容不满足要求', '系统提示', {
          confirmButtonText: '确定',
          type: 'error'
        });
        return false;
      }
      
      // 检查序号4及以后是否至少有一条数据
      const optionalItems = this.tableData.filter(row => row.order >= 4);
      if (optionalItems.length === 0) {
        this.$alert('配置内容不满足要求', '系统提示', {
          confirmButtonText: '确定',
          type: 'error'
        });
        return false;
      }
      
      // 检查可选项是否都配置了数据源
      const unconfiguredItems = optionalItems.filter(row => !row.dataSource || row.dataSource.trim() === '');
      if (unconfiguredItems.length > 0) {
        this.$alert('配置内容不满足要求', '系统提示', {
          confirmButtonText: '确定',
          type: 'error'
        });
        return false;
      }
      
      console.log('✓ 配置校验通过');
      return true;
    },

    // 选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },
    
    // ========== 组织树相关方法 ==========
        
    // 加载组织架构树（模拟数据）
    loadOrgTree() {
      this.orgTreeData = [
        {
          id: 1,
          label: '云南电网有限责任公司',
          icon: 'el-icon-s-grid',
          children: [
            {
              id: 2,
              label: '昆明供电局',
              icon: 'el-icon-office-building',
              children: [
                { id: 21, label: '安监部', icon: 'el-icon-folder' },
                { id: 22, label: '财务部', icon: 'el-icon-folder' }
              ]
            },
            {
              id: 3,
              label: '曲靖供电局',
              icon: 'el-icon-office-building',
              children: [
                { id: 31, label: '安监部', icon: 'el-icon-folder' },
                { id: 32, label: '财务部', icon: 'el-icon-folder' }
              ]
            },
            {
              id: 4,
              label: '玉溪供电局',
              icon: 'el-icon-office-building',
              children: [
                { id: 41, label: '安监部', icon: 'el-icon-folder' },
                { id: 42, label: '财务部', icon: 'el-icon-folder' }
              ]
            }
          ]
        }
      ];
    },

    // 点击组织节点
    handleOrgClick(data) {
      // 根节点不设置筛选条件
      this.selectedOrg = data.id === 1 ? '' : data.label;
      
      console.log('选中的组织:', this.selectedOrg);
      
      // 根据选中的组织重新加载右侧数据
      this.loadShiftData();
    },
    
    // 重置组织树选择
    resetOrgSelection() {
      this.selectedOrg = '';
      if (this.$refs.orgTree) {
        this.$refs.orgTree.setCurrentKey(null);
      }
    },
    
    // ========== 班次设置相关方法 ==========
    
    // 获取出勤模式标签
    getAttendanceModeLabel(value) {
      const modeMap = {
        'business': '业务班',
        'admin': '行政班',
        'rotation': '轮值班',
        'flexible': '弹性班'
      };
      return modeMap[value] || '-';
    },
    
    // 加载班次数据
    loadShiftData() {
      console.log('=== 加载班次数据 ===');
      console.log('选中组织:', this.selectedOrg);
      console.log('查询参数:', this.shiftQueryParams);
          
      // 这里可以根据 selectedOrg 和 shiftQueryParams 调用后端 API
      // 目前使用模拟数据
    },
    
    // 班次查询
    handleShiftQuery() {
      console.log('=== 班次查询 ===');
      console.log('查询参数:', this.shiftQueryParams);
      this.loadShiftData();
      this.$message.success('查询成功');
    },
    
    // 班次重置
    handleShiftReset() {
      this.shiftQueryParams.groupName = '';
      this.resetOrgSelection();
      this.loadShiftData();
      this.$message.info('已重置查询条件');
    },
    
    // 班次保存
    handleShiftSave() {
      console.log('=== 班次保存 ===');
      
      // 验证必填字段
      const emptyRows = this.shiftTableData.filter(row => 
        !row.groupName || !row.groupName.trim()
      );
      
      if (emptyRows.length > 0) {
        this.$message.warning('请确保所有考勤组都已填写完整后再保存');
        return;
      }
      
      // 这里可以调用后端 API 保存数据
      console.log('保存的数据:', this.shiftTableData);
      
      this.$message.success('保存成功');
    },
    
    // 班次修改（通过选择框）
    handleShiftEdit() {
      if (this.shiftSelectedRows.length !== 1) {
        this.$message.warning("请选择一条数据进行修改");
        return;
      }
          
      const selectedRow = this.shiftSelectedRows[0];
      this.handleShiftEditRow(selectedRow);
    },

    // 班次修改（通过操作列按钮）
    handleShiftEditRow(row) {
      // 填充表单数据
      this.shiftEditForm = {
        order: row.order,
        groupName: row.groupName || '',
        attendanceMode: row.attendanceMode || '',
        timeSetting: row.timeSetting || '',
        shift: row.shift || ''
      };
      
      // 设置编辑类型为修改
      this.shiftEditType = 'edit';
      
      // 打开对话框
      this.shiftEditDialogVisible = true;
    },
    
    // 班次新增
    handleShiftAdd() {
      console.log('=== 班次新增 ===');
      
      // 获取当前最大序号
      const maxOrder = this.shiftTableData.length > 0 
        ? Math.max(...this.shiftTableData.map(item => item.order)) : 0;
      const newOrder = maxOrder + 1;
      
      // 重置表单数据
      this.shiftEditForm = {
        order: newOrder,
        groupName: '',
        attendanceMode: '',
        timeSetting: '',
        shift: ''
      };
      
      // 设置编辑类型为新增
      this.shiftEditType = 'add';
      
      // 打开对话框
      this.shiftEditDialogVisible = true;
    },
    
    // 班次表格选择变化
    handleShiftSelectionChange(selection) {
      this.shiftSelectedRows = selection;
    },

    // 班次每页条数变化
    handleShiftSizeChange(val) {
      console.log('=== 每页显示条数变化 ===');
      console.log('新值:', val);
      this.shiftPageSize = val;
      this.shiftCurrentPage = 1; // 重置为第一页
      this.loadShiftData();
    },

    // 班次当前页变化
    handleShiftCurrentChange(val) {
      console.log('=== 当前页变化 ===');
      console.log('新页码:', val);
      this.shiftCurrentPage = val;
      this.loadShiftData();
    },

    // 编辑对话框关闭
    handleShiftEditDialogClose() {
      // 重置表单数据
      this.shiftEditForm = {
        order: 0,
        groupName: '',
        attendanceMode: '',
        timeSetting: '',              // 单个时间点 HH:mm
        shift: ''
      };
      this.shiftEditType = 'add';
    },

    // 编辑对话框提交
    handleShiftEditSubmit() {
      // 验证必填字段
      if (!this.shiftEditForm.groupName || !this.shiftEditForm.groupName.trim()) {
        this.$message.warning('请填写考勤组名称');
        return;
      }
      
      if (!this.shiftEditForm.attendanceMode) {
        this.$message.warning('请选择出勤模式');
        return;
      }
      
      if (this.shiftEditType === 'add') {
        // 新增逻辑
        const newRow = {
          ...this.shiftEditForm,
          editable: false
        };
        this.shiftTableData.push(newRow);
        this.$message.success(`已新增第 ${newRow.order} 条考勤组配置`);
      } else {
        // 修改逻辑
        const index = this.shiftTableData.findIndex(row => row.order === this.shiftEditForm.order);
        if (index !== -1) {
          this.$set(this.shiftTableData[index], 'groupName', this.shiftEditForm.groupName);
          this.$set(this.shiftTableData[index], 'attendanceMode', this.shiftEditForm.attendanceMode);
          this.$set(this.shiftTableData[index], 'timeSetting', this.shiftEditForm.timeSetting);
          this.$set(this.shiftTableData[index], 'shift', this.shiftEditForm.shift);
          this.$message.success('修改成功');
        }
      }
      
      // 关闭对话框
      this.shiftEditDialogVisible = false;
    },

    // ==================== 异常预警配置相关方法 ====================

    // 返回（预留功能）
    handleWarningBack() {
      console.log('=== 异常预警配置-返回 ===');
      // 这里可以添加返回上一页的逻辑
    },

    // 保存
    handleWarningSave() {
      console.log('=== 异常预警配置-保存 ===');
      
      // 验证阈值区间是否填写完整
      const emptyRows = this.warningTableData.filter(row => 
        !row.thresholdLower && !row.thresholdUpper
      );
      
      if (emptyRows.length > 0) {
        this.$message.warning('请确保所有预警项的阈值区间都已填写完整后再保存');
        return;
      }
      
      // 模拟保存操作
      console.log('保存的数据:', this.warningTableData);
      this.$message.success('保存成功');
    },

    // 启用
    handleWarningEnable() {
      console.log('=== 异常预警配置-启用 ===');
      
      if (this.warningSelectedRows.length === 0) {
        this.$message.warning('请先选择要启用的预警项');
        return;
      }
      
      // 模拟启用操作
      console.log('启用的数据:', this.warningSelectedRows);
      this.$message.success(`已启用 ${this.warningSelectedRows.length} 个预警项`);
    },

    // 停用
    handleWarningDisable() {
      console.log('=== 异常预警配置-停用 ===');
      
      if (this.warningSelectedRows.length === 0) {
        this.$message.warning('请先选择要停用的预警项');
        return;
      }
      
      // 模拟停用操作
      console.log('停用的数据:', this.warningSelectedRows);
      this.$message.success(`已停用 ${this.warningSelectedRows.length} 个预警项`);
    },

    // 表格选择变化
    handleWarningSelectionChange(selection) {
      this.warningSelectedRows = selection;
    },

    // 新增（打开对话框）
    handleWarningAddRow() {
      console.log('=== 异常预警配置-新增 ===');
      
      // 获取当前最大序号
      const maxOrder = this.warningTableData.length > 0 
        ? Math.max(...this.warningTableData.map(item => item.order)) : 0;
      const newOrder = maxOrder + 1;
      
      // 重置表单数据
      this.warningAddForm = {
        order: newOrder,
        warningType: '',
        thresholdLower: '',
        thresholdUpper: '',
        status: '停用'
      };
      
      // 打开对话框
      this.warningAddDialogVisible = true;
    },

    // 新增对话框关闭
    handleWarningAddDialogClose() {
      // 重置表单数据
      this.warningAddForm = {
        order: 0,
        warningType: '',
        thresholdLower: '',
        thresholdUpper: '',
        status: '停用'
      };
    },

    // 新增对话框提交
    handleWarningAddSubmit() {
      // 验证必填字段
      if (!this.warningAddForm.warningType || !this.warningAddForm.warningType.trim()) {
        this.$message.warning('请填写预警数据类型');
        return;
      }
      
      // 添加到表格
      this.warningTableData.push({ ...this.warningAddForm });
      
      this.$message.success(`已新增"${this.warningAddForm.warningType}"预警项`);
      
      // 关闭对话框
      this.warningAddDialogVisible = false;
    },

    // 行内启用
    handleWarningEnableRow(row) {
      console.log('=== 异常预警配置-行内启用 ===', row);
      
      // 验证阈值区间是否填写完整
      if (!row.thresholdLower && !row.thresholdUpper) {
        this.$message.warning('请先填写该预警项的阈值区间后再启用');
        return;
      }
      
      // 更新状态为启用
      this.$set(row, 'status', '启用');
      
      // 模拟启用操作
      console.log('启用的数据:', row);
      this.$message.success(`已启用"${row.warningType}"预警项`);
    },

    // 行内停用
    handleWarningDisableRow(row) {
      console.log('=== 异常预警配置-行内停用 ===', row);
      
      // 更新状态为停用
      this.$set(row, 'status', '停用');
      
      // 模拟停用操作
      console.log('停用的数据:', row);
      this.$message.success(`已停用"${row.warningType}"预警项`);
    },

    // 行内删除
    handleWarningDeleteRow(row, index) {
      console.log('=== 异常预警配置-行内删除 ===', row);
      
      this.$confirm(`确定要删除"${row.warningType || '该'}"预警项吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          // 从表格中删除该行
          this.warningTableData.splice(index, 1);
          
          // 重新排序序号
          this.warningTableData.forEach((item, idx) => {
            item.order = idx + 1;
          });
          
          this.$message.success('删除成功');
        })
        .catch(() => {
          // 用户取消删除
        });
    },

    // ==================== 打卡人员设置相关方法 ====================

    // 查询
    handlePunchQuery() {
      console.log('=== 打卡人员设置-查询 ===');
      console.log('查询参数:', this.punchQueryParams);
      
      // 模拟查询操作
      this.$message.success('查询成功');
    },

    // 新增人员
    handlePunchAdd() {
      console.log('=== 打卡人员设置-新增人员 ===');
      this.$message.info('新增人员功能待开发');
    },

    // 批量设置
    handlePunchBatchSet() {
      console.log('=== 打卡人员设置-批量设置 ===');
      
      if (this.punchSelectedRows.length === 0) {
        this.$message.warning('请先选择要设置的人员');
        return;
      }
      
      this.$message.success(`已对 ${this.punchSelectedRows.length} 人进行批量设置`);
    },

    // 批量取消
    handlePunchBatchCancel() {
      console.log('=== 打卡人员设置-批量取消 ===');
      
      if (this.punchSelectedRows.length === 0) {
        this.$message.warning('请先选择要取消的人员');
        return;
      }
      
      this.$message.success(`已取消 ${this.punchSelectedRows.length} 人的打卡限制`);
    },

    // 表格选择变化
    handlePunchSelectionChange(selection) {
      this.punchSelectedRows = selection;
    },

    // ==================== 新增人员对话框相关方法 ====================

    // 打开新增人员对话框
    handlePunchAdd() {
      console.log('=== 打卡人员设置-新增人员 ===');
      
      // 重置表单数据
      this.punchAddForm = {
        selectedPerson: '',
        startTime: '',
        endTime: ''
      };
      
      // 打开对话框
      this.punchAddDialogVisible = true;
    },

    // 关闭新增人员对话框
    handlePunchAddDialogClose() {
      console.log('=== 打卡人员设置-关闭新增对话框 ===');
      
      // 重置表单数据
      this.punchAddForm = {
        selectedPerson: '',
        startTime: '',
        endTime: ''
      };
    },

    // 提交新增人员
    handlePunchAddSubmit() {
      console.log('=== 打卡人员设置-提交新增人员 ===');
      
      // 验证必填项
      if (!this.punchAddForm.selectedPerson) {
        this.$message.warning('请选择人员');
        return;
      }
      
      if (!this.punchAddForm.startTime || !this.punchAddForm.endTime) {
        this.$message.warning('请填写强制打卡时间段');
        return;
      }
      
      // 验证时间范围
      const start = new Date(this.punchAddForm.startTime);
      const end = new Date(this.punchAddForm.endTime);
      
      if (start >= end) {
        this.$message.warning('开始时间必须早于结束时间');
        return;
      }
      
      // 获取选中的人员信息
      const selectedPerson = this.personOptions.find(
        p => p.value === this.punchAddForm.selectedPerson
      );
      
      if (!selectedPerson) {
        this.$message.error('人员信息异常，请重新选择');
        return;
      }
      
      // 格式化时间范围为字符串
      const timeRange = `${this.formatDateTime(start)} ~ ${this.formatDateTime(end)}`;
      
      // 计算新的序号
      const maxOrder = this.punchTableData.length > 0 
        ? Math.max(...this.punchTableData.map(item => item.order)) : 0;
      const newOrder = maxOrder + 1;
      
      // 添加到表格数据中
      const newRow = {
        order: newOrder,
        unit: selectedPerson.unit,
        department: selectedPerson.department,
        name: selectedPerson.label,
        status: '强制打卡',
        timeRange: timeRange
      };
      
      this.punchTableData.push(newRow);
      
      // 关闭对话框并提示成功
      this.punchAddDialogVisible = false;
      this.$message.success(`已成功添加"${selectedPerson.label}"到打卡人员列表`);
      
      console.log('新增的人员:', newRow);
    },

    // 格式化日期时间为字符串
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    // 每页条数变化
    handlePunchSizeChange(val) {
      console.log('=== 打卡人员设置-每页显示条数变化 ===');
      console.log('新值:', val);
      this.punchPageSize = val;
      this.punchCurrentPage = 1; // 重置为第一页
      this.loadPunchData();
    },

    // 当前页变化
    handlePunchCurrentChange(val) {
      console.log('=== 打卡人员设置-当前页变化 ===');
      console.log('新页码:', val);
      this.punchCurrentPage = val;
      this.loadPunchData();
    },

    // 加载数据（预留）
    loadPunchData() {
      console.log('=== 加载打卡人员数据 ===');
      // 这里可以调用后端 API 获取数据
    },

    // 取消打卡限制
    handlePunchCancelLimit(row) {
      console.log('=== 打卡人员设置-取消打卡限制 ===', row);
      
      this.$confirm(`确定要取消"${row.name}"的打卡限制吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          console.log('取消限制的数据:', row);
          this.$message.success(`已取消"${row.name}"的打卡限制`);
        })
        .catch(() => {
          // 用户取消
        });
    },

    // 查看打卡情况
    handlePunchViewDetail(row) {
      console.log('=== 打卡人员设置-查看打卡情况 ===', row);
      this.$message.info(`查看"${row.name}"的打卡详情功能待开发`);
    },
  }
};
</script>

<style scoped>
.attendance-config-management {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: #f5f7fa;
}

/* 标签页样式 */
.page-tabs {
  background: #fff;
  padding: 0 20px;
  margin-bottom: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-tabs /deep/ .el-tabs__header {
  margin-bottom: 0;
}

.page-tabs /deep/ .el-tabs__item {
  font-size: 15px;
  font-weight: 500;
  padding: 0 20px;
  height: 50px;
  line-height: 50px;
}

.page-tabs /deep/ .el-tabs__item.is-active {
  color: #409eff;
  font-weight: 600;
}

.page-tabs /deep/ .el-tabs__active-bar {
  height: 3px;
}

/* 二级标签页样式 */
.sub-tabs {
  background: #fff;
  padding: 0 20px;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sub-tabs /deep/ .el-tabs__header {
  margin-bottom: 0;
}

.sub-tabs /deep/ .el-tabs__item {
  font-size: 14px;
  padding: 0 16px;
  height: 40px;
  line-height: 40px;
}

.sub-tabs /deep/ .el-tabs__item.is-active {
  color: #409eff;
  font-weight: 600;
}

.sub-tabs /deep/ .el-tabs__active-bar {
  height: 2px;
}

/* 二级页签内容区 */
.sub-tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.shift-content {
  display: flex;
  gap: 16px;
  overflow: hidden;
}

/* 班次设置布局 */
.shift-layout {
  display: flex;
  flex-direction: row; /* 明确设置为横向布局 */
  gap: 16px;
  overflow: hidden;
  height: 100%;
}

/* 左侧组织树面板 */
.left-org-tree {
  width: 280px;
  min-width: 280px;
  flex-shrink: 0;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 搜索框区域 */
.org-search-box {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
}

/* 树容器 - 允许内部滚动 */
.tree-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
  min-height: 0;
}

/* 右侧内容区 */
.right-shift-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

/* 顶部查询栏 */
.top-query-bar {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
}

.query-form-inline {
  margin: 0;
}

/* 中间操作按钮 */
.middle-action-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 底部数据表格区域 */
.bottom-table-area {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 分页包装器 */
.pagination-wrapper {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

/* 主容器 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 操作按钮栏 */
.action-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.action-bar .el-button {
  min-width: 80px;
}

/* 表格区域 */
.table-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 16px;
}

.table-wrapper /deep/ .el-table {
  font-size: 14px;
}

.table-wrapper /deep/ .el-table th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.table-wrapper /deep/ .el-table td {
  padding: 12px 0;
}

.adjust-text {
  color: #409eff;
  font-weight: 500;
}

.adjust-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.adjust-buttons .el-button {
  padding: 4px;
  min-height: auto;
}

.adjust-buttons .el-button.is-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.logic-text {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.result-text {
  color: #67c23a;
  font-weight: 500;
}

/* 班次设置区域 */
/* 计算模型页签 */
.calculation-tab {
  display: flex;
  flex-direction: column;
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 60px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 64px;
  color: #dcdfe6;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 规则说明对话框样式 */
.rules-content {
  padding: 20px;
  line-height: 1.8;
}

.rules-content h4 {
  margin: 20px 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 10px;
}

.rules-content h4:first-child {
  margin-top: 0;
}

.rules-content p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  text-align: justify;
}

.rules-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.rules-content li {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.rules-content strong {
  color: #409eff;
  font-weight: 600;
}

.dialog-footer {
  text-align: center;
}

/* 操作列按钮样式 */
.el-table .el-button--text {
  color: #409eff;
  font-size: 13px;
}

.el-table .el-button--text:hover {
  color: #66b1ff;
}

/* 异常预警配置样式 */
.warning-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.section-header .section-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-left: 12px;
}

.section-header .section-subtitle {
  font-size: 13px;
  color: #909399;
  margin-left: 8px;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 16px;
}

.add-row-wrapper {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

/* 打卡人员设置样式 */
.punch-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.query-bar {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 响应式适配 */
@media (max-width: 1400px) {
  .action-bar {
    flex-wrap: wrap;
  }

  .action-bar .el-button {
    min-width: 70px;
    padding: 8px 12px;
  }
}
</style>
