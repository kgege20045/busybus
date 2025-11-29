// src/data/index.ts
import routesRaw from "./routes.json";
import stationBusRaw from "./stationBus.json";

// ---------- 타입 정의 ----------

// "3302" 이런 키 (버스번호_방향)
export type RouteKey = string;

export type RouteStop = {
  order: number;
  stationId: string;
  stationName: string;
};

export type RoutesMap = Record<RouteKey, RouteStop[]>;

export type StationBusInfo = {
  name: string;
  busNums: string[];
  busCount: number;
};

export type StationBusMap = Record<string, StationBusInfo>;

// ---------- 실제 데이터 ----------

export const ROUTES = routesRaw as RoutesMap;
export const STATION_BUS = stationBusRaw as StationBusMap;

// ---------- 헬퍼 함수들 ----------

/**
 * 노선 번호 + 방향으로 정류장 리스트 가져오기
 * @param routeNm 예: "3302"
 * @param direction 0(상행) / 1(하행)
 */
export function getRouteStops(
  routeNm: string,
  direction: 0 | 1
): RouteStop[] {
  const key = `${routeNm}_${direction}`;
  return ROUTES[key] ?? [];
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
 * 특정 버스번호가 정차하는 정류장 목록 (양방향 다 합쳐서)
 */
export function getStationsForRoute(routeNm: string): RouteStop[] {
  const keys = Object.keys(ROUTES).filter((k) =>
    k.startsWith(`${routeNm}_`)
  );
  const result: RouteStop[] = [];
  keys.forEach((key) => {
    result.push(...ROUTES[key]);
  });
  // 필요하면 order 기준 정렬
  return result.sort((a, b) => a.order - b.order);
}

/**
 * 모든 고유 버스 번호 목록 가져오기
 */
export function getAllRouteNumbers(): string[] {
  const routeKeys = Object.keys(ROUTES);
  const routeNums = new Set<string>();
  routeKeys.forEach((key) => {
    const routeNum = key.split("_")[0];
    if (routeNum) {
      routeNums.add(routeNum);
    }
  });
  return Array.from(routeNums).sort();
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
  const entry = Object.entries(STATION_BUS).find(([_, info]) => info.name === stationName);
  return entry ? entry[0] : null;
}

/**
 * 특정 정류장이 특정 버스 노선의 어느 순서에 있는지 찾기
 * @param routeNm 버스 번호
 * @param stationId 정류장 ID
 * @returns direction과 order를 포함한 정보, 없으면 null
 */
export function findStationInRoute(routeNm: string, stationId: string): { direction: 0 | 1; order: number } | null {
  // 상행(0)과 하행(1) 모두 확인
  for (let dir = 0; dir <= 1; dir++) {
    const direction = dir as 0 | 1;
    const stops = getRouteStops(routeNm, direction);
    const found = stops.find((stop) => stop.stationId === stationId);
    if (found) {
      return { direction, order: found.order };
    }
  }
  return null;
}