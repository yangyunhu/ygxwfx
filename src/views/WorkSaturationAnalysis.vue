<template>
  <div class="work-saturation-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="工作时长统计" name="duration" />
        <el-tab-pane label="工时分析" name="hourAnalysis" />
        <el-tab-pane label="工作饱和度分析" name="saturation" />
      </el-tabs>

      <div class="tab-body">
        <div v-show="activeTab === 'duration'" class="tab-panel tab-panel--full">
          <WorkDurationStatsPanel />
        </div>

        <div v-show="activeTab === 'hourAnalysis'" class="tab-panel tab-panel--full">
          <WorkHourAnalysisPanel :panel-active="activeTab === 'hourAnalysis'" />
        </div>

        <div v-show="activeTab === 'saturation'" class="tab-panel tab-panel--full">
          <WorkSaturationPanel :panel-active="activeTab === 'saturation'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WorkDurationStatsPanel from "../components/WorkDurationStatsPanel.vue";
import WorkHourAnalysisPanel from "../components/WorkHourAnalysisPanel.vue";
import WorkSaturationPanel from "../components/WorkSaturationPanel.vue";

export default {
  name: "WorkSaturationAnalysis",
  components: { WorkDurationStatsPanel, WorkHourAnalysisPanel, WorkSaturationPanel },
  data() {
    return {
      activeTab: "duration",
    };
  },
};
</script>

<style scoped>
.work-saturation-page {
  min-height: calc(100vh - 100px);
  padding: 0 4px 20px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.page-shell {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.main-tabs {
  padding: 0 16px;
}

.main-tabs >>> .el-tabs__header {
  margin-bottom: 0;
}

.main-tabs >>> .el-tabs__nav-wrap::after {
  height: 1px;
  background: #e8e8e8;
}

.main-tabs >>> .el-tabs__item {
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  color: #606266;
}

.main-tabs >>> .el-tabs__item.is-active {
  color: #1890ff;
  font-weight: 500;
}

.main-tabs >>> .el-tabs__active-bar {
  background-color: #1890ff;
  height: 2px;
}

.tab-body {
  min-height: 480px;
  padding: 16px;
}

.tab-panel {
  min-height: 440px;
}

.tab-panel--full {
  padding: 0;
  min-height: 520px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 24px;
  text-align: center;
  background: #fafbfc;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.empty-state__icon-inline {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-state__title {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.empty-state__text {
  margin: 0;
  max-width: 420px;
  font-size: 13px;
  color: #909399;
  line-height: 1.7;
}
</style>
