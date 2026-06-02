/**
 * 无感基础数据管理 — 四类业务规则引擎
 * 1. 无感考勤表生成规则（9层）
 * 2. 异常考勤校验表生成规则（6层）
 * 3. 工时计算规则-管理类/专业技术类（4层）
 * 4. 工时计算规则-技能类（5层）
 */
import { isMissing } from "./sensingRecords";
import { getEffectiveRecordOrg, loadOrgAssociations } from "./sensingOrgAssociation";
import { DEFAULT_WORK_CONFIG, RULE_CATALOG } from "./behaviorModeSettings";

export { DEFAULT_WORK_CONFIG, RULE_CATALOG };

function parseTimeToMinutes(str, defaultDate) {
  if (isMissing(str)) return null;
  const s = String(str).trim();
  const m = s.match(/(\d{2}):(\d{2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const d = new Date(s.replace(/-/g, "/"));
  if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  if (defaultDate && s.length === 10) return null;
  return null;
}

function configMinutes(config, type) {
  const t = type === "arrival" ? config.arrivalTime : config.departureTime;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function durationHours(start, end) {
  const a = parseTimeToMinutes(start);
  const b = parseTimeToMinutes(end);
  if (a == null || b == null || b <= a) return 0;
  return Math.round(((b - a) / 60) * 10) / 10;
}

function isWorkday(dateStr) {
  const d = new Date(String(dateStr).replace(/-/g, "/"));
  if (isNaN(d.getTime())) return false;
  const dow = d.getDay();
  return dow !== 0 && dow !== 6;
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function pickEarlierTime(a, b) {
  if (!a || isMissing(a)) return b;
  if (!b || isMissing(b)) return a;
  const am = parseTimeToMinutes(a);
  const bm = parseTimeToMinutes(b);
  if (am == null) return b;
  if (bm == null) return a;
  return am <= bm ? a : b;
}

function pickLaterTime(a, b) {
  if (!a || isMissing(a)) return b;
  if (!b || isMissing(b)) return a;
  const am = parseTimeToMinutes(a);
  const bm = parseTimeToMinutes(b);
  if (am == null) return b;
  if (bm == null) return a;
  return am >= bm ? a : b;
}

function hasAnyEvidence(ctx) {
  return (
    ctx.hasLearn ||
    ctx.hasTravel ||
    ctx.hasLeave ||
    ctx.hasGate ||
    ctx.hasLogin ||
    ctx.hasCanteen ||
    ctx.hasWorkTicket
  );
}

function hasPrimaryEvidence(ctx) {
  return ctx.hasLearn || ctx.hasTravel || ctx.hasLeave || ctx.hasGate || ctx.hasLogin;
}

function isInsufficientEvidenceDay(ctx) {
  return hasAnyEvidence(ctx) && !hasPrimaryEvidence(ctx);
}

function isAbnormalLayerEnabled(ruleConfig, level) {
  if (!ruleConfig) return true;
  if (ruleConfig.enabled === false) return false;
  const layer = (ruleConfig.layers || []).find((l) => l.level === level);
  if (!layer) return true;
  return layer.enabled !== false;
}

function consecutiveWorkdayStreak(contextMap, personId, endDate, predicate, maxLookback = 40) {
  let streak = 0;
  let cursor = new Date(String(endDate).replace(/-/g, "/"));
  let guard = 0;
  while (guard < maxLookback) {
    guard += 1;
    const dateStr = toDateStr(cursor);
    if (isWorkday(dateStr)) {
      const ctx = contextMap.get(`${personId}|${dateStr}`);
      if (!ctx || !predicate(ctx)) break;
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function buildConflictDetail(ctx) {
  const parts = [];
  if (ctx.hasTravel && ctx.hasLeave) parts.push("出差与休假");
  if (ctx.hasLearn && ctx.hasLeave) parts.push("培训与休假");
  return `${parts.join("、") || "多源"}记录同日重叠`;
}

function isLoginLateBothPlatforms(ctx, arrivalMin) {
  if (!ctx.hasLogin || !ctx.hasElink) return false;
  const shurenMin = parseTimeToMinutes(ctx.loginEarliest || ctx.loginTime);
  const elinkMin = parseTimeToMinutes(ctx.elinkLoginTime || ctx.loginTime);
  return (
    shurenMin != null &&
    elinkMin != null &&
    shurenMin > arrivalMin &&
    elinkMin > arrivalMin
  );
}

function evaluateAbnormalForContext(ctx, config, contextMap, ruleConfig) {
  const arrivalMin = configMinutes(config, "arrival");
  const departureMin = configMinutes(config, "departure");
  const streakDays = config.loginLateConsecutiveDays ?? DEFAULT_WORK_CONFIG.loginLateConsecutiveDays;

  const base = {
    orgName: ctx.orgName,
    name: ctx.name,
    personId: ctx.personId,
    recordDate: ctx.recordDate,
  };

  if (isAbnormalLayerEnabled(ruleConfig, 1) && (ctx.hasTravel || ctx.hasLearn) && ctx.hasLeave) {
    return {
      ...base,
      id: `abn-conflict-${ctx.key}`,
      abnormalType: "在岗证据冲突",
      ruleLevel: "异常第1层",
      detail: buildConflictDetail(ctx),
      dataSources: ctx.sources.join("、"),
    };
  }

  if (isAbnormalLayerEnabled(ruleConfig, 2) && ctx.hasGate && !isMissing(ctx.arrivalTime)) {
    const inMin = parseTimeToMinutes(ctx.arrivalTime);
    if (inMin != null && inMin > arrivalMin) {
      return {
        ...base,
        id: `abn-late-gate-${ctx.key}`,
        abnormalType: "迟到",
        ruleLevel: "异常第2层",
        detail: `闸机最早进入晚于上岗时间 ${config.arrivalTime}`,
        dataSources: "闸机/门禁",
      };
    }
  }

  if (isAbnormalLayerEnabled(ruleConfig, 3) && ctx.hasGate && !isMissing(ctx.departureTime)) {
    const outMin = parseTimeToMinutes(ctx.departureTime);
    if (outMin != null && outMin < departureMin) {
      return {
        ...base,
        id: `abn-early-${ctx.key}`,
        abnormalType: "早退",
        ruleLevel: "异常第3层",
        detail: `闸机最晚离开早于离岗时间 ${config.departureTime}`,
        dataSources: "闸机/门禁",
      };
    }
  }

  if (isAbnormalLayerEnabled(ruleConfig, 4)) {
    const loginLateStreak = consecutiveWorkdayStreak(
      contextMap,
      ctx.personId,
      ctx.recordDate,
      (dayCtx) => isLoginLateBothPlatforms(dayCtx, arrivalMin)
    );
    if (loginLateStreak >= streakDays) {
      return {
        ...base,
        id: `abn-late-login-${ctx.key}`,
        abnormalType: "迟到",
        ruleLevel: "异常第4层",
        detail: `连续 ${loginLateStreak} 个工作日数认与 elink 最早登录均晚于上岗时间 ${config.arrivalTime}`,
        dataSources: "数认平台/elink",
      };
    }
  }

  if (isAbnormalLayerEnabled(ruleConfig, 5)) {
    const insufficientStreak = consecutiveWorkdayStreak(
      contextMap,
      ctx.personId,
      ctx.recordDate,
      isInsufficientEvidenceDay
    );
    if (insufficientStreak >= streakDays) {
      return {
        ...base,
        id: `abn-insufficient-${ctx.key}`,
        abnormalType: "在岗证据不足",
        ruleLevel: "异常第5层",
        detail: `连续 ${insufficientStreak} 个工作日仅有辅助数据，无法判定考勤类型`,
        dataSources: ctx.sources.join("、"),
      };
    }
  }

  if (isAbnormalLayerEnabled(ruleConfig, 6) && !hasAnyEvidence(ctx)) {
    return {
      ...base,
      id: `abn-absent-${ctx.key}`,
      abnormalType: "旷工",
      ruleLevel: "异常第6层",
      detail: "各系统均无该人员当日记录",
      dataSources: "—",
    };
  }

  return null;
}

/** 由标准宽表行构建规则计算上下文（四规则统一读标准表） */
export function buildPersonDayContextsFromStandardRows(standardRows) {
  return standardRows.map((row) => {
    const sources =
      row.sources && row.sources.length
        ? row.sources
        : String(row.dataSources || "")
            .split("、")
            .map((s) => s.trim())
            .filter(Boolean);
    return {
      key: `${row.personId}|${row.recordDate}`,
      personId: row.personId,
      recordDate: row.recordDate,
      name: row.name,
      orgName: row.orgName,
      orgId: row.orgId,
      sources,
      hasLearn: !isMissing(row.trainingStartTime),
      trainingTime: isMissing(row.trainingStartTime) ? null : row.trainingStartTime,
      trainingEndTime: isMissing(row.trainingEndTime) ? null : row.trainingEndTime,
      trainingHours: 6,
      hasTravel: !isMissing(row.businessTripStartTime) || !isMissing(row.travelStartTime),
      travelStart: !isMissing(row.businessTripStartTime)
        ? row.businessTripStartTime
        : isMissing(row.travelStartTime)
          ? null
          : row.travelStartTime,
      travelEnd: !isMissing(row.businessTripEndTime)
        ? row.businessTripEndTime
        : isMissing(row.travelEndTime)
          ? null
          : row.travelEndTime,
      hasLeave: !isMissing(row.leaveType),
      leaveType: isMissing(row.leaveType) ? null : row.leaveType,
      leaveStart: isMissing(row.leaveStartTime) ? null : row.leaveStartTime,
      hasGate: !isMissing(row.arrivalTime),
      arrivalTime: isMissing(row.arrivalTime) ? null : row.arrivalTime,
      departureTime: isMissing(row.departureTime) ? null : row.departureTime,
      hasLogin: !isMissing(row.loginTime) || !isMissing(row.loginEarliestTime),
      loginTime: isMissing(row.loginEarliestTime)
        ? isMissing(row.loginTime)
          ? null
          : row.loginTime
        : row.loginEarliestTime,
      loginEarliest: isMissing(row.loginEarliestTime) ? null : row.loginEarliestTime,
      loginLatest: isMissing(row.loginLatestTime) ? null : row.loginLatestTime,
      hasElink: !isMissing(row.elinkLoginTime),
      elinkLoginTime: isMissing(row.elinkLoginTime) ? null : row.elinkLoginTime,
      hasCanteen:
        !isMissing(row.breakfastTime) || !isMissing(row.lunchTime) || !isMissing(row.dinnerTime),
      breakfastTime: row.breakfastTime,
      lunchTime: row.lunchTime,
      dinnerTime: row.dinnerTime,
      hasWorkTicket: !isMissing(row.workTicketStartTime),
      workTicketStart: isMissing(row.workTicketStartTime) ? null : row.workTicketStartTime,
      workTicketEnd: isMissing(row.workTicketEndTime) ? null : row.workTicketEndTime,
    };
  });
}

/** 由七源明细构建人员-日期上下文 */
export function buildPersonDayContexts(gateRows, canteenRows, onlineRows) {
  const map = new Map();
  const touch = (personId, recordDate, patch) => {
    if (!personId || !recordDate) return null;
    const key = `${personId}|${recordDate}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        personId,
        recordDate,
        name: "",
        orgName: "",
        orgId: "",
        sources: [],
        hasLearn: false,
        trainingTime: null,
        trainingEndTime: null,
        trainingHours: 6,
        hasTravel: false,
        travelStart: null,
        travelEnd: null,
        hasLeave: false,
        leaveType: null,
        leaveStart: null,
        hasGate: false,
        arrivalTime: null,
        departureTime: null,
        hasLogin: false,
        loginTime: null,
        loginEarliest: null,
        loginLatest: null,
        hasElink: false,
        elinkLoginTime: null,
        hasCanteen: false,
        breakfastTime: null,
        lunchTime: null,
        dinnerTime: null,
        hasWorkTicket: false,
        workTicketStart: null,
        workTicketEnd: null,
      });
    }
    const row = map.get(key);
    Object.assign(row, patch);
    return row;
  };

  gateRows.forEach((r) => {
    if (!r.personId) return;
    const ctx = touch(r.personId, r.recordDate, {
      name: r.name,
      orgName: r.orgName,
      orgId: r.orgId,
      hasGate: true,
      arrivalTime: isMissing(r.entryTime) ? null : r.entryTime,
      departureTime: isMissing(r.exitTime) ? null : r.exitTime,
    });
    if (ctx && !ctx.sources.includes("闸机门禁")) ctx.sources.push("闸机门禁");
  });

  canteenRows.forEach((r) => {
    if (!r.personId) return;
    const ctx = touch(r.personId, r.recordDate, {
      name: r.name,
      orgName: r.orgName,
      hasCanteen: true,
      breakfastTime: r.breakfast,
      lunchTime: r.lunch,
      dinnerTime: r.dinner,
    });
    if (ctx && !ctx.sources.includes("食堂用餐")) ctx.sources.push("食堂用餐");
  });

  onlineRows.forEach((r) => {
    const personId = r.personId || r.用户ID || r.员工编号;
    const recordDate =
      r.recordDate ||
      String(r.出差开始日期 || r.培训时间 || r.创建时间 || r.实际开始时间 || "").slice(0, 10);
    if (!personId || !recordDate) return;
    const effective = getEffectiveRecordOrg(r, loadOrgAssociations());
    const name = r.name || r.姓名 || r.出行人 || r.负责人 || "";
    const orgName =
      effective.orgName || r.orgName || r.单位名称 || r.所属单位 || r.单位 || "—";
    const orgId = effective.orgId || r.orgId || "";

    if (r.sourceCode === "online_learn") {
      const ctx = touch(personId, recordDate, {
        name,
        orgName,
        orgId,
        hasLearn: true,
        trainingTime: r.培训时间,
        trainingEndTime: r.培训结束时间,
      });
      if (ctx && !ctx.sources.includes("南网智学")) ctx.sources.push("南网智学");
    } else if (r.sourceCode === "online_travel") {
      const ctx = touch(personId, recordDate, {
        name,
        orgName,
        orgId,
        hasTravel: true,
        travelStart: r.出差开始日期,
        travelEnd: r.出差结束日期,
      });
      if (ctx && !ctx.sources.includes("南网商旅通")) ctx.sources.push("南网商旅通");
    } else if (r.sourceCode === "online_leave") {
      const ctx = touch(personId, recordDate, {
        name,
        orgName,
        orgId,
        hasLeave: true,
        leaveType: r.休假类型,
        leaveStart: r.休假详情起始时间,
      });
      if (ctx && !ctx.sources.includes("人资休假")) ctx.sources.push("人资休假");
    } else if (r.sourceCode === "online_login") {
      const loginTime = r.创建时间;
      const hasLogin = !isMissing(loginTime);
      const hasElink =
        !isMissing(r.elink消息ID) ||
        !isMissing(r.ELINK_MSG_ID) ||
        String(r.作用域 || r.SCOPE || "").toLowerCase().includes("elink");
      const ctx = touch(personId, recordDate, { name, orgName, orgId });
      if (ctx) {
        if (hasLogin) {
          ctx.hasLogin = true;
          ctx.loginTime = loginTime;
          ctx.loginEarliest = pickEarlierTime(ctx.loginEarliest, loginTime);
          ctx.loginLatest = pickLaterTime(ctx.loginLatest, loginTime);
        }
        if (hasElink || hasLogin) {
          ctx.hasElink = true;
          ctx.elinkLoginTime = pickEarlierTime(ctx.elinkLoginTime, loginTime);
        }
        if (!ctx.sources.includes("数认平台")) ctx.sources.push("数认平台");
        if (ctx.hasElink && !ctx.sources.includes("elink")) ctx.sources.push("elink");
      }
    } else if (r.sourceCode === "online_workticket") {
      const ctx = touch(personId, recordDate, {
        name,
        orgName,
        orgId,
        hasWorkTicket: true,
        workTicketStart: r.实际开始时间,
        workTicketEnd: r.实际结束时间,
      });
      if (ctx && !ctx.sources.includes("工作票")) ctx.sources.push("工作票");
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.recordDate === b.recordDate
      ? a.personId.localeCompare(b.personId)
      : b.recordDate.localeCompare(a.recordDate)
  );
}

/** 无感考勤表（规则 1-6 层） */
export function generateSenselessAttendanceTable(contexts, config = DEFAULT_WORK_CONFIG) {
  const arrivalMin = configMinutes(config, "arrival");
  const departureMin = configMinutes(config, "departure");

  return contexts
    .map((ctx) => {
      let attendanceType = null;
      let ruleLevel = null;
      let targetTable = "无感考勤表";

      if (ctx.hasLearn) {
        attendanceType = "培训";
        ruleLevel = 1;
      } else if (ctx.hasTravel) {
        attendanceType = "出差";
        ruleLevel = 2;
      } else if (ctx.hasLeave) {
        attendanceType = ctx.leaveType || "休假";
        ruleLevel = 3;
      } else if (ctx.hasGate && !isMissing(ctx.arrivalTime) && !isMissing(ctx.departureTime)) {
        const inMin = parseTimeToMinutes(ctx.arrivalTime);
        const outMin = parseTimeToMinutes(ctx.departureTime);
        if (inMin != null && outMin != null) {
          if (inMin <= arrivalMin && outMin >= departureMin) {
            attendanceType = "出勤";
            ruleLevel = 4;
          } else if (inMin > arrivalMin) {
            attendanceType = "迟到";
            ruleLevel = 5;
          } else if (outMin < departureMin) {
            attendanceType = "早退";
            ruleLevel = 6;
          }
        }
      }

      if (!attendanceType) return null;

      return {
        id: `att-${ctx.key}`,
        orgName: ctx.orgName,
        name: ctx.name,
        personId: ctx.personId,
        recordDate: ctx.recordDate,
        attendanceType,
        arrivalTime: ctx.arrivalTime || "—",
        departureTime: ctx.departureTime || "—",
        dataSources: ctx.sources.join("、"),
        ruleLevel: `第${ruleLevel}层`,
        targetTable,
        remark: `到岗 ${config.arrivalTime} / 离岗 ${config.departureTime}`,
      };
    })
    .filter(Boolean);
}

/** 异常考勤校验表（6 层逐层校验，命中即停止） */
export function generateAbnormalAttendanceTable(
  contexts,
  config = DEFAULT_WORK_CONFIG,
  ruleConfig = null
) {
  if (ruleConfig && ruleConfig.enabled === false) return [];

  const contextMap = new Map(contexts.map((ctx) => [ctx.key, ctx]));
  const rows = [];

  contexts.forEach((ctx) => {
    const row = evaluateAbnormalForContext(ctx, config, contextMap, ruleConfig);
    if (row) rows.push(row);
  });

  return rows;
}

function isHoursLayerEnabled(ruleConfig, level) {
  if (!ruleConfig) return true;
  if (ruleConfig.enabled === false) return false;
  const layer = (ruleConfig.layers || []).find((l) => l.level === level);
  if (!layer) return true;
  return layer.enabled !== false;
}

function calcLoginWorkHours(ctx, params = {}) {
  const afterMin = parseTimeToMinutes(params.loginEarliestAfter || "08:00");
  const winStart = parseTimeToMinutes(params.loginLatestFrom || "18:00");
  const winEnd = parseTimeToMinutes(params.loginLatestTo || "22:00");
  const fallback = params.loginHoursPerDay ?? 7.5;

  const allTimes = [ctx.loginEarliest, ctx.loginLatest, ctx.loginTime, ctx.elinkLoginTime].filter(
    (t) => !isMissing(t)
  );
  if (!allTimes.length) return fallback;

  let startMin = null;
  let endMin = null;
  allTimes.forEach((t) => {
    const m = parseTimeToMinutes(t);
    if (m == null) return;
    if (m >= afterMin && (startMin == null || m < startMin)) startMin = m;
    if (m >= winStart && m <= winEnd && (endMin == null || m > endMin)) endMin = m;
  });

  if (startMin != null && endMin != null && endMin > startMin) {
    return Math.round(((endMin - startMin) / 60) * 10) / 10;
  }
  return fallback;
}

function evaluateMgmtWorkHours(ctx, att, params, ruleConfig) {
  if (!att) return null;

  if (isHoursLayerEnabled(ruleConfig, 1) && att.attendanceType === "培训" && ctx.hasLearn) {
    const hours =
      durationHours(ctx.trainingTime, ctx.trainingEndTime) || params.trainingHoursDefault || 6;
    return {
      hours,
      hoursType: "培训工时",
      ruleLevel: "管理第1层",
      dataSources: "无感考勤表、南网智学",
      remark: "按课表起止时间计算",
    };
  }

  if (isHoursLayerEnabled(ruleConfig, 2) && att.attendanceType === "出差" && ctx.hasTravel) {
    return {
      hours: params.travelHoursPerDay ?? 8,
      hoursType: "出差工时",
      ruleLevel: "管理第2层",
      dataSources: "无感考勤表、南网商旅通",
      remark: `按 ${params.travelHoursPerDay ?? 8} 小时/天计`,
    };
  }

  if (isHoursLayerEnabled(ruleConfig, 3) && att.attendanceType === "出勤" && ctx.hasGate) {
    const hours = durationHours(ctx.arrivalTime, ctx.departureTime);
    if (hours > 0) {
      return {
        hours,
        hoursType: "出勤工时",
        ruleLevel: "管理第3层",
        dataSources: "无感考勤表、闸机/门禁",
        remark: "最早进入至最晚离开时长",
      };
    }
  }

  if (
    isHoursLayerEnabled(ruleConfig, 4) &&
    att.attendanceType === "出勤" &&
    (ctx.hasLogin || ctx.hasElink)
  ) {
    return {
      hours: calcLoginWorkHours(ctx, params),
      hoursType: "出勤工时",
      ruleLevel: "管理第4层",
      dataSources: "无感考勤表、数认平台/elink",
      remark: `${params.loginEarliestAfter || "08:00"} 后起算，${params.loginLatestFrom || "18:00"}-${params.loginLatestTo || "22:00"} 内截止`,
    };
  }

  return null;
}

function evaluateSkillWorkHours(ctx, att, params, ruleConfig) {
  if (!att) return null;

  if (isHoursLayerEnabled(ruleConfig, 1) && att.attendanceType === "培训" && ctx.hasLearn) {
    const hours =
      durationHours(ctx.trainingTime, ctx.trainingEndTime) || params.trainingHoursDefault || 6;
    return {
      hours,
      hoursType: "培训工时",
      ruleLevel: "技能第1层",
      dataSources: "无感考勤表、南网智学",
      remark: "按课表起止时间计算",
    };
  }
  if (isHoursLayerEnabled(ruleConfig, 2) && ctx.hasWorkTicket) {
    const canUseWorkTicket =
      att.attendanceType === "出勤" ||
      att.attendanceType === "出差" ||
      att.attendanceType === "培训";
    if (canUseWorkTicket) {
      const hours =
        durationHours(ctx.workTicketStart, ctx.workTicketEnd) ||
        params.workTicketHoursDefault ||
        8;
      return {
        hours,
        hoursType: "工作票工时",
        ruleLevel: "技能第2层",
        dataSources: "无感考勤表、工作票系统",
        remark: "按工作票实际起止时间计算",
      };
    }
  }
  if (isHoursLayerEnabled(ruleConfig, 3) && att.attendanceType === "出差" && ctx.hasTravel) {
    return {
      hours: params.travelHoursPerDay ?? 8,
      hoursType: "出差工时",
      ruleLevel: "技能第3层",
      dataSources: "无感考勤表、南网商旅通",
      remark: `按 ${params.travelHoursPerDay ?? 8} 小时/天计`,
    };
  }
  if (isHoursLayerEnabled(ruleConfig, 4) && att.attendanceType === "出勤" && ctx.hasGate) {
    const hours = durationHours(ctx.arrivalTime, ctx.departureTime);
    if (hours > 0) {
      return {
        hours,
        hoursType: "出勤工时",
        ruleLevel: "技能第4层",
        dataSources: "无感考勤表、闸机/门禁",
        remark: "最早进入至最晚离开时长",
      };
    }
  }
  if (
    isHoursLayerEnabled(ruleConfig, 5) &&
    att.attendanceType === "出勤" &&
    (ctx.hasLogin || ctx.hasElink)
  ) {
    return {
      hours: calcLoginWorkHours(ctx, params),
      hoursType: "出勤工时",
      ruleLevel: "技能第5层",
      dataSources: "无感考勤表、数认平台/elink",
      remark: `${params.loginEarliestAfter || "08:00"} 后起算，${params.loginLatestFrom || "18:00"}-${params.loginLatestTo || "22:00"} 内截止`,
    };
  }
  return null;
}

/** 工时统计（管理类/专技 4 层、技能类 5 层，逐层匹配） */
export function generateWorkHoursTable(
  contexts,
  attendanceRows,
  category = "management",
  ruleConfig = null,
  hoursParams = null
) {
  if (ruleConfig && ruleConfig.enabled === false) return [];

  const params = hoursParams || ruleConfig?.hoursParams || {};
  const attMap = new Map(attendanceRows.map((r) => [`${r.personId}|${r.recordDate}`, r]));

  return contexts
    .map((ctx) => {
      const att = attMap.get(ctx.key);
      const result =
        category === "skill"
          ? evaluateSkillWorkHours(ctx, att, params, ruleConfig)
          : evaluateMgmtWorkHours(ctx, att, params, ruleConfig);

      if (!result) return null;

      return {
        id: `wh-${ctx.key}-${category}`,
        orgName: ctx.orgName,
        name: ctx.name,
        personId: ctx.personId,
        recordDate: ctx.recordDate,
        attendanceType: att.attendanceType,
        hoursType: result.hoursType,
        workHours: result.hours,
        ruleLevel: result.ruleLevel,
        dataSources: result.dataSources,
        remark: result.remark,
        category: category === "skill" ? "技能类" : "管理类/专业技术类",
      };
    })
    .filter(Boolean);
}
