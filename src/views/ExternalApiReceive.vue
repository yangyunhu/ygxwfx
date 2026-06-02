<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据接收与解析</h2>
        <p class="page-desc">接收外部应用推送数据，按预定规则解析并校验格式与内容，提取有效信息。</p>
      </div>
      <el-button size="small" @click="loadSample">加载示例数据</el-button>
    </div>

    <div class="stats-row">
      <span>接收日志 <strong>{{ logs.length }}</strong></span>
      <span>今日接收 <strong>{{ stats.todayReceive }}</strong></span>
    </div>

    <section class="config-card">
      <div class="card-title">API 请求模拟</div>
      <el-form label-width="88px" size="small">
        <el-form-item label="API Key">
          <el-select v-model="apiKey" style="width: 360px" placeholder="选择密钥">
            <el-option v-for="k in apiKeys.filter(x => x.enabled)" :key="k.id" :label="`${k.name} (${k.apiKey.slice(0, 16)}...)`" :value="k.apiKey" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源类型">
          <el-select v-model="sourceType" style="width: 200px">
            <el-option v-for="s in sourceTypes" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求体 JSON">
          <el-input v-model="payloadText" type="textarea" :rows="12" placeholder="粘贴外部系统推送的 JSON 数据" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="processing" @click="handleReceive">接收并解析</el-button>
          <el-button @click="handleParseOnly">仅解析校验</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section v-if="parseResult" class="config-card">
      <div class="card-title">解析结果</div>
      <el-alert :title="parseResult.message" :type="parseResult.success ? 'success' : 'error'" show-icon :closable="false" />
      <div v-if="parseResult.errors && parseResult.errors.length" class="error-list">
        <div v-for="(e, i) in parseResult.errors" :key="i">{{ e }}</div>
      </div>
      <div v-if="parseResult.warnings && parseResult.warnings.length" class="warn-list">
        <div v-for="(w, i) in parseResult.warnings" :key="i">{{ w }}</div>
      </div>
      <p v-if="parseResult.recordCount != null" class="result-meta">共 {{ parseResult.recordCount }} 条记录</p>
    </section>

    <section class="config-card">
      <div class="card-title">接收日志</div>
      <el-table :data="logs.slice(0, 20)" border size="small" empty-text="暂无接收记录">
        <el-table-column prop="createdAt" label="时间" width="160" />
        <el-table-column prop="apiKeyName" label="调用方" width="120" />
        <el-table-column prop="batchId" label="批次号" width="160" show-overflow-tooltip />
        <el-table-column prop="statusLabel" label="状态" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="statusType(row.status)" size="mini">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="recordCount" label="条数" width="70" align="center" />
      </el-table>
    </section>
  </div>
</template>

<script>
import {
  loadApiKeys,
  loadReceiveLogs,
  countExternalApiStats,
  processExternalApiRequest,
  parseExternalPayload,
  SAMPLE_PAYLOAD,
  EXTERNAL_SOURCE_TYPES,
} from "../utils/externalApiManagement";

export default {
  name: "ExternalApiReceive",
  data() {
    return {
      apiKeys: [],
      logs: [],
      stats: countExternalApiStats(),
      apiKey: "",
      sourceType: "hr_system",
      payloadText: "",
      processing: false,
      parseResult: null,
      sourceTypes: EXTERNAL_SOURCE_TYPES,
    };
  },
  mounted() {
    this.reload();
    this.loadSample();
  },
  methods: {
    reload() {
      this.apiKeys = loadApiKeys();
      this.logs = loadReceiveLogs();
      this.stats = countExternalApiStats();
      if (!this.apiKey && this.apiKeys.length) {
        const enabled = this.apiKeys.find((k) => k.enabled);
        if (enabled) this.apiKey = enabled.apiKey;
      }
    },
    loadSample() {
      this.payloadText = JSON.stringify({ ...SAMPLE_PAYLOAD, sourceType: this.sourceType }, null, 2);
    },
    getPayload() {
      return JSON.parse(this.payloadText);
    },
    handleParseOnly() {
      try {
        this.parseResult = parseExternalPayload(this.getPayload());
      } catch (e) {
        this.$message.warning("JSON 格式错误");
      }
    },
    handleReceive() {
      if (!this.apiKey) {
        this.$message.warning("请选择 API Key");
        return;
      }
      this.processing = true;
      try {
        const result = processExternalApiRequest(this.apiKey, this.getPayload());
        this.parseResult = result.parsed || { message: result.message, success: result.success, errors: result.parsed?.errors };
        this.reload();
        if (result.success) this.$message.success(result.log.message);
        else this.$message.warning(result.message);
      } catch (e) {
        this.$message.warning(e.message || "处理失败");
      }
      this.processing = false;
    },
    statusType(s) {
      const map = { success: "success", partial: "warning", parse_failed: "danger", auth_failed: "danger" };
      return map[s] || "info";
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.error-list { margin-top: 10px; font-size: 12px; color: #f56c6c; line-height: 1.8; }
.warn-list { margin-top: 8px; font-size: 12px; color: #e6a23c; line-height: 1.8; }
.result-meta { margin: 10px 0 0; font-size: 13px; color: #606266; }
</style>
