<template>
  <div class="data-config-page">
    <!-- 页面头部 -->
    <div class="page-header-wrapper">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">无感数据配置</h2>
          <p class="page-subtitle">管理组织机构与数据源的关联配置</p>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <el-tabs v-model="activeTab" type="card" class="main-tabs">
      <!-- 组织机构无感数据配置 -->
      <el-tab-pane label="组织机构无感数据配置" name="org">
        <div class="org-config-wrapper">
          <!-- 左侧组织机构树 -->
          <div class="side-panel">
            <div class="panel-card">
              <div class="panel-header">
                <i class="el-icon-office-building panel-icon"></i>
                <span class="panel-title">组织机构树</span>
              </div>

              <!-- 搜索框 -->
              <div class="search-wrapper">
                <el-input
                  v-model="orgSearch"
                  placeholder="搜索组织机构"
                  prefix-icon="el-icon-search"
                  clearable
                  size="small"
                ></el-input>
              </div>

              <!-- 树结构 -->
              <div class="tree-wrapper">
                <el-tree
                  ref="orgTree"
                  :data="orgTreeData"
                  :props="orgTreeProps"
                  node-key="id"
                  :expand-on-click-node="false"
                  :default-expand-all="true"
                  :filter-node-method="filterOrgNode"
                  highlight-current
                  class="org-tree"
                  @node-click="handleOrgNodeClick"
                >
                  <span class="custom-tree-node" slot-scope="{ node, data }">
                    <span class="node-content">
                      <i
                        :class="['node-icon', data.icon || 'el-icon-folder']"
                      ></i>
                      <span class="node-label">{{ node.label }}</span>
                    </span>
                    <el-tag
                      v-if="data.configured"
                      type="success"
                      size="mini"
                      class="config-tag"
                      >已配置</el-tag
                    >
                  </span>
                </el-tree>
              </div>
            </div>
          </div>

          <!-- 右侧配置区域 -->
          <div class="main-panel">
            <el-card
              class="config-card"
              body-style="padding: 0;"
              v-if="selectedOrg"
            >
              <!-- 卡片头部 -->
              <div class="card-header-row">
                <div class="card-title">
                  <i class="el-icon-settings"></i>
                  <span>数据源配置</span>
                </div>
                <div class="card-actions">
                  <el-button
                    type="primary"
                    size="small"
                    icon="el-icon-plus"
                    @click="openAddSourceDialog"
                  >
                    添加数据源
                  </el-button>
                </div>
              </div>

              <!-- 组织机构信息 -->
              <div class="org-info-section">
                <el-descriptions
                  :column="3"
                  border
                  size="small"
                  class="org-descriptions"
                >
                  <el-descriptions-item
                    label="组织机构名称"
                    label-align="right"
                  >
                    <span class="info-value">{{ selectedOrg.name }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item
                    label="组织机构类型"
                    label-align="right"
                  >
                    <el-tag size="small" type="info">
                      {{
                        selectedOrg.type === "dept"
                          ? "部门"
                          : selectedOrg.type === "team"
                          ? "班组"
                          : "单位"
                      }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item
                    v-if="selectedOrg.code"
                    label="组织机构编码"
                    label-align="right"
                  >
                    <code class="code-value">{{ selectedOrg.code }}</code>
                  </el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 数据源列表 -->
              <div class="source-table-section">
                <div class="section-header">
                  <span class="section-title">关联的无感数据源</span>
                  <el-tag type="info" size="small">
                    共 {{ orgConfigSources.length }} 项
                  </el-tag>
                </div>

                <div v-if="orgConfigSources.length === 0" class="empty-table">
                  <i class="el-icon-document-empty"></i>
                  <p>暂无关联数据源，点击右上角添加</p>
                </div>

                <el-table
                  v-else
                  :data="orgConfigSources"
                  border
                  stripe
                  size="small"
                  class="source-table"
                >
                  <el-table-column
                    type="index"
                    label="序号"
                    width="60"
                    align="center"
                  ></el-table-column>
                  <el-table-column
                    prop="sourceName"
                    label="数据源名称"
                    min-width="180"
                  ></el-table-column>
                  <el-table-column
                    prop="sourceType"
                    label="数据来源"
                    width="120"
                    align="center"
                  >
                    <template slot-scope="scope">
                      <el-tag
                        :type="
                          scope.row.sourceType === 'online'
                            ? 'primary'
                            : 'warning'
                        "
                        size="small"
                      >
                        {{
                          scope.row.sourceType === "online"
                            ? "线上接入"
                            : "线下导入"
                        }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column
                    prop="syncFreq"
                    label="同步频率"
                    width="140"
                    align="center"
                  ></el-table-column>
                  <el-table-column
                    prop="status"
                    label="接入状态"
                    width="100"
                    align="center"
                  >
                    <template slot-scope="scope">
                      <el-tag
                        :type="scope.row.status === 'sync' ? 'success' : 'info'"
                        size="small"
                      >
                        {{ scope.row.status === "sync" ? "已接入" : "待接入" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="140" align="center">
                    <template slot-scope="scope">
                      <el-button
                        type="text"
                        size="small"
                        icon="el-icon-edit"
                        @click="editOrgSourceConfig(scope.row)"
                        >编辑</el-button
                      >
                      <el-button
                        type="text"
                        size="small"
                        icon="el-icon-delete"
                        class="delete-btn"
                        @click="removeOrgSourceConfig(scope.$index)"
                        >移除</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>

            <!-- 未选择组织机构时的空状态 -->
            <el-card v-else class="empty-card">
              <el-empty description="请选择组织机构" class="custom-empty">
                <template #image>
                  <i
                    class="el-icon-sitemap"
                    style="font-size: 48px; color: #d9d9d9"
                  ></i>
                </template>
                <template #description>
                  <span>请选择组织机构</span>
                  <p style="margin-top: 8px; font-size: 12px; color: #999">
                    从左侧组织机构树中选择一个部门或班组
                  </p>
                </template>
              </el-empty>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 无感数据关联配置 -->
      <el-tab-pane label="无感数据关联配置" name="relation">
        <div class="relation-config-wrapper">
          <!-- 配置表单区域 -->
          <el-card class="config-form-card" body-style="padding: 20px;">
            <div class="card-header-row">
              <div class="card-title">
                <i class="el-icon-folder-add"></i>
                <span>专业分类配置</span>
              </div>
            </div>

            <el-form :model="majorForm" label-width="140px" class="config-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="选择专业分类">
                    <el-select
                      v-model="majorForm.majorId"
                      placeholder="请选择专业分类"
                      style="width: 100%"
                      size="small"
                    >
                      <el-option
                        v-for="major in majorCategories"
                        :key="major.id"
                        :label="major.path"
                        :value="major.id"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="移动端数据源">
                    <el-select
                      v-model="majorForm.mobileSources"
                      multiple
                      placeholder="请选择移动端数据源"
                      style="width: 100%"
                      size="small"
                    >
                      <el-option
                        v-for="source in SENSING_ACCESS_SOURCES"
                        :key="source.code"
                        :label="source.name"
                        :value="source.code"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Web端数据源">
                    <el-select
                      v-model="majorForm.webSources"
                      multiple
                      placeholder="请选择Web端数据源"
                      style="width: 100%"
                      size="small"
                    >
                      <el-option
                        v-for="source in SENSING_ACCESS_SOURCES"
                        :key="source.code"
                        :label="source.name"
                        :value="source.code"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item class="form-actions">
                <el-button
                  type="primary"
                  size="small"
                  icon="el-icon-check"
                  @click="saveMajorConfig"
                >
                  保存配置
                </el-button>
                <el-button
                  size="small"
                  icon="el-icon-refresh"
                  @click="resetMajorForm"
                >
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 已配置列表 -->
          <el-card class="config-list-card" body-style="padding: 20px;">
            <div class="card-header-row">
              <div class="card-title">
                <i class="el-icon-list"></i>
                <span>已配置的专业分类列表</span>
              </div>
              <el-tag type="info" size="small">
                共 {{ majorConfigList.length }} 条记录
              </el-tag>
            </div>

            <div v-if="majorConfigList.length === 0" class="empty-table">
              <i class="el-icon-folder-open"></i>
              <p>暂无配置记录</p>
            </div>

            <el-table
              v-else
              :data="majorConfigList"
              border
              stripe
              size="small"
              class="relation-table"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                align="center"
              ></el-table-column>
              <el-table-column
                prop="majorPath"
                label="专业分类路径"
                min-width="250"
              ></el-table-column>
              <el-table-column label="移动端数据源" min-width="200">
                <template slot-scope="scope">
                  <el-tag
                    v-for="code in scope.row.mobileSources"
                    :key="code"
                    size="mini"
                    type="primary"
                    class="source-tag"
                  >
                    {{ getSourceName(code) }}
                  </el-tag>
                  <span
                    v-if="scope.row.mobileSources.length === 0"
                    class="empty-text"
                    >未配置</span
                  >
                </template>
              </el-table-column>
              <el-table-column label="Web端数据源" min-width="200">
                <template slot-scope="scope">
                  <el-tag
                    v-for="code in scope.row.webSources"
                    :key="code"
                    size="mini"
                    type="success"
                    class="source-tag"
                  >
                    {{ getSourceName(code) }}
                  </el-tag>
                  <span
                    v-if="scope.row.webSources.length === 0"
                    class="empty-text"
                    >未配置</span
                  >
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="text"
                    size="small"
                    icon="el-icon-edit"
                    @click="editMajorConfig(scope.row)"
                    >编辑</el-button
                  >
                  <el-button
                    type="text"
                    size="small"
                    icon="el-icon-delete"
                    class="delete-btn"
                    @click="deleteMajorConfig(scope.$index)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加数据源弹窗 -->
    <el-dialog
      title="添加数据源"
      :visible.sync="sourceDialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="sourceForm" label-width="110px" class="dialog-form">
        <el-form-item label="选择数据源">
          <el-select
            v-model="sourceForm.sourceCode"
            placeholder="请选择数据源"
            style="width: 100%"
            size="small"
            @change="onSourceSelect"
          >
            <el-option
              v-for="source in SENSING_ACCESS_SOURCES"
              :key="source.code"
              :label="source.name"
              :value="source.code"
              :disabled="isSourceSelected(source.code)"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="数据来源">
          <el-select
            v-model="sourceForm.sourceType"
            placeholder="请选择数据来源"
            style="width: 100%"
            size="small"
          >
            <el-option label="南网数据中心接入" value="online"></el-option>
            <el-option label="单位线下自行导入" value="offline"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="sourceDialogVisible = false"
          >取消</el-button
        >
        <el-button type="primary" size="small" @click="confirmAddSource"
          >确定</el-button
        >
      </div>
    </el-dialog>

    <!-- 线下数据上传弹窗 -->
    <el-dialog
      :title="`线下数据上传 - ${
        currentOfflineSource ? currentOfflineSource.sourceName : ''
      }`"
      :visible.sync="offlineUploadDialogVisible"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="upload-dialog-content">
        <el-alert
          title="上传说明"
          type="info"
          :closable="false"
          show-icon
          class="upload-alert"
        >
          <template slot="default">
            <p>请按照以下步骤上传线下数据:</p>
            <ol style="padding-left: 20px; margin: 10px 0">
              <li>下载数据模板文件</li>
              <li>按照模板格式填写数据</li>
              <li>上传填写好的数据文件</li>
            </ol>
          </template>
        </el-alert>

        <!-- 步骤1：下载模板 -->
        <div class="upload-step">
          <div class="step-header">
            <span class="step-number">1</span>
            <h4>下载模板</h4>
          </div>
          <el-button
            type="primary"
            size="small"
            icon="el-icon-download"
            @click="downloadTemplate"
          >
            下载数据模板
          </el-button>
        </div>

        <!-- 步骤2：上传文件 -->
        <div class="upload-step">
          <div class="step-header">
            <span class="step-number">2</span>
            <h4>上传数据文件</h4>
          </div>
          <el-upload
            ref="upload"
            :action="uploadUrl"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :file-list="uploadedFiles"
            accept=".xlsx,.xls,.csv"
            drag
            class="uploader"
          >
            <i class="el-icon-upload upload-icon"></i>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <div class="el-upload__tip" slot="tip">
              支持 xlsx、xls、csv 格式，单个文件不超过10MB
            </div>
          </el-upload>
        </div>

        <!-- 步骤3：已上传文件列表 -->
        <div class="upload-step">
          <div class="step-header">
            <span class="step-number">3</span>
            <h4>已上传文件列表</h4>
          </div>

          <div v-if="uploadedFiles.length === 0" class="empty-upload-list">
            <i class="el-icon-file"></i>
            <p>暂无上传文件</p>
          </div>

          <el-table
            v-else
            :data="uploadedFiles"
            border
            stripe
            size="small"
            max-height="250"
            class="upload-table"
          >
            <el-table-column
              prop="name"
              label="文件名"
              min-width="200"
            ></el-table-column>
            <el-table-column prop="size" label="文件大小" width="120">
              <template slot-scope="scope">{{
                formatFileSize(scope.row.size)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="status"
              label="状态"
              width="100"
              align="center"
            >
              <template slot-scope="scope">
                <el-tag
                  :type="
                    scope.row.status === 'success'
                      ? 'success'
                      : scope.row.status === 'error'
                      ? 'danger'
                      : 'warning'
                  "
                  size="small"
                >
                  {{
                    scope.row.status === "success"
                      ? "成功"
                      : scope.row.status === "error"
                      ? "失败"
                      : "上传中"
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="text"
                  size="small"
                  icon="el-icon-delete"
                  class="delete-btn"
                  @click="removeUploadedFile(scope.$index)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="offlineUploadDialogVisible = false"
          >关闭</el-button
        >
        <el-button type="primary" size="small" @click="submitOfflineData"
          >提交数据</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { SENSING_ACCESS_SOURCES } from "../utils/sensingAccessSchemas";
import { getEnabledLeafCategories } from "../utils/majorCategory";
import { generateOrgTree } from "../utils/orgTree";

export default {
  name: "DataConfig",
  data() {
    return {
      orgTreeData: [],
      activeTab: "org",
      orgSearch: "",
      selectedOrg: null,
      orgConfigSources: [],
      sourceDialogVisible: false,
      sourceForm: {
        sourceCode: "",
        sourceType: "online",
      },
      majorForm: {
        majorId: "",
        mobileSources: [],
        webSources: [],
      },
      majorConfigList: [],
      SENSING_ACCESS_SOURCES,
      offlineUploadDialogVisible: false,
      currentOfflineSource: null,
      uploadUrl: "#",
      uploadedFiles: [],
    };
  },
  computed: {
    orgTreeProps() {
      return {
        children: "children",
        label: "name",
      };
    },
    majorCategories() {
      return getEnabledLeafCategories();
    },
    offlineSources() {
      return this.orgConfigSources.filter(
        (source) => source.sourceType === "offline",
      );
    },
  },
  mounted() {
    this.initOrgTreeData();
    this.loadMajorConfigList();
  },
  methods: {
    initOrgTreeData() {
      const tree = generateOrgTree();
      const addConfiguredFlag = (nodes) => {
        return nodes.map((node) => {
          const hasChildren = node.children && node.children.length > 0;
          return {
            ...node,
            configured: false,
            children: hasChildren
              ? addConfiguredFlag(node.children)
              : undefined,
          };
        });
      };
      this.orgTreeData = addConfiguredFlag(tree);
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
      this.orgConfigSources = saved ? JSON.parse(saved) : [];
      this.selectedOrg.configured = this.orgConfigSources.length > 0;
    },
    openAddSourceDialog() {
      this.sourceForm = {
        sourceCode: "",
        sourceType: "online",
      };
      this.sourceDialogVisible = true;
    },
    onSourceSelect(code) {
      const source = this.SENSING_ACCESS_SOURCES.find((s) => s.code === code);
      if (source) {
        this.sourceForm.sourceType = source.category;
      }
    },
    isSourceSelected(code) {
      return this.orgConfigSources.some((s) => s.sourceCode === code);
    },
    getSourceName(code) {
      const source = this.SENSING_ACCESS_SOURCES.find((s) => s.code === code);
      return source ? source.name : code;
    },
    confirmAddSource() {
      if (!this.sourceForm.sourceCode) {
        this.$message.warning("请选择数据源");
        return;
      }

      const source = this.SENSING_ACCESS_SOURCES.find(
        (s) => s.code === this.sourceForm.sourceCode,
      );
      const newConfig = {
        id: Date.now(),
        sourceCode: this.sourceForm.sourceCode,
        sourceName: source.name,
        sourceType: this.sourceForm.sourceType,
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
      };
      this.sourceDialogVisible = true;

      const index = this.orgConfigSources.findIndex((s) => s.id === config.id);
      if (index > -1) {
        this.orgConfigSources.splice(index, 1);
      }
    },
    removeOrgSourceConfig(index) {
      this.$confirm("确定移除该数据源配置吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.orgConfigSources.splice(index, 1);
          this.saveOrgConfig();
          this.$message.success("已移除");
        })
        .catch(() => {});
    },
    saveOrgConfig() {
      localStorage.setItem(
        `org_config_${this.selectedOrg.id}`,
        JSON.stringify(this.orgConfigSources),
      );
      this.selectedOrg.configured = this.orgConfigSources.length > 0;
    },
    saveMajorConfig() {
      if (!this.majorForm.majorId) {
        this.$message.warning("请选择专业分类");
        return;
      }

      const major = this.majorCategories.find(
        (m) => m.id === this.majorForm.majorId,
      );
      const newConfig = {
        id: Date.now(),
        majorId: this.majorForm.majorId,
        majorPath: major.path,
        mobileSources: [...this.majorForm.mobileSources],
        webSources: [...this.majorForm.webSources],
      };

      const existingIndex = this.majorConfigList.findIndex(
        (c) => c.majorId === this.majorForm.majorId,
      );
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
        webSources: [...config.webSources],
      };
    },
    deleteMajorConfig(index) {
      this.$confirm("确定删除该专业分类配置吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.majorConfigList.splice(index, 1);
          this.saveMajorConfigList();
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    resetMajorForm() {
      this.majorForm = {
        majorId: "",
        mobileSources: [],
        webSources: [],
      };
    },
    loadMajorConfigList() {
      const saved = localStorage.getItem("major_config_list");
      if (saved) {
        this.majorConfigList = JSON.parse(saved);
      }
    },
    saveMajorConfigList() {
      localStorage.setItem(
        "major_config_list",
        JSON.stringify(this.majorConfigList),
      );
    },
    openOfflineDataUpload(source) {
      this.currentOfflineSource = source;
      this.offlineUploadDialogVisible = true;
      this.uploadedFiles = [];
    },
    downloadTemplate() {
      this.$message.success("模板下载成功");
    },
    beforeUpload(file) {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        this.$message.error("文件大小不能超过10MB!");
        return false;
      }

      this.uploadedFiles.push({
        name: file.name,
        size: file.size,
        status: "uploading",
      });

      return true;
    },
    handleUploadSuccess(response, file, fileList) {
      const index = this.uploadedFiles.findIndex((f) => f.name === file.name);
      if (index > -1) {
        this.uploadedFiles[index].status = "success";
      }
      this.$message.success(`${file.name} 上传成功`);
    },
    handleUploadError(err, file, fileList) {
      const index = this.uploadedFiles.findIndex((f) => f.name === file.name);
      if (index > -1) {
        this.uploadedFiles[index].status = "error";
      }
      this.$message.error(`${file.name} 上传失败`);
    },
    removeUploadedFile(index) {
      this.uploadedFiles.splice(index, 1);
    },
    formatFileSize(size) {
      if (size < 1024) return size + " B";
      if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB";
      return (size / 1024 / 1024).toFixed(2) + " MB";
    },
    submitOfflineData() {
      if (this.uploadedFiles.length === 0) {
        this.$message.warning("请先上传数据文件");
        return;
      }

      const successFiles = this.uploadedFiles.filter(
        (f) => f.status === "success",
      );
      if (successFiles.length === 0) {
        this.$message.warning("没有上传成功的文件");
        return;
      }

      const sourceName = this.currentOfflineSource
        ? this.currentOfflineSource.sourceName
        : "";
      this.$message.success(
        `已为"${sourceName}"提交 ${successFiles.length} 个文件的数据`,
      );
      this.offlineUploadDialogVisible = false;
    },
  },
};
</script>

<style scoped>
/* 页面整体样式 */
.data-config-page {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 0;
}

/* 页面头部 */
.page-header-wrapper {
  background: #409eff;
  padding: 24px 32px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left .page-title {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px 0;
}

.header-left .page-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

/* 主标签页 */
.main-tabs {
  margin: 20px;
  background: transparent;
}

.main-tabs >>> .el-tabs__header {
  margin: 0 0 16px 0;
}

.main-tabs >>> .el-tabs__item {
  font-size: 14px;
  font-weight: 500;
  padding: 0 24px;
  height: 40px;
  line-height: 40px;
  color: #606266;
}

.main-tabs >>> .el-tabs__item.is-active {
  color: #1a73e8;
  background: #fff;
  border-color: #1a73e8;
}

.main-tabs >>> .el-tabs__content {
  background: transparent;
}

/* 组织机构配置区域 */
.org-config-wrapper {
  display: flex;
  gap: 20px;
  min-height: calc(100vh - 220px);
}

.side-panel {
  width: 320px;
  flex-shrink: 0;
  height: calc(100vh - 220px);
  max-height: calc(100vh - 220px);
  overflow: hidden;
}

.main-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 220px);
  max-height: calc(100vh - 220px);
}

/* 面板卡片 */
.panel-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.panel-icon {
  font-size: 18px;
  margin-right: 10px;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
}

/* 搜索框 */
.search-wrapper {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.search-wrapper >>> .el-input__inner {
  border-radius: 8px;
}

/* 树结构 */
.tree-wrapper {
  padding: 8px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.org-tree {
  background: transparent;
}

.org-tree >>> .el-tree-node__content {
  height: 36px;
  padding: 0 12px;
}

.org-tree >>> .el-tree-node__content:hover {
  background-color: #f5f7fa;
}

.org-tree >>> .el-tree-node.is-current > .el-tree-node__content {
  background-color: #ecf5ff;
  color: #409eff;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
}

.node-content {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.node-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #606266;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
}

.config-tag {
  font-size: 11px;
  padding: 2px 8px;
}

/* 配置卡片 */
.config-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-card >>> .el-card__body {
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.card-title i {
  margin-right: 8px;
  color: #3b82f6;
}

/* 组织机构信息 */
.org-info-section {
  padding: 16px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #e8eef3;
}

.org-descriptions >>> .el-descriptions__label {
  font-weight: 500;
  color: #64748b;
}

.org-descriptions >>> .el-descriptions__content {
  color: #1e293b;
}

.info-value {
  font-weight: 500;
  color: #1e293b;
}

.code-value {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #64748b;
}

/* 数据源列表区域 */
.source-table-section {
  padding: 16px 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.empty-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #94a3b8;
}

.empty-table i {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-table p {
  margin: 0;
  font-size: 14px;
}

.source-table {
  border-radius: 8px;
  overflow: hidden;
}

/* 空状态卡片 */
.empty-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-empty {
  text-align: center;
}

/* 删除按钮 */
.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  color: #dc2626;
}

/* 关联配置区域 */
.relation-config-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-form-card,
.config-list-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.config-form {
  margin-top: 16px;
}

.form-actions {
  padding-top: 16px;
  border-top: 1px solid #e8eef3;
}

/* 数据源标签 */
.source-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}

.empty-text {
  color: #94a3b8;
  font-size: 13px;
}

/* 弹窗样式 */
.dialog-form {
  padding: 12px 0;
}

.dialog-footer {
  text-align: right;
}

/* 上传弹窗 */
.upload-dialog-content {
  padding: 10px 0;
}

.upload-alert {
  margin-bottom: 20px;
}

.upload-step {
  margin-bottom: 24px;
}

.step-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.step-number {
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
}

.step-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.uploader >>> .el-upload-dragger {
  width: 100%;
  border-radius: 8px;
  border: 2px dashed #cbd5e1;
}

.uploader >>> .el-upload-dragger:hover {
  border-color: #3b82f6;
}

.upload-icon {
  font-size: 40px;
  color: #94a3b8;
}

.empty-upload-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #94a3b8;
}

.empty-upload-list i {
  font-size: 32px;
  margin-bottom: 12px;
}

.upload-table {
  border-radius: 8px;
}

/* 滚动条样式 */
.tree-wrapper::-webkit-scrollbar {
  width: 6px;
}

.tree-wrapper::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.tree-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.tree-wrapper::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
