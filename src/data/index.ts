// src/data/index.ts
import routesRaw from "./routes.json";
import stationBusRaw from "./stationBus.json";

// ---------- 타입 정의 ----------

// routeid (예: "218000005")
export type RouteId = string;

// routes.json의 각 정류장 정보
export type RouteStopRaw = {
  route_nm: string;      // 버스 번호 (예: "3200", "3302")
  sta_order: number;     // 정류장 순서
  station_id: string;    // 정류장 ID
  station_nm?: string;   // 정류장 이름 (선택적, 없으면 stationBus.json에서 가져옴)
};

// 정규화된 RouteStop 타입
export type RouteStop = {
  order: number;
  stationId: string;
  stationName: string;
};

// routes.json 구조: routeid -> RouteStopRaw[]
export type RoutesMapRaw = Record<RouteId, RouteStopRaw[]>;

// 정규화된 RoutesMap: routeid -> RouteStop[]
export type RoutesMap = Record<RouteId, RouteStop[]>;

// stationBus.json 구조
export type StationBusInfo = {
  name: string;
  busNums: string[];  // route_nm 배열
  busCount: number;
};

export type StationBusMap = Record<string, StationBusInfo>;

// ---------- 실제 데이터 ----------

const ROUTES_RAW = routesRaw as RoutesMapRaw;
const STATION_BUS_RAW = stationBusRaw as StationBusMap;

// 정규화된 ROUTES (routeid -> RouteStop[])
// station_nm이 없으면 stationBus.json에서 정류장 이름을 가져옴
export const ROUTES: RoutesMap = Object.fromEntries(
  Object.entries(ROUTES_RAW).map(([routeId, stops]) => [
    routeId,
    stops.map((stop) => {
      // station_nm이 있으면 사용, 없으면 stationBus.json에서 가져오기
      const stationName = stop.station_nm || STATION_BUS_RAW[stop.station_id]?.name || `정류장 ${stop.station_id}`;
      return {
        order: stop.sta_order,
        stationId: stop.station_id,
        stationName: stationName,
      };
    }),
  ])
);

// STATION_BUS는 그대로 사용
export const STATION_BUS: StationBusMap = STATION_BUS_RAW;

// route_nm -> routeid[] 매핑 (캐시)
const ROUTE_NM_TO_IDS: Map<string, RouteId[]> = (() => {
  const map = new Map<string, RouteId[]>();
  Object.entries(ROUTES_RAW).forEach(([routeId, stops]) => {
    if (stops.length > 0) {
      const routeNm = stops[0].route_nm;
      if (!map.has(routeNm)) {
        map.set(routeNm, []);
      }
      map.get(routeNm)!.push(routeId);
    }
  });
  return map;
})();

// ---------- 헬퍼 함수들 ----------

/**
 * routeid로 정류장 리스트 가져오기
 * @param routeId 예: "218000005"
 */
export function getRouteStopsByRouteId(routeId: RouteId): RouteStop[] {
  return ROUTES[routeId] ?? [];
}

/**
 * route_nm으로 해당하는 모든 routeid 목록 가져오기
 * @param routeNm 예: "3302"
 */
export function getRouteIdsByRouteNm(routeNm: string): RouteId[] {
  return ROUTE_NM_TO_IDS.get(routeNm) ?? [];
}

/**
 * route_nm과 station_id로 해당하는 routeid 찾기
 * @param routeNm 버스 번호
 * @param stationId 정류장 ID
 * @returns 해당하는 routeid, 없으면 null
 */
export function findRouteIdByRouteNmAndStation(
  routeNm: string,
  stationId: string
): RouteId | null {
  const routeIds = getRouteIdsByRouteNm(routeNm);
  for (const routeId of routeIds) {
    const stops = ROUTES[routeId];
    if (stops?.some((stop) => stop.stationId === stationId)) {
      return routeId;
    }
  }
  return null;
}

/**
 * route_nm과 station_id로 정류장의 위치 찾기
 * @param routeNm 버스 번호
 * @param stationId 정류장 ID
 * @returns routeid와 order를 포함한 정보, 없으면 null
 */
export function findStationInRoute(
  routeNm: string,
  stationId: string
): { routeId: RouteId; order: number } | null {
  const routeId = findRouteIdByRouteNmAndStation(routeNm, stationId);
  if (!routeId) return null;

  const stops = ROUTES[routeId];
  const found = stops?.find((stop) => stop.stationId === stationId);
  if (!found) return null;

  return { routeId, order: found.order };
}

/**
 * 버스 번호로 출발지에서 도착지로 갈 수 있는지 확인
 * 같은 routeid에서 출발지가 도착지보다 앞에 있어야 함
 * @param routeNm 버스 번호
 * @param originStationId 출발지 정류장 ID
 * @param destStationId 도착지 정류장 ID
 * @returns 갈 수 있으면 true, 없으면 false
 */
export function canGoFromTo(
  routeNm: string,
  originStationId: string,
  destStationId: string
): boolean {
  const routeIds = getRouteIdsByRouteNm(routeNm);
  
  // 모든 routeid를 확인하여 출발지와 도착지가 같은 routeid에 있고
  // 출발지가 도착지보다 앞에 있는 경우가 있는지 확인
  for (const routeId of routeIds) {
    const stops = ROUTES[routeId];
    if (!stops) continue;

    const originStop = stops.find((stop) => stop.stationId === originStationId);
    const destStop = stops.find((stop) => stop.stationId === destStationId);

    // 둘 다 같은 routeid에 있고, 출발지가 도착지보다 앞에 있어야 함
    if (originStop && destStop && originStop.order < destStop.order) {
      return true;
    }
  }

  return false;
}

/**
 * 호환성을 위한 함수: route_nm으로 정류장 리스트 가져오기
 * 상행만 있으므로 첫 번째 routeid를 사용
 * @param routeNm 예: "3302"
 * @param direction 0(상행) - 호환성을 위해 유지하지만 항상 0으로 고정
 * @deprecated routeid 중심 구조로 변경되었으므로 getRouteStopsByRouteId 사용 권장
 */
export function getRouteStops(
  routeNm: string,
  direction: 0 | 1 = 0
): RouteStop[] {
  const routeIds = getRouteIdsByRouteNm(routeNm);
  if (routeIds.length === 0) return [];

  // 상행만 있으므로 첫 번째 routeid 사용
  const routeId = routeIds[0];
  return getRouteStopsByRouteId(routeId);
}

/**
 * 정류장 ID로 해당 정류장 정보 + 지나가는 버스 목록 조회
 */
export function getStationBusInfo(
  stationId: string
): StationBusInfo | null {
  return STATION_BUS[stationId] ?? null;
}

/**
 * 정류장 ID로 지나가는 버스 번호 배열만 가져오기
 */
export function getBusesAtStation(stationId: string): string[] {
  return STATION_BUS[stationId]?.busNums ?? [];
}

/**
 * 특정 버스번호(route_nm)가 정차하는 모든 정류장 목록
 * (모든 routeid의 정류장을 합쳐서 반환)
 */
export function getStationsForRoute(routeNm: string): RouteStop[] {
  const routeIds = getRouteIdsByRouteNm(routeNm);
  const result: RouteStop[] = [];
  routeIds.forEach((routeId) => {
    result.push(...getRouteStopsByRouteId(routeId));
  });
  // order 기준 정렬
  return result.sort((a, b) => a.order - b.order);
}

/**
 * 모든 고유 버스 번호(route_nm) 목록 가져오기
 */
export function getAllRouteNumbers(): string[] {
  return Array.from(ROUTE_NM_TO_IDS.keys()).sort();
}

/**
 * 모든 정류장 정보 목록 가져오기
 */
export function getAllStations(): Array<{ stationId: string; name: string }> {
  return Object.entries(STATION_BUS).map(([stationId, info]) => ({
    stationId,
    name: info.name,
  }));
}

/**
 * 정류장 이름으로 stationId 찾기 (정확히 일치)
 */
export function getStationIdByName(stationName: string): string | null {
  const entry = Object.entries(STATION_BUS).find(
    ([_, info]) => info.name === stationName
  );
  return entry ? entry[0] : null;
}
