/**
 * 云南省地图 — ECharts registerMap + 阿里云 DataV 标准 GeoJSON
 * 技术栈：ECharts geo/map + 本地 yunnan-full.json（530000 地级边界）
 */
import yunnanFullGeo from "../assets/geo/yunnan-full.json";

/** DataV 全称 → 业务短名（与供电局名称一致） */
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

/** 地图底色 — 无数据 / 0 人次（与卡片白底有对比，避免“缺块”） */
export const MAP_BASE_COLOR = "#D6E4FF";

/** 旷工人次分级配色（暖色递进 + 蓝灰底色） */
export const ABSENTEE_MAP_LEVELS = [
  { min: 50, color: "#F5222D", label: "≥50人次" },
  { min: 20, color: "#FA541C", label: "20~49人次" },
  { min: 5, color: "#FFA940", label: "5~19人次" },
  { min: 1, color: "#FFD666", label: "1~4人次" },
  { min: 0, color: MAP_BASE_COLOR, label: "0人次" },
];

/** ECharts visualMap 分档 */
export const MAP_VISUAL_PIECES = [
  { min: 50, color: "#F5222D" },
  { min: 20, max: 49, color: "#FA541C" },
  { min: 5, max: 19, color: "#FFA940" },
  { min: 1, max: 4, color: "#FFD666" },
  { max: 0, color: MAP_BASE_COLOR },
];

export const MAP_GEO_ITEM_STYLE = {
  areaColor: MAP_BASE_COLOR,
  borderColor: "#B8C5D6",
  borderWidth: 1,
};

export const MAP_EMPHASIS_ITEM_STYLE = {
  areaColor: "#FFC069",
  borderColor: "#FFFFFF",
  borderWidth: 2,
  shadowBlur: 8,
  shadowColor: "rgba(0,0,0,0.12)",
};

export function getAbsenteeMapColor(value) {
  const v = Number(value) || 0;
  if (v >= 50) return ABSENTEE_MAP_LEVELS[0].color;
  if (v >= 20) return ABSENTEE_MAP_LEVELS[1].color;
  if (v >= 5) return ABSENTEE_MAP_LEVELS[2].color;
  if (v >= 1) return ABSENTEE_MAP_LEVELS[3].color;
  return ABSENTEE_MAP_LEVELS[4].color;
}

/** 补全地图 series 数据，确保每个区域都有值（缺失补 0） */
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

/** 将 DataV GeoJSON 转为 ECharts 可识别的短地名 */
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
