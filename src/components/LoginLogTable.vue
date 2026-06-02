<template>
  <el-table
    :data="data"
    border
    size="small"
    class="login-log-table"
    :empty-text="emptyText"
    stripe
  >
    <el-table-column
      v-if="showIndex"
      type="index"
      label="序号"
      width="60"
      align="center"
      fixed="left"
      :index="indexMethod"
    />
    <el-table-column prop="deptName" label="部门名称" min-width="110" show-overflow-tooltip fixed="left" />
    <el-table-column prop="account" label="用户账号" min-width="150" show-overflow-tooltip />
    <el-table-column prop="maskedName" label="用户名" width="80" align="center" />
    <el-table-column prop="ip" label="用户IP" width="130" />
    <el-table-column label="访问时间" align="center">
      <el-table-column prop="loginTime" label="进入时间" width="160" />
      <el-table-column prop="logoutTime" label="退出时间" width="160">
        <template slot-scope="{ row }">
          {{ row.logoutTime || "—" }}
        </template>
      </el-table-column>
    </el-table-column>
    <el-table-column prop="browser" label="浏览器" min-width="180" show-overflow-tooltip />
    <el-table-column prop="deviceModel" label="移动端设备型号" width="130" show-overflow-tooltip>
      <template slot-scope="{ row }">
        {{ formatMobileField(row.deviceModel) }}
      </template>
    </el-table-column>
    <el-table-column label="用户环境" align="center">
      <el-table-column prop="os" label="操作系统" min-width="140" show-overflow-tooltip />
      <el-table-column prop="resolution" label="分辨率" width="100">
        <template slot-scope="{ row }">
          {{ row.resolution || "—" }}
        </template>
      </el-table-column>
    </el-table-column>
    <el-table-column prop="networkType" label="移动端联网方式" width="120">
      <template slot-scope="{ row }">
        {{ formatMobileField(row.networkType) }}
      </template>
    </el-table-column>
    <el-table-column v-if="showActions" label="操作" width="72" align="center" fixed="right">
      <template slot-scope="{ row }">
        <el-button type="text" size="small" @click="$emit('detail', row)">详情</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import { formatMobileOnlyField } from "../utils/loginLog";

export default {
  name: "LoginLogTable",
  props: {
    data: { type: Array, default: () => [] },
    emptyText: { type: String, default: "暂无登录日志" },
    showIndex: { type: Boolean, default: true },
    showActions: { type: Boolean, default: false },
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 20 },
  },
  methods: {
    indexMethod(index) {
      return (this.page - 1) * this.pageSize + index + 1;
    },
    formatMobileField(value) {
      return formatMobileOnlyField(value);
    },
  },
};
</script>

<style scoped>
.login-log-table {
  width: 100%;
}

.login-log-table >>> .el-table__header th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}
</style>
