<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">请求数据格式设定</h2>
        <p class="page-desc">根据接口接收到的请求数据格式，确定返回给调用方的响应数据格式。</p>
      </div>
      <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">恢复默认</el-button>
    </div>

    <div class="stats-row">
      <span>格式规则 <strong>{{ enabledRuleCount }}</strong> 条</span>
      <span>匹配方式 <strong>{{ formatForm.autoMatch ? "自动匹配" : "手动指定" }}</strong></span>
    </div>

    <section class="config-card">
      <div class="card-head">
        <div class="card-title" style="margin:0;border:none;padding:0">请求数据格式设定</div>
        <el-switch v-model="formatForm.autoMatch" active-text="自动匹配响应格式" inactive-text="手动指定" />
      </div>
      <p class="section-tip">根据接口接收到的请求数据格式，确定返回给调用方的响应数据格式。</p>

      <el-form label-width="120px" size="small" class="config-form">
        <el-form-item v-if="!formatForm.autoMatch" label="默认响应格式">
          <el-select v-model="formatForm.defaultResponseFormat" style="width: 140px">
            <el-option v-for="r in responseFormatOptions" :key="r.value" :label="r.label" :value="r.value" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="formatForm.rules" border size="small">
        <el-table-column prop="requestFormat" label="请求格式" width="100">
          <template slot-scope="{ row }">{{ requestFormatLabel(row.requestFormat) }}</template>
        </el-table-column>
        <el-table-column prop="responseFormat" label="响应格式" width="100">
          <template slot-scope="{ row }">{{ responseFormatLabel(row.responseFormat) }}</template>
        </el-table-column>
        <el-table-column prop="requestContentType" label="请求 Content-Type" min-width="200" show-overflow-tooltip />
        <el-table-column prop="responseContentType" label="响应 Content-Type" min-width="200" show-overflow-tooltip />
        <el-table-column prop="charset" label="编码" width="80" align="center" />
        <el-table-column prop="desc" label="规则说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="启用" width="70" align="center">
          <template slot-scope="{ row }">
            <el-switch v-model="row.enabled" @change="saveFormat" />
          </template>
        </el-table-column>
        <el-table-column label="预览" width="80" align="center">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="previewResponse(row)">示例</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button size="small" type="primary" plain style="margin-top: 12px" @click="saveFormat">保存格式配置</el-button>
    </section>

    <el-dialog title="响应示例" :visible.sync="showPreview" width="560px" append-to-body>
      <p class="preview-meta">Content-Type: {{ previewContentType }}</p>
      <pre class="preview-body">{{ previewBody }}</pre>
      <span slot="footer">
        <el-button type="primary" @click="showPreview = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  loadFormatConfig,
  saveFormatConfig,
  resetFormatConfig,
  buildSampleResponse,
  REQUEST_FORMAT_OPTIONS,
  RESPONSE_FORMAT_OPTIONS,
} from "../utils/interfaceConfigManagement";

export default {
  name: "InterfaceRequestFormat",
  data() {
    return {
      formatForm: loadFormatConfig(),
      requestFormatOptions: REQUEST_FORMAT_OPTIONS,
      responseFormatOptions: RESPONSE_FORMAT_OPTIONS,
      showPreview: false,
      previewBody: "",
      previewContentType: "",
    };
  },
  computed: {
    enabledRuleCount() {
      return (this.formatForm.rules || []).filter((r) => r.enabled).length;
    },
  },
  methods: {
    reload() {
      this.formatForm = loadFormatConfig();
    },
    saveFormat() {
      saveFormatConfig(this.formatForm);
      this.reload();
      this.$message.success("格式配置已保存");
    },
    requestFormatLabel(v) {
      return REQUEST_FORMAT_OPTIONS.find((o) => o.value === v)?.label || v;
    },
    responseFormatLabel(v) {
      return RESPONSE_FORMAT_OPTIONS.find((o) => o.value === v)?.label || v;
    },
    previewResponse(row) {
      const sample = buildSampleResponse(row.requestFormat, true);
      this.previewContentType = sample.contentType;
      this.previewBody = sample.body;
      this.showPreview = true;
    },
    handleReset() {
      this.$confirm("确定恢复默认格式配置？", "恢复默认", { type: "warning" })
        .then(() => {
          resetFormatConfig();
          this.reload();
          this.$message.success("已恢复默认");
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.section-tip { margin: 0 0 12px; font-size: 12px; color: #909399; }
.config-form { max-width: 640px; }
.preview-meta { margin: 0 0 8px; font-size: 12px; color: #909399; }
.preview-body {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
