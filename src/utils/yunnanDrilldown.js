/**
 * 云南地图下钻 — 按地市 adcode 懒加载 DataV 县级 GeoJSON
 */
import yunnanFullGeo from "../assets/geo/yunnan-full.json";
import { GEO_NAME_TO_SHORT } from "./yunnanGeo";

const DATAV_GEO_BASE = "https://geo.datav.aliyun.com/areas_v3/bound";

/** 供电局 key → 地级 adcode */
export const UNIT_ADCODE = {
  kunming: 530100,
  qujing: 530300,
  yuxi: 530400,
  baoshan: 530500,
  zhaotong: 530600,
  lijiang: 530700,
  puer: 530800,
  lincang: 530900,
  chuxiong: 532300,
  honghe: 532500,
  wenshan: 532600,
  xishuangbanna: 532800,
  dali: 532900,
  dehong: 533100,
  nujiang: 533300,
  diqing: 533400,
};

/** 短地名 → 供电局 key */
export const SHORT_NAME_TO_UNIT_KEY = {
  昆明: "kunming",
  曲靖: "qujing",
  玉溪: "yuxi",
  保山: "baoshan",
  昭通: "zhaotong",
  丽江: "lijiang",
  普洱: "puer",
  临沧: "lincang",
  楚雄: "chuxiong",
  红河: "honghe",
  文山: "wenshan",
  西双版纳: "xishuangbanna",
  大理: "dali",
  德宏: "dehong",
  怒江: "nujiang",
  迪庆: "diqing",
};

const countyMapCache = new Map();

export function shortenCountyName(fullName) {
  if (!fullName) return "";
  let name = fullName;
  name = name.replace(
    /彝族苗族自治县|回族彝族自治县|哈尼族彝族自治州|壮族苗族自治州|傣族景颇族自治州|傈僳族自治州|白族自治州|藏族自治州/g,
    ""
  );
  name = name.replace(/自治县|自治区|特别行政区/g, "");
  name = name.replace(/(区|县|市)$/g, "");
  if (name.length > 5) return name.slice(0, 4);
  return name || fullName.slice(0, 4);
}

export function normalizeCountyGeoJson(geoJson) {
  return {
    type: "FeatureCollection",
    features: (geoJson.features || []).map((feature) => {
      const fullName = feature.properties.name;
      const shortName = shortenCountyName(fullName);
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

export function getCountyMapName(unitKey) {
  return `yunnan-${unitKey}`;
}

export function resolveUnitKeyByRegionName(regionName) {
  if (!regionName) return null;
  if (UNIT_ADCODE[regionName]) return regionName;
  return SHORT_NAME_TO_UNIT_KEY[regionName] || null;
}

/** 懒加载并注册县级地图 */
export async function loadCountyMap(echarts, unitKey) {
  const adcode = UNIT_ADCODE[unitKey];
  if (!adcode) throw new Error(`未知地市：${unitKey}`);

  const mapName = getCountyMapName(unitKey);
  if (countyMapCache.has(mapName)) {
    return countyMapCache.get(mapName);
  }

  const resp = await fetch(`${DATAV_GEO_BASE}/${adcode}_full.json`);
  if (!resp.ok) throw new Error("县级地图数据加载失败");
  const raw = await resp.json();
  const geoJson = normalizeCountyGeoJson(raw);
  echarts.registerMap(mapName, geoJson);

  const counties = geoJson.features.map((f) => ({
    name: f.properties.name,
    fullName: f.properties.fullName,
    adcode: f.properties.adcode,
  }));

  const payload = { mapName, unitKey, adcode, counties, geoJson };
  countyMapCache.set(mapName, payload);
  return payload;
}

/** 生成县级 mock 数据（含 0 值县区，按统计维度区分） */
export function buildCountyMapData(counties, parentValue, factor = 1, metricKey = "late") {
  const n = Math.max(counties.length, 1);
  const base = Math.max(metricKey === "longAbsent" ? 1 : 3, Math.round((Number(parentValue) || 20) / n));
  const zeroMod = metricKey === "longAbsent" ? 4 : 5;

  return counties.map((c, i) => {
    const seed = i + 1 + (metricKey === "early" ? 2 : metricKey === "longAbsent" ? 4 : 0);
    if (seed % zeroMod === 0) {
      return { name: c.name, fullName: c.fullName, value: 0 };
    }
    const spread = metricKey === "longAbsent" ? 0.35 + (seed % 5) * 0.12 : 0.5 + (seed % 6) * 0.18;
    const raw = Math.round(base * spread * factor);
    const cap = metricKey === "longAbsent" ? 18 : 55;
    const floor = metricKey === "longAbsent" ? 0 : 1;
    const value = Math.max(floor, Math.min(cap, raw));
    return { name: c.name, fullName: c.fullName, value };
  });
}

export function getUnitMetaByKey(unitKey) {
  const adcode = UNIT_ADCODE[unitKey];
  if (!adcode) return null;
  const feature = yunnanFullGeo.features.find((f) => f.properties.adcode === adcode);
  const fullName = feature ? feature.properties.name : "";
  const shortName = GEO_NAME_TO_SHORT[fullName] || unitKey;
  return {
    unitKey,
    adcode,
    fullName,
    shortName,
    bureauName: `${shortName}供电局`,
  };
}
