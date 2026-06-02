<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">认证与授权</h2>
        <p class="page-desc">通过 API Key 认证机制验证调用方身份与权限，确保接口安全访问。</p>
      </div>
      <el-button type="primary" size="small" icon="el-icon-plus" @click="openCreate">新增密钥</el-button>
    </div>

    <div class="stats-row">
      <span>密钥总数 <strong>{{ keys.length }}</strong></span>
      <span>启用 <strong>{{ enabledCount }}</strong></span>
    </div>

    <section class="config-card">
      <div class="card-title">API Key 管理</div>
      <el-table :data="keys" border size="small">
        <el-table-column prop="name" label="应用名称" min-width="140" />
        <el-table-column prop="appId" label="应用ID" width="120" />
        <el-table-column prop="apiKey" label="API Key" min-width="240" show-overflow-tooltip />
        <el-table-column label="权限" min-width="120">
          <template slot-scope="{ row }">
            <el-tag v-for="p in row.permissions" :key="p" size="mini" style="margin-right: 4px">{{ permLabel(p) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="mini">{{ row.enabled ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="testKey(row)">测试</el-button>
            <el-button type="text" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="text" size="small" class="danger-text" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="config-card">
      <div class="card-title">认证测试</div>
      <el-form :inline="true" size="small">
        <el-form-item label="API Key">
          <el-input v-model="testApiKey" placeholder="输入 API Key" style="width: 320px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="runTest">验证</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="testResult" :title="testResult.message" :type="testResult.success ? 'success' : 'error'" show-icon :closable="false" style="margin-top: 10px" />
    </section>

    <el-dialog :title="formTitle" :visible.sync="showForm" width="520px" append-to-body @closed="resetForm">
      <el-form ref="keyForm" :model="form" :rules="rules" label-width="88px" size="small">
        <el-form-item label="应用名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="应用ID"><el-input v-model="form.appId" placeholder="自动生成" /></el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox label="receive">数据接收</el-checkbox>
            <el-checkbox label="transform">数据转换</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  loadApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  authenticateApiKey,
} from "../utils/externalApiManagement";

export default {
  name: "ExternalApiAuth",
  data() {
    return {
      keys: [],
      testApiKey: "",
      testResult: null,
      showForm: false,
      formMode: "create",
      editingId: null,
      form: { name: "", appId: "", permissions: ["receive"], enabled: true, remark: "" },
      rules: { name: [{ required: true, message: "请输入应用名称", trigger: "blur" }] },
    };
  },
  computed: {
    enabledCount() { return this.keys.filter((k) => k.enabled).length; },
    formTitle() { return this.formMode === "create" ? "新增 API Key" : "编辑 API Key"; },
  },
  mounted() { this.reload(); },
  methods: {
    reload() { this.keys = loadApiKeys(); },
    permLabel(p) { return p === "receive" ? "接收" : p === "transform" ? "转换" : p; },
    openCreate() {
      this.formMode = "create";
      this.form = { name: "", appId: "", permissions: ["receive"], enabled: true, remark: "" };
      this.showForm = true;
    },
    openEdit(row) {
      this.formMode = "edit";
      this.editingId = row.id;
      this.form = { name: row.name, appId: row.appId, permissions: [...row.permissions], enabled: row.enabled, remark: row.remark };
      this.showForm = true;
    },
    resetForm() { this.$refs.keyForm && this.$refs.keyForm.resetFields(); },
    submitForm() {
      this.$refs.keyForm.validate((ok) => {
        if (!ok) return;
        try {
          if (this.formMode === "create") createApiKey(this.form);
          else updateApiKey(this.editingId, this.form);
          this.reload();
          this.showForm = false;
          this.$message.success("保存成功");
        } catch (e) { this.$message.warning(e.message); }
      });
    },
    handleDelete(row) {
      this.$confirm(`确定删除「${row.name}」的 API Key？`, "删除", { type: "warning" })
        .then(() => { deleteApiKey(row.id); this.reload(); this.$message.success("已删除"); })
        .catch(() => {});
    },
    testKey(row) {
      this.testApiKey = row.apiKey;
      this.runTest();
    },
    runTest() {
      this.testResult = authenticateApiKey(this.testApiKey);
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>.danger-text { color: #f56c6c; }</style>
