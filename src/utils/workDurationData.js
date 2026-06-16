import { generateOrgTree } from "./orgTree";

const UNITS = [
  "昆明供电局",
  "曲靖供电局",
  "玉溪供电局",
  "红河供电局",
  "大理供电局",
  "楚雄供电局",
];

const TEAMS = [
  "综合管理班组",
  "运维一组",
  "运维二组",
  "营销服务班",
  "配电抢修班",
  "调度运行班",
  "后勤保障班",
];

const DEPARTMENTS = [
  { id: 110, name: "人力资源部" },
  { id: 115, name: "数字化部" },
  { id: 116, name: "市场营销部（客户服务部）" },
  { id: 119, name: "生产技术部" },
  { id: 120, name: "系统运行部（与电力调度控制中心合署）" },
  { id: 122, name: "安全监管部（应急管理部）" },
  { id: 113, name: "计划与财务部（云南电网资产运营监控中心）" },
  { id: 117, name: "基建部" },
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function countWorkDays(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekDay = cursor.getDay();
    if (weekDay !== 0 && weekDay !== 6) days += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return Math.max(1, days);
}

function buildRow(index, dept, unit, team, workDays) {
  const seed = index * 17 + dept.id * 3 + unit.length;
  const onDutyCount = 12 + Math.floor(seededRandom(seed) * 38);
  const avgHours = Number((7.45 + seededRandom(seed + 1) * 0.85).toFixed(2));
  const standardAvg = 8.0;
  const totalHours = Number((onDutyCount * avgHours * workDays).toFixed(2));
  const standardTotalHours = Number((onDutyCount * standardAvg * workDays).toFixed(2));
  // 出勤工时：人均日出勤工时
  const attendanceHours = avgHours;
  // 饱和工时：按饱和标准 10h/人/日 测算
  const saturationDaily = 10.0;
  const saturationHours = Number((onDutyCount * saturationDaily * workDays).toFixed(2));
  // 平均工时：统计区间内人均累计工时
  const averageHours = Number((totalHours / onDutyCount).toFixed(2));

  return {
    id: index + 1,
    unit,
    department: dept.name,
    team,
    orgId: dept.id,
    orgName: dept.name,
    onDutyCount,
    attendanceHours,
    totalHours,
    saturationHours,
    averageHours,
    avgHours,
    standardTotalHours,
    standardAvg,
    saturationDaily,
    meetsStandard: avgHours >= standardAvg,
    exceedsSaturation: totalHours >= saturationHours,
  };
}

/** 生成工作时长统计汇总行 */
export function generateWorkDurationRows(options = {}) {
  const { startDate, endDate } = options;
  const workDays = countWorkDays(startDate, endDate);
  const rows = [];
  let index = 0;

  UNITS.forEach((unit, unitIdx) => {
    DEPARTMENTS.forEach((dept, deptIdx) => {
      const teamCount = 1 + (unitIdx + deptIdx) % 2;
      for (let t = 0; t < teamCount; t += 1) {
        rows.push(
          buildRow(index, dept, unit, TEAMS[(unitIdx + deptIdx + t) % TEAMS.length], workDays)
        );
        index += 1;
      }
    });
  });

  return rows;
}

/** 明细行：某汇总行下员工出勤明细 */
export function generateWorkDurationDetails(summaryRow, options = {}) {
  const { startDate, endDate } = options;
  const workDays = countWorkDays(startDate, endDate);
  const surnames = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴"];
  const names = ["伟", "芳", "娜", "敏", "静", "强", "磊", "洋", "艳", "军"];
  const count = Math.min(summaryRow.onDutyCount, 20);
  const details = [];

  for (let i = 0; i < count; i += 1) {
    const seed = summaryRow.id * 31 + i;
    const hours = Number((7.2 + seededRandom(seed) * 1.4).toFixed(2));
    const dayOffset = i % workDays;
    const date = startDate ? addDays(startDate, dayOffset) : "2025-05-05";
    details.push({
      id: `${summaryRow.id}-${i + 1}`,
      employeeName: `${surnames[i % surnames.length]}${names[(i + summaryRow.id) % names.length]}`,
      employeeNo: `YG${String(10000 + summaryRow.id * 10 + i).slice(-5)}`,
      date,
      attendanceHours: hours,
      standardHours: 8.0,
      status: hours >= 8 ? "正常" : hours >= 7.5 ? "略低" : "偏低",
    });
  }

  return details;
}

function addDays(dateStr, offset) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 收集节点及其子节点 id */
export function collectOrgNodeIds(node, includeSelf = true) {
  const ids = includeSelf ? [node.id] : [];
  if (node.children && node.children.length) {
    node.children.forEach((child) => {
      ids.push(...collectOrgNodeIds(child, true));
    });
  }
  return ids;
}

/** 在树中查找节点 */
export function findOrgNodeById(nodes, id) {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node.id === id) return node;
    if (node.children) {
      const found = findOrgNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** 判断汇总行是否命中任一已勾选组织（支持多选并集） */
export function rowMatchesOrgFilter(row, checkedKeys, orgTree) {
  if (!checkedKeys.length) return true;
  if (checkedKeys.includes(1)) return true;

  return checkedKeys.some((key) => {
    if (key === row.orgId) return true;

    const checkedNode = findOrgNodeById(orgTree, key);
    const rowNode = findOrgNodeById(orgTree, row.orgId);
    if (!checkedNode) return false;
    if (!rowNode) {
      return (
        row.department.includes(checkedNode.name) ||
        checkedNode.name.includes(row.department)
      );
    }

    const checkedScope = collectOrgNodeIds(checkedNode);
    const rowScope = collectOrgNodeIds(rowNode);
    return checkedScope.includes(row.orgId) || rowScope.includes(key);
  });
}

/** 按组织多选筛选汇总行 */
export function filterWorkDurationRows(rows, filter = {}) {
  const { checkedOrgKeys = [], orgTree = [] } = filter;
  if (!checkedOrgKeys.length) return rows;
  return rows.filter((row) => rowMatchesOrgFilter(row, checkedOrgKeys, orgTree));
}

export function getWorkDurationOrgTree() {
  return generateOrgTree();
}

export function defaultDateRange() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const date = `${y}-${m}-${d}`;
  return { startDate: date, endDate: date };
}
