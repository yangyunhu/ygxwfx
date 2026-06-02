/**
 * 考勤管理台账 — 与无感考勤表同源数据
 * 记录出勤、请假、加班，用于考勤管理与工资核算
 */
import {
  generateGateRows,
  generateCanteenRows,
  generateOnlineRows,
  isMissing,
} from "./sensingRecords";
import {
  DEFAULT_WORK_CONFIG,
  buildPersonDayContexts,
  generateSenselessAttendanceTable,
  generateAbnormalAttendanceTable,
} from "./sensingBusinessRules";
import { getGlobalWorkConfig, getLeaveTypeNames } from "./behaviorModeSettings";
import { getBusinessRuleConfig } from "./businessRuleSettings";
import { downloadCsvWithLog } from "./exportLogger";

export const RECORD_CATEGORY_OPTIONS = ["出勤情况", "请假情况", "加班情况"];

export const ATTENDANCE_TYPE_OPTIONS = [
  "出勤",
  "培训",
  "出差",
  "迟到",
  "早退",
  "旷工",
  "在岗证据冲突",
  "在岗证据不足",
  "加班",
  ...getLeaveTypeNames(),
];

function parseConfigTimeToMinutes(timeStr) {
  if (!timeStr || !String(timeStr).includes(":")) return 17 * 60 + 30;
  const [h, m] = String(timeStr).split(":").map(Number);
  return h * 60 + m;
}

function parseTimeToMinutes(str) {
  if (isMissing(str)) return null;
  const s = String(str).trim();
  const m = s.match(/(\d{2}):(\d{2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const d = new Date(s.replace(/-/g, "/"));
  if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  return null;
}

function calcOvertimeHours(departureTime, standardDepartureTime) {
  const standardMin = parseConfigTimeToMinutes(standardDepartureTime);
  const outMin = parseTimeToMinutes(departureTime);
  if (outMin == null || outMin <= standardMin) return 0;
  return Math.round(((outMin - standardMin) / 60) * 10) / 10;
}

export function classifyRecordCategory(attendanceType) {
  if (!attendanceType) return "出勤情况";
  if (attendanceType === "加班") return "加班情况";
  const leaveTypes = getLeaveTypeNames();
  if (leaveTypes.some((t) => attendanceType === t || String(attendanceType).includes(t))) {
    return "请假情况";
  }
  return "出勤情况";
}

/** 异常考勤校验表记录 → 台账行（旷工等不在无感考勤 1-6 层的类型） */
export function buildAbnormalLedgerRows(abnormalRows = []) {
  return (abnormalRows || []).map((r) => ({
    id: r.id || `abn-ledger-${r.personId}-${r.recordDate}`,
    orgName: r.orgName,
    name: r.name,
    personId: r.personId,
    recordDate: r.recordDate,
    attendanceType: r.abnormalType,
    arrivalTime: "—",
    departureTime: "—",
    dataSources: r.dataSources || "—",
    ruleLevel: r.ruleLevel || "—",
    targetTable: "异常考勤校验表",
    remark: r.detail || "",
    recordCategory: classifyRecordCategory(r.abnormalType),
  }));
}

function mergeLedgerRows(senselessRows, overtimeRows, abnormalRows) {
  const senselessDayKeys = new Set(
    senselessRows.map((r) => `${r.personId}|${r.recordDate}`)
  );
  const abnormalOnlyTypes = new Set(["旷工", "在岗证据冲突", "在岗证据不足"]);
  const abnormalLedger = buildAbnormalLedgerRows(abnormalRows).filter((r) => {
    if (abnormalOnlyTypes.has(r.attendanceType)) return true;
    return !senselessDayKeys.has(`${r.personId}|${r.recordDate}`);
  });
  return [...senselessRows, ...overtimeRows, ...abnormalLedger];
}

/** 离岗晚于加班起算时间（默认 17:30）则生成加班记录 */
export function buildOvertimeRows(personContexts, config = DEFAULT_WORK_CONFIG) {
  const standardDeparture =
    config.overtimeStartTime || config.departureTime || DEFAULT_WORK_CONFIG.departureTime;

  return personContexts
    .map((ctx) => {
      if (!ctx.hasGate || isMissing(ctx.departureTime)) return null;
      const overtimeHours = calcOvertimeHours(ctx.departureTime, standardDeparture);
      if (overtimeHours <= 0) return null;

      return {
        id: `ot-${ctx.personId}-${ctx.recordDate}`,
        orgName: ctx.orgName,
        name: ctx.name,
        personId: ctx.personId,
        recordDate: ctx.recordDate,
        attendanceType: "加班",
        arrivalTime: ctx.arrivalTime || "—",
        departureTime: ctx.departureTime || "—",
        dataSources: ctx.sources.length ? ctx.sources.join("、") : "闸机门禁",
        ruleLevel: "加班规则",
        targetTable: "考勤管理台账",
        overtimeHours,
        remark: `加班 ${overtimeHours.toFixed(1)}h（${standardDeparture} 至离岗时间）`,
        recordCategory: "加班情况",
      };
    })
    .filter(Boolean);
}

export function buildAttendanceLedgerData(config = getGlobalWorkConfig()) {
  const gateRows = generateGateRows();
  const canteenRows = generateCanteenRows();
  const onlineRows = generateOnlineRows();
  const personContexts = buildPersonDayContexts(gateRows, canteenRows, onlineRows);
  const senselessRows = generateSenselessAttendanceTable(personContexts, config);
  const overtimeRows = buildOvertimeRows(personContexts, config);
  const abnormalRows = generateAbnormalAttendanceTable(
    personContexts,
    config,
    getBusinessRuleConfig("abnormal")
  );

  const rows = mergeLedgerRows(senselessRows, overtimeRows, abnormalRows)
    .map((r) => ({
      ...r,
      recordCategory: r.recordCategory || classifyRecordCategory(r.attendanceType),
    }))
    .sort((a, b) =>
      a.recordDate === b.recordDate
        ? a.personId.localeCompare(b.personId)
        : b.recordDate.localeCompare(a.recordDate)
    );

  return { rows, personContexts, abnormalRows };
}

export function exportAttendanceLedgerCsv(rows, filename) {
  const headers = [
    "记录类型",
    "所属组织机构",
    "姓名",
    "人员ID",
    "考勤日期",
    "考勤类型",
    "到岗时间",
    "离岗时间",
    "规则层级",
    "输出表",
    "数据来源",
    "备注",
  ];
  const lines = rows.map((r) =>
    [
      r.recordCategory,
      r.orgName,
      r.name,
      r.personId,
      r.recordDate,
      r.attendanceType,
      r.arrivalTime,
      r.departureTime,
      r.ruleLevel,
      r.targetTable,
      r.dataSources,
      r.remark || "",
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: "staff-attendance",
    moduleName: "考勤管理台账",
    moduleGroup: "人员信息台账",
    rowCount: rows.length,
    searchCriteria: "台账查询结果",
  });
}
