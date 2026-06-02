/**
 * 休假类型 — 柔性化考勤表展示配置（简称、配色、图例）
 */
import { getLeaveTypes, LEAVE_TYPE_NAMES } from "./behaviorModeSettings";

/** 单元格内展示的简称（单字，互不重复） */
const SHORT_LABELS = {
  年休假: "年",
  事假: "事",
  病假: "病",
  探亲假: "探",
  婚假: "婚",
  丧假: "丧",
  流产假: "流",
  产假: "产",
  哺乳假: "哺",
  陪护假: "护",
  节育假: "节",
  育儿假: "育",
  父母护理假: "孝",
  其他: "其",
};

/** 配色分组：regular 常规 / medical 医疗 / family 家事 / maternity 生育 / care 照护 / other 其他 */
const CATEGORY_STYLES = {
  regular: { bg: "#e8f4ff", color: "#409eff", border: "#b3d8ff" },
  medical: { bg: "#fef0f0", color: "#f56c6c", border: "#fbc4c4" },
  family: { bg: "#fdf6ec", color: "#e6a23c", border: "#f5dab1" },
  maternity: { bg: "#f9ecf9", color: "#b86bd7", border: "#e8c4f0" },
  care: { bg: "#e8f8f0", color: "#3eaf7c", border: "#b8e6cf" },
  other: { bg: "#f4f4f5", color: "#909399", border: "#dcdfe6" },
};

const NAME_CATEGORY = {
  年休假: "regular",
  事假: "regular",
  病假: "medical",
  探亲假: "family",
  婚假: "family",
  丧假: "family",
  流产假: "medical",
  产假: "maternity",
  哺乳假: "maternity",
  陪护假: "care",
  节育假: "medical",
  育儿假: "care",
  父母护理假: "care",
  其他: "other",
};

function hashSeed(str) {
  return String(str || "")
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

/** 从考勤类型 / 上下文文本匹配休假类型名称 */
export function matchLeaveTypeName(text) {
  if (!text) return null;
  const str = String(text);
  const types = getLeaveTypes();
  const sorted = [...types].sort((a, b) => b.name.length - a.name.length);
  const hit = sorted.find((t) => str === t.name || str.includes(t.name));
  if (hit) return hit.name;
  if (str === "休假" || str === "请假") return "年休假";
  if (LEAVE_TYPE_NAMES.includes(str)) return str;
  return null;
}

/** 获取某休假类型的展示配置 */
export function getLeaveDisplayByName(name) {
  const types = getLeaveTypes();
  const matched = types.find((t) => t.name === name) || types.find((t) => name?.includes?.(t.name));
  const typeName = matched?.name || name || "其他";
  const code = matched?.code || "other";
  const category = NAME_CATEGORY[typeName] || "other";
  const style = CATEGORY_STYLES[category];
  return {
    name: typeName,
    code,
    short: SHORT_LABELS[typeName] || typeName.slice(0, 1),
    cellType: `leave-${code}`,
    category,
    style,
  };
}

/** 构建休假单元格内容 */
export function buildLeaveSlotCell(leaveTypeName) {
  const display = getLeaveDisplayByName(leaveTypeName);
  return {
    text: display.short,
    type: display.cellType,
    class: `flex-cell flex-cell--${display.cellType}`,
    leaveTypeName: display.name,
  };
}

/** 图例项：仅包含当前启用的休假类型 */
export function buildLeaveLegendItems() {
  return getLeaveTypes().map((t) => {
    const display = getLeaveDisplayByName(t.name);
    return {
      text: display.short,
      label: t.name,
      type: display.cellType,
      category: display.category,
    };
  });
}

/** 将 leaveDates 入参规范化为 Map<date, leaveTypeName> */
export function normalizeLeaveDateMap(leaveDates) {
  const map = new Map();
  (leaveDates || []).forEach((item) => {
    if (typeof item === "string") {
      map.set(item, "年休假");
      return;
    }
    if (item && item.date) {
      map.set(item.date, item.leaveType || "年休假");
    }
  });
  return map;
}

/** 按请假天数生成若干工作日休假记录（模拟展示，轮换多种休假类型） */
export function synthesizeLeaveEntries(periodMonth, count, personId, synthesizeDates) {
  if (!count || !periodMonth || typeof synthesizeDates !== "function") return [];
  const seedKey = `${personId}-leave`;
  const dates = synthesizeDates(periodMonth, count + 3, seedKey).slice(0, count);
  const enabledTypes = getLeaveTypes().map((t) => t.name);
  if (!enabledTypes.length) return dates.map((date) => ({ date, leaveType: "年休假" }));
  return dates.map((date, idx) => ({
    date,
    leaveType: enabledTypes[(hashSeed(`${personId}-${date}-${idx}`) + idx) % enabledTypes.length],
  }));
}
