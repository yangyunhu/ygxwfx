<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">服务器端口配置</h2>
        <p class="page-desc">配置 API 接口服务地址、监听端口及接口端点列表。</p>
      </div>
      <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">恢复默认</el-button>
    </div>

    <div class="stats-row">
      <span>服务地址 <strong>{{ summary.endpoint }}</strong></span>
      <span>服务状态 <strong>{{ serverForm.enabled ? "启用" : "停用" }}</strong></span>
    </div>

    <section class="config-card">
      <div class="card-title">服务器端口配置</div>
      <p class="section-tip">配置 API 接口所在服务器的 IP 地址或域名，以及接口监听的端口号。</p>
      <el-form ref="serverFormRef" :model="serverForm" :rules="serverRules" label-width="120px" size="small" class="config-form">
        <el-form-item label="地址类型" prop="hostType">
          <el-radio-group v-model="serverForm.hostType">
            <el-radio v-for="o in hostTypeOptions" :key="o.value" :label="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="serverForm.hostType === 'ip' ? 'IP 地址' : '域名'" prop="serverHost">
          <el-input v-model="serverForm.serverHost" style="width: 360px" placeholder="如 api.ygxwfx.csg.cn 或 10.12.8.100" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="serverForm.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="serverForm.protocol" style="width: 120px">
            <el-option v-for="p in protocolOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 基础路径" prop="apiBasePath">
          <el-input v-model="serverForm.apiBasePath" style="width: 360px" placeholder="/api/v1/external" />
        </el-form-item>
        <el-form-item label="连接超时">
          <el-input-number v-model="serverForm.timeout" :min="5" :max="120" /> 秒
        </el-form-item>
        <el-form-item label="最大连接数">
          <el-input-number v-model="serverForm.maxConnections" :min="10" :max="1000" :step="10" />
        </el-form-item>
        <el-form-item label="服务状态">
          <el-switch v-model="serverForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="serverForm.remark" type="textarea" :rows="2" style="width: 480px" />
        </el-form-item>
        <el-form-item label="完整地址">
          <el-input :value="fullEndpoint" readonly style="width: 480px">
            <el-button slot="append" icon="el-icon-document-copy" @click="copyEndpoint">复制</el-button>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveServer">保存服务器配置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="config-card">
      <div class="card-title">接口端点列表</div>
      <el-table :data="endpoints" border size="small">
        <el-table-column prop="method" label="方法" width="70" align="center" />
        <el-table-column prop="name" label="接口名称" width="120" />
        <el-table-column prop="path" label="路径" width="120" />
        <el-table-column prop="fullUrl" label="完整 URL" min-width="320" show-overflow-tooltip />
        <el-table-column prop="desc" label="说明" min-width="160" show-overflow-tooltip />
      </el-table>
    </section>
  </div>
</template>

<script>
import {
  loadServerConfig,
  saveServerConfig,
  resetServerConfig,
  validateServerConfig,
  buildServerEndpoint,
  getInterfaceConfigSummary,
  getApiEndpointList,
  HOST_TYPE_OPTIONS,
  PROTOCOL_OPTIONS,
} from "../utils/interfaceConfigManagement";

export default {
  name: "InterfaceServerConfig",
  data() {
    const portValidator = (rule, value, callback) => {
      const n = Number(value);
      if (!n || n < 1 || n > 65535) callback(new Error("端口须在 1-65535"));
      else callback();
    };
    return {
      serverForm: loadServerConfig(),
      summary: getInterfaceConfigSummary(),
      endpoints: getApiEndpointList(),
      hostTypeOptions: HOST_TYPE_OPTIONS,
      protocolOptions: PROTOCOL_OPTIONS,
      serverRules: {
        serverHost: [{ required: true, message: "请填写地址", trigger: "blur" }],
        port: [{ validator: portValidator, trigger: "blur" }],
        apiBasePath: [{ required: true, message: "请填写基础路径", trigger: "blur" }],
      },
    };
  },
  computed: {
    fullEndpoint() {
      return buildServerEndpoint(this.serverForm);
    },
  },
  methods: {
    reload() {
      this.serverForm = loadServerConfig();
      this.summary = getInterfaceConfigSummary();
      this.endpoints = getApiEndpointList(this.serverForm);
    },
    saveServer() {
      this.$refs.serverFormRef.validate((ok) => {
        if (!ok) return;
        const errors = validateServerConfig(this.serverForm);
        if (errors.length) {
          this.$message.warning(errors[0]);
          return;
        }
        saveServerConfig(this.serverForm);
        this.reload();
        this.$message.success("服务器配置已保存");
      });
    },
    copyEndpoint() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.fullEndpoint);
        this.$message.success("已复制");
      }
    },
    handleReset() {
      this.$confirm("确定恢复默认服务器端口配置？", "恢复默认", { type: "warning" })
        .then(() => {
          resetServerConfig();
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
</style>
