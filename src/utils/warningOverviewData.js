/**
 * 员工行为总览 — 异常预警模拟数据（三维度地图 + 区域联动）
 */

import { UNIT_OPTIONS } from "./behaviorOverviewData";
import { buildCountyMapData } from "./yunnanDrilldown";

const UNIT_META = UNIT_OPTIONS.filter((u) => u.value !== "all").map((u) => ({
  key: u.value,
  name: u.label.replace("供电局", ""),
  fullName: u.label,
}));

const DEPARTMENTS = ["安监部", "财务部", "人力资源部", "市场营销部", "生产技术部", "数字化部"];
const COUNTY_DEPARTMENTS = ["运维", "营销", "调度", "综合", "安监"];
const POSITIONS = ["变电检修", "线路运维", "营销专责", "安监专责", "人资专责", "综合管理员"];
const NAMES = ["张三", "李四", "王五", "赵六", "陈静", "刘洋", "杨帆", "周婷", "吴磊", "孙浩"];
const WARNING_STATUS = ["预警中", "处理中", "已处理", "提醒"];

/** 地图统计维度 */
export const MAP_METRICS = [
  {
    key: "late",
    label: "迟到预警",
    valueUnit: "人次",
    abnormalType: "迟到",
    topChartColor: "#1890FF",
    highlightColor: "#1890FF",
  },
  {
    key: "early",
    label: "早退预警",
    valueUnit: "人次",
    abnormalType: "早退",
    topChartColor: "#FA8C16",
    highlightColor: "#FA8C16",
  },
  {
    key: "longAbsent",
    label: "长期不在岗人员",
    valueUnit: "人数",
    abnormalType: "长期不在岗",
    topChartColor: "#722ED1",
    highlightColor: "#722ED1",
  },
];

export function getMapMetricMeta(metricKey) {
  return MAP_METRICS.find((m) => m.key === metricKey) || MAP_METRICS[0];
}

const LATE_MAP_BASE = [52, 44, 38, 32, 28, 22, 46, 18, 26, 30, 14, 10, 36, 16, 6, 4];
const EARLY_MAP_BASE = [40, 35, 30, 26, 22, 18, 38, 14, 20, 24, 11, 8, 28, 12, 5, 3];
const LONG_ABSENT_MAP_BASE = [18, 15, 12, 10, 8, 6, 16, 7, 11, 9, 5, 4, 13, 6, 2, 1];

const LATE_TOP_BASE = [28, 24, 21, 19, 17];
const EARLY_TOP_BASE = [22, 19, 16, 14, 12];
const LONG_ABSENT_TOP_BASE = [9, 8, 7, 6, 5];

const COUNTY_NAMES_POOL = [
  "五华", "盘龙", "官渡", "西山", "呈贡", "晋宁", "富民", "宜良", "石林", "嵩明", "禄劝", "寻甸", "安宁",
  "麒麟", "沾益", "马龙", "陆良", "师宗", "罗平", "富源", "会泽", "宣威",
];

function getDateFactor(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 1;
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  return Math.min(1.2, Math.max(0.15, days / 30));
}

function pickUnits(unitFilter) {
  if (unitFilter === "all") return UNIT_META;
  return UNIT_META.filter((u) => u.key === unitFilter);
}

function scaleCount(n, factor) {
  return Math.max(0, Math.round(n * factor));
}

function getMetricBaseMap(metricKey) {
  if (metricKey === "early") return EARLY_MAP_BASE;
  if (metricKey === "longAbsent") return LONG_ABSENT_MAP_BASE;
  return LATE_MAP_BASE;
}

export function buildProvinceMapData(metricKey, factor) {
  const base = getMetricBaseMap(metricKey);
  return UNIT_META.map((u, idx) => ({
    name: u.name,
    key: u.key,
    fullName: u.fullName,
    value: scaleCount(base[idx], factor),
  }));
}

function normalizeCounties(countyList) {
  return (countyList || []).map((c) => ({
    name: typeof c === "string" ? c : c.name,
    fullName: typeof c === "string" ? c : c.fullName || c.name,
  }));
}

function buildCountyValuesByMetric(countyList, parentValues, factor) {
  const counties = normalizeCounties(countyList);
  if (!counties.length) return null;
  const parents = parentValues || {};
  return {
    late: buildCountyMapData(counties, parents.late || 10, factor, "late"),
    early: buildCountyMapData(counties, parents.early || 8, factor, "early"),
    longAbsent: buildCountyMapData(counties, parents.longAbsent || 5, factor, "longAbsent"),
  };
}

function buildCountyTopList(metricKey, regionFilter, factor, countyMapData) {
  const unit = UNIT_META.find((u) => u.key === regionFilter.unitKey);
  let countLabel = "迟到";
  if (metricKey === "early") countLabel = "早退";
  else if (metricKey === "longAbsent") countLabel = "不在岗";

  const counties = normalizeCounties(regionFilter.countyList);
  const dataMap = new Map((countyMapData || []).map((d) => [d.name, d]));

  const ranked = counties
    .map((c, i) => {
      const hit = dataMap.get(c.name);
      const seed = i + (metricKey === "late" ? 1 : metricKey === "early" ? 3 : 5);
      return {
        name: c.name,
        fullName: c.fullName,
        count: hit ? hit.value : scaleCount(4 + (seed % 10), factor),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return ranked.map((c, i) => ({
    rank: i + 1,
    unit: unit ? unit.fullName : "",
    unitShort: c.name,
    county: c.name,
    countyFullName: c.fullName,
    department: COUNTY_DEPARTMENTS[i % COUNTY_DEPARTMENTS.length],
    count: c.count,
    countLabel,
    status: WARNING_STATUS[(i + c.name.charCodeAt(0)) % WARNING_STATUS.length],
  }));
}

function buildTopList(metricKey, units, factor, regionFilter, countyMapData) {
  let base;
  let countLabel;
  if (metricKey === "early") {
    base = EARLY_TOP_BASE;
    countLabel = "早退";
  } else if (metricKey === "longAbsent") {
    base = LONG_ABSENT_TOP_BASE;
    countLabel = "不在岗";
  } else {
    base = LATE_TOP_BASE;
    countLabel = "迟到";
  }

  if (
    regionFilter &&
    regionFilter.drillLevel === "county" &&
    regionFilter.countyList &&
    regionFilter.countyList.length
  ) {
    return buildCountyTopList(metricKey, regionFilter, factor, countyMapData);
  }

  if (regionFilter && regionFilter.unitKey && regionFilter.drillLevel !== "county") {
    const unit = UNIT_META.find((u) => u.key === regionFilter.unitKey) || units[0];
    return base.map((cnt, i) => {
      const seed = i + (metricKey === "late" ? 1 : metricKey === "early" ? 5 : 9);
      return {
        rank: i + 1,
        unit: unit.fullName,
        unitShort: unit.name,
        department: DEPARTMENTS[seed % DEPARTMENTS.length],
        count: scaleCount(cnt - i, factor),
        countLabel,
        status: WARNING_STATUS[seed % WARNING_STATUS.length],
      };
    });
  }

  return base.map((cnt, i) => {
    const u = units[i % units.length];
    const seed = i + (metricKey === "late" ? 1 : metricKey === "early" ? 5 : 9);
    return {
      rank: i + 1,
      unit: u.fullName,
      unitShort: u.name,
      department: DEPARTMENTS[seed % DEPARTMENTS.length],
      count: scaleCount(cnt, factor),
      countLabel,
      status: WARNING_STATUS[seed % WARNING_STATUS.length],
    };
  });
}

function buildCountyAbnormalChangeRows(regionFilter, factor, countyValuesByMetric) {
  const counties = normalizeCounties(regionFilter.countyList);
  const lateMap = new Map((countyValuesByMetric.late || []).map((d) => [d.name, d.value]));
  const earlyMap = new Map((countyValuesByMetric.early || []).map((d) => [d.name, d.value]));
  const longMap = new Map((countyValuesByMetric.longAbsent || []).map((d) => [d.name, d.value]));

  return counties.map((c, i) => {
    const seed = i + (c.name.charCodeAt(0) || 0);
    return {
      name: c.name,
      late: scaleCount(lateMap.get(c.name) ?? 4 + (seed % 12), factor),
      early: scaleCount(earlyMap.get(c.name) ?? 3 + (seed % 9), factor),
      evidence: scaleCount(2 + (seed % 8), factor),
      absentee: scaleCount(1 + (seed % 6), factor),
      longAbsent: scaleCount(longMap.get(c.name) ?? 1 + (seed % 5), factor),
    };
  });
}

function buildAbnormalChangeRows(units, factor, mode, regionFilter, countyValuesByMetric) {
  if (
    regionFilter &&
    regionFilter.drillLevel === "county" &&
    regionFilter.countyList &&
    regionFilter.countyList.length &&
    countyValuesByMetric
  ) {
    return buildCountyAbnormalChangeRows(regionFilter, factor, countyValuesByMetric);
  }

  if (regionFilter && regionFilter.unitKey && mode === "department") {
    const seedOffset = String(regionFilter.unitKey).charCodeAt(0) || 0;
    return DEPARTMENTS.map((dept, dIdx) => {
      const seed = dIdx + seedOffset;
      return {
        name: dept,
        late: scaleCount(6 + (seed % 14), factor),
        early: scaleCount(4 + (seed % 10), factor),
        evidence: scaleCount(2 + (seed % 8), factor),
        absentee: scaleCount(1 + (seed % 5), factor),
        longAbsent: scaleCount(1 + (seed % 4), factor),
      };
    });
  }

  if (mode === "department") {
    return DEPARTMENTS.map((dept, dIdx) => {
      const seed = dIdx + 3;
      return {
        name: dept,
        late: scaleCount(8 + (seed % 12), factor),
        early: scaleCount(5 + (seed % 8), factor),
        evidence: scaleCount(3 + (seed % 10), factor),
        absentee: scaleCount(2 + (seed % 6), factor),
        longAbsent: scaleCount(1 + (seed % 5), factor),
      };
    });
  }

  const targetUnits =
    regionFilter && regionFilter.unitKey
      ? units.filter((u) => u.key === regionFilter.unitKey)
      : units;

  return targetUnits.map((u, idx) => {
    const globalIdx = UNIT_META.findIndex((m) => m.key === u.key);
    const seed = globalIdx >= 0 ? globalIdx + 1 : idx + 1;
    return {
      name: u.name,
      late: scaleCount(LATE_MAP_BASE[globalIdx] || 10, factor),
      early: scaleCount(EARLY_MAP_BASE[globalIdx] || 6, factor),
      evidence: scaleCount(4 + (seed * 5) % 15, factor),
      absentee: scaleCount(LATE_MAP_BASE[globalIdx] % 12, factor),
      longAbsent: scaleCount(LONG_ABSENT_MAP_BASE[globalIdx] || 3, factor),
    };
  });
}

function pickCountyName(unitKey, index) {
  const seed = unitKey.charCodeAt(0) + index * 7;
  return COUNTY_NAMES_POOL[seed % COUNTY_NAMES_POOL.length];
}

function buildDetailTable(units, factor, queryUnit, regionFilter, mapMetric) {
  const rows = [];
  let id = 1;

  const allTypes = ["迟到", "早退", "在岗证据不足", "旷工", "长期不在岗"];
  const targetUnits =
    regionFilter && regionFilter.unitKey
      ? UNIT_META.filter((u) => u.key === regionFilter.unitKey)
      : queryUnit === "all"
        ? UNIT_META
        : units;

  const countyPool =
    regionFilter && regionFilter.countyList && regionFilter.countyList.length
      ? regionFilter.countyList.map((c) => (typeof c === "string" ? c : c.name))
      : null;

  targetUnits.forEach((u, uIdx) => {
    for (let i = 0; i < 10; i++) {
      const seed = uIdx * 20 + i;
      const county = countyPool
        ? countyPool[i % countyPool.length]
        : pickCountyName(u.key, i);
      if (regionFilter && regionFilter.countyName && county !== regionFilter.countyName) {
        continue;
      }
      const abnormalType = allTypes[seed % allTypes.length];
      rows.push({
        id: id++,
        unitKey: u.key,
        unit: u.fullName,
        county,
        department: DEPARTMENTS[seed % DEPARTMENTS.length],
        position: POSITIONS[seed % POSITIONS.length],
        name: NAMES[seed % NAMES.length],
        abnormalType,
        times: scaleCount(1 + (seed % 8), factor),
        status: WARNING_STATUS[seed % WARNING_STATUS.length],
      });
    }
  });

  if (queryUnit === "all" && !(regionFilter && regionFilter.unitKey)) {
    UNIT_META.slice(0, 6).forEach((u, uIdx) => {
      const seed = uIdx + 10;
      rows.push({
        id: id++,
        unitKey: u.key,
        unit: u.fullName,
        county: pickCountyName(u.key, uIdx + 3),
        department: DEPARTMENTS[(seed + 1) % DEPARTMENTS.length],
        position: POSITIONS[(seed + 1) % POSITIONS.length],
        name: NAMES[(seed + 1) % NAMES.length],
        abnormalType: "长期不在岗",
        times: scaleCount(3 + (seed % 5), factor),
        status: WARNING_STATUS[(seed + 1) % WARNING_STATUS.length],
      });
    });
  }

  if (mapMetric && mapMetric !== "all") {
    const typeFilter = getMapMetricMeta(mapMetric).abnormalType;
    return rows.filter((r) => r.abnormalType === typeFilter);
  }
  return rows;
}

export const DEFAULT_WARNING_QUERY = {
  startDate: "",
  endDate: "",
  unit: "all",
};

export const ABNORMAL_CHANGE_COLORS = {
  迟到: "#1890FF",
  早退: "#FA8C16",
  在岗证据不足: "#FAAD14",
  旷工: "#52C41A",
  长期不在岗: "#722ED1",
};

export const DEFAULT_LINK_CONTEXT = {
  mapMetric: "late",
  unitKey: null,
  regionName: null,
  countyName: null,
};

/**
 * @param {object} queryParams
 * @param {'unit'|'department'} changeMode
 * @param {object} linkContext — mapMetric / unitKey / regionName / countyName
 */
export function buildWarningSnapshot(queryParams, changeMode = "unit", linkContext = DEFAULT_LINK_CONTEXT) {
  const factor = getDateFactor(queryParams.startDate, queryParams.endDate);
  const units = pickUnits(queryParams.unit);
  const mapMetric = linkContext.mapMetric || "late";
  const drillLevel = linkContext.drillLevel || "province";
  const regionFilter =
    linkContext.unitKey || linkContext.countyName || drillLevel === "county"
      ? {
          unitKey: linkContext.unitKey,
          regionName: linkContext.regionName,
          countyName: linkContext.countyName,
          countyList: linkContext.countyList || [],
          drillLevel,
        }
      : null;

  const countyValuesByMetric =
    drillLevel === "county" && linkContext.countyList && linkContext.countyList.length
      ? buildCountyValuesByMetric(
          linkContext.countyList,
          linkContext.parentValues,
          factor
        )
      : null;

  const effectiveChangeMode =
    drillLevel === "county"
      ? "county"
      : regionFilter && regionFilter.unitKey
        ? "department"
        : changeMode;

  const mapDataByMetric = {
    late: buildProvinceMapData("late", factor),
    early: buildProvinceMapData("early", factor),
    longAbsent: buildProvinceMapData("longAbsent", factor),
  };

  const abnormalRows = buildAbnormalChangeRows(
    units,
    factor,
    effectiveChangeMode,
    regionFilter,
    countyValuesByMetric
  );

  return {
    factor,
    unitFilter: queryParams.unit,
    changeMode: effectiveChangeMode,
    mapMetric,
    regionFilter,
    drillLevel,
    mapDataByMetric,
    mapData: mapDataByMetric[mapMetric],
    lateTop5: buildTopList(
      "late",
      units,
      factor,
      regionFilter,
      countyValuesByMetric && countyValuesByMetric.late
    ),
    earlyTop5: buildTopList(
      "early",
      units,
      factor,
      regionFilter,
      countyValuesByMetric && countyValuesByMetric.early
    ),
    longAbsentTop5: buildTopList(
      "longAbsent",
      units,
      factor,
      regionFilter,
      countyValuesByMetric && countyValuesByMetric.longAbsent
    ),
    abnormalChange: {
      categories: abnormalRows.map((r) => r.name),
      late: abnormalRows.map((r) => r.late),
      early: abnormalRows.map((r) => r.early),
      evidence: abnormalRows.map((r) => r.evidence),
      absentee: abnormalRows.map((r) => r.absentee),
      longAbsent: abnormalRows.map((r) => r.longAbsent),
    },
    detailTable: buildDetailTable(units, factor, queryParams.unit, regionFilter, mapMetric),
  };
}

export function buildWarningDetailExportRows(detailTable) {
  return detailTable.map((row, index) => [
    index + 1,
    row.unit,
    row.county || "",
    row.department,
    row.position,
    row.name,
    row.abnormalType,
    row.times,
    row.status,
  ]);
}

export const WARNING_DETAIL_EXPORT_HEADERS = [
  "序号",
  "单位",
  "县区",
  "部门",
  "岗位",
  "姓名",
  "异常类型",
  "次数",
  "预警状态",
];
