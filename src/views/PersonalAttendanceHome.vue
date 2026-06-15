<template>
  <div class="personal-home-showcase">
    <header class="showcase-header">
      <h1 class="showcase-title">个人出勤管理 APP · 首页</h1>
      <p class="showcase-desc">
        出勤日历打卡、个人考勤统计概览，以及当月明细、出勤明细与时长分类详情等页面原型。
      </p>
    </header>

    <div class="mockup-grid-wrap">
      <div class="mockup-grid">
        <!-- ① 出勤日历 -->
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
              <div class="home-header">
                <div class="home-header__user">
                  <div class="home-avatar"><i class="el-icon-user-solid" /></div>
                  <div>
                    <div class="home-header__name">{{ user.name }}</div>
                    <div class="home-header__dept">{{ user.dept }}</div>
                  </div>
                </div>
                <div class="home-header__title">出勤日历</div>
              </div>

              <div class="legend-row">
                <span v-for="item in legend" :key="item.key" class="legend-item">
                  <i class="legend-dot" :style="{ background: item.color }" />
                  {{ item.label }}
                </span>
              </div>

              <div class="card card--calendar">
                <div class="calendar-nav">
                  <i class="el-icon-arrow-left" />
                  <span>{{ calendarMonth.label }}</span>
                  <i class="el-icon-arrow-right" />
                </div>
                <div class="calendar-week">
                  <span v-for="w in weekHeaders" :key="w">{{ w }}</span>
                </div>
                <div class="calendar-grid">
                  <div
                    v-for="(cell, idx) in calendarCells"
                    :key="'cal-' + idx"
                    class="calendar-cell"
                    :class="{
                      'is-empty': cell.empty,
                      'is-selected': !cell.empty && cell.day === calendarMonth.selectedDay,
                      'is-today': !cell.empty && cell.day === calendarMonth.selectedDay,
                    }"
                  >
                    <template v-if="!cell.empty">
                      <span class="calendar-cell__day">{{ cell.day }}</span>
                      <i
                        v-if="statusMap[cell.day]"
                        class="calendar-cell__dot"
                        :style="{ background: statusColor(statusMap[cell.day]) }"
                      />
                    </template>
                  </div>
                </div>
              </div>

              <div class="punch-row">
                <button type="button" class="punch-btn punch-btn--in">
                  <i class="el-icon-circle-check" />
                  <span>签到</span>
                </button>
                <button type="button" class="punch-btn punch-btn--out">
                  <i class="el-icon-circle-close" />
                  <span>签退</span>
                </button>
              </div>

              <div class="link-btn">查看个人统计数据</div>
            </div>

            <div class="tab-bar">
              <div class="tab-bar__item is-active"><i class="el-icon-s-home" /><span>首页</span></div>
              <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
              <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
            </div>
          </div>
          <p class="mockup-label">① 出勤日历</p>
        </div>

        <!-- ② 个人考勤统计 -->
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
              <div class="sub-nav">
                <i class="el-icon-arrow-left" />
                <span>个人考勤统计</span>
                <span class="sub-nav__placeholder" />
              </div>

              <div class="card">
                <div class="card__title">当月考勤统计</div>
                <div
                  v-for="(row, ri) in monthlyStatRows"
                  :key="'row-' + ri"
                  class="stat-grid stat-grid--3"
                  :class="{ 'stat-grid--2': row.length === 2 }"
                >
                  <div v-for="cell in row" :key="cell.key" class="stat-cell stat-cell--compact">
                    <div class="stat-cell__value">
                      {{ summary[cell.key] }}{{ cell.suffix || "" }}
                    </div>
                    <div class="stat-cell__label">{{ cell.label }}</div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card__head">
                  <span class="card__title card__title--sm">业务班时长统计</span>
                  <span class="card__extra">总时长：<strong>{{ summary.businessTotal }}</strong></span>
                </div>
                <div class="stat-grid stat-grid--3">
                  <div v-for="item in businessItems" :key="item.key" class="stat-cell stat-cell--compact">
                    <div class="stat-cell__value">{{ summary[item.key] }}</div>
                    <div class="stat-cell__label">{{ item.label }}</div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card__head">
                  <span class="card__title card__title--sm">外勤时长统计</span>
                  <span class="card__extra">总时长：<strong>{{ summary.fieldTotal }}</strong></span>
                </div>
                <div class="stat-grid stat-grid--3">
                  <div v-for="item in fieldItems" :key="item.key" class="stat-cell stat-cell--compact">
                    <div class="stat-cell__value">{{ summary[item.key] }}</div>
                    <div class="stat-cell__label">{{ item.label }}</div>
                  </div>
                </div>
              </div>

              <div class="card">
                <div class="card__title card__title--sm">请假时长统计</div>
                <div class="stat-grid stat-grid--3">
                  <div v-for="item in leaveItems" :key="item.key" class="stat-cell stat-cell--compact">
                    <div class="stat-cell__value">{{ summary[item.key] }}</div>
                    <div class="stat-cell__label">{{ item.label }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="tab-bar">
              <div class="tab-bar__item is-active"><i class="el-icon-s-home" /><span>首页</span></div>
              <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
              <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
            </div>
          </div>
          <p class="mockup-label">② 个人考勤统计</p>
        </div>

        <!-- ③ 当月考勤明细 -->
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
                <span>当月考勤统计</span>
                <span class="sub-nav__placeholder" />
              </div>

              <div class="detail-tabs">
                <span
                  v-for="tab in attendanceTabs"
                  :key="tab.key"
                  class="detail-tab"
                  :class="{ 'is-active': tab.key === 'present' }"
                >{{ tab.label }}</span>
              </div>

              <div class="list-summary">出勤天数 <strong>{{ summary.attendanceDays }}</strong> 天</div>

              <div class="record-list">
                <div v-for="row in attendanceList" :key="row.date" class="record-item">
                  <div class="record-item__main">
                    <div class="record-item__date">{{ row.date }}</div>
                    <div class="record-item__week">{{ row.weekday }}</div>
                  </div>
                  <div class="record-item__extra">
                    {{ row.value }}
                    <i class="el-icon-arrow-right" />
                  </div>
                </div>
              </div>
            </div>

            <div class="tab-bar">
              <div class="tab-bar__item is-active"><i class="el-icon-s-home" /><span>首页</span></div>
              <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
              <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
            </div>
          </div>
          <p class="mockup-label">③ 当月考勤明细</p>
        </div>

        <!-- ④ 出勤明细 -->
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
                <span>出勤明细</span>
                <span class="sub-nav__placeholder" />
              </div>

              <div class="card card--calendar card--mini">
                <div class="calendar-nav calendar-nav--sm">
                  <i class="el-icon-arrow-left" />
                  <span>{{ calendarMonth.label }}</span>
                  <i class="el-icon-arrow-right" />
                </div>
                <div class="calendar-week calendar-week--sm">
                  <span v-for="w in weekHeaders" :key="'m-' + w">{{ w }}</span>
                </div>
                <div class="calendar-grid calendar-grid--sm">
                  <div
                    v-for="(cell, idx) in calendarCells"
                    :key="'mini-' + idx"
                    class="calendar-cell calendar-cell--sm"
                    :class="{
                      'is-empty': cell.empty,
                      'is-selected': !cell.empty && cell.day === calendarMonth.selectedDay,
                    }"
                  >
                    <template v-if="!cell.empty">
                      <span class="calendar-cell__day">{{ cell.day }}</span>
                    </template>
                  </div>
                </div>
              </div>

              <div class="punch-list">
                <div v-for="row in punchRecords" :key="row.label" class="punch-record">
                  <div class="punch-record__icon"><i :class="row.icon" /></div>
                  <div class="punch-record__body">
                    <div class="punch-record__label">{{ row.label }}</div>
                    <div class="punch-record__time">{{ row.time }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="tab-bar">
              <div class="tab-bar__item is-active"><i class="el-icon-s-home" /><span>首页</span></div>
              <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
              <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
            </div>
          </div>
          <p class="mockup-label">④ 出勤明细</p>
        </div>

        <!-- ⑤ 业务班时长明细 -->
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
                <span>业务班时长统计</span>
                <span class="sub-nav__placeholder" />
              </div>

              <div class="detail-tabs detail-tabs--3">
                <span
                  v-for="tab in businessTabs"
                  :key="tab.key"
                  class="detail-tab"
                  :class="{ 'is-active': tab.key === 'work' }"
                >{{ tab.label }}</span>
              </div>

              <div class="list-summary">工作日时长 <strong>{{ summary.businessTotal }}</strong> 工时</div>

              <div class="record-list">
                <div v-for="row in businessList" :key="row.date" class="record-item">
                  <div class="record-item__main">
                    <div class="record-item__date">{{ row.date }}</div>
                    <div class="record-item__week">{{ row.weekday }}</div>
                  </div>
                  <div class="record-item__extra">
                    {{ row.value }}
                    <i class="el-icon-arrow-right" />
                  </div>
                </div>
              </div>
            </div>

            <div class="tab-bar">
              <div class="tab-bar__item is-active"><i class="el-icon-s-home" /><span>首页</span></div>
              <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
              <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
            </div>
          </div>
          <p class="mockup-label">⑤ 业务班时长明细</p>
        </div>

        <!-- ⑥ 请假时长明细 -->
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
                <span>请假时长统计</span>
                <span class="sub-nav__placeholder" />
              </div>

              <div class="detail-tabs detail-tabs--3">
                <span
                  v-for="tab in leaveTabs"
                  :key="tab.key"
                  class="detail-tab"
                  :class="{ 'is-active': tab.key === 'personal' }"
                >{{ tab.label }}</span>
              </div>

              <div class="list-summary">事假 <strong>{{ summary.personalLeave }}</strong> 天</div>

              <div class="record-list">
                <div v-for="row in leaveList" :key="row.date" class="record-item">
                  <div class="record-item__main">
                    <div class="record-item__date">{{ row.date }}</div>
                    <div class="record-item__week">{{ row.weekday }}</div>
                  </div>
                  <div class="record-item__extra">
                    {{ row.value }}
                    <i class="el-icon-arrow-right" />
                  </div>
                </div>
              </div>
            </div>

            <div class="tab-bar">
              <div class="tab-bar__item is-active"><i class="el-icon-s-home" /><span>首页</span></div>
              <div class="tab-bar__item"><i class="el-icon-data-line" /><span>出勤统计</span></div>
              <div class="tab-bar__item"><i class="el-icon-setting" /><span>我的设置</span></div>
            </div>
          </div>
          <p class="mockup-label">⑥ 请假时长明细</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  HOME_USER,
  STATUS_LEGEND,
  MAY_2023_STATUS,
  CALENDAR_MONTH,
  getMonthlySummary,
  MONTHLY_STAT_ROWS,
  BUSINESS_STAT_ITEMS,
  FIELD_STAT_ITEMS,
  LEAVE_STAT_ITEMS,
  ATTENDANCE_LIST_TABS,
  ATTENDANCE_LIST_ITEMS,
  BUSINESS_LIST_TABS,
  BUSINESS_LIST_ITEMS,
  LEAVE_LIST_TABS,
  LEAVE_LIST_ITEMS,
  PUNCH_RECORDS,
  WEEK_HEADERS,
  buildCalendarCells,
} from "../utils/personalAttendanceHomeData";

export default {
  name: "PersonalAttendanceHome",
  data() {
    const cal = CALENDAR_MONTH;
    return {
      user: HOME_USER,
      legend: STATUS_LEGEND,
      calendarMonth: cal,
      statusMap: MAY_2023_STATUS,
      weekHeaders: WEEK_HEADERS,
      calendarCells: buildCalendarCells(cal.year, cal.month),
      summary: getMonthlySummary(),
      monthlyStatRows: MONTHLY_STAT_ROWS,
      businessItems: BUSINESS_STAT_ITEMS,
      fieldItems: FIELD_STAT_ITEMS,
      leaveItems: LEAVE_STAT_ITEMS,
      attendanceTabs: ATTENDANCE_LIST_TABS,
      attendanceList: ATTENDANCE_LIST_ITEMS,
      businessTabs: BUSINESS_LIST_TABS,
      businessList: BUSINESS_LIST_ITEMS,
      leaveTabs: LEAVE_LIST_TABS,
      leaveList: LEAVE_LIST_ITEMS,
      punchRecords: PUNCH_RECORDS,
    };
  },
  methods: {
    statusColor(key) {
      const item = STATUS_LEGEND.find((l) => l.key === key);
      return item ? item.color : "#c0c4cc";
    },
  },
};
</script>

<style scoped>
.personal-home-showcase {
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
  background: #f3f5f9;
}

.screen--scroll {
  overflow-y: auto;
  padding: 10px 12px 12px;
}

.screen--no-pad-top {
  padding-top: 0;
}

.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.home-header__user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.home-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff, #69c0ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.home-header__name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.home-header__dept {
  font-size: 10px;
  color: #909399;
  margin-top: 2px;
  max-width: 130px;
  line-height: 1.3;
}

.home-header__title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  padding-top: 4px;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 10px;
  padding: 0 2px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #606266;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(15, 35, 75, 0.06);
}

.card--calendar {
  padding: 12px 10px 14px;
}

.card--mini {
  margin-top: 10px;
}

.card__title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.card__title--sm {
  font-size: 14px;
  margin-bottom: 8px;
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.card__extra {
  font-size: 12px;
  color: #909399;
}

.card__extra strong {
  color: #1890ff;
  font-size: 14px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding: 0 4px;
}

.calendar-nav--sm {
  font-size: 13px;
  margin-bottom: 8px;
}

.calendar-nav i {
  color: #909399;
  font-size: 14px;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  color: #909399;
  margin-bottom: 6px;
}

.calendar-week--sm {
  font-size: 10px;
  margin-bottom: 4px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-grid--sm {
  gap: 1px;
}

.calendar-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 8px;
  min-height: 32px;
}

.calendar-cell--sm {
  min-height: 26px;
  border-radius: 6px;
}

.calendar-cell.is-empty {
  visibility: hidden;
}

.calendar-cell.is-selected {
  background: #1890ff;
}

.calendar-cell.is-selected .calendar-cell__day {
  color: #fff;
  font-weight: 600;
}

.calendar-cell__day {
  font-size: 12px;
  color: #303133;
  line-height: 1;
}

.calendar-cell--sm .calendar-cell__day {
  font-size: 11px;
}

.calendar-cell__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin-top: 2px;
}

.calendar-cell.is-selected .calendar-cell__dot {
  background: #fff !important;
}

.punch-row {
  display: flex;
  gap: 20px;
  margin: 14px 0 12px;
  padding: 0 4px;
  justify-content: center;
}

.punch-btn {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  width: 88px;
  height: 88px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.25);
}

.punch-btn i {
  font-size: 28px;
}

.punch-btn--in {
  background: linear-gradient(145deg, #1890ff, #096dd9);
  color: #fff;
}

.punch-btn--out {
  background: linear-gradient(145deg, #fff, #f5f7fb);
  color: #1890ff;
  box-shadow: 0 4px 16px rgba(15, 35, 75, 0.1);
  border: 1px solid #e8ecf2;
}

.link-btn {
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  font-size: 13px;
  color: #1890ff;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
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

.sub-nav i {
  font-size: 18px;
  color: #606266;
}

.sub-nav__placeholder {
  width: 18px;
}

.stat-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}

.stat-grid--3 {
  grid-template-columns: repeat(3, 1fr);
}

.stat-grid--2 {
  grid-template-columns: repeat(2, 1fr);
  max-width: 66%;
  margin-left: auto;
  margin-right: auto;
}

.stat-cell {
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
  background: #fafbfc;
}

.stat-cell--compact {
  padding: 10px 4px;
}

.stat-cell__value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-cell__label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.detail-tabs {
  display: flex;
  gap: 0;
  overflow-x: auto;
  background: #fff;
  margin: 0 -12px;
  padding: 0 8px;
  border-bottom: 1px solid #eef0f4;
}

.detail-tabs--3 {
  justify-content: space-around;
}

.detail-tab {
  flex-shrink: 0;
  padding: 10px 10px;
  font-size: 12px;
  color: #606266;
  border-bottom: 2px solid transparent;
}

.detail-tab.is-active {
  color: #1890ff;
  font-weight: 600;
  border-bottom-color: #1890ff;
}

.list-summary {
  padding: 12px 4px 8px;
  font-size: 12px;
  color: #909399;
}

.list-summary strong {
  color: #1890ff;
  font-size: 16px;
  margin: 0 2px;
}

.record-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 35, 75, 0.06);
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f2f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item__date {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.record-item__week {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.record-item__extra {
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.record-item__extra i {
  color: #c0c4cc;
  font-size: 12px;
}

.punch-list {
  margin-top: 10px;
}

.punch-record {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(15, 35, 75, 0.06);
}

.punch-record__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e6f7ff;
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.punch-record__label {
  font-size: 12px;
  color: #909399;
}

.punch-record__time {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-top: 4px;
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
  .personal-home-showcase {
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
