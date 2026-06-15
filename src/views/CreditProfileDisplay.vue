<template>
  <div class="credit-profile-display-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="员工信用画像" name="employee" />
        <el-tab-pane label="单位信用画像" name="unit" />
      </el-tabs>

      <div class="tab-body">
        <div v-show="activeTab === 'employee'" class="tab-panel">
          <employee-credit-portrait-panel :panel-active="activeTab === 'employee'" />
        </div>
        <div v-show="activeTab === 'unit'" class="tab-panel">
          <unit-credit-portrait-panel :panel-active="activeTab === 'unit'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EmployeeCreditPortraitPanel from "../components/EmployeeCreditPortraitPanel.vue";
import UnitCreditPortraitPanel from "../components/UnitCreditPortraitPanel.vue";

export default {
  name: "CreditProfileDisplay",
  components: {
    EmployeeCreditPortraitPanel,
    UnitCreditPortraitPanel,
  },
  data() {
    return {
      activeTab: "employee",
    };
  },
};
</script>

<style scoped>
.credit-profile-display-page {
  height: calc(100vh - 100px);
  padding: 0 4px 20px;
  background: #f5f5f5;
  box-sizing: border-box;
  overflow: hidden;
}

.page-shell {
  height: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-tabs { padding: 0 16px; flex-shrink: 0; }
.main-tabs >>> .el-tabs__header { margin-bottom: 0; }
.main-tabs >>> .el-tabs__nav-wrap::after { height: 1px; background: #e8e8e8; }
.main-tabs >>> .el-tabs__item { height: 44px; line-height: 44px; font-size: 14px; color: #606266; }
.main-tabs >>> .el-tabs__item.is-active { color: #1890ff; font-weight: 500; }
.main-tabs >>> .el-tabs__active-bar { background-color: #1890ff; height: 2px; }

.tab-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
