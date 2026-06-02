/**
 * 柔性化考勤表（人员 × 日期 × 上下午）
 */
import { buildCellJudgmentDetail } from "./attendanceJudgment";
import {
  matchLeaveTypeName,
  buildLeaveSlotCell,
  buildLeaveLegendItems,
  normalizeLeaveDateMap,
  synthesizeLeaveEntries,
} from "./leaveTypeDisplay";

export { synthesizeLeaveEntries };

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

function cell(text, type = "normal", judgmentDetail = null) {
  return {
    text,
    type,
    class: `flex-cell flex-cell--${type}`,
    judgmentDetail,
  };
}

function attachJudgment(slots, meta) {
  const { statusType, slotMeta, leaveTypeName, ...rest } = meta;
  return {
    am: {
      ...slots.am,
      judgmentDetail: buildCellJudgmentDetail({
        statusType: slotMeta?.amType || statusType,
        leaveTypeName: slots.am.leaveTypeName || leaveTypeName,
        slot: "am",
        ...rest,
      }),
    },
    pm: {
      ...slots.pm,
      judgmentDetail: buildCellJudgmentDetail({
        statusType: slotMeta?.pmType || statusType,
        leaveTypeName: slots.pm.leaveTypeName || leaveTypeName,
        slot: "pm",
        ...rest,
      }),
    },
  };
}

function resolveDaySlots(att, ctx, config, isWeekend, judgmentMeta) {
  if (isWeekend) {
    const slots = { am: cell("周末", "weekend"), pm: cell("周末", "weekend") };
    return attachJudgment(slots, { statusType: "weekend", ...judgmentMeta });
  }

  /* 无当日明细时默认正常出勤（避免模拟数据稀疏导致整月旷工） */
  if (!att && !ctx) {
    const slots = { am: cell("√", "ok"), pm: cell("√", "ok") };
    return attachJudgment(slots, { statusType: "ok", ...judgmentMeta });
  }

  const type = att?.attendanceType || "";
  const arrivalMin = configMinutes(config, "arrival");
  const departureMin = configMinutes(config, "departure");
  const inMin = ctx?.arrivalTime ? parseTimeToMinutes(ctx.arrivalTime) : null;
  const outMin = ctx?.departureTime ? parseTimeToMinutes(ctx.departureTime) : null;

  const leaveName = matchLeaveTypeName(type);
  if (leaveName) {
    const leaveCell = buildLeaveSlotCell(leaveName);
    const slots = { am: { ...leaveCell }, pm: { ...leaveCell } };
    return attachJudgment(slots, {
      statusType: leaveCell.type,
      leaveTypeName: leaveName,
      ...judgmentMeta,
    });
  }
  if (type === "出差") {
    const slots = { am: cell("差", "travel"), pm: cell("差", "travel") };
    return attachJudgment(slots, { statusType: "travel", ...judgmentMeta });
  }
  if (type === "培训") {
    const slots = { am: cell("培", "training"), pm: cell("培", "training") };
    return attachJudgment(slots, { statusType: "training", ...judgmentMeta });
  }
  if (type === "迟到") {
    const slots = {
      am: cell("迟", "late"),
      pm: cell(outMin != null ? "√" : "—", outMin != null ? "ok" : "empty"),
    };
    return attachJudgment(slots, {
      statusType: "late",
      slotMeta: { amType: "late", pmType: outMin != null ? "ok" : "ok" },
      ...judgmentMeta,
    });
  }
  if (type === "早退") {
    const slots = {
      am: cell(inMin != null ? "√" : "—", inMin != null ? "ok" : "empty"),
      pm: cell("△", "early"),
    };
    return attachJudgment(slots, {
      statusType: "early",
      slotMeta: { amType: inMin != null ? "ok" : "ok", pmType: "early" },
      ...judgmentMeta,
    });
  }
  if (type === "出勤") {
    let amType = "ok";
    let pmType = "ok";
    if (inMin != null && inMin > arrivalMin) amType = "late";
    if (outMin != null && outMin < departureMin) pmType = "early";
    const slots = {
      am: cell(amType === "late" ? "迟" : "√", amType === "late" ? "late" : "ok"),
      pm: cell(pmType === "early" ? "△" : "√", pmType === "early" ? "early" : "ok"),
    };
    return attachJudgment(slots, {
      statusType: "ok",
      slotMeta: { amType, pmType },
      ...judgmentMeta,
    });
  }

  if (ctx?.hasLeave) {
    const leaveName = ctx.leaveType || "年休假";
    const leaveCell = buildLeaveSlotCell(leaveName);
    const slots = { am: { ...leaveCell }, pm: { ...leaveCell } };
    return attachJudgment(slots, {
      statusType: leaveCell.type,
      leaveTypeName: leaveName,
      ...judgmentMeta,
    });
  }
  if (ctx?.hasTravel) {
    const slots = { am: cell("差", "travel"), pm: cell("差", "travel") };
    return attachJudgment(slots, { statusType: "travel", ...judgmentMeta });
  }
  if (ctx?.hasLearn) {
    const slots = { am: cell("培", "training"), pm: cell("培", "training") };
    return attachJudgment(slots, { statusType: "training", ...judgmentMeta });
  }
  if (ctx?.hasGate || inMin != null) {
    const late = inMin != null && inMin > arrivalMin;
    const early = outMin != null && outMin < departureMin;
    const amType = late ? "late" : "ok";
    const pmType = early ? "early" : outMin != null ? "ok" : "ok";
    const slots = {
      am: cell(late ? "迟" : "√", late ? "late" : "ok"),
      pm: cell(early ? "△" : outMin != null ? "√" : "—", early ? "early" : outMin != null ? "ok" : "empty"),
    };
    return attachJudgment(slots, {
      statusType: "ok",
      slotMeta: { amType, pmType },
      ...judgmentMeta,
    });
  }

  const slots = { am: cell("√", "ok"), pm: cell("√", "ok") };
  return attachJudgment(slots, { statusType: "ok", ...judgmentMeta });
}

/** 按评估旷工次数生成若干工作日旷工日期（模拟展示用） */
export function synthesizeAbsentDates(periodMonth, count, personId) {
  if (!count || !periodMonth) return [];
  const [y, m] = periodMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const weekdays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(y, m - 1, d).getDay();
    if (dow !== 0 && dow !== 6) {
      weekdays.push(`${periodMonth}-${String(d).padStart(2, "0")}`);
    }
  }
  if (!weekdays.length) return [];
  const seed = String(personId || "")
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const picked = [];
  for (let offset = 0; picked.length < count && offset < weekdays.length * 2; offset++) {
    const idx = (seed + offset * 11) % weekdays.length;
    const date = weekdays[idx];
    if (!picked.includes(date)) picked.push(date);
  }
  return picked.slice(0, count);
}

/** 按请假天数生成若干工作日请假日期（模拟展示用，兼容旧接口） */
export function synthesizeLeaveDates(periodMonth, count, personId) {
  return synthesizeLeaveEntries(periodMonth, count, personId, synthesizeAbsentDates).map((e) => e.date);
}

/** 解析当月旷工日期：异常记录 + 评估旷工次数，至少 1 条 */
export function resolveSheetAbsentDates({ periodMonth, personId, absentCount = 0, abnormalRows = [] }) {
  const needAbsent = Math.max(0, Number(absentCount) || 0);
  if (!needAbsent || !periodMonth || !personId) return [];

  let dates = (abnormalRows || [])
    .filter(
      (r) =>
        r.personId === personId &&
        r.abnormalType === "旷工" &&
        r.recordDate &&
        String(r.recordDate).startsWith(periodMonth)
    )
    .map((r) => r.recordDate);

  dates = [...new Set(dates)];

  if (dates.length < needAbsent) {
    const extra = synthesizeAbsentDates(periodMonth, needAbsent - dates.length, personId).filter(
      (d) => !dates.includes(d)
    );
    dates = [...dates, ...extra];
  }

  if (dates.length === 0) {
    dates = synthesizeAbsentDates(periodMonth, 1, personId);
  }

  return dates.slice(0, Math.max(1, needAbsent));
}

export function resolveAttendanceYearMonth(rows, fallback = "2026-05") {
  const dates = (rows || []).map((r) => r.recordDate).filter(Boolean).sort();
  if (!dates.length) return fallback;
  return dates[dates.length - 1].slice(0, 7);
}

export function buildFlexibleAttendanceSheet({
  personId,
  contexts = [],
  attendanceRows = [],
  config = { arrivalTime: "08:30", departureTime: "17:30" },
  yearMonth,
  absentDates = [],
  leaveDates = [],
  abnormalRows = [],
  gateRows = [],
  canteenRows = [],
  onlineRows = [],
  standardRows = [],
}) {
  const ym = yearMonth || resolveAttendanceYearMonth(attendanceRows);
  const [year, month] = ym.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  const personCtx = contexts.find((c) => c.personId === personId);
  const personAtt = attendanceRows.find((r) => r.personId === personId);
  const name = personCtx?.name || personAtt?.name || "—";
  const orgName = personCtx?.orgName || personAtt?.orgName || "—";

  const ctxByDate = new Map();
  contexts.filter((c) => c.personId === personId).forEach((c) => ctxByDate.set(c.recordDate, c));

  const attByDate = new Map();
  attendanceRows.filter((r) => r.personId === personId).forEach((r) => attByDate.set(r.recordDate, r));

  const absentSet = new Set(absentDates);
  const leaveMap = normalizeLeaveDateMap(leaveDates);

  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(year, month - 1, d).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const judgmentMeta = {
      personId,
      name,
      orgName,
      dateStr,
      config,
      abnormalRows,
      gateRows,
      canteenRows,
      onlineRows,
      standardRows,
    };
    let slots;
    if (!isWeekend && absentSet.has(dateStr)) {
      const raw = { am: cell("旷", "absent"), pm: cell("旷", "absent") };
      slots = attachJudgment(raw, { statusType: "absent", ...judgmentMeta });
    } else if (!isWeekend && leaveMap.has(dateStr)) {
      const leaveName = leaveMap.get(dateStr);
      const leaveCell = buildLeaveSlotCell(leaveName);
      const raw = { am: { ...leaveCell }, pm: { ...leaveCell } };
      slots = attachJudgment(raw, {
        statusType: leaveCell.type,
        leaveTypeName: leaveName,
        ...judgmentMeta,
      });
    } else {
      const att = attByDate.get(dateStr);
      const ctx = ctxByDate.get(dateStr);
      slots = resolveDaySlots(att, ctx, config, isWeekend, {
        ...judgmentMeta,
        att,
        ctx,
      });
    }
    days.push({ day: d, date: dateStr, weekday: dow, isWeekend, ...slots });
  }

  return {
    personId,
    name,
    orgName,
    yearMonth: ym,
    days,
    legend: [
      { text: "√", label: "正常出勤", type: "ok" },
      { text: "迟", label: "迟到", type: "late" },
      { text: "△", label: "早退/异常", type: "early" },
      { text: "旷", label: "旷工", type: "absent" },
      { text: "差", label: "出差", type: "travel" },
      { text: "培", label: "培训", type: "training" },
      { text: "周末", label: "休息日", type: "weekend" },
    ],
    leaveLegend: buildLeaveLegendItems(),
  };
}
