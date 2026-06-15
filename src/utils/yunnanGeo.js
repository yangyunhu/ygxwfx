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

export const ABSENTEE_MAP_LEVELS = [
  { min: 50, color: "#F5222D", label: "≥50人次" },
  { min: 20, color: "#FA8C16", label: "20~49人次" },
  { min: 5, color: "#FFC53D", label: "5~19人次" },
  { min: 0, color: "#FFF1B8", label: "<5人次" },
];

export function getAbsenteeMapColor(value) {
  const v = Number(value) || 0;
  if (v >= 50) return ABSENTEE_MAP_LEVELS[0].color;
  if (v >= 20) return ABSENTEE_MAP_LEVELS[1].color;
  if (v >= 5) return ABSENTEE_MAP_LEVELS[2].color;
  return ABSENTEE_MAP_LEVELS[3].color;
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
