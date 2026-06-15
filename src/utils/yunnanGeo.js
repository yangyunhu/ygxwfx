/**
 * 云南省地图 — ECharts registerMap + 阿里云 DataV 标准 GeoJSON
 */
import yunnanFullGeo from "../assets/geo/yunnan-full.json";

export const GEO_NAME_TO_SHORT = {
  昆明市: "昆明",
  曲靖市: "曲靖",
  玉溪市: "玉溪",
  保山市: "保山",
  昭通市: "昭通",
  丽江市: "丽江",
  普洱市: "普洱",
  临沧市: "临沧",
  楚雄彝族自治州: "楚雄",
  红河哈尼族彝族自治州: "红河",
  文山壮族苗族自治州: "文山",
  西双版纳傣族自治州: "西双版纳",
  大理白族自治州: "大理",
  德宏傣族景颇族自治州: "德宏",
  怒江傈僳族自治州: "怒江",
  迪庆藏族自治州: "迪庆",
};

export const SHORT_TO_GEO_NAME = Object.fromEntries(
  Object.entries(GEO_NAME_TO_SHORT).map(([full, short]) => [short, full])
);

export const MAP_BASE_COLOR = "#D6E4FF";

const MAP_LEVEL_TEMPLATES = {
  late: [
    { min: 50, color: "#F5222D", label: "≥50人次" },
    { min: 20, color: "#FA541C", label: "20~49人次" },
    { min: 5, color: "#FFA940", label: "5~19人次" },
    { min: 1, color: "#FFD666", label: "1~4人次" },
    { min: 0, color: MAP_BASE_COLOR, label: "0人次" },
  ],
  early: [
    { min: 40, color: "#CF1322", label: "≥40人次" },
    { min: 15, color: "#FA541C", label: "15~39人次" },
    { min: 5, color: "#FFA940", label: "5~14人次" },
    { min: 1, color: "#FFE58F", label: "1~4人次" },
    { min: 0, color: MAP_BASE_COLOR, label: "0人次" },
  ],
  longAbsent: [
    { min: 15, color: "#531DAB", label: "≥15人" },
    { min: 8, color: "#722ED1", label: "8~14人" },
    { min: 4, color: "#9254DE", label: "4~7人" },
    { min: 1, color: "#B37FEB", label: "1~3人" },
    { min: 0, color: "#EFDBFF", label: "0人" },
  ],
};

const MAP_BASE_COLORS = {
  late: MAP_BASE_COLOR,
  early: MAP_BASE_COLOR,
  longAbsent: "#EFDBFF",
};

const MAP_EMPHASIS_COLORS = {
  late: "#FFC069",
  early: "#FFD591",
  longAbsent: "#D3ADF7",
};

/** @deprecated 兼容旧引用 */
export const ABSENTEE_MAP_LEVELS = MAP_LEVEL_TEMPLATES.late;

const MAP_VISUAL_PIECES_BY_METRIC = {
  late: [
    { min: 50, color: "#F5222D" },
    { min: 20, max: 49, color: "#FA541C" },
    { min: 5, max: 19, color: "#FFA940" },
    { min: 1, max: 4, color: "#FFD666" },
    { max: 0, color: MAP_BASE_COLOR },
  ],
  early: [
    { min: 40, color: "#CF1322" },
    { min: 15, max: 39, color: "#FA541C" },
    { min: 5, max: 14, color: "#FFA940" },
    { min: 1, max: 4, color: "#FFE58F" },
    { max: 0, color: MAP_BASE_COLOR },
  ],
  longAbsent: [
    { min: 15, color: "#531DAB" },
    { min: 8, max: 14, color: "#722ED1" },
    { min: 4, max: 7, color: "#9254DE" },
    { min: 1, max: 3, color: "#B37FEB" },
    { max: 0, color: "#EFDBFF" },
  ],
};

export function getMapMetricConfig(metricKey = "late") {
  const key = MAP_LEVEL_TEMPLATES[metricKey] ? metricKey : "late";
  const levels = MAP_LEVEL_TEMPLATES[key];
  const baseColor = MAP_BASE_COLORS[key];
  return {
    key,
    levels,
    pieces: MAP_VISUAL_PIECES_BY_METRIC[key],
    baseColor,
    geoItemStyle: {
      areaColor: baseColor,
      borderColor: "#B8C5D6",
      borderWidth: 1,
    },
    emphasisItemStyle: {
      areaColor: MAP_EMPHASIS_COLORS[key],
      borderColor: "#FFFFFF",
      borderWidth: 2,
      shadowBlur: 8,
      shadowColor: "rgba(0,0,0,0.12)",
    },
  };
}

/** @deprecated */
export const MAP_VISUAL_PIECES = getMapMetricConfig("late").pieces;

export const MAP_GEO_ITEM_STYLE = getMapMetricConfig("late").geoItemStyle;

export const MAP_EMPHASIS_ITEM_STYLE = getMapMetricConfig("late").emphasisItemStyle;

export function fillMapSeriesData(mapName, data, echartsInstance) {
  const mapMeta = echartsInstance.getMap(mapName);
  const features = mapMeta && mapMeta.geoJson && mapMeta.geoJson.features;
  if (!features || !features.length) return data;

  const dataMap = new Map((data || []).map((d) => [d.name, d]));
  return features.map((f) => {
    const name = f.properties.name;
    const hit = dataMap.get(name);
    if (hit) return hit;
    return {
      name,
      fullName: f.properties.fullName || name,
      value: 0,
    };
  });
}

export function buildYunnanGeoJson() {
  return {
    type: "FeatureCollection",
    features: yunnanFullGeo.features.map((feature) => {
      const fullName = feature.properties.name;
      const shortName = GEO_NAME_TO_SHORT[fullName] || fullName;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          name: shortName,
          fullName,
        },
      };
    }),
  };
}

let mapRegistered = false;

export function registerYunnanMap(echarts) {
  if (mapRegistered) return;
  echarts.registerMap("yunnan", buildYunnanGeoJson());
  mapRegistered = true;
}
