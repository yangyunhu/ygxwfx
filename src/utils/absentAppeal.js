/**
 * 旷工判定规则与异议申请（模拟）
 */

export const ABSENT_APPEAL_STATUS = {
  none: { label: "未提交", type: "info" },
  pending_dept: { label: "待部门审核", type: "warning" },
  pending_hr: { label: "待人资审核", type: "warning" },
  approved: { label: "已通过", type: "success" },
  rejected: { label: "已驳回", type: "danger" },
};

const APPEAL_REASONS = [
  "当日外出抢修未刷闸机，附工作票及现场照片",
  "系统同步延迟导致登录记录未入库",
  "因公出差返程，商旅数据尚未回传",
  "当日参加集中培训，培训平台考勤未对接",
];

function hashSeed(str) {
  return String(str || "")
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function findAbnormalRow(abnormalRows, personId, dateStr) {
  return (abnormalRows || []).find(
    (r) => r.personId === personId && r.recordDate === dateStr && r.abnormalType === "旷工"
  );
}

/** 构建单日旷工判定与异议详情 */
export function buildAbsentDetail({ personId, dateStr, abnormalRows = [], name = "", orgName = "" }) {
  const abnormal = findAbnormalRow(abnormalRows, personId, dateStr);
  const seed = hashSeed(`${personId}|${dateStr}`);

  const ruleLevel = abnormal?.ruleLevel || "异常第6层";
  const ruleName = abnormal ? "异常考勤校验表·旷工判定规则" : "无感考勤表·旷工判定规则";
  const ruleDesc = abnormal
    ? abnormal.detail || "各系统均无该人员当日有效在岗记录"
    : "闸机、登录、商旅、休假等数据源均未采集到该人员当日在岗证据，系统自动判定旷工";
  const dataSources = abnormal?.dataSources || "闸机门禁、数认平台、南网商旅通、休假台账";

  const appealSubmitted = seed % 10 !== 0;
  let appealStatusKey = "none";
  if (appealSubmitted) {
    const mod = seed % 5;
    if (mod === 0) appealStatusKey = "pending_dept";
    else if (mod === 1) appealStatusKey = "pending_hr";
    else if (mod === 2) appealStatusKey = "approved";
    else if (mod === 3) appealStatusKey = "rejected";
    else appealStatusKey = "pending_dept";
  }

  const statusMeta = ABSENT_APPEAL_STATUS[appealStatusKey];
  const appealNo = appealSubmitted
    ? `KY${dateStr.replace(/-/g, "")}${String((seed % 900) + 100)}`
    : "";

  const dayNum = parseInt(dateStr.slice(8, 10), 10) || 1;
  const submitTime = appealSubmitted
    ? `${dateStr.slice(0, 7)}-${String(Math.min(28, dayNum + 1)).padStart(2, "0")} ${9 + (seed % 4)}:${String((seed * 7) % 60).padStart(2, "0")}:00`
    : "";

  const auditRecords = buildAuditRecords(appealSubmitted, appealStatusKey, name, submitTime);

  return {
    personId,
    name,
    orgName,
    recordDate: dateStr,
    ruleLevel,
    ruleName,
    ruleDesc,
    dataSources,
    targetTable: abnormal ? "异常考勤校验表" : "考勤管理台账",
    appealSubmitted,
    appealNo,
    appealStatus: statusMeta.label,
    appealStatusType: statusMeta.type,
    appealStatusKey,
    submitTime,
    submitReason: appealSubmitted ? APPEAL_REASONS[seed % APPEAL_REASONS.length] : "",
    auditRecords,
  };
}

function buildAuditRecords(submitted, statusKey, name, submitTime) {
  if (!submitted) {
    return [{ node: "旷工异议申请", user: name, time: "—", result: "未提交", resultType: "info" }];
  }

  const records = [
    { node: "员工提交", user: name, time: submitTime, result: "已提交", resultType: "primary" },
    { node: "部门负责人审核", user: "—", time: "—", result: "待审核", resultType: "info" },
    { node: "人力资源部审核", user: "—", time: "—", result: "待审核", resultType: "info" },
  ];

  if (statusKey === "pending_dept") {
    records[1].result = "待审核";
    records[1].resultType = "warning";
    return records;
  }

  if (statusKey === "pending_hr") {
    records[1].user = "李主任";
    records[1].time = submitTime || "—";
    records[1].result = "同意";
    records[1].resultType = "success";
    records[2].result = "待审核";
    records[2].resultType = "warning";
    return records;
  }

  if (statusKey === "approved") {
    records[1].user = "李主任";
    records[1].time = "2026-05-08 14:30:00";
    records[1].result = "同意";
    records[1].resultType = "success";
    records[2].user = "王专员";
    records[2].time = "2026-05-09 10:15:00";
    records[2].result = "通过（撤销旷工）";
    records[2].resultType = "success";
    return records;
  }

  if (statusKey === "rejected") {
    records[1].user = "李主任";
    records[1].time = "2026-05-08 11:20:00";
    records[1].result = "同意";
    records[1].resultType = "success";
    records[2].user = "王专员";
    records[2].time = "2026-05-09 09:40:00";
    records[2].result = "驳回";
    records[2].resultType = "danger";
    records[2].remark = "补充材料不足以证明在岗，维持旷工判定";
    return records;
  }

  return records;
}
