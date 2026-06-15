/**
 * 个人出勤管理 APP — 首页 / 出勤日历模拟数据
 */

export const HOME_USER = {
  name: "于文",
  dept: "云南电网 / 信息管理部",
};

export const STATUS_LEGEND = [
  { key: "normal", label: "正常", color: "#1890ff" },
  { key: "late", label: "迟到", color: "#f5222d" },
  { key: "absent", label: "缺勤", color: "#fa8c16" },
  { key: "leave", label: "请假", color: "#722ed1" },
];

/** 2023年5月 — 日期 → 出勤状态 */
export const MAY_2023_STATUS = {
  1: "normal",
  2: "late",
  3: "normal",
  4: "leave",
  5: "normal",
  6: "normal",
  7: "normal",
  8: "absent",
  9: "normal",
  10: "normal",
  11: "late",
  12: "normal",
  15: "leave",
  16: "normal",
  17: "normal",
  18: "normal",
  19: "normal",
  22: "late",
  23: "normal",
  24: "normal",
  25: "normal",
  26: "normal",
  29: "normal",
  30: "normal",
  31: "normal",
};

export const CALENDAR_MONTH = { year: 2023, month: 5, label: "2023年5月", selectedDay: 6 };

export function getMonthlySummary() {
  return {
    attendanceDays: 18,
    avgHours: 8.2,
    leaveDays: 1,
    late: 2,
    earlyLeave: 0,
    missingPunch: 1,
    attendanceRate: 80,
    absent: 0,
    businessTotal: 56,
    workdays: 18,
    restDays: 4,
    holidays: 0,
    fieldTotal: 56,
    businessTrip: 7,
    outing: 3,
    training: 0,
    annualLeave: 0,
    personalLeave: 1,
    sickLeave: 0,
  };
}

export const MONTHLY_STAT_ROWS = [
  [
    { key: "attendanceDays", label: "出勤天数" },
    { key: "avgHours", label: "平均工时" },
    { key: "leaveDays", label: "请假天数" },
  ],
  [
    { key: "late", label: "迟到" },
    { key: "earlyLeave", label: "早退" },
    { key: "missingPunch", label: "缺卡" },
  ],
  [
    { key: "attendanceRate", label: "出勤率", suffix: "%" },
    { key: "absent", label: "旷工" },
  ],
];

export const BUSINESS_STAT_ITEMS = [
  { key: "workdays", label: "工作日" },
  { key: "restDays", label: "休息日" },
  { key: "holidays", label: "法定节假日" },
];

export const FIELD_STAT_ITEMS = [
  { key: "businessTrip", label: "出差天数" },
  { key: "outing", label: "外出天数" },
  { key: "training", label: "培训天数" },
];

export const LEAVE_STAT_ITEMS = [
  { key: "annualLeave", label: "年假" },
  { key: "personalLeave", label: "事假" },
  { key: "sickLeave", label: "病假" },
];

export const ATTENDANCE_LIST_TABS = [
  { key: "present", label: "出勤" },
  { key: "leave", label: "请假" },
  { key: "late", label: "迟到" },
  { key: "early", label: "早退" },
  { key: "missing", label: "缺卡" },
  { key: "absent", label: "旷工" },
];

export const ATTENDANCE_LIST_ITEMS = [
  { date: "2023-05-06", weekday: "星期六", value: "8工时" },
  { date: "2023-05-05", weekday: "星期五", value: "8工时" },
  { date: "2023-05-04", weekday: "星期四", value: "请假" },
  { date: "2023-05-03", weekday: "星期三", value: "8工时" },
  { date: "2023-05-02", weekday: "星期二", value: "7.5工时" },
];

export const BUSINESS_LIST_TABS = [
  { key: "work", label: "工作日" },
  { key: "rest", label: "休息日" },
  { key: "holiday", label: "法定节假日" },
];

export const BUSINESS_LIST_ITEMS = [
  { date: "2023-05-06", weekday: "星期六", value: "8工时" },
  { date: "2023-05-05", weekday: "星期五", value: "8工时" },
  { date: "2023-05-03", weekday: "星期三", value: "8工时" },
  { date: "2023-05-02", weekday: "星期二", value: "7.5工时" },
];

export const LEAVE_LIST_TABS = [
  { key: "annual", label: "年假" },
  { key: "personal", label: "事假" },
  { key: "sick", label: "病假" },
];

export const LEAVE_LIST_ITEMS = [
  { date: "2023-05-04", weekday: "星期四", value: "事假 1天" },
];

export const PUNCH_RECORDS = [
  { label: "上班签到时间", time: "08:43", icon: "el-icon-sunrise" },
  { label: "下班签退时间", time: "18:32", icon: "el-icon-sunset" },
];

export const WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"];

/** 生成某月日历格（含前导空白） */
export function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ empty: true });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, empty: false });
  }
  return cells;
}
