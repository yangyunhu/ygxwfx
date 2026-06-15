<template>
  <div class="credit-profile-display-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="员工信用画像" name="employee" />
        <el-tab-pane label="单位信用画像" name="unit" />
      </el-tabs>

      <div class="tab-body">
        <div v-show="activeTab === 'employee'" class="tab-panel">
          <div class="developing-placeholder">
            <i class="el-icon-user developing-placeholder__icon" />
            <p class="developing-placeholder__title">员工信用画像</p>
            <p class="developing-placeholder__desc">功能开发中，敬请期待</p>
          </div>
        </div>

        <div v-show="activeTab === 'unit'" class="tab-panel">
          <div class="developing-placeholder">
            <i class="el-icon-office-building developing-placeholder__icon" />
            <p class="developing-placeholder__title">单位信用画像</p>
            <p class="developing-placeholder__desc">功能开发中，敬请期待</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CreditProfileDisplay",
  data() {
    return {
      activeTab: "employee",
    };
  },
};
</script>

<style scoped>
.credit-profile-display-page {
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

.main-tabs { padding: 0 16px; }
.main-tabs >>> .el-tabs__header { margin-bottom: 0; }
.main-tabs >>> .el-tabs__nav-wrap::after { height: 1px; background: #e8e8e8; }
.main-tabs >>> .el-tabs__item { height: 44px; line-height: 44px; font-size: 14px; color: #606266; }
.main-tabs >>> .el-tabs__item.is-active { color: #1890ff; font-weight: 500; }
.main-tabs >>> .el-tabs__active-bar { background-color: #1890ff; height: 2px; }

.tab-body { min-height: 480px; padding: 16px; }
.tab-panel { min-height: 440px; }

.developing-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: #909399;
}

.developing-placeholder__icon {
  font-size: 56px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.developing-placeholder__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.developing-placeholder__desc {
  margin: 0;
  font-size: 14px;
  color: #909399;
}
</style>
