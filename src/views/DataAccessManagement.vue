<template>
  <div class="data-access-page">
    <div class="page-header">
      <h2>数据接入管理</h2>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <div class="panel-title">数据类型</div>
        <div class="data-type-list">
          <div
            v-for="(item, index) in dataTypes"
            :key="item.code"
            class="data-type-item"
            :class="{ active: selectedType === item.code }"
            @click="selectDataType(item.code)"
          >
            <div class="item-number">{{ index + 1 }}</div>
            <div class="item-info">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-desc">{{ item.category === 'offline' ? '线下导入' : '线上接入' }} · {{ item.fields.length }} 项字段</div>
            </div>
            <div class="item-arrow">›</div>
          </div>
        </div>
      </div>

      <div class="right-panel">
        <div class="panel-header">
          <div class="selected-info">
            <span class="selected-label">当前选择：</span>
            <span class="selected-name">{{ selectedDataType?.name || '请选择数据类型' }}</span>
          </div>
        </div>

        <div v-if="!selectedDataType" class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-text">请从左侧选择数据类型查看字段详情</div>
        </div>

        <div v-else class="field-content">
          <div class="data-source-info">
            <div class="info-item">
              <span class="info-label">数据源编码：</span>
              <span class="info-value">{{ selectedDataType.sourceTable }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">字段数量：</span>
              <span class="info-value">{{ selectedDataType.fields.length }} 项</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据描述：</span>
              <span class="info-value">{{ selectedDataType.description }}</span>
            </div>
          </div>

          <div class="config-section">
            <div class="config-title">接入配置</div>
            <div class="config-content">
              <div class="config-row">
                <span class="config-label">接入路径：</span>
                <el-select v-model="currentConfig.apiPath" class="config-select" placeholder="请选择">
                  <el-option label="南网数据中心接入" value="南网数据中心接入"></el-option>
                  <el-option label="单位线下自行导入" value="单位线下自行导入"></el-option>
                </el-select>
              </div>
              <div class="config-row">
                <span class="config-label">同步频率：</span>
                <el-select v-model="currentConfig.syncFreq" class="config-select" placeholder="请选择">
                  <el-option v-for="freq in syncFreqOptions" :key="freq" :label="freq" :value="freq"></el-option>
                </el-select>
              </div>
              <div class="config-row">
                <span class="config-label">接入状态：</span>
                <el-radio-group v-model="currentConfig.status">
                  <el-radio label="sync">已连接</el-radio>
                  <el-radio label="disconnect">待连接</el-radio>
                </el-radio-group>
              </div>
              <div class="config-actions">
                <el-button type="primary" size="small" @click="saveConfig" :loading="saving">
                  保存配置
                </el-button>
                <el-button size="small" @click="resetConfig">
                  重置
                </el-button>
              </div>
            </div>
          </div>

          <div class="table-wrapper">
            <div class="table-title">字段详情</div>
            <el-table
              :data="selectedDataType.fields"
              border
              stripe
              style="width: 100%"
              height="400"
            >
              <el-table-column type="index" label="序号" width="70" align="center"></el-table-column>
              <el-table-column prop="en" label="字段英文名" width="200" show-overflow-tooltip></el-table-column>
              <el-table-column prop="zh" label="字段中文名" width="180" show-overflow-tooltip></el-table-column>
              <el-table-column prop="type" label="字段属性" width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="meaning" label="数据项业务含义" min-width="200" show-overflow-tooltip></el-table-column>
              <el-table-column label="是否主键" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.isPk" type="danger" size="small">是</el-tag>
                  <span v-else>否</span>
                </template>
              </el-table-column>
              <el-table-column label="安全级别" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.securityLevel === '一级' ? 'danger' : 'warning'" size="small">
                    {{ scope.row.securityLevel }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { SENSING_ACCESS_SOURCES, SYNC_FREQ_OPTIONS, loadAccessConfig, saveAccessConfig } from '../utils/dataAccessManagement';

export default {
  name: 'DataAccessManagement',
  data() {
    return {
      selectedType: 'online_travel',
      dataTypes: SENSING_ACCESS_SOURCES,
      syncFreqOptions: SYNC_FREQ_OPTIONS,
      config: {},
      saving: false
    };
  },
  computed: {
    selectedDataType() {
      return this.dataTypes.find(item => item.code === this.selectedType);
    },
    currentConfig: {
      get() {
        return this.config[this.selectedType] || {
          apiPath: this.selectedDataType?.defaultWeb?.apiPath || '南网数据中心接入',
          syncFreq: this.selectedDataType?.defaultWeb?.syncFreq || '每日同步',
          status: this.selectedDataType?.defaultWeb?.status || 'sync'
        };
      },
      set(val) {
        this.$set(this.config, this.selectedType, val);
      }
    }
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    selectDataType(code) {
      this.selectedType = code;
    },
    loadConfig() {
      try {
        this.config = loadAccessConfig();
      } catch (e) {
        console.error('加载配置失败', e);
      }
    },
    saveConfig() {
      this.saving = true;
      setTimeout(() => {
        try {
          const newConfig = { ...this.config };
          if (!newConfig.web) newConfig.web = {};
          if (!newConfig.mobile) newConfig.mobile = {};
          
          newConfig.web[this.selectedType] = { ...this.currentConfig };
          newConfig.mobile[this.selectedType] = { ...this.currentConfig };
          
          saveAccessConfig(newConfig);
          this.config = newConfig;
          this.$message.success('配置保存成功！');
        } catch (e) {
          this.$message.error('保存失败');
        } finally {
          this.saving = false;
        }
      }, 500);
    },
    resetConfig() {
      this.$confirm('确定要重置配置吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        if (this.selectedDataType) {
          this.currentConfig = {
            apiPath: this.selectedDataType.defaultWeb?.apiPath || '南网数据中心接入',
            syncFreq: this.selectedDataType.defaultWeb?.syncFreq || '每日同步',
            status: this.selectedDataType.defaultWeb?.status || 'sync'
          };
        }
        this.$message.info('配置已重置');
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.data-access-page {
  padding: 0px 0px 20px;
  background: #f0f2f5;
  box-sizing: border-box;
  width: 100%;
  overflow-x: auto;
}

.page-header {
  margin-bottom: 8px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 17px;
  font-weight: 600;
}

.main-content {
  display: flex;
  gap: 14px;
  min-width: 1000px;
}

.left-panel {
  width: 360px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.panel-title {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.data-type-list {
  padding: 6px;
}

.data-type-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.3s;
  border: 1px solid transparent;
}

.data-type-item:hover {
  background: #f5f7fa;
}

.data-type-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.item-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-right: 14px;
  flex-shrink: 0;
}

.data-type-item.active .item-number {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.item-desc {
  font-size: 12px;
  color: #909399;
}

.item-arrow {
  font-size: 24px;
  color: #c0c4cc;
  font-weight: 300;
}

.data-type-item.active .item-arrow {
  color: #409eff;
}

.right-panel {
  flex: 1;
  min-width: 600px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.selected-info {
  display: flex;
  align-items: center;
}

.selected-label {
  color: #606266;
  font-size: 14px;
}

.selected-name {
  color: #409eff;
  font-size: 15px;
  font-weight: 600;
  margin-left: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  color: #909399;
  font-size: 14px;
}

.field-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.data-source-info {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-label {
  color: #606266;
  font-size: 13px;
}

.info-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
  margin-left: 6px;
}

.config-section {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.config-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.config-content {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.config-row {
  display: flex;
  align-items: center;
}

.config-label {
  font-size: 13px;
  color: #606266;
  margin-right: 10px;
  white-space: nowrap;
}

.config-select {
  width: 180px;
}

.config-actions {
  margin-left: auto;
}

.table-wrapper {
  flex: 1;
  padding: 12px 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.table-wrapper >>> .el-table {
  font-size: 13px;
}

.table-wrapper >>> .el-table th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}
</style>
