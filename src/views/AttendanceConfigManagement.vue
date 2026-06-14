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
      <div v-if="activeTab === 'calculation'" class="tab-content">
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
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <el-table-column prop="order" label="校验顺序" width="100" align="center"></el-table-column>
            <el-table-column prop="adjustment" label="顺序调整" width="100" align="center">
              <template slot-scope="scope">
                <span class="adjust-text">{{ scope.row.adjustment }}</span>
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

        <!-- 班次设置区域 -->
        <div class="shift-settings-section">
          <h3 class="section-title">班次设置</h3>
          <div class="shift-settings-content">
            <p class="placeholder-text">班次设置功能待开发...</p>
          </div>
        </div>
      </div>

      <!-- 异常预警配置页签内容 -->
      <div v-if="activeTab === 'warning'" class="tab-content">
        <div class="empty-state">
          <i class="el-icon-warning-outline"></i>
          <p>异常预警配置功能待开发...</p>
        </div>
      </div>

      <!-- 打卡人员设置页签内容 -->
      <div v-if="activeTab === 'punch'" class="tab-content">
        <div class="empty-state">
          <i class="el-icon-user"></i>
          <p>打卡人员设置功能待开发...</p>
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
  </div>
</template>

<script>
export default {
  name: "AttendanceConfigManagement",
  data() {
    return {
      activeTab: "calculation",
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
  methods: {
    // 标签页切换
    handleTabClick(tab) {
      console.log("切换标签页:", tab.name);
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
      const hasForcedItem = this.selectedRows.some(row => row.order <= 3);
      if (hasForcedItem) {
        this.$message.error("序号1-3为强制校验项，不可删除！");
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
          
          // 重新排序序号
          this.tableData.forEach((row, index) => {
            if (row.order >= 4) {
              row.order = index + 4;
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
    }
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
.shift-settings-section {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.shift-settings-content {
  min-height: 100px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.placeholder-text {
  margin: 0;
  color: #909399;
  font-size: 14px;
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
