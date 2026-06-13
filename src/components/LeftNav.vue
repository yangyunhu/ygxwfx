<template>
  <div class="left-nav" :class="{ collapsed: collapsed }">
    <el-menu
      :default-active="activeMenu"
      class="nav-menu"
      mode="vertical"
      :collapse="collapsed"
      :collapse-transition="false"
      :unique-opened="false"
      text-color="#ffffff"
      active-text-color="#ffffff"
      router
      @select="handleMenuSelect"
    >
      <el-submenu index="0">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>员工出勤行为管理</span>
        </template>
        <el-menu-item index="/employee-attendance-behavior/data">
          <i class="el-icon-document"></i>
          <span>员工出勤数据管理</span>
        </el-menu-item>
        <el-menu-item index="/employee-attendance-behavior/abnormal">
          <i class="el-icon-document"></i>
          <span>员工异常数据管理</span>
        </el-menu-item>
        <el-menu-item index="/employee-attendance-behavior/config">
          <i class="el-icon-document"></i>
          <span>出勤配置管理</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="0-1">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>员工行为可视化数据看板</span>
        </template>
        <el-menu-item index="/behavior-visual-dashboard">
          <i class="el-icon-document"></i>
          <span>员工行为可视化数据看板</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="0-2">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>员工行为智能分析场景应用</span>
        </template>
        <el-menu-item index="/behavior-intelligence-scenarios">
          <i class="el-icon-document"></i>
          <span>员工行为智能分析场景应用</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="0-3">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>员工信用画像</span>
        </template>
        <el-menu-item index="/employee-credit-profile">
          <i class="el-icon-document"></i>
          <span>员工信用画像</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="1">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>无感数据管理</span>
        </template>
        <el-submenu index="1-1">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>无感数据配置</span>
          </template>
          <el-menu-item index="/data-access">
            <i class="el-icon-document"></i>
            <span>数据接入管理</span>
          </el-menu-item>
          <el-menu-item index="/data-config">
            <i class="el-icon-document"></i>
            <span>无感数据配置</span>
          </el-menu-item>
          <el-menu-item index="/data-custom">
            <i class="el-icon-document"></i>
            <span>无感数据自定义</span>
          </el-menu-item>
        </el-submenu>
        <el-submenu index="1-2">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>无感基础数据管理</span>
          </template>
          <el-menu-item index="/sensing-basic/rules">
            <i class="el-icon-document"></i>
            <span>规则设置</span>
          </el-menu-item>
          <el-menu-item index="/sensing-basic/clean">
            <i class="el-icon-document"></i>
            <span>数据清洗</span>
          </el-menu-item>
          <el-menu-item index="/sensing-basic/organize">
            <i class="el-icon-document"></i>
            <span>数据整理</span>
          </el-menu-item>
          <el-menu-item index="/sensing-basic/output">
            <i class="el-icon-document"></i>
            <span>数据结果输出</span>
          </el-menu-item>
        </el-submenu>
        <el-submenu index="1-3">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>多源数据管理</span>
          </template>
          <el-submenu index="1-3-1">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>外部输入API接口</span>
            </template>
            <el-menu-item index="/external-api-receive">
              <i class="el-icon-document"></i>
              <span>数据接收与解析</span>
            </el-menu-item>
            <el-menu-item index="/external-api-auth">
              <i class="el-icon-document"></i>
              <span>认证与授权</span>
            </el-menu-item>
            <el-menu-item index="/external-api-transform">
              <i class="el-icon-document"></i>
              <span>数据处理与转换</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="1-3-2">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>接口配置</span>
            </template>
            <el-menu-item index="/interface-config/server">
              <i class="el-icon-document"></i>
              <span>服务器端口配置</span>
            </el-menu-item>
            <el-menu-item index="/interface-config/format">
              <i class="el-icon-document"></i>
              <span>请求数据格式设定</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="1-3-3">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>多源数据汇总</span>
            </template>
            <el-menu-item index="/multi-source-aggregation/collect">
              <i class="el-icon-document"></i>
              <span>数据汇集</span>
            </el-menu-item>
            <el-menu-item index="/multi-source-aggregation/display">
              <i class="el-icon-document"></i>
              <span>数据展示及导入导出</span>
            </el-menu-item>
          </el-submenu>
        </el-submenu>
      </el-submenu>

      <el-submenu index="5">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>个人出勤管理APP</span>
        </template>
        <el-menu-item index="/personal-attendance-app">
          <i class="el-icon-document"></i>
          <span>个人出勤管理APP</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="6">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>员工（班组）行为画像</span>
        </template>
        <el-menu-item index="/team-behavior-portrait">
          <i class="el-icon-document"></i>
          <span>员工（班组）行为画像</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="4">
        <template slot="title">
          <i class="el-icon-folder-opened"></i>
          <span>系统管理</span>
        </template>
        <el-submenu index="4-1">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>组织机构配置</span>
          </template>
          <el-submenu index="4-1-1">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>人员信息台账</span>
            </template>
            <el-menu-item index="/staff-basic-ledger">
              <i class="el-icon-document"></i>
              <span>员工基本信息台账</span>
            </el-menu-item>
            <el-menu-item index="/staff-attendance-ledger">
              <i class="el-icon-document"></i>
              <span>考勤管理台账</span>
            </el-menu-item>
            <el-menu-item index="/staff-assessment-ledger">
              <i class="el-icon-document"></i>
              <span>考勤评估台账</span>
            </el-menu-item>
            <el-menu-item index="/behavior-mode-settings">
              <i class="el-icon-document"></i>
              <span>行为模式设置信息</span>
            </el-menu-item>
            <el-menu-item index="/major-category">
              <i class="el-icon-document"></i>
              <span>专业分类</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="4-1-3">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>组织机构台账</span>
            </template>
            <el-menu-item index="/org-management">
              <i class="el-icon-document"></i>
              <span>组织机构管理</span>
            </el-menu-item>
            <el-menu-item index="/org-relation-config">
              <i class="el-icon-document"></i>
              <span>组织机构关联配置</span>
            </el-menu-item>
            <el-menu-item index="/staff-post-relation-config">
              <i class="el-icon-document"></i>
              <span>人员与岗位关联配置</span>
            </el-menu-item>
          </el-submenu>
        </el-submenu>
        <el-submenu index="4-5">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>权限管理</span>
          </template>
          <el-submenu index="4-5-1">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>角色配置</span>
            </template>
            <el-menu-item index="/role-management">
              <i class="el-icon-document"></i>
              <span>角色管理</span>
            </el-menu-item>
            <el-menu-item index="/role-hierarchy">
              <i class="el-icon-document"></i>
              <span>角色层级管理</span>
            </el-menu-item>
            <el-menu-item index="/role-user-association">
              <i class="el-icon-document"></i>
              <span>角色与用户关联</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="4-5-2">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>功能模块权限配置</span>
            </template>
            <el-menu-item index="/module-permission-allocation">
              <i class="el-icon-document"></i>
              <span>功能模块权限分配</span>
            </el-menu-item>
            <el-menu-item index="/org-level-permission">
              <i class="el-icon-document"></i>
              <span>组织机构层级管理</span>
            </el-menu-item>
            <el-menu-item index="/permission-control">
              <i class="el-icon-document"></i>
              <span>权限控制与分配</span>
            </el-menu-item>
          </el-submenu>
        </el-submenu>
        <el-submenu index="4-6">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>日志管理</span>
          </template>
          <el-submenu index="4-6-1">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>登录日志查询</span>
            </template>
            <el-menu-item index="/login-log-content">
              <i class="el-icon-document"></i>
              <span>日志内容</span>
            </el-menu-item>
            <el-menu-item index="/login-log-query">
              <i class="el-icon-document"></i>
              <span>查询功能</span>
            </el-menu-item>
            <el-menu-item index="/login-log-management">
              <i class="el-icon-document"></i>
              <span>日志管理功能</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="4-6-2">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>异常数据修复记录</span>
            </template>
            <el-menu-item index="/abnormal-data-processing">
              <i class="el-icon-document"></i>
              <span>数据质量检查及异常处置</span>
            </el-menu-item>
            <el-menu-item index="/data-repair-records">
              <i class="el-icon-document"></i>
              <span>数据修复记录</span>
            </el-menu-item>
            <el-menu-item index="/abnormal-data-disposal">
              <i class="el-icon-document"></i>
              <span>异常数据处置</span>
            </el-menu-item>
          </el-submenu>
          <el-submenu index="4-6-3">
            <template slot="title">
              <i class="el-icon-folder-opened"></i>
              <span>数据导出记录查询</span>
            </template>
            <el-menu-item index="/data-export-function">
              <i class="el-icon-document"></i>
              <span>数据导出功能</span>
            </el-menu-item>
            <el-menu-item index="/export-record-query">
              <i class="el-icon-document"></i>
              <span>导出记录查询</span>
            </el-menu-item>
          </el-submenu>
        </el-submenu>
        <el-submenu index="4-7">
          <template slot="title">
            <i class="el-icon-folder-opened"></i>
            <span>数据字典</span>
          </template>
          <el-menu-item index="/data-dictionary">
            <i class="el-icon-document"></i>
            <span>数据字典</span>
          </el-menu-item>
        </el-submenu>
      </el-submenu>
    </el-menu>
    <button
      type="button"
      class="nav-toggle"
      :class="{ 'is-collapsed': collapsed }"
      :title="collapsed ? '展开菜单' : '折叠菜单'"
      @click.stop="$emit('toggle')"
    >
      <span class="nav-toggle-arrow"></span>
    </button>
  </div>
</template>

<script>
export default {
  name: "LeftNav",
  props: {
    collapsed: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      activeMenu: this.$route.path,
    };
  },
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        this.activeMenu = to.path;
      },
    },
  },
  methods: {
    handleMenuSelect(index) {
      this.activeMenu = index;
    },
  },
};
</script>

<style scoped>
.left-nav {
  width: 280px;
  height: calc(100vh - 60px);
  position: fixed;
  left: 0;
  top: 60px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background-color: #5ba8d4;
  background-image: url(~@/assets/u501.png);
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: cover;
  border-right: none;
  transition: width 0.28s ease;
  overflow: visible;
}

.left-nav.collapsed {
  width: 64px;
  overflow: visible;
}

.nav-menu {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: transparent !important;
  border-right: none !important;
}

.nav-menu::-webkit-scrollbar {
  width: 6px;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.35);
  border-radius: 3px;
}

.nav-toggle {
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  width: 14px;
  height: 50px;
  border: none;
  border-radius: 0 8px 8px 0;
  background-color: #5ba8d4;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  padding: 0;
  outline: none;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.nav-toggle:hover {
  background-color: #4f9bc8;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.18);
}

.nav-toggle-arrow {
  display: block;
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-right: 6px solid rgba(255, 255, 255, 0.95);
  margin-left: -1px;
  transition: transform 0.2s ease;
}

.nav-toggle.is-collapsed .nav-toggle-arrow {
  border-right: none;
  border-left: 6px solid rgba(255, 255, 255, 0.95);
  margin-left: 1px;
}

.left-nav >>> .el-menu {
  background-color: transparent !important;
  border-right: none !important;
}

.left-nav >>> .el-menu-item,
.left-nav >>> .el-submenu__title {
  color: #ffffff !important;
  font-size: 14px !important;
  height: 40px !important;
  line-height: 40px !important;
  background-color: transparent !important;
}

.left-nav >>> .el-menu-item span,
.left-nav >>> .el-submenu__title span {
  color: #ffffff !important;
}

.left-nav >>> .el-menu-item:hover,
.left-nav >>> .el-submenu__title:hover,
.left-nav >>> .el-menu-item:focus,
.left-nav >>> .el-submenu__title:focus {
  background-color: transparent !important;
  color: #ffffff !important;
}

/* 仅当前路由对应的叶子菜单项显示选中背景，父级目录/展开项保持透明 */
.left-nav >>> .el-submenu.is-active > .el-submenu__title,
.left-nav >>> .el-submenu.is-opened > .el-submenu__title {
  background-color: transparent !important;
  color: #ffffff !important;
}

.left-nav >>> .el-menu-item.is-active {
  background-color: rgba(45, 55, 70, 0.55) !important;
  color: #ffffff !important;
}

.left-nav >>> .el-menu-item.is-active span {
  color: #ffffff !important;
}

.left-nav >>> .el-menu-item i,
.left-nav >>> .el-submenu__title i,
.left-nav >>> [class^="el-icon-"],
.left-nav >>> [class*=" el-icon-"] {
  color: #ffffff !important;
}

.left-nav >>> .el-submenu__icon-arrow {
  color: #ffffff !important;
}

.left-nav >>> .el-submenu .el-menu {
  background-color: transparent !important;
}

.left-nav >>> .el-submenu .el-menu-item,
.left-nav >>> .el-submenu .el-submenu__title {
  background-color: transparent !important;
  color: #ffffff !important;
}

.left-nav >>> .el-submenu .el-menu-item:hover,
.left-nav >>> .el-submenu .el-submenu__title:hover {
  background-color: transparent !important;
  color: #ffffff !important;
}

.left-nav >>> .el-submenu .el-menu-item.is-active {
  background-color: rgba(45, 55, 70, 0.55) !important;
  color: #ffffff !important;
}

.left-nav.collapsed >>> .el-menu--collapse {
  width: 64px;
}

.left-nav.collapsed >>> .el-menu--collapse .el-submenu__title {
  padding: 0 !important;
  text-align: center;
}

.left-nav.collapsed >>> .el-menu--collapse .el-menu-item,
.left-nav.collapsed >>> .el-menu--collapse .el-submenu__title {
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-nav.collapsed >>> .el-menu--collapse .el-submenu__icon-arrow {
  display: none;
}
</style>

<style>
/* 折叠态禁用 Element 弹出子菜单，避免多层白框遮挡主内容 */
body.nav-sidebar-collapsed .el-menu--popup {
  display: none !important;
}
</style>
