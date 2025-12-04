// src/api/liveBus.ts

// ✅ 다른 API들에서 쓰는 공용 client 불러오기
import client from "./client";

type StationPayload = {
  stationId: string;
  staOrder: number;
};

/**
 * 버스 번호 화면(BusSearch)에서 쓰는 실시간 API
 * - POST /api/bus/realtime/
 * - body: { routeId, stations }
 */
export async function fetchLiveBus(
  routeId: string,
  stations: StationPayload[]
) {
  try {
    const res = await client.post("/bus/realtime/", {
      routeId,
      stations,
    });

    console.log("🔥 /bus/realtime 응답:", res.data); // 디버그용
    return res.data;
  } catch (err) {
    console.error("실시간 버스 조회 실패:", err);
    throw err;
  }
}

