<template>
  <el-alert
    :title="retention.notice"
    :description="retention.description"
    type="warning"
    show-icon
    :closable="false"
    class="retention-alert"
  />
</template>

<script>
import { getLogRetentionInfo } from "../utils/loginLog";

export default {
  name: "LoginLogRetentionAlert",
  computed: {
    retention() {
      return getLogRetentionInfo();
    },
  },
};
</script>

<style scoped>
.retention-alert {
  margin-bottom: 12px;
}
</style>
