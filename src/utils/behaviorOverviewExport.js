/**
 * 员工行为总览 — 统计模块明细导出
 */

import { downloadTableWithLog } from "./exportLogger";
import { UNIT_OPTIONS } from "./behaviorOverviewData";

export const OVERVIEW_EXPORT_MODULES = [
  {
    key: "main",
    label: "各单位出勤概况",
    desc: "按单位/部门汇总应出勤、实际出勤及出勤率，并附人员明细",
  },
  {
    key: "punctuality",
    label: "按时出勤 & 迟到早退率",
    desc: "人员按时出勤率、迟到早退率及异常次数明细",
  },
  {
    key: "lateEarly",
    label: "迟到早退人数",
    desc: "迟到、早退人员及异常日期明细",
  },
  {
    key: "leaveTrend",
    label: "请假趋势变化情况",
    desc: "事假、病假、年休假申请与审批明细",
  },
  {
    key: "leaveType",
    label: "请假类型分布情况",
    desc: "各类请假类型人员申请明细",
  },
  {
    key: "businessTraining",
    label: "出差 & 培训工时与专业相关性",
    desc: "出差、培训工时及专业关联分析明细",
  },
  {
    key: "specialty",
    label: "专业与作业工时相关性",
    desc: "各专业作业工时、出勤工时及相关性明细",
  },
  {
    key: "leaveDistribution",
    label: "年休假请假分布时段",
    desc: "年休假时段分布及外勤统计明细",
  },
];

const NAMES = ["张伟", "李娜", "王强", "刘洋", "陈静", "赵敏", "孙浩", "周婷", "张明", "李华", "杨帆", "吴磊"];
const DEPTS = ["安监部", "财务部", "人力资源部", "市场营销部", "生产技术部", "数字化部"];
const SPECIALTIES = ["技术", "安监", "市场", "人资", "综合"];
const LEAVE_TYPES = ["事假", "病假", "年休假"];
const LEAVE_REASONS = {
  事假: ["家事处理", "个人事务", "证件办理"],
  病假: ["感冒发烧", "门诊复查", "工伤休养"],
  年休假: ["带薪休假", "家庭旅行", "休整调休"],
};
const APPROVAL_STATUS = ["已批准", "审批中", "已批准", "已批准"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function mockEmpId(seed) {
  return `YN${String(100000 + (seed % 900000)).padStart(6, "0")}`;
}

function periodLabel(queryParams) {
  if (queryParams.startDate && queryParams.endDate) {
    return `${queryParams.startDate} ~ ${queryParams.endDate}`;
  }
  return "全部日期";
}

function unitFilterLabel(unit) {
  const opt = UNIT_OPTIONS.find((o) => o.value === unit);
  return opt ? opt.label : "全部单位";
}

function mockDate(seed, monthOffset = 0) {
  const m = ((new Date().getMonth() + monthOffset + seed) % 12) + 1;
  const d = (seed % 26) + 1;
  return `2025-${pad2(m)}-${pad2(d)}`;
}

function buildMainDetail(snapshot, queryParams) {
  const dim = snapshot.dimensionLabel;
  const headers = ["序号", "姓名", "工号", dim, "部门", "应出勤天数", "实际出勤天数", "出勤率", "统计周期"];
  const rows = [];
  let seq = 1;
  snapshot.rows.forEach((r, ri) => {
    for (let j = 0; j < 5; j++) {
      const seed = ri * 7 + j;
      const shouldDays = 22;
      const actualDays = Math.max(18, shouldDays - (seed % 4));
      rows.push([
        seq++,
        NAMES[seed % NAMES.length],
        mockEmpId(seed),
        r.fullName || r.name,
        DEPTS[j % DEPTS.length],
        shouldDays,
        actualDays,
        `${((actualDays / shouldDays) * 100).toFixed(1)}%`,
        periodLabel(queryParams),
      ]);
    }
  });
  return { headers, rows };
}

function buildPunctualityDetail(snapshot, queryParams) {
  const headers = [
    "序号",
    "姓名",
    "工号",
    "单位",
    "部门",
    "按时出勤率",
    "迟到次数",
    "早退次数",
    "迟到早退率",
    "统计周期",
  ];
  const rows = [];
  let seq = 1;
  snapshot.rows.forEach((r, ri) => {
    const onTime = snapshot.punctuality.onTime[ri] || 90;
    const lateR = snapshot.punctuality.late[ri] || 2;
    const earlyR = snapshot.punctuality.early[ri] || 1;
    const lateEarlyR = Math.round((lateR + earlyR) * 10) / 10;
    for (let j = 0; j < 4; j++) {
      const seed = ri * 5 + j;
      const lateCnt = j === 0 ? Math.max(1, Math.round(lateR / 3)) : seed % 2;
      const earlyCnt = j === 1 ? Math.max(0, Math.round(earlyR / 3)) : seed % 2;
      rows.push([
        seq++,
        NAMES[seed % NAMES.length],
        mockEmpId(seed + 100),
        r.fullName || r.name,
        DEPTS[j % DEPTS.length],
        `${(onTime + (j % 3) - 1).toFixed(1)}%`,
        lateCnt,
        earlyCnt,
        `${(lateEarlyR + (j % 2) * 0.5).toFixed(1)}%`,
        periodLabel(queryParams),
      ]);
    }
  });
  return { headers, rows };
}

function buildLateEarlyDetail(snapshot, queryParams) {
  const headers = ["序号", "姓名", "工号", "单位", "部门", "迟到次数", "早退次数", "最近异常日期", "异常说明"];
  const rows = [];
  let seq = 1;
  const remarks = ["上班迟到15分钟", "下班早退20分钟", "迟到且早退", "交通延误", "会议延时"];
  snapshot.rows.forEach((r, ri) => {
    const lateCnt = snapshot.lateEarly.late[ri] || 0;
    const earlyCnt = snapshot.lateEarly.early[ri] || 0;
    const total = lateCnt + earlyCnt;
    if (total === 0) return;
    const count = Math.min(6, Math.max(2, Math.ceil(total / 3)));
    for (let j = 0; j < count; j++) {
      const seed = ri * 8 + j;
      const isLate = j % 2 === 0;
      rows.push([
        seq++,
        NAMES[seed % NAMES.length],
        mockEmpId(seed + 200),
        r.fullName || r.name,
        DEPTS[j % DEPTS.length],
        isLate ? 1 + (seed % 3) : 0,
        isLate ? 0 : 1 + (seed % 2),
        mockDate(seed),
        remarks[seed % remarks.length],
      ]);
    }
  });
  if (!rows.length) {
    rows.push([1, "—", "—", "—", "—", 0, 0, "—", "当前筛选条件下暂无迟到早退记录"]);
  }
  return { headers, rows };
}

function buildLeaveTrendDetail(snapshot, queryParams) {
  const headers = [
    "序号",
    "姓名",
    "工号",
    "单位",
    "部门",
    "请假类型",
    "请假天数",
    "请假开始日期",
    "请假结束日期",
    "审批状态",
  ];
  const rows = [];
  let seq = 1;
  snapshot.rows.forEach((r, ri) => {
    const personal = snapshot.leaveTrend.personal[ri] || 0;
    const sick = snapshot.leaveTrend.sick[ri] || 0;
    const annual = snapshot.leaveTrend.annual[ri] || 0;
    const buckets = [
      { type: "事假", days: personal },
      { type: "病假", days: sick },
      { type: "年休假", days: annual },
    ];
    buckets.forEach((b, bi) => {
      if (b.days <= 0) return;
      const itemCount = Math.min(3, Math.max(1, Math.ceil(b.days / 8)));
      for (let j = 0; j < itemCount; j++) {
        const seed = ri * 9 + bi * 3 + j;
        const days = Math.max(1, Math.round(b.days / itemCount));
        const start = mockDate(seed, bi);
        rows.push([
          seq++,
          NAMES[seed % NAMES.length],
          mockEmpId(seed + 300),
          r.fullName || r.name,
          DEPTS[j % DEPTS.length],
          b.type,
          days,
          start,
          mockDate(seed + days, bi),
          APPROVAL_STATUS[seed % APPROVAL_STATUS.length],
        ]);
      }
    });
  });
  return { headers, rows };
}

function buildLeaveTypeDetail(snapshot, queryParams) {
  const headers = ["序号", "姓名", "工号", "单位", "请假类型", "请假天数", "请假原因", "申请日期"];
  const rows = [];
  let seq = 1;
  snapshot.leavePie.forEach((pie) => {
    const count = Math.min(8, Math.max(3, Math.ceil(pie.value / 4)));
    for (let j = 0; j < count; j++) {
      const seed = seq + j;
      const unit = snapshot.rows[j % snapshot.rows.length];
      const reasons = LEAVE_REASONS[pie.name] || ["其他"];
      rows.push([
        seq++,
        NAMES[seed % NAMES.length],
        mockEmpId(seed + 400),
        unit ? unit.fullName || unit.name : "云南电网",
        pie.name,
        Math.max(1, Math.round(pie.value / count)),
        reasons[j % reasons.length],
        mockDate(seed, -1),
      ]);
    }
  });
  return { headers, rows };
}

function buildBusinessTrainingDetail(snapshot, queryParams) {
  const headers = ["序号", "姓名", "单位", "专业", "业务类型", "工时(h)", "月份", "关联度得分"];
  const rows = [];
  let seq = 1;
  const types = ["出差", "培训"];
  snapshot.rows.slice(0, 8).forEach((r, ri) => {
    types.forEach((type, ti) => {
      for (let j = 0; j < 2; j++) {
        const seed = ri * 4 + ti * 2 + j;
        const scatter = type === "出差" ? snapshot.scatter.business : snapshot.scatter.training;
        const point = scatter[(ri + j) % scatter.length] || [1, 10];
        rows.push([
          seq++,
          NAMES[seed % NAMES.length],
          r.fullName || r.name,
          SPECIALTIES[seed % SPECIALTIES.length],
          type,
          point[1] || 10,
          `2025-${pad2((ri % 12) + 1)}`,
          (75 + (seed % 20)).toFixed(1),
        ]);
      }
    });
  });
  return { headers, rows };
}

function buildSpecialtyDetail(snapshot, queryParams) {
  const headers = ["序号", "姓名", "单位", "专业", "作业工时(h)", "出勤工时(h)", "相关性系数"];
  const rows = [];
  let seq = 1;
  const radarNames = ["输电", "营配", "电网建设", "变电", "配电"];
  snapshot.rows.slice(0, 6).forEach((r, ri) => {
    radarNames.forEach((spec, si) => {
      const seed = ri * 5 + si;
      const workH = snapshot.specialty.work[ri] || 80 + seed * 3;
      const attendH = snapshot.specialty.attend[ri] || 70 + seed * 2;
      const coef = (0.65 + (seed % 30) / 100).toFixed(2);
      rows.push([
        seq++,
        NAMES[seed % NAMES.length],
        r.fullName || r.name,
        spec,
        workH + si * 5,
        attendH + si * 4,
        coef,
      ]);
    });
  });
  return { headers, rows };
}

function buildLeaveDistributionDetail(snapshot, queryParams, leaveQueryParams) {
  const headers = [
    "序号",
    "单位",
    "专业",
    "姓名",
    "外勤人次",
    "总时长",
    "人均时长",
    "业务类型",
    "年休假开始",
    "年休假结束",
  ];
  const rows = [];
  let seq = 1;
  const period =
    leaveQueryParams.startDate && leaveQueryParams.endDate
      ? `${leaveQueryParams.startDate} ~ ${leaveQueryParams.endDate}`
      : periodLabel(queryParams);

  snapshot.leaveTable.forEach((row, ri) => {
    for (let j = 0; j < 3; j++) {
      const seed = ri * 3 + j;
      rows.push([
        seq++,
        row.unit,
        row.specialty,
        NAMES[seed % NAMES.length],
        row.fieldWorkCount,
        row.totalDuration,
        row.avgDuration,
        row.businessType,
        leaveQueryParams.startDate || mockDate(seed, 5),
        leaveQueryParams.endDate || mockDate(seed + 5, 5),
      ]);
    }
  });

  if (!rows.length) {
    rows.push([1, "—", "—", "—", 0, "0h", "0h", "—", period.split(" ~ ")[0] || "—", period.split(" ~ ")[1] || "—"]);
  }
  return { headers, rows };
}

const BUILDERS = {
  main: buildMainDetail,
  punctuality: buildPunctualityDetail,
  lateEarly: buildLateEarlyDetail,
  leaveTrend: buildLeaveTrendDetail,
  leaveType: buildLeaveTypeDetail,
  businessTraining: buildBusinessTrainingDetail,
  specialty: buildSpecialtyDetail,
  leaveDistribution: buildLeaveDistributionDetail,
};

export function buildOverviewExportTable(moduleKey, snapshot, queryParams, leaveQueryParams = {}) {
  const builder = BUILDERS[moduleKey];
  if (!builder) return { headers: [], rows: [] };
  return builder(snapshot, queryParams, leaveQueryParams);
}

export function getOverviewExportModuleLabel(moduleKey) {
  const mod = OVERVIEW_EXPORT_MODULES.find((m) => m.key === moduleKey);
  return mod ? mod.label : moduleKey;
}

function buildSearchCriteria(queryParams, leaveQueryParams) {
  const dim = queryParams.dimension === "department" ? "按部门" : "按单位";
  return [
    `统计维度:${dim}`,
    `单位:${unitFilterLabel(queryParams.unit)}`,
    `日期:${periodLabel(queryParams)}`,
    leaveQueryParams.startDate ? `年休假分布:${periodLabel(leaveQueryParams)}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * 导出选中的统计模块明细（每个模块一个 CSV 文件）
 */
export function exportOverviewModules(moduleKeys, snapshot, queryParams, leaveQueryParams = {}) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const criteria = buildSearchCriteria(queryParams, leaveQueryParams);

  moduleKeys.forEach((key, index) => {
    const mod = OVERVIEW_EXPORT_MODULES.find((m) => m.key === key);
    if (!mod) return;
    const { headers, rows } = buildOverviewExportTable(key, snapshot, queryParams, leaveQueryParams);
    setTimeout(() => {
      downloadTableWithLog({
        headers,
        rows,
        format: "csv",
        baseFilename: `员工行为总览_${mod.label}_${stamp}`,
        meta: {
          moduleCode: `behavior-overview-${key}`,
          moduleName: `员工行为总览-${mod.label}`,
          moduleGroup: "员工出勤行为管理",
          rowCount: rows.length,
          searchCriteria: criteria,
        },
      });
    }, index * 350);
  });

  return moduleKeys.length;
}
