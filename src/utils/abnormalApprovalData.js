/**
 * 异常数据审批 — 双视角模拟数据（员工 / 审核员）
 */

export const DEMO_CURRENT_EMPLOYEE = {
  name: "张伟",
  unit: "昆明供电局",
  department: "人力资源部",
  team: "干部管理科",
  attendanceGroup: "人力资源部-干部管理科考勤组",
};

export const DEMO_CURRENT_AUDITOR = {
  name: "王审核",
  role: "考勤异常审核员",
  unit: "云南电网有限责任公司",
};

/** 审批人候选（员工申诉时选择） */
export const APPROVER_OPTIONS = [
  { label: "部门主管 — 李明（人力资源部）", value: "dept_li", step: 2 },
  { label: "人资专责 — 赵芳（人力资源部）", value: "hr_zhao", step: 3 },
  { label: "分管领导 — 陈强（昆明供电局）", value: "leader_chen", step: 4 },
];

export const EMPLOYEE_STATUS_MAP = {
  wait_appeal: { text: "待申诉", type: "danger" },
  approving: { text: "审批中", type: "warning" },
  confirmed: { text: "已通过", type: "success" },
  returned: { text: "已退回", type: "info" },
};

export const AUDITOR_STATUS_MAP = {
  wait_appeal: { text: "待员工申诉", type: "info" },
  approving: { text: "待审核", type: "warning" },
  confirmed: { text: "已通过", type: "success" },
  returned: { text: "已退回", type: "info" },
};

const ALL_RECORDS = [
  {
    id: 1,
    processId: "GD202502150200000006",
    name: "张伟",
    unit: "昆明供电局",
    department: "人力资源部",
    team: "干部管理科",
    attendanceGroup: "人力资源部-干部管理科考勤组",
    abnormalType: "missing_card",
    abnormalTypeLabel: "缺卡",
    eventDate: "2025-02-15",
    eventTime: "2025-02-15 09:00",
    approvalTime: "2025-02-15",
    status: "wait_appeal",
    currentStep: 0,
    description: "",
    attachments: [],
    approvers: [],
  },
  {
    id: 2,
    processId: "GD202502140200000003",
    name: "张伟",
    unit: "昆明供电局",
    department: "人力资源部",
    team: "干部管理科",
    attendanceGroup: "人力资源部-干部管理科考勤组",
    abnormalType: "late",
    abnormalTypeLabel: "迟到",
    eventDate: "2025-02-14",
    eventTime: "2025-02-14 09:25",
    approvalTime: "2025-02-14",
    status: "approving",
    currentStep: 2,
    description: "当日因暴雨导致道路积水，公交车延误约20分钟，已联系班组长说明情况。",
    attachments: [
      { name: "路况说明.jpg", size: "156KB", type: "image" },
    ],
    approvers: ["dept_li", "hr_zhao", "leader_chen"],
  },
  {
    id: 3,
    processId: "GD202502100200000001",
    name: "张伟",
    unit: "昆明供电局",
    department: "人力资源部",
    team: "干部管理科",
    attendanceGroup: "人力资源部-干部管理科考勤组",
    abnormalType: "early_leave",
    abnormalTypeLabel: "早退",
    eventDate: "2025-02-10",
    eventTime: "2025-02-10 16:30",
    approvalTime: "2025-02-10",
    status: "confirmed",
    currentStep: 4,
    description: "下午参加市公司组织的保密培训，培训结束后直接返程，已与主管报备。",
    attachments: [
      { name: "培训通知.pdf", size: "89KB", type: "pdf" },
    ],
    approvers: ["dept_li", "hr_zhao", "leader_chen"],
  },
  {
    id: 4,
    processId: "GD202502130200000004",
    name: "张伟",
    unit: "昆明供电局",
    department: "人力资源部",
    team: "干部管理科",
    attendanceGroup: "人力资源部-干部管理科考勤组",
    abnormalType: "missing_card",
    abnormalTypeLabel: "缺卡",
    eventDate: "2025-02-13",
    eventTime: "2025-02-13 18:00",
    approvalTime: "2025-02-13",
    status: "returned",
    currentStep: 2,
    description: "下班打卡时系统故障未能成功打卡。",
    attachments: [{ name: "系统截图.png", size: "210KB", type: "image" }],
    approvers: ["dept_li", "hr_zhao"],
    returnReason: "证明材料不完整，请补充系统故障工单截图。",
  },
  {
    id: 5,
    processId: "GD202502150200000005",
    name: "李芳",
    unit: "曲靖供电局",
    department: "财务部",
    team: "会计核算科",
    attendanceGroup: "财务部考勤组",
    abnormalType: "missing_card",
    abnormalTypeLabel: "缺卡",
    eventDate: "2025-02-15",
    eventTime: "2025-02-15 08:55",
    approvalTime: "2025-02-15",
    status: "approving",
    currentStep: 2,
    description: "当日因暴雨导致道路积水，公交车延误约20分钟，已联系班组长说明情况。",
    attachments: [
      { name: "导航截图.png", size: "189KB", type: "image" },
      { name: "情况说明.docx", size: "45KB", type: "word" },
    ],
    approvers: ["dept_li", "hr_zhao", "leader_chen"],
  },
  {
    id: 6,
    processId: "GD202502150200000007",
    name: "王娜",
    unit: "玉溪供电局",
    department: "生产技术部",
    team: "运行检修班",
    attendanceGroup: "生产技术部考勤组",
    abnormalType: "late",
    abnormalTypeLabel: "迟到",
    eventDate: "2025-02-15",
    eventTime: "2025-02-15 09:40",
    approvalTime: "2025-02-15",
    status: "approving",
    currentStep: 2,
    description: "现场抢修任务结束后返回单位打卡，路上遇交通事故拥堵。",
    attachments: [{ name: "抢修工单.pdf", size: "320KB", type: "pdf" }],
    approvers: ["dept_li", "hr_zhao", "leader_chen"],
  },
  {
    id: 7,
    processId: "GD202502140200000008",
    name: "刘敏",
    unit: "红河供电局",
    department: "市场营销部",
    team: "客户服务班",
    attendanceGroup: "市场营销部考勤组",
    abnormalType: "early_leave",
    abnormalTypeLabel: "早退",
    eventDate: "2025-02-14",
    eventTime: "2025-02-14 16:00",
    approvalTime: "2025-02-14",
    status: "wait_appeal",
    currentStep: 0,
    description: "",
    attachments: [],
    approvers: [],
  },
  {
    id: 8,
    processId: "GD202502120200000009",
    name: "陈静",
    unit: "大理供电局",
    department: "数字化部",
    team: "信息班",
    attendanceGroup: "数字化部考勤组",
    abnormalType: "missing_card",
    abnormalTypeLabel: "缺卡",
    eventDate: "2025-02-12",
    eventTime: "2025-02-12 12:00",
    approvalTime: "2025-02-12",
    status: "confirmed",
    currentStep: 4,
    description: "外出参加数字化项目联调，午间未返回单位打卡。",
    attachments: [{ name: "联调通知.pdf", size: "112KB", type: "pdf" }],
    approvers: ["dept_li", "hr_zhao", "leader_chen"],
  },
];

export function cloneRecords() {
  return ALL_RECORDS.map((r) => ({
    ...r,
    attachments: r.attachments.map((f) => ({ ...f })),
    approvers: [...r.approvers],
  }));
}

export function getEmployeeRecords(records, employee = DEMO_CURRENT_EMPLOYEE) {
  return records.filter((r) => r.name === employee.name);
}

export function getAuditorRecords(records) {
  return records.filter((r) => r.status !== "wait_appeal" || r.currentStep > 0);
}

export function calcApprovalStats(records) {
  const total = records.length;
  const waitAppeal = records.filter((r) => r.status === "wait_appeal").length;
  const approving = records.filter((r) => r.status === "approving").length;
  const confirmed = records.filter((r) => r.status === "confirmed").length;
  const returned = records.filter((r) => r.status === "returned").length;
  return {
    total,
    waitAppeal,
    approving,
    confirmed,
    returned,
    closed: confirmed + returned,
  };
}

const WORKFLOW_STEPS = [
  { step: 1, type: "员工申诉", role: "employee" },
  { step: 2, type: "部门审批", role: "dept" },
  { step: 3, type: "人资审批", role: "hr" },
  { step: 4, type: "领导审批", role: "leader" },
];

const APPROVER_NAMES = {
  dept_li: "李明",
  hr_zhao: "赵芳",
  leader_chen: "陈强",
};

export function buildWorkflowTimeline(record) {
  const baseTime = `${record.approvalTime} 09:12:11`;
  return WORKFLOW_STEPS.map((s) => {
    let status = "pending";
    let opinion = "";
    let applicant = record.name;
    let department = record.department;

    if (s.step === 1) {
      if (record.status === "wait_appeal") status = "pending";
      else status = "submitted";
      applicant = record.name;
    } else if (s.step <= record.currentStep) {
      if (record.status === "returned" && s.step === record.currentStep) {
        status = "rejected";
        opinion = record.returnReason || "材料不符合要求，请补充后重新提交";
        applicant = APPROVER_NAMES[record.approvers[s.step - 2]] || "审批人";
      } else if (s.step < record.currentStep || record.status === "confirmed") {
        status = "approved";
        opinion = "同意";
        applicant = APPROVER_NAMES[record.approvers[s.step - 2]] || "审批人";
      } else if (record.status === "approving" && s.step === record.currentStep) {
        status = "pending";
        applicant = APPROVER_NAMES[record.approvers[s.step - 2]] || "审批人";
      }
    }

    return {
      step: s.step,
      type: s.type,
      time: status === "pending" ? "—" : baseTime,
      applicant,
      department,
      status,
      opinion,
    };
  });
}

export function getApproverLabels(values = []) {
  return values
    .map((v) => APPROVER_OPTIONS.find((o) => o.value === v))
    .filter(Boolean)
    .map((o) => o.label);
}
