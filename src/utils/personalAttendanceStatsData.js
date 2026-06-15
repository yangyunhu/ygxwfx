/**
 * 个人出勤管理 APP — 出勤统计模拟数据
 */

export const PERIOD_TABS = [
  { key: "year", label: "年度" },
  { key: "quarter", label: "季度" },
  { key: "month", label: "月度" },
];

export const PERIOD_PRESETS = {
  year: { label: "2025年", title: "当年考勤统计" },
  quarter: { label: "第2季度", title: "当季考勤统计" },
  month: { label: "5月", title: "当月考勤统计" },
};

export function getAttendanceSummary() {
  return {
    attendanceDays: 245,
    workHours: 1960,
    leaveDays: 5,
    late: 2,
    earlyLeave: 0,
    absent: 0,
    attendanceRate: 80,
    fieldTotal: 56,
    businessTrip: 7,
    outing: 3,
    training: 0,
  };
}

export function getRateGaugeData() {
  return {
    personalRate: 55,
    absentRate: 5,
  };
}

export function getCompareLineData() {
  return {
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月"],
    earlyLeave: [3, 4, 2, 5, 3, 4, 2],
    late: [7, 8, 9, 7, 10, 8, 9],
  };
}

export function getWorkHoursBarData() {
  return {
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月"],
    hours: [120, 145, 132, 158, 180, 165, 150],
  };
}

export const STAT_ITEMS = [
  { key: "attendanceDays", label: "出勤天数", icon: "el-icon-date", color: "#1890ff" },
  { key: "workHours", label: "业务班时长", icon: "el-icon-time", color: "#13c2c2" },
  { key: "leaveDays", label: "请假天数", icon: "el-icon-document", color: "#722ed1" },
  { key: "late", label: "迟到", icon: "el-icon-alarm-clock", color: "#fa8c16" },
  { key: "earlyLeave", label: "早退", icon: "el-icon-bottom", color: "#eb2f96" },
  { key: "absent", label: "旷工", icon: "el-icon-warning-outline", color: "#f5222d" },
];

export const FIELD_ITEMS = [
  { key: "businessTrip", label: "出差天数", icon: "el-icon-position" },
  { key: "outing", label: "外出天数", icon: "el-icon-map-location" },
  { key: "training", label: "培训天数", icon: "el-icon-reading" },
];
