<template>
  <div class="header">
    <div class="header-left">
      <img src="../../logo.png" alt="logo" class="header-logo" />
      <span class="header-platform">电网管理平台</span>
    </div>
    <div class="header-center">
      <el-menu mode="horizontal" class="header-menu">
        <el-menu-item index="1">首页</el-menu-item>
        <el-menu-item index="2">常用应用</el-menu-item>
        <el-menu-item index="3">任务</el-menu-item>
      </el-menu>
    </div>
    <div class="header-right">
      <i class="el-icon-search header-icon"></i>
      <i class="el-icon-message header-icon"></i>
      <div class="notification-icon">
        <i class="el-icon-bell"></i>
        <span class="notification-badge">3</span>
      </div>
      <i class="el-icon-setting header-icon"></i>
      <div class="user-info">
        <div class="user-avatar"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Header",
};
</script>

<style scoped>
.header {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-menu-icon {
  font-size: 20px;
  color: #666;
  margin-right: 12px;
  cursor: pointer;
}

.header-logo {
  max-height: 50px;
  width: auto;
  margin-right: 8px;
}

.header-platform {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.header-menu {
  border-bottom: none;
}

.header-menu .el-menu-item {
  font-size: 14px;
  color: #303133;
  margin: 0 20px;
}

.header-menu .el-menu-item:hover,
.header-menu .el-menu-item.is-active {
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-icon {
  font-size: 20px;
  color: #606266;
  margin-right: 20px;
  cursor: pointer;
}

.header-icon:hover {
  color: #1890ff;
}

.notification-icon {
  position: relative;
  font-size: 20px;
  color: #606266;
  margin-right: 20px;
  cursor: pointer;
}

.notification-icon:hover {
  color: #1890ff;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  background-color: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 10px;
}

.user-info {
  display: flex;
  align-items: center;
  margin-left: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #1890ff;
  cursor: pointer;
}
</style>
