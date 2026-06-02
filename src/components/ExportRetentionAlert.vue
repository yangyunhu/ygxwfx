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
import { getExportRetentionInfo } from "../utils/exportRecordManagement";

export default {
  name: "ExportRetentionAlert",
  computed: {
    retention() {
      return getExportRetentionInfo();
    },
  },
};
</script>

<style scoped>
.retention-alert {
  margin-bottom: 12px;
}
</style>
