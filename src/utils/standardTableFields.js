/**
 * 标准表字段定义（数据处理与转换、无感数据整理共用）
 */

export const STANDARD_TABLE_FIELDS = [
  { key: "personId", label: "人员ID", prop: "personId", required: true },
  { key: "name", label: "姓名", prop: "name", required: true },
  { key: "orgName", label: "组织机构", prop: "orgName", required: true },
  { key: "orgId", label: "组织机构ID", prop: "orgId", required: true },
  { key: "arrivalTime", label: "到岗时间", prop: "arrivalTime", required: true },
  { key: "departureTime", label: "离岗时间", prop: "departureTime", required: true },
  { key: "breakfastTime", label: "早餐用餐时间", prop: "breakfastTime", required: true },
  { key: "lunchTime", label: "午餐用餐时间", prop: "lunchTime", required: true },
  { key: "dinnerTime", label: "晚餐用餐时间", prop: "dinnerTime", required: true },
  { key: "loginTime", label: "系统登录时间", prop: "loginTime", required: true },
  { key: "leaveStartTime", label: "休假开始时间", prop: "leaveStartTime", required: true },
  { key: "leaveEndTime", label: "休假结束时间", prop: "leaveEndTime", required: true },
  { key: "leaveType", label: "休假类型", prop: "leaveType", required: true },
  { key: "businessTripStartTime", label: "出差开始时间", prop: "businessTripStartTime", required: true },
  { key: "businessTripEndTime", label: "出差结束时间", prop: "businessTripEndTime", required: true },
  { key: "travelStartTime", label: "外出开始时间", prop: "travelStartTime", required: true },
  { key: "travelEndTime", label: "外出结束时间", prop: "travelEndTime", required: true },
  { key: "trainingStartTime", label: "培训开始时间", prop: "trainingStartTime", required: true },
  { key: "trainingEndTime", label: "培训结束时间", prop: "trainingEndTime", required: true },
  { key: "loginEarliestTime", label: "最早登录时间", prop: "loginEarliestTime", required: true },
  { key: "loginLatestTime", label: "最晚登录时间", prop: "loginLatestTime", required: true },
  { key: "elinkLoginTime", label: "elink登录时间", prop: "elinkLoginTime", required: true },
  { key: "workTicketStartTime", label: "工作票开始时间", prop: "workTicketStartTime", required: true },
  { key: "workTicketEndTime", label: "工作票结束时间", prop: "workTicketEndTime", required: true },
  { key: "workTicketLeader", label: "工作票负责人", prop: "workTicketLeader", required: true },
  { key: "workTicketMembers", label: "工作成员", prop: "workTicketMembers", required: true },
  { key: "workTicketRange", label: "作业起止时间", prop: "workTicketRange", required: true },
  { key: "postCategory", label: "岗位类别", prop: "postCategory", required: true },
  { key: "dataSources", label: "数据来源", prop: "dataSources", required: true },
];

/** 已从标准字段映射中移除的 prop（仍可能存在于宽表运行时数据） */
export const REMOVED_STANDARD_FIELD_PROPS = new Set([
  "recordDate",
  "trainingParticipants",
  "attendanceType",
]);

export function getStandardTargetFieldOptions() {
  return STANDARD_TABLE_FIELDS.map((f) => ({ label: f.label, prop: f.prop }));
}

export function getAttendanceTableFields() {
  return STANDARD_TABLE_FIELDS.map(({ key, label, required }) => ({ key, label, required }));
}

export const STANDARD_EMPTY_VALUE = "—";

const LEGACY_FIELD_ALIASES = {
  dataSources: ["dataSource"],
};

function isEmptyStandardValue(val) {
  return val == null || val === "";
}

/** 生成仅含标准表字段的空行 */
export function createEmptyStandardRow() {
  const row = {};
  STANDARD_TABLE_FIELDS.forEach((f) => {
    row[f.prop] = STANDARD_EMPTY_VALUE;
  });
  return row;
}

/** 将任意转换结果规整为标准表字段结构 */
export function normalizeToStandardRow(row = {}, meta = {}) {
  const result = createEmptyStandardRow();
  STANDARD_TABLE_FIELDS.forEach((f) => {
    let val = row[f.prop];
    if (isEmptyStandardValue(val) && LEGACY_FIELD_ALIASES[f.prop]) {
      for (const alt of LEGACY_FIELD_ALIASES[f.prop]) {
        if (!isEmptyStandardValue(row[alt])) {
          val = row[alt];
          break;
        }
      }
    }
    if (!isEmptyStandardValue(val)) result[f.prop] = val;
  });
  if (result.dataSources === STANDARD_EMPTY_VALUE && meta.sourceName) {
    result.dataSources = meta.sourceName;
  }
  return result;
}
