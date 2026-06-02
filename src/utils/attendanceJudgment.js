/**
 * 柔性化考勤表单元格 — 判定依据详情
 */
import { RULE_CHAIN_DETAILS } from "./behaviorModeSettings";
import { buildAbsentDetail } from "./absentAppeal";
import { collectRawEvidenceRecords } from "./sensingRawEvidence";
import { getLeaveDisplayByName } from "./leaveTypeDisplay";

function parseTimeToMinutes(str) {
  if (!str || str === "—") return null;
  const m = String(str).match(/(\d{2}):(\d{2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return null;
}

function configMinutes(config, type) {
  const t = type === "arrival" ? config.arrivalTime : config.departureTime;
  const [h, m] = String(t || "08:30").split(":").map(Number);
  return h * 60 + (m || 0);
}

function getAttendanceLayer(level) {
  const chain = RULE_CHAIN_DETAILS.find((c) => c.catalogId === "attendance");
  return chain?.layers.find((l) => l.level === level) || null;
}

const STATUS_LABELS = {
  ok: "正常出勤",
  late: "迟到",
  early: "早退/异常",
  absent: "旷工",
  leave: "休假",
  travel: "出差",
  training: "培训",
  weekend: "休息日",
};

const STATUS_TEXT = {
  ok: "√",
  late: "迟",
  early: "△",
  absent: "旷",
  leave: "年",
  travel: "差",
  training: "培",
  weekend: "周末",
};

function isLeaveStatusType(statusType) {
  return statusType === "leave" || (statusType && String(statusType).startsWith("leave-"));
}

function resolveLeaveStatusMeta(statusType, leaveTypeName) {
  if (!leaveTypeName) return null;
  const display = getLeaveDisplayByName(leaveTypeName);
  return {
    statusLabel: display.name,
    statusText: display.short,
    statusType: display.cellType,
  };
}

function abnormalTypeForStatus(statusType) {
  if (statusType === "late") return "迟到";
  if (statusType === "early") return "早退";
  if (statusType === "absent") return "旷工";
  return null;
}

function findAbnormalRow(abnormalRows, personId, dateStr, statusType) {
  const type = abnormalTypeForStatus(statusType);
  if (!type) return null;
  return (abnormalRows || []).find(
    (r) => r.personId === personId && r.recordDate === dateStr && r.abnormalType === type
  );
}

function buildEvidence(ctx, att, config, statusType) {
  const lines = [];
  if (ctx?.arrivalTime && ctx.arrivalTime !== "—") {
    lines.push(`闸机进入：${ctx.arrivalTime}`);
  }
  if (ctx?.departureTime && ctx.departureTime !== "—") {
    lines.push(`闸机离开：${ctx.departureTime}`);
  }
  if (ctx?.loginEarliest && ctx.loginEarliest !== "—") {
    lines.push(`最早登录：${ctx.loginEarliest}`);
  }
  if (ctx?.loginLatest && ctx.loginLatest !== "—") {
    lines.push(`最晚登录：${ctx.loginLatest}`);
  }
  if (ctx?.elinkLoginTime && ctx.elinkLoginTime !== "—") {
    lines.push(`elink 登录：${ctx.elinkLoginTime}`);
  }
  if (ctx?.leaveType) {
    lines.push(`休假类型：${ctx.leaveType}`);
  }
  if (ctx?.travelStart || ctx?.travelEnd) {
    lines.push(`出差时段：${ctx.travelStart || "—"} ~ ${ctx.travelEnd || "—"}`);
  }
  if (ctx?.trainingTime || ctx?.trainingEndTime) {
    lines.push(`培训时段：${ctx.trainingTime || "—"} ~ ${ctx.trainingEndTime || "—"}`);
  }
  if (att?.arrivalTime && att.arrivalTime !== "—" && !lines.some((l) => l.startsWith("闸机进入"))) {
    lines.push(`到岗时间：${att.arrivalTime}`);
  }
  if (att?.departureTime && att.departureTime !== "—" && !lines.some((l) => l.startsWith("闸机离开"))) {
    lines.push(`离岗时间：${att.departureTime}`);
  }
  const gateBased = ["ok", "late", "early"].includes(statusType);
  if (gateBased && (config?.arrivalTime || config?.departureTime)) {
    lines.push(`制度时间：到岗 ${config.arrivalTime || "08:30"} / 离岗 ${config.departureTime || "17:30"}`);
  }
  return lines.length ? lines.join("\n") : "";
}

function finalizeDetail(detail, params) {
  const rawEvidence = collectRawEvidenceRecords({
    personId: params.personId,
    dateStr: params.dateStr,
    statusType: detail.statusType,
    gateRows: params.gateRows,
    canteenRows: params.canteenRows,
    onlineRows: params.onlineRows,
    standardRows: params.standardRows,
  });
  return { ...detail, rawEvidence };
}

function resolveLayerNumber(att, statusType, slot) {
  const fromRow = parseInt(String(att?.ruleLevel || "").replace(/\D/g, ""), 10);
  if (fromRow) return fromRow;
  const type = att?.attendanceType || "";
  if (type === "培训") return 1;
  if (type === "出差") return 2;
  if (type === "休假" || type.includes("假")) return 3;
  if (type === "迟到" || statusType === "late") return 5;
  if (type === "早退" || statusType === "early") return 6;
  if (type === "出勤") {
    if (statusType === "late" && slot === "am") return 5;
    if (statusType === "early" && slot === "pm") return 6;
    return 4;
  }
  if (statusType === "training") return 1;
  if (statusType === "travel") return 2;
  if (isLeaveStatusType(statusType)) return 3;
  if (statusType === "ok") return 4;
  return null;
}

function buildSlotRuleDesc(statusType, slot, att, ctx, config, layer) {
  const arrivalMin = configMinutes(config, "arrival");
  const departureMin = configMinutes(config, "departure");
  const inMin = ctx?.arrivalTime ? parseTimeToMinutes(ctx.arrivalTime) : parseTimeToMinutes(att?.arrivalTime);
  const outMin = ctx?.departureTime ? parseTimeToMinutes(ctx.departureTime) : parseTimeToMinutes(att?.departureTime);

  if (statusType === "late" && slot === "am") {
    const t = ctx?.arrivalTime || att?.arrivalTime || "—";
    return `上午时段：闸机/登录最早进入 ${t} 晚于上岗时间 ${config.arrivalTime || "08:30"}`;
  }
  if (statusType === "early" && slot === "pm") {
    const t = ctx?.departureTime || att?.departureTime || "—";
    return `下午时段：闸机/登录最晚离开 ${t} 早于离岗时间 ${config.departureTime || "17:30"}`;
  }
  if (statusType === "ok" && slot === "am" && inMin != null) {
    return `上午时段：进入时间 ${ctx?.arrivalTime || att?.arrivalTime} ${inMin <= arrivalMin ? "≤" : ">"} 上岗时间 ${config.arrivalTime || "08:30"}`;
  }
  if (statusType === "ok" && slot === "pm" && outMin != null) {
    return `下午时段：离开时间 ${ctx?.departureTime || att?.departureTime} ${outMin >= departureMin ? "≥" : "<"} 离岗时间 ${config.departureTime || "17:30"}`;
  }
  if (layer?.logic) return layer.logic;
  if (att?.attendanceType) {
    const label = isLeaveStatusType(statusType) && ctx?.leaveType ? ctx.leaveType : att.attendanceType;
    return `无感考勤规则判定考勤类型为「${label}」，${slot === "am" ? "上午" : "下午"}展示为${STATUS_LABELS[statusType] || label || statusType}`;
  }
  return "依据无感考勤表逐层 waterfall 规则判定";
}

function buildFromAttendance(base, att, statusType, slot, ctx, config) {
  const layerNum = resolveLayerNumber(att, statusType, slot);
  const layer = layerNum ? getAttendanceLayer(layerNum) : null;
  return {
    ...base,
    ruleName: layer ? `无感考勤表·${layer.name}` : `无感考勤表·${att.attendanceType || STATUS_LABELS[statusType]}判定`,
    ruleLevel: att.ruleLevel || (layer ? `第${layer.level}层` : "—"),
    targetTable: att.targetTable || layer?.targetTable || "无感考勤表",
    dataSources: att.dataSources || (ctx?.sources || []).join("、") || layer?.source || "—",
    ruleDesc: buildSlotRuleDesc(statusType, slot, att, ctx, config, layer),
    evidence: buildEvidence(ctx, att, config, statusType),
  };
}

function buildFromContext(base, statusType, slot, ctx, config) {
  const layerNum = resolveLayerNumber(null, statusType, slot);
  const layer = layerNum ? getAttendanceLayer(layerNum) : null;

  if (isLeaveStatusType(statusType) && ctx?.leaveType) {
    return {
      ...base,
      ruleName: "无感考勤表·休假判定",
      ruleLevel: "第3层",
      targetTable: "无感考勤表",
      dataSources: (ctx.sources || []).join("、") || "人资域休假台账",
      ruleDesc: `人资休假台账存在「${ctx.leaveType}」记录，考勤类型与休假类型一致`,
      evidence: buildEvidence(ctx, null, config, statusType),
    };
  }
  if (statusType === "travel" && ctx?.hasTravel) {
    return {
      ...base,
      ruleName: "无感考勤表·商旅判定",
      ruleLevel: "第2层",
      targetTable: "无感考勤表",
      dataSources: (ctx.sources || []).join("、") || "南网商旅通",
      ruleDesc: layer?.logic || "南网商旅通存在出差申请记录，判定为出差",
      evidence: buildEvidence(ctx, null, config, statusType),
    };
  }
  if (statusType === "training" && ctx?.hasLearn) {
    return {
      ...base,
      ruleName: "无感考勤表·培训判定",
      ruleLevel: "第1层",
      targetTable: "无感考勤表",
      dataSources: (ctx.sources || []).join("、") || "南网智学",
      ruleDesc: layer?.logic || "南网智学存在培训记录，判定为培训",
      evidence: buildEvidence(ctx, null, config, statusType),
    };
  }
  if (statusType === "ok") {
    return {
      ...base,
      ruleName: layer ? `无感考勤表·${layer.name}` : "无感考勤表·正常出勤",
      ruleLevel: layer ? `第${layer.level}层` : "第4层",
      targetTable: "无感考勤表",
      dataSources: (ctx?.sources || []).join("、") || "闸机/门禁、数认平台",
      ruleDesc: buildSlotRuleDesc(statusType, slot, null, ctx, config, layer) || "闸机进出或登录记录满足在岗时间要求，判定为正常出勤",
      evidence: buildEvidence(ctx, null, config, statusType),
    };
  }
  if (statusType === "late" || statusType === "early") {
    return {
      ...base,
      ruleName: layer ? `无感考勤表·${layer.name}` : `无感考勤表·${STATUS_LABELS[statusType]}判定`,
      ruleLevel: layer ? `第${layer.level}层` : "—",
      targetTable: "无感考勤表",
      dataSources: (ctx?.sources || []).join("、") || "闸机/门禁",
      ruleDesc: buildSlotRuleDesc(statusType, slot, null, ctx, config, layer),
      evidence: buildEvidence(ctx, null, config, statusType),
    };
  }
  return {
    ...base,
    ruleName: "无感考勤表·默认展示",
    ruleLevel: "—",
    targetTable: "无感考勤表",
    dataSources: "—",
    ruleDesc: "当日无异常记录，按默认规则展示",
    evidence: buildEvidence(ctx, null, config, statusType),
  };
}

/** 构建单元格判定依据（点击柔性化考勤表时展示） */
export function buildCellJudgmentDetail({
  statusType,
  leaveTypeName = null,
  slot,
  personId,
  name,
  orgName,
  dateStr,
  att = null,
  ctx = null,
  config = {},
  abnormalRows = [],
  gateRows = [],
  canteenRows = [],
  onlineRows = [],
  standardRows = [],
}) {
  const rawParams = {
    personId,
    dateStr,
    gateRows,
    canteenRows,
    onlineRows,
    standardRows,
  };

  const leaveMeta = resolveLeaveStatusMeta(statusType, leaveTypeName || ctx?.leaveType || att?.attendanceType);
  const base = {
    personId,
    name,
    orgName,
    recordDate: dateStr,
    slot: slot === "am" ? "上午" : "下午",
    statusType: leaveMeta?.statusType || statusType,
    statusText: leaveMeta?.statusText || STATUS_TEXT[statusType] || "—",
    statusLabel: leaveMeta?.statusLabel || STATUS_LABELS[statusType] || statusType,
    showAppeal: false,
  };

  if (statusType === "weekend") {
    return finalizeDetail(
      {
        ...base,
        ruleName: "工作日历规则",
        ruleLevel: "—",
        targetTable: "—",
        dataSources: "—",
        ruleDesc: "周六、周日为休息日，不计入出勤考核。",
        evidence: "",
      },
      rawParams
    );
  }

  if (statusType === "absent") {
    const absent = buildAbsentDetail({ personId, dateStr, abnormalRows, name, orgName });
    return finalizeDetail(
      {
        ...absent,
        ...base,
        statusLabel: "旷工",
        statusText: "旷",
        showAppeal: true,
        evidence: buildEvidence(ctx, att, config, statusType),
      },
      rawParams
    );
  }

  const abnormal = findAbnormalRow(abnormalRows, personId, dateStr, statusType);
  if (abnormal) {
    return finalizeDetail(
      {
        ...base,
        ruleName: `异常考勤校验表·${abnormal.abnormalType}判定`,
        ruleLevel: abnormal.ruleLevel,
        targetTable: "异常考勤校验表",
        dataSources: abnormal.dataSources || "—",
        ruleDesc: abnormal.detail || "异常校验规则命中",
        evidence: buildEvidence(ctx, att, config, statusType),
      },
      rawParams
    );
  }

  if (isLeaveStatusType(statusType) && leaveTypeName) {
    return finalizeDetail(
      {
        ...base,
        ruleName: "无感考勤表·休假判定",
        ruleLevel: "第3层",
        targetTable: "无感考勤表",
        dataSources: (ctx?.sources || []).join("、") || "人资域休假台账",
        ruleDesc: `人资休假台账存在「${leaveTypeName}」记录，考勤类型与休假类型一致`,
        evidence: buildEvidence(ctx, att, config, statusType),
      },
      rawParams
    );
  }

  if (att) {
    return finalizeDetail(buildFromAttendance(base, att, statusType, slot, ctx, config), rawParams);
  }

  return finalizeDetail(buildFromContext(base, statusType, slot, ctx, config), rawParams);
}
