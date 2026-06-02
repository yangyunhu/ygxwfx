<template>
  <div class="data-access-page">
    <div class="page-header">
      <h2>数据接入管理</h2>
    </div>

    <!-- 端类型切换页签 -->
    <div class="endpoint-tabs">
      <el-tabs
        v-model="activeEndpoint"
        type="card"
        @tab-click="handleEndpointChange"
      >
        <el-tab-pane label="移动端数据接入管理" name="mobile">
          <div style="display: none"></div>
        </el-tab-pane>
        <el-tab-pane label="Web端数据接入管理" name="web">
          <div style="display: none"></div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="main-content">
      <!-- 左侧数据类型列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <i class="el-icon-menu"></i>
          <span>数据类型</span>
        </div>
        <div class="data-type-list">
          <div
            v-for="(item, index) in filteredDataTypes"
            :key="item.code"
            class="data-type-item"
            :class="{ active: selectedType === item.code }"
            @click="selectDataType(item.code)"
          >
            <div class="item-badge">{{ index + 1 }}</div>
            <div class="item-content">
              <div class="item-title">{{ item.name }}</div>
              <div class="item-meta">
                <el-tag
                  :type="item.category === 'offline' ? 'warning' : 'success'"
                  size="mini"
                >
                  {{ item.category === "offline" ? "线下导入" : "线上接入" }}
                </el-tag>
                <span class="item-count">{{ item.fields.length }} 个字段</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="right-panel">
        <!-- 空状态 -->
        <div v-if="!selectedDataType" class="empty-state">
          <i class="el-icon-document"></i>
          <p>请从左侧选择数据类型查看字段详情</p>
        </div>

        <!-- 详情内容 -->
        <div v-else class="detail-content">
          <!-- 数据源信息卡片 -->
          <el-card shadow="never" class="info-card">
            <div slot="header" class="card-header">
              <i class="el-icon-info"></i>
              <span>数据源信息</span>
            </div>
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="数据名称">
                <span class="highlight">{{ selectedDataType.name }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="数据源编码">
                <code>{{ selectedDataType.sourceTable }}</code>
              </el-descriptions-item>
              <el-descriptions-item label="字段数量">
                <el-tag type="primary" size="small"
                  >{{ selectedDataType.fields.length }} 项</el-tag
                >
              </el-descriptions-item>
              <el-descriptions-item label="数据描述" :span="3">
                {{ selectedDataType.description }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 接入配置卡片 -->
          <el-card shadow="never" class="config-card">
            <div slot="header" class="card-header">
              <i class="el-icon-setting"></i>
              <span
                >接入配置 -
                {{ activeEndpoint === "mobile" ? "移动端" : "Web端" }}</span
              >
            </div>
            <div class="config-form">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="form-item">
                    <label>接入路径</label>
                    <el-select
                      v-model="currentConfig.apiPath"
                      placeholder="请选择"
                      style="width: 100%"
                    >
                      <el-option
                        label="南网数据中心接入"
                        value="南网数据中心接入"
                      ></el-option>
                      <el-option
                        label="单位线下自行导入"
                        value="单位线下自行导入"
                      ></el-option>
                    </el-select>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="form-item">
                    <label>同步频率</label>
                    <el-select
                      v-model="currentConfig.syncFreq"
                      placeholder="请选择"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="freq in syncFreqOptions"
                        :key="freq"
                        :label="freq"
                        :value="freq"
                      ></el-option>
                    </el-select>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="form-item">
                    <label>接入状态</label>
                    <el-radio-group v-model="currentConfig.status" size="small">
                      <el-radio-button label="sync">已连接</el-radio-button>
                      <el-radio-button label="disconnect"
                        >待连接</el-radio-button
                      >
                    </el-radio-group>
                  </div>
                </el-col>
              </el-row>
              <div class="form-actions">
                <el-button
                  type="primary"
                  icon="el-icon-check"
                  size="small"
                  @click="saveConfig"
                  :loading="saving"
                >
                  保存配置
                </el-button>
                <el-button
                  icon="el-icon-refresh"
                  size="small"
                  @click="resetConfig"
                >
                  重置
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 字段详情表格 -->
          <el-card shadow="never" class="table-card">
            <div slot="header" class="card-header">
              <i class="el-icon-tickets"></i>
              <span>字段详情</span>
              <div class="card-extra">
                <el-tag type="info" size="small"
                  >共 {{ selectedDataType.fields.length }} 个字段</el-tag
                >
              </div>
            </div>
            <el-table
              :data="selectedDataType.fields"
              border
              stripe
              style="width: 100%"
              max-height="400"
              size="small"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                align="center"
              ></el-table-column>
              <el-table-column
                prop="en"
                label="字段英文名"
                min-width="150"
                show-overflow-tooltip
              >
                <template slot-scope="scope">
                  <code>{{ scope.row.en }}</code>
                </template>
              </el-table-column>
              <el-table-column
                prop="zh"
                label="字段中文名"
                min-width="120"
                show-overflow-tooltip
              ></el-table-column>
              <el-table-column prop="type" label="字段属性" width="140">
                <template slot-scope="scope">
                  <el-tag size="mini" type="info">{{ scope.row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="meaning"
                label="数据项业务含义"
                min-width="200"
                show-overflow-tooltip
              ></el-table-column>
              <el-table-column label="是否主键" width="90" align="center">
                <template slot-scope="scope">
                  <el-tag v-if="scope.row.isPk" type="danger" size="mini">
                    <i class="el-icon-check"></i> 是
                  </el-tag>
                  <span v-else class="text-muted">否</span>
                </template>
              </el-table-column>
              <el-table-column label="安全级别" width="100" align="center">
                <template slot-scope="scope">
                  <el-tag
                    :type="
                      scope.row.securityLevel === '一级' ? 'danger' : 'warning'
                    "
                    size="mini"
                    effect="light"
                  >
                    {{ scope.row.securityLevel }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  SENSING_ACCESS_SOURCES,
  SYNC_FREQ_OPTIONS,
  loadAccessConfig,
  saveAccessConfig,
} from "../utils/dataAccessManagement";

export default {
  name: "DataAccessManagement",
  data() {
    return {
      activeEndpoint: "mobile", // 当前端类型：mobile 或 web
      selectedType: "online_travel",
      dataTypes: SENSING_ACCESS_SOURCES,
      syncFreqOptions: SYNC_FREQ_OPTIONS,
      config: {},
      saving: false,
    };
  },
  computed: {
    // 根据端类型过滤数据类型
    filteredDataTypes() {
      if (this.activeEndpoint === "mobile") {
        // 移动端只显示南网商旅通
        return this.dataTypes.filter((item) => item.code === "online_travel");
      } else {
        // Web端显示除南网商旅通外的所有数据源
        return this.dataTypes.filter((item) => item.code !== "online_travel");
      }
    },
    selectedDataType() {
      return this.dataTypes.find((item) => item.code === this.selectedType);
    },
    currentConfig: {
      get() {
        // 根据端类型加载对应的配置
        const endpoint = this.activeEndpoint;
        const configKey = `${this.selectedType}_${endpoint}`;

        return (
          this.config[configKey] || {
            apiPath:
              this.selectedDataType?.[
                `default${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}`
              ]?.apiPath || "南网数据中心接入",
            syncFreq:
              this.selectedDataType?.[
                `default${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}`
              ]?.syncFreq || "每日同步",
            status:
              this.selectedDataType?.[
                `default${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}`
              ]?.status || "sync",
          }
        );
      },
      set(val) {
        const configKey = `${this.selectedType}_${this.activeEndpoint}`;
        this.$set(this.config, configKey, val);
      },
    },
  },
  watch: {
    // 监听端类型切换，自动调整选中的数据类型
    activeEndpoint(newEndpoint) {
      this.$nextTick(() => {
        // 检查当前选中的类型是否在新的过滤列表中
        const isAvailable = this.filteredDataTypes.some(
          (item) => item.code === this.selectedType,
        );
        if (!isAvailable && this.filteredDataTypes.length > 0) {
          // 自动选中第一个可用的数据类型
          this.selectedType = this.filteredDataTypes[0].code;
        }
      });
    },
  },
  mounted() {
    this.loadConfig();
  },
  methods: {
    selectDataType(code) {
      this.selectedType = code;
    },
    handleEndpointChange(tab) {
      // 切换端类型时的处理
      console.log("切换到:", tab.name);
    },
    loadConfig() {
      try {
        this.config = loadAccessConfig();
      } catch (e) {
        console.error("加载配置失败", e);
      }
    },
    saveConfig() {
      this.saving = true;
      setTimeout(() => {
        try {
          const newConfig = { ...this.config };
          const configKey = `${this.selectedType}_${this.activeEndpoint}`;

          // 保存当前端类型的配置
          newConfig[configKey] = { ...this.currentConfig };

          saveAccessConfig(newConfig);
          this.config = newConfig;
          const endpointText =
            this.activeEndpoint === "mobile" ? "移动端" : "Web端";
          this.$message.success(`${endpointText}配置保存成功！`);
        } catch (e) {
          this.$message.error("保存失败");
        } finally {
          this.saving = false;
        }
      }, 500);
    },
    resetConfig() {
      this.$confirm("确定要重置配置吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          if (this.selectedDataType) {
            const endpoint = this.activeEndpoint;
            const configKey = `${this.selectedType}_${endpoint}`;
            this.currentConfig = {
              apiPath:
                this.selectedDataType?.[
                  `default${
                    endpoint.charAt(0).toUpperCase() + endpoint.slice(1)
                  }`
                ]?.apiPath || "南网数据中心接入",
              syncFreq:
                this.selectedDataType?.[
                  `default${
                    endpoint.charAt(0).toUpperCase() + endpoint.slice(1)
                  }`
                ]?.syncFreq || "每日同步",
              status:
                this.selectedDataType?.[
                  `default${
                    endpoint.charAt(0).toUpperCase() + endpoint.slice(1)
                  }`
                ]?.status || "sync",
            };
          }
          const endpointText =
            this.activeEndpoint === "mobile" ? "移动端" : "Web端";
          this.$message.info(`${endpointText}配置已重置`);
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.data-access-page {
  /* padding: 20px; */
  background: #f5f7fa;
  box-sizing: border-box;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 10px;
  background: #fff;
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 端类型切换页签 */
.endpoint-tabs {
  margin-bottom: 0 !important;
  background: #fff;
  padding: 0 !important;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.endpoint-tabs >>> .el-tabs__header {
  margin: 0 !important;
  padding: 0 !important;
  border-bottom: 1px solid #e4e7ed;
}

.endpoint-tabs >>> .el-tabs__nav-wrap {
  margin-bottom: 0 !important;
}

.endpoint-tabs >>> .el-tabs__nav-wrap::after {
  height: 0 !important;
}

.endpoint-tabs >>> .el-tabs__nav {
  margin-bottom: 0 !important;
}

.endpoint-tabs >>> .el-tabs__item {
  font-size: 14px;
  font-weight: 500;
  height: 40px !important;
  line-height: 40px !important;
  margin-bottom: 0 !important;
}

.endpoint-tabs >>> .el-tabs__item i {
  margin-right: 6px;
  font-size: 16px;
}

.endpoint-tabs >>> .el-tabs__content {
  display: none !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.endpoint-tabs >>> .el-tab-pane {
  display: none !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.main-content {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  min-height: calc(100vh - 160px);
}

/* 左侧面板 */
.left-panel {
  width: 320px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel .panel-header {
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 8px;
}

.left-panel .panel-header i {
  color: #409eff;
  font-size: 16px;
}

.data-type-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.data-type-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.data-type-item:hover {
  background: #f5f7fa;
}

.data-type-item.active {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.item-badge {
  width: 28px;
  height: 28px;
  background: #909399;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
}

.data-type-item.active .item-badge {
  background: #409eff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-count {
  font-size: 12px;
  color: #909399;
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-state i {
  font-size: 72px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-state p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

/* 详情内容 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片通用样式 */
.info-card,
.config-card,
.table-card {
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-header i {
  color: #409eff;
  font-size: 16px;
}

.card-extra {
  margin-left: auto;
}

/* 高亮文本 */
.highlight {
  color: #409eff;
  font-weight: 600;
}

code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #606266;
}

.text-muted {
  color: #909399;
}

/* 配置表单 */
.config-form {
  padding: 4px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 表格卡片 */
.table-card >>> .el-card__body {
  padding: 0;
}

.table-card >>> .el-table {
  font-size: 13px;
}

.table-card >>> .el-table th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

/* 滚动条优化 */
.data-type-list::-webkit-scrollbar {
  width: 6px;
}

.data-type-list::-webkit-scrollbar-track {
  background: #f5f7fa;
}

.data-type-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.data-type-list::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>
