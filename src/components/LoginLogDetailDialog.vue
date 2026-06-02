<template>
  <el-dialog title="登录日志详情" :visible.sync="visibleProxy" width="680px" append-to-body>
    <el-descriptions v-if="row" :column="2" border size="small">
      <el-descriptions-item label="部门名称">{{ row.deptName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="用户账号">{{ row.account || "—" }}</el-descriptions-item>
      <el-descriptions-item label="用户名">{{ row.maskedName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="姓名">{{ row.displayName || "—" }}</el-descriptions-item>
      <el-descriptions-item label="用户IP">{{ row.ip || "—" }}</el-descriptions-item>
      <el-descriptions-item label="终端类型">{{ row.terminal || "—" }}</el-descriptions-item>
      <el-descriptions-item label="进入时间">{{ row.loginTime || "—" }}</el-descriptions-item>
      <el-descriptions-item label="退出时间">{{ row.logoutTime || "—" }}</el-descriptions-item>
      <el-descriptions-item label="浏览器" :span="2">{{ row.browser || "—" }}</el-descriptions-item>
      <el-descriptions-item label="移动端设备型号">{{ formatMobileField(row.deviceModel) }}</el-descriptions-item>
      <el-descriptions-item label="移动端联网方式">{{ formatMobileField(row.networkType) }}</el-descriptions-item>
      <el-descriptions-item label="操作系统">{{ row.os || "—" }}</el-descriptions-item>
      <el-descriptions-item label="分辨率">{{ row.resolution || "—" }}</el-descriptions-item>
    </el-descriptions>
    <span slot="footer">
      <el-button type="primary" @click="visibleProxy = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { formatMobileOnlyField } from "../utils/loginLog";

export default {
  name: "LoginLogDetailDialog",
  props: {
    visible: { type: Boolean, default: false },
    row: { type: Object, default: null },
  },
  computed: {
    visibleProxy: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
  },
  methods: {
    formatMobileField(value) {
      return formatMobileOnlyField(value);
    },
  },
};
</script>
