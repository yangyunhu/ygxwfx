<template>
  <div class="personal-settings-showcase">
    <header class="showcase-header">
      <h1 class="showcase-title">个人出勤管理 APP · 我的设置</h1>
      <p class="showcase-desc">以下为「我的设置」模块原型页面，包含主页面、基本信息、出勤规则与出勤模式选择。</p>
    </header>

    <div class="mockup-grid-wrap">
      <div class="mockup-grid">
      <!-- 1. 我的设置 -->
      <div class="mockup-item">
        <div class="phone-frame">
          <div class="phone-notch" />
          <div class="status-bar">
            <span>9:41</span>
            <span class="status-bar__icons">
              <i class="el-icon-mobile-phone" />
              <i class="el-icon-connection" />
              <i class="el-icon-lightning" />
            </span>
          </div>

          <div class="screen screen--scroll">
            <div class="profile-header">
              <div class="profile-avatar"><i class="el-icon-user-solid" /></div>
              <div class="profile-meta">
                <div class="profile-name">{{ user.name }}</div>
                <div class="profile-dept">部门路径：{{ user.deptPath }}</div>
              </div>
            </div>

            <div class="card card--menu">
              <div class="menu-item">
                <span>基本信息</span>
                <span class="menu-item__extra">前去设置 <i class="el-icon-arrow-right" /></span>
              </div>
              <div class="menu-item">
                <span>出勤规则</span>
                <span class="menu-item__extra">前去设置 <i class="el-icon-arrow-right" /></span>
              </div>
              <div class="menu-item menu-item--action" @click="clearCache">
                <span>清除缓存</span>
                <span class="menu-item__cache">{{ cacheSize }}</span>
              </div>
            </div>

            <transition name="fade">
              <div v-if="showCacheToast" class="cache-toast">缓存清除成功~</div>
            </transition>
          </div>

          <div class="tab-bar">
            <div class="tab-bar__item"><i class="el-icon-s-home" /><span>首页</span></div>
            <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
            <div class="tab-bar__item is-active"><i class="el-icon-setting" /><span>我的设置</span></div>
          </div>
        </div>
        <p class="mockup-label">① 我的设置</p>
      </div>

      <!-- 2. 基本信息设置 -->
      <div class="mockup-item">
        <div class="phone-frame">
          <div class="phone-notch" />
          <div class="status-bar">
            <span>9:41</span>
            <span class="status-bar__icons">
              <i class="el-icon-mobile-phone" />
              <i class="el-icon-connection" />
              <i class="el-icon-lightning" />
            </span>
          </div>

          <div class="screen screen--scroll screen--no-pad-top">
            <div class="sub-nav sub-nav--flat">
              <i class="el-icon-arrow-left" />
              <span>基本信息设置</span>
              <span class="sub-nav__placeholder" />
            </div>

            <div class="card card--avatar">
              <div class="avatar-large"><i class="el-icon-user-solid" /></div>
              <div class="avatar-tip">点击更换头像</div>
            </div>

            <div class="card card--info">
              <div v-for="row in basicInfoRows" :key="row.label" class="info-row">
                <span class="info-row__label">{{ row.label }}</span>
                <span class="info-row__value">{{ row.value }}</span>
              </div>
            </div>
          </div>

          <div class="tab-bar">
            <div class="tab-bar__item"><i class="el-icon-s-home" /><span>首页</span></div>
            <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
            <div class="tab-bar__item is-active"><i class="el-icon-setting" /><span>我的设置</span></div>
          </div>
        </div>
        <p class="mockup-label">② 基本信息设置</p>
      </div>

      <!-- 3. 出勤规则 -->
      <div class="mockup-item">
        <div class="phone-frame">
          <div class="phone-notch" />
          <div class="status-bar">
            <span>9:41</span>
            <span class="status-bar__icons">
              <i class="el-icon-mobile-phone" />
              <i class="el-icon-connection" />
              <i class="el-icon-lightning" />
            </span>
          </div>

          <div class="screen screen--scroll screen--no-pad-top">
            <div class="sub-nav sub-nav--flat">
              <i class="el-icon-arrow-left" />
              <span>出勤规则</span>
              <span class="sub-nav__placeholder" />
            </div>

            <div class="section-block">
              <div class="section-title">考勤规则</div>
              <div class="card card--menu">
                <div v-for="row in attendanceRules" :key="row.label" class="menu-item">
                  <span>{{ row.label }}</span>
                  <span class="menu-item__extra">{{ row.value }} <i class="el-icon-arrow-right" /></span>
                </div>
              </div>
            </div>

            <div class="section-block">
              <div class="section-title">出勤模式</div>
              <div class="card card--menu">
                <div class="menu-item">
                  <span>出勤模式</span>
                  <span class="menu-item__extra">{{ selectedMode }} <i class="el-icon-arrow-right" /></span>
                </div>
              </div>
            </div>
          </div>

          <div class="tab-bar">
            <div class="tab-bar__item"><i class="el-icon-s-home" /><span>首页</span></div>
            <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
            <div class="tab-bar__item is-active"><i class="el-icon-setting" /><span>我的设置</span></div>
          </div>
        </div>
        <p class="mockup-label">③ 出勤规则</p>
      </div>

      <!-- 4. 出勤模式选择 -->
      <div class="mockup-item">
        <div class="phone-frame">
          <div class="phone-notch" />
          <div class="status-bar">
            <span>9:41</span>
            <span class="status-bar__icons">
              <i class="el-icon-mobile-phone" />
              <i class="el-icon-connection" />
              <i class="el-icon-lightning" />
            </span>
          </div>

          <div class="screen screen--picker">
            <div class="sub-nav sub-nav--flat sub-nav--overlay">
              <i class="el-icon-arrow-left" />
              <span>出勤模式</span>
              <span class="sub-nav__placeholder" />
            </div>
            <div class="picker-backdrop" />

            <div class="bottom-sheet">
              <div class="bottom-sheet__title">选择出勤模式</div>
              <div class="picker-options">
                <div
                  v-for="opt in modeOptions"
                  :key="opt"
                  class="picker-option"
                  :class="{ 'is-active': opt === selectedMode }"
                >
                  {{ opt }}
                </div>
              </div>
              <div class="bottom-sheet__footer">
                <span class="btn-confirm">确定</span>
                <span class="btn-close">关闭</span>
              </div>
            </div>
          </div>

          <div class="tab-bar">
            <div class="tab-bar__item"><i class="el-icon-s-home" /><span>首页</span></div>
            <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
            <div class="tab-bar__item is-active"><i class="el-icon-setting" /><span>我的设置</span></div>
          </div>
        </div>
        <p class="mockup-label">④ 出勤模式选择</p>
      </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PersonalAttendanceSettings",
  data() {
    return {
      user: {
        name: "张三四",
        deptPath: "xxxxx公司/xxxxx部门",
      },
      cacheSize: "320.6K",
      showCacheToast: false,
      basicInfoRows: [
        { label: "姓名", value: "杜兰" },
        { label: "员工编码", value: "01-001-002-1024" },
        { label: "所属部门", value: "xxxxxxxxx公司/xxxxxxx部门" },
        { label: "职位", value: "xx管理专员" },
        { label: "入职日期", value: "2016.08.05" },
      ],
      attendanceRules: [
        { label: "工作时间", value: "9:00至17:00" },
        { label: "加班规则", value: "20:00至04:00" },
        { label: "请假制度", value: "每月3次" },
      ],
      selectedMode: "正常班",
      modeOptions: ["正常班", "周日班", "周一班"],
    };
  },
  methods: {
    clearCache() {
      this.cacheSize = "0K";
      this.showCacheToast = true;
      setTimeout(() => {
        this.showCacheToast = false;
      }, 2000);
    },
  },
};
</script>

<style scoped>
.personal-settings-showcase {
  min-height: calc(100vh - 100px);
  padding: 28px 24px 40px;
  background: linear-gradient(160deg, #eef2f8 0%, #e8edf5 45%, #f5f7fb 100%);
  box-sizing: border-box;
}

.showcase-header {
  max-width: 1280px;
  margin: 0 auto 28px;
  text-align: center;
}

.showcase-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2d3d;
}

.showcase-desc {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.mockup-grid-wrap {
  overflow-x: auto;
  padding-bottom: 12px;
  margin: 0 auto;
  max-width: 100%;
}

.mockup-grid-wrap::-webkit-scrollbar {
  height: 6px;
}

.mockup-grid-wrap::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}

.mockup-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 20px;
  justify-content: center;
  width: max-content;
  min-width: 100%;
  margin: 0 auto;
  align-items: flex-start;
}

.mockup-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mockup-label {
  margin: 14px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.phone-frame {
  width: 280px;
  height: 660px;
  background: #fff;
  border-radius: 36px;
  box-shadow:
    0 24px 48px rgba(15, 35, 75, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.06),
    inset 0 0 0 2px #fafafa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.phone-notch {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 120px;
  height: 28px;
  background: #fff;
  border-radius: 0 0 18px 18px;
  z-index: 2;
}

.status-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 22px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  background: #fff;
}

.status-bar__icons {
  display: flex;
  gap: 4px;
  font-size: 11px;
}

.screen {
  flex: 1;
  min-height: 0;
  position: relative;
  background: #f3f5f9;
}

.screen--scroll {
  overflow-y: auto;
  padding: 10px 12px 12px;
}

.screen--no-pad-top {
  padding-top: 0;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 35, 75, 0.06);
}

.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #69c0ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.profile-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.profile-dept {
  font-size: 11px;
  color: #909399;
  line-height: 1.3;
}

.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 35, 75, 0.06);
  margin-bottom: 10px;
  overflow: hidden;
}

.card--menu {
  padding: 0;
}

.card--avatar {
  text-align: center;
  padding: 24px 12px 18px;
}

.card--info {
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #f0f2f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item--action {
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item--action:active {
  background: #fafbfc;
}

.menu-item__extra {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 2px;
}

.menu-item__cache {
  font-size: 13px;
  color: #606266;
}

.cache-toast {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 14px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.sub-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.sub-nav--flat {
  background: #fff;
  margin: 0 -12px 0;
  padding: 10px 14px;
  border-bottom: 1px solid #eef0f4;
}

.sub-nav--overlay {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.95);
}

.sub-nav i {
  font-size: 18px;
  color: #606266;
}

.sub-nav__placeholder {
  width: 18px;
}

.avatar-large {
  width: 64px;
  height: 64px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #69c0ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.avatar-tip {
  font-size: 12px;
  color: #909399;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px;
  border-bottom: 1px solid #f0f2f5;
  font-size: 13px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row__label {
  color: #909399;
  flex-shrink: 0;
}

.info-row__value {
  color: #303133;
  text-align: right;
  word-break: break-all;
  font-size: 12px;
}

.section-block {
  margin-bottom: 10px;
}

.section-title {
  padding: 4px 4px 8px;
  font-size: 12px;
  color: #909399;
}

.screen--picker {
  display: flex;
  flex-direction: column;
  background: #8c939d;
}

.picker-backdrop {
  flex: 1;
  min-height: 120px;
}

.bottom-sheet {
  flex-shrink: 0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding-bottom: 8px;
  box-shadow: 0 -4px 20px rgba(15, 35, 75, 0.12);
}

.bottom-sheet__title {
  text-align: center;
  padding: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #f0f2f5;
}

.picker-options {
  padding: 6px 0;
}

.picker-option {
  text-align: center;
  padding: 13px;
  font-size: 15px;
  color: #606266;
}

.picker-option.is-active {
  color: #1890ff;
  font-weight: 600;
}

.bottom-sheet__footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px 8px;
  border-top: 1px solid #f0f2f5;
  font-size: 14px;
}

.btn-confirm {
  color: #1890ff;
  font-weight: 600;
}

.btn-close {
  color: #606266;
}

.tab-bar {
  flex-shrink: 0;
  display: flex;
  border-top: 1px solid #eee;
  background: #fff;
  padding: 6px 0 10px;
}

.tab-bar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #909399;
}

.tab-bar__item i {
  font-size: 20px;
}

.tab-bar__item.is-active {
  color: #1890ff;
  font-weight: 600;
}

@media (max-width: 768px) {
  .personal-settings-showcase {
    padding: 16px 12px 32px;
  }

  .mockup-grid {
    justify-content: flex-start;
    padding: 0 4px;
  }

  .phone-frame {
    width: 260px;
  }
}
</style>
