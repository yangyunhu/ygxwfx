/**
 * 考勤评估台账
 * 依据考勤管理台账与异常校验数据，按规则自动评估
 */
import {
  generateGateRows,
  generateCanteenRows,
  generateOnlineRows,
} from "./sensingRecords";
import {
  buildPersonDayContexts,
  generateSenselessAttendanceTable,
  generateAbnormalAttendanceTable,
} from "./sensingBusinessRules";
import { buildOvertimeRows, classifyRecordCategory } from "./attendanceLedger";
import { getBusinessRuleConfig } from "./businessRuleSettings";
import {
  getGlobalWorkConfig,
  getAssessmentRules,
  computeEvaluationResult,
  shouldCountLeaveForAssessment,
} from "./behaviorModeSettings";
import { downloadCsvWithLog } from "./exportLogger";

export const EVALUATION_RESULT_OPTIONS = ["优秀", "良好", "不合格"];

export { getAssessmentRules as getAssessmentRulesFromConfig, computeEvaluationResult };

export function refreshAssessmentRules() {
  return getAssessmentRules();
}

function monthKey(dateStr) {
  return dateStr ? String(dateStr).slice(0, 7) : "";
}

function buildEvaluationDate(periodMonth) {
  if (!periodMonth) return "—";
  const [y, m] = periodMonth.split("-").map(Number);
  if (!y || !m) return "—";
  const lastDay = new Date(y, m, 0).getDate();
  return `${periodMonth}-${String(lastDay).padStart(2, "0")}`;
}

/** 2026-05 模拟样本：覆盖优秀 / 良好 / 不合格 */
const MOCK_ASSESSMENT_202605 = [
  { personId: "P10001", name: "张伟", orgName: "办公室（党委办公室、董事会办公室）", absentCount: 0, leaveDays: 0 },
  { personId: "P10002", name: "李娜", orgName: "人力资源部", absentCount: 0, leaveDays: 1 },
  { personId: "P10003", name: "王强", orgName: "数字化部", absentCount: 0, leaveDays: 2 },
  { personId: "P10004", name: "刘洋", orgName: "生产技术部", absentCount: 0, leaveDays: 3 },
  { personId: "P10005", name: "陈静", orgName: "市场营销部", absentCount: 0, leaveDays: 4 },
  { personId: "P10006", name: "赵敏", orgName: "基建部", absentCount: 1, leaveDays: 0 },
  { personId: "P10007", name: "孙浩", orgName: "安全监管部", absentCount: 2, leaveDays: 1 },
  { personId: "P10008", name: "周婷", orgName: "审计部", absentCount: 0, leaveDays: 0 },
  { personId: "P10009", name: "张明", orgName: "法规部", absentCount: 0, leaveDays: 5 },
  { personId: "P10010", name: "李华", orgName: "党建工作部", absentCount: 1, leaveDays: 2 },
  { personId: "P10011", name: "张伟", orgName: "计划与财务部", absentCount: 0, leaveDays: 2 },
  { personId: "P10012", name: "李娜", orgName: "科技创新部", absentCount: 0, leaveDays: 4 },
  { personId: "P10013", name: "王强", orgName: "供应链管理部", absentCount: 3, leaveDays: 0 },
  { personId: "P10014", name: "刘洋", orgName: "系统运行部", absentCount: 0, leaveDays: 6 },
  { personId: "P10015", name: "陈静", orgName: "工会办公室", absentCount: 0, leaveDays: 1 },
];

function buildMockAssessmentRows(periodMonth = "2026-05") {
  return MOCK_ASSESSMENT_202605.map((item) => {
    const { result, content } = computeEvaluationResult(item.absentCount, item.leaveDays);
    return {
      id: `assess-mock-${item.personId}`,
      personId: item.personId,
      name: item.name,
      orgName: item.orgName,
      periodMonth,
      absentCount: item.absentCount,
      leaveDays: item.leaveDays,
      evaluationResult: result,
      evaluationDate: buildEvaluationDate(periodMonth),
      evaluationContent: content,
    };
  });
}

export function buildAssessmentLedgerData(config = getGlobalWorkConfig()) {
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

  const attendanceRows = [...senselessRows, ...overtimeRows].map((r) => ({
    ...r,
    recordCategory: r.recordCategory || classifyRecordCategory(r.attendanceType),
  }));

  const personMonthMap = new Map();

  const touch = (personId, name, orgName, period) => {
    const key = `${personId}|${period}`;
    if (!personMonthMap.has(key)) {
      personMonthMap.set(key, {
        id: key,
        personId,
        name: name || "—",
        orgName: orgName || "—",
        periodMonth: period,
        absentCount: 0,
        leaveDates: new Set(),
      });
    }
    const row = personMonthMap.get(key);
    if (name) row.name = name;
    if (orgName) row.orgName = orgName;
    return row;
  };

  attendanceRows.forEach((r) => {
    if (!r.personId || !r.recordDate) return;
    const period = monthKey(r.recordDate);
    const item = touch(r.personId, r.name, r.orgName, period);
    if (r.recordCategory === "请假情况" && shouldCountLeaveForAssessment(r.attendanceType)) {
      item.leaveDates.add(r.recordDate);
    }
  });

  abnormalRows.forEach((r) => {
    if (!r.personId || !r.recordDate) return;
    const period = monthKey(r.recordDate);
    const item = touch(r.personId, r.name, r.orgName, period);
    if (r.abnormalType === "旷工") {
      item.absentCount += 1;
    }
  });

  const autoRows = Array.from(personMonthMap.values())
    .map((item) => {
      const leaveDays = item.leaveDates.size;
      const { result, content } = computeEvaluationResult(item.absentCount, leaveDays);
      return {
        id: item.id,
        personId: item.personId,
        name: item.name,
        orgName: item.orgName,
        periodMonth: item.periodMonth,
        absentCount: item.absentCount,
        leaveDays,
        evaluationResult: result,
        evaluationDate: buildEvaluationDate(item.periodMonth),
        evaluationContent: content,
      };
    });

  const mockRows = buildMockAssessmentRows("2026-05");
  const mockKeys = new Set(mockRows.map((r) => `${r.personId}|${r.periodMonth}`));
  const mergedAuto = autoRows.filter((r) => !mockKeys.has(`${r.personId}|${r.periodMonth}`));
  const rows = [...mockRows, ...mergedAuto].sort((a, b) =>
    a.periodMonth === b.periodMonth
      ? a.personId.localeCompare(b.personId)
      : b.periodMonth.localeCompare(a.periodMonth)
  );

  return { rows, personContexts, attendanceRows, abnormalRows };
}

export function exportAssessmentLedgerCsv(rows, filename) {
  const headers = [
    "所属组织机构",
    "姓名",
    "人员ID",
    "评估周期",
    "旷工次数",
    "请假天数",
    "评估结果",
    "评估日期",
    "评估内容",
  ];
  const lines = rows.map((r) =>
    [
      r.orgName,
      r.name,
      r.personId,
      r.periodMonth,
      r.absentCount,
      r.leaveDays,
      r.evaluationResult,
      r.evaluationDate,
      r.evaluationContent,
    ]
      .map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...lines].join("\n");
  downloadCsvWithLog(csv, filename, {
    moduleCode: "staff-assessment",
    moduleName: "考勤评估台账",
    moduleGroup: "人员信息台账",
    rowCount: rows.length,
    searchCriteria: "台账查询结果",
  });
}
