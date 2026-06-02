<template>
  <div class="data-config-page">
    <div class="page-header">
      <h2>无感数据配置</h2>
    </div>

    <div class="tabs-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="组织机构无感数据配置" name="org">
          <div class="org-config-content">
            <div class="content-layout">
              <div class="left-panel">
                <div class="panel-header">
                  <h3>组织机构树</h3>
                </div>
                <div class="search-box">
                  <el-input
                    v-model="orgSearch"
                    placeholder="搜索组织机构"
                    prefix-icon="el-icon-search"
                    clearable
                  ></el-input>
                </div>
                <div class="tree-container">
                  <el-tree
                    ref="orgTree"
                    :data="orgTreeData"
                    :props="orgTreeProps"
                    node-key="id"
                    :expand-on-click-node="false"
                    :default-expand-all="true"
                    :filter-node-method="filterOrgNode"
                    highlight-current
                    @node-click="handleOrgNodeClick"
                  >
                    <span class="custom-tree-node" slot-scope="{ node, data }">
                      <span style="display: flex; align-items: center; flex: 1;">
                        <i :class="data.type === 'team' ? 'el-icon-user node-icon' : 'el-icon-office-building node-icon'"></i>
                        <span class="node-label">{{ node.label }}</span>
                      </span>
                      <el-tag v-if="data.configured" type="success" size="mini" style="margin-left: 8px; flex-shrink: 0;">已配置</el-tag>
                    </span>
                  </el-tree>
                </div>
              </div>

              <div class="right-panel">
                <div class="panel-header">
                  <h3>数据源配置</h3>
                </div>
                <div v-if="!selectedOrg" class="empty-state">
                  <i class="el-icon-s-home"></i>
                  <p>请在左侧选择一个组织机构</p>
                </div>
                <div v-else class="config-content">
                  <div class="org-info">
                    <el-descriptions :column="1" border size="small">
                      <el-descriptions-item label="组织机构名称">{{ selectedOrg.name }}</el-descriptions-item>
                      <el-descriptions-item label="组织机构类型">
                        {{ selectedOrg.type === 'dept' ? '部门' : selectedOrg.type === 'team' ? '班组' : '单位' }}
                      </el-descriptions-item>
                      <el-descriptions-item v-if="selectedOrg.code" label="组织机构编码">{{ selectedOrg.code }}</el-descriptions-item>
                    </el-descriptions>
                  </div>

                  <div class="source-config-section">
                    <div class="section-title">
                      <span>关联的无感数据源</span>
                      <el-button type="primary" size="small" @click="openAddSourceDialog">
                        <i class="el-icon-plus"></i> 添加数据源
                      </el-button>
                    </div>
                    <el-table :data="orgConfigSources" border stripe size="small">
                      <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                      <el-table-column prop="sourceName" label="数据源名称" min-width="180"></el-table-column>
                      <el-table-column prop="sourceType" label="数据来源" width="120" align="center">
                        <template slot-scope="scope">
                          <el-tag :type="scope.row.sourceType === 'online' ? 'primary' : 'info'" size="small">
                            {{ scope.row.sourceType === 'online' ? '线上接入' : '线下导入' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="syncFreq" label="同步频率" width="140" align="center"></el-table-column>
                      <el-table-column prop="status" label="接入状态" width="100" align="center">
                        <template slot-scope="scope">
                          <el-tag :type="scope.row.status === 'sync' ? 'success' : 'info'" size="small">
                            {{ scope.row.status === 'sync' ? '已接入' : '待接入' }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="120" align="center">
                        <template slot-scope="scope">
                          <el-button type="text" size="small" @click="editOrgSourceConfig(scope.row)">编辑</el-button>
                          <el-button type="text" size="small" @click="removeOrgSourceConfig(scope.$index)" style="color: #f56c6c;">移除</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="无感数据关联配置" name="relation">
          <div class="relation-config-content">
            <div class="config-section">
              <div class="section-title">专业分类配置</div>
              <div class="config-form">
                <el-form :model="majorForm" label-width="140px">
                  <el-form-item label="选择专业分类">
                    <el-select v-model="majorForm.majorId" placeholder="请选择专业分类" style="width: 400px;">
                      <el-option v-for="major in majorCategories" :key="major.id" :label="major.path" :value="major.id"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="移动端数据源">
                    <el-select v-model="majorForm.mobileSources" multiple placeholder="请选择移动端数据源" style="width: 100%;">
                      <el-option v-for="source in SENSING_ACCESS_SOURCES" :key="source.code" :label="source.name" :value="source.code"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="Web端数据源">
                    <el-select v-model="majorForm.webSources" multiple placeholder="请选择Web端数据源" style="width: 100%;">
                      <el-option v-for="source in SENSING_ACCESS_SOURCES" :key="source.code" :label="source.name" :value="source.code"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="saveMajorConfig">保存配置</el-button>
                    <el-button @click="resetMajorForm">重置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <div class="config-list-section">
              <div class="section-title">已配置的专业分类列表</div>
              <el-table :data="majorConfigList" border stripe>
                <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                <el-table-column prop="majorPath" label="专业分类路径" min-width="250"></el-table-column>
                <el-table-column label="移动端数据源" min-width="300">
                  <template slot-scope="scope">
                    <el-tag v-for="code in scope.row.mobileSources" :key="code" size="small" style="margin-right: 4px; margin-bottom: 4px;">
                      {{ getSourceName(code) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Web端数据源" min-width="300">
                  <template slot-scope="scope">
                    <el-tag v-for="code in scope.row.webSources" :key="code" size="small" style="margin-right: 4px; margin-bottom: 4px;">
                      {{ getSourceName(code) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                  <template slot-scope="scope">
                    <el-button type="text" size="small" @click="editMajorConfig(scope.row)">编辑</el-button>
                    <el-button type="text" size="small" @click="deleteMajorConfig(scope.$index)" style="color: #f56c6c;">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog title="添加数据源" :visible.sync="sourceDialogVisible" width="700px">
      <el-form :model="sourceForm" label-width="120px">
        <el-form-item label="选择数据源">
          <el-select v-model="sourceForm.sourceCode" placeholder="请选择数据源" style="width: 100%;" @change="onSourceSelect">
            <el-option v-for="source in SENSING_ACCESS_SOURCES" :key="source.code" :label="source.name" :value="source.code" :disabled="isSourceSelected(source.code)"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="sourceForm.sourceCode" label="数据来源">
          <el-select v-model="sourceForm.sourceType" placeholder="请选择数据来源" style="width: 100%;">
            <el-option label="南网数据中心接入" value="online"></el-option>
            <el-option label="单位线下自行导入" value="offline"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="sourceForm.sourceCode" label="同步频率">
          <el-select v-model="sourceForm.syncFreq" placeholder="请选择同步频率" style="width: 100%;">
            <el-option label="实时同步" value="实时同步"></el-option>
            <el-option label="每30分钟同步" value="每30分钟同步"></el-option>
            <el-option label="每1小时同步" value="每1小时同步"></el-option>
            <el-option label="每2小时同步" value="每2小时同步"></el-option>
            <el-option label="每4小时同步" value="每4小时同步"></el-option>
            <el-option label="每6小时同步" value="每6小时同步"></el-option>
            <el-option label="每8小时同步" value="每8小时同步"></el-option>
            <el-option label="每12小时同步" value="每12小时同步"></el-option>
            <el-option label="每日同步" value="每日同步"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="sourceForm.sourceCode" label="接入状态">
          <el-radio-group v-model="sourceForm.status">
            <el-radio label="sync">已接入</el-radio>
            <el-radio label="disconnect">待接入</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="sourceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddSource">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { SENSING_ACCESS_SOURCES } from "../utils/sensingAccessSchemas";
import { getEnabledLeafCategories } from "../utils/majorCategory";

export default {
  name: "DataConfig",
  data() {
    return {
      activeTab: "org",
      orgSearch: "",
      selectedOrg: null,
      orgConfigSources: [],
      sourceDialogVisible: false,
      sourceForm: {
        sourceCode: "",
        sourceType: "online",
        syncFreq: "每日同步",
        status: "sync"
      },
      majorForm: {
        majorId: "",
        mobileSources: [],
        webSources: []
      },
      majorConfigList: [],
      SENSING_ACCESS_SOURCES
    };
  },
  computed: {
    orgTreeProps() {
      return {
        children: "children",
        label: "name"
      };
    },
    majorCategories() {
      return getEnabledLeafCategories();
    }
  },
  mounted() {
    this.initOrgTreeData();
    this.loadMajorConfigList();
  },
  methods: {
    initOrgTreeData() {
      this.orgTreeData = [
        {
          id: "unit-1",
          name: "云南电网有限责任公司",
          type: "unit",
          code: "YN_CSG",
          configured: false,
          children: [
            {
              id: "dept-1",
              name: "变电运行一所",
              type: "dept",
              code: "BYD_YX01",
              configured: true,
              children: [
                {
                  id: "team-1",
                  name: "运行区",
                  type: "team",
                  code: "YX01_QY",
                  configured: false,
                  children: [
                    { id: "team-1-1", name: "运行一班", type: "team", code: "YX01_QY01", configured: true },
                    { id: "team-1-2", name: "运行二班", type: "team", code: "YX01_QY02", configured: false }
                  ]
                }
              ]
            },
            {
              id: "dept-2",
              name: "生产技术部",
              type: "dept",
              code: "SC_JSB",
              configured: false,
              children: [
                { id: "team-2-1", name: "检修中心", type: "team", code: "SC_JSB_JXZX", configured: false },
                { id: "team-2-2", name: "检修一班", type: "team", code: "SC_JSB_JXYB", configured: true }
              ]
            },
            {
              id: "dept-3",
              name: "人力资源部",
              type: "dept",
              code: "HR_B",
              configured: true,
              children: [
                { id: "team-3-1", name: "干部管理科", type: "team", code: "HR_B_GBK", configured: false }
              ]
            }
          ]
        }
      ];
    },
    filterOrgNode(value, data) {
      if (!value) return true;
      return data.name.indexOf(value) !== -1;
    },
    handleOrgNodeClick(data) {
      this.selectedOrg = data;
      this.loadOrgConfig(data.id);
    },
    loadOrgConfig(orgId) {
      const saved = localStorage.getItem(`org_config_${orgId}`);
      if (saved) {
        this.orgConfigSources = JSON.parse(saved);
      } else {
        this.orgConfigSources = [];
      }
      this.selectedOrg.configured = this.orgConfigSources.length > 0;
    },
    openAddSourceDialog() {
      this.sourceForm = {
        sourceCode: "",
        sourceType: "online",
        syncFreq: "每日同步",
        status: "sync"
      };
      this.sourceDialogVisible = true;
    },
    onSourceSelect(code) {
      const source = this.SENSING_ACCESS_SOURCES.find(s => s.code === code);
      if (source) {
        this.sourceForm.sourceType = source.category;
        this.sourceForm.syncFreq = source.defaultWeb.syncFreq;
        this.sourceForm.status = source.defaultWeb.status;
      }
    },
    isSourceSelected(code) {
      return this.orgConfigSources.some(s => s.sourceCode === code);
    },
    getSourceName(code) {
      const source = this.SENSING_ACCESS_SOURCES.find(s => s.code === code);
      return source ? source.name : code;
    },
    confirmAddSource() {
      if (!this.sourceForm.sourceCode) {
        this.$message.warning("请选择数据源");
        return;
      }
      
      const source = this.SENSING_ACCESS_SOURCES.find(s => s.code === this.sourceForm.sourceCode);
      const newConfig = {
        id: Date.now(),
        sourceCode: this.sourceForm.sourceCode,
        sourceName: source.name,
        sourceType: this.sourceForm.sourceType,
        syncFreq: this.sourceForm.syncFreq,
        status: this.sourceForm.status
      };
      
      this.orgConfigSources.push(newConfig);
      this.saveOrgConfig();
      this.sourceDialogVisible = false;
      this.$message.success("数据源添加成功");
    },
    editOrgSourceConfig(config) {
      this.sourceForm = {
        sourceCode: config.sourceCode,
        sourceType: config.sourceType,
        syncFreq: config.syncFreq,
        status: config.status
      };
      this.sourceDialogVisible = true;
      
      const index = this.orgConfigSources.findIndex(s => s.id === config.id);
      if (index > -1) {
        this.orgConfigSources.splice(index, 1);
      }
    },
    removeOrgSourceConfig(index) {
      this.$confirm("确定移除该数据源配置吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.orgConfigSources.splice(index, 1);
        this.saveOrgConfig();
        this.$message.success("已移除");
      }).catch(() => {});
    },
    saveOrgConfig() {
      localStorage.setItem(`org_config_${this.selectedOrg.id}`, JSON.stringify(this.orgConfigSources));
      this.selectedOrg.configured = this.orgConfigSources.length > 0;
    },
    saveMajorConfig() {
      if (!this.majorForm.majorId) {
        this.$message.warning("请选择专业分类");
        return;
      }
      
      const major = this.majorCategories.find(m => m.id === this.majorForm.majorId);
      const newConfig = {
        id: Date.now(),
        majorId: this.majorForm.majorId,
        majorPath: major.path,
        mobileSources: [...this.majorForm.mobileSources],
        webSources: [...this.majorForm.webSources]
      };
      
      const existingIndex = this.majorConfigList.findIndex(c => c.majorId === this.majorForm.majorId);
      if (existingIndex > -1) {
        this.majorConfigList[existingIndex] = newConfig;
      } else {
        this.majorConfigList.push(newConfig);
      }
      
      this.saveMajorConfigList();
      this.$message.success("配置保存成功");
    },
    editMajorConfig(config) {
      this.majorForm = {
        majorId: config.majorId,
        mobileSources: [...config.mobileSources],
        webSources: [...config.webSources]
      };
    },
    deleteMajorConfig(index) {
      this.$confirm("确定删除该专业分类配置吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.majorConfigList.splice(index, 1);
        this.saveMajorConfigList();
        this.$message.success("已删除");
      }).catch(() => {});
    },
    resetMajorForm() {
      this.majorForm = {
        majorId: "",
        mobileSources: [],
        webSources: []
      };
    },
    loadMajorConfigList() {
      const saved = localStorage.getItem("major_config_list");
      if (saved) {
        this.majorConfigList = JSON.parse(saved);
      }
    },
    saveMajorConfigList() {
      localStorage.setItem("major_config_list", JSON.stringify(this.majorConfigList));
    }
  }
};
</script>

<style scoped>
.data-config-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.tabs-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.content-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 280px);
}

.left-panel,
.right-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
}

.left-panel {
  width: 380px;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.panel-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.search-box {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tree-container >>> .el-tree {
  background: transparent;
}

.tree-container >>> .el-tree-node__content {
  height: 40px;
  padding: 0 16px;
}

.tree-container >>> .el-tree-node__content:hover {
  background-color: #f5f7fa;
}

.tree-container >>> .el-tree-node.is-current > .el-tree-node__content {
  background-color: #ecf5ff;
  color: #409eff;
}

.tree-container >>> .el-tree-node__expand-icon {
  padding: 6px;
}

.tree-container >>> .el-tree-node__expand-icon.el-icon-caret-right {
  color: #909399;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 4px;
}

.node-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  color: #606266;
}

.node-icon.el-icon-office-building {
  color: #409eff;
}

.node-icon.el-icon-user {
  color: #67c23a;
}

.node-label {
  flex: 1;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  padding: 60px 0;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
}

.config-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.org-info {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.source-config-section {
  flex: 1;
  padding: 16px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.table-wrapper {
  flex: 1;
  overflow: auto;
}

.relation-config-content {
  padding: 20px;
}

.config-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.config-list-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.config-form {
  padding-top: 12px;
}
</style>
