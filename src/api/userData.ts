import api_client from "./client";

/**
 * 즐겨찾기 타입 정의
 */
export type FavoriteItem = {
  id: number;
  label: string;
  type: "bus" | "stop";
};

/**
 * 저장된 경로 타입 정의
 */
export type SavedRouteItem = {
  id: number;
  from: string;
  to: string;
  detail: string;
  type: "bus" | "stop";
};

/**
 * 즐겨찾기 목록 조회
 * - 백엔드 엔드포인트: /api/favorites/
 */
export const getFavorites = async (): Promise<FavoriteItem[]> => {
  try {
    const response = await api_client.get<FavoriteItem[]>("/favorites/");
    return response.data;
  } catch (error: any) {
    console.error("즐겨찾기 조회 실패:", error);
    return [];
  }
};

/**
 * 즐겨찾기 추가
 * - 백엔드 엔드포인트: /api/favorites/
 */
export const addFavorite = async (label: string, type: "bus" | "stop"): Promise<FavoriteItem> => {
  try {
    const response = await api_client.post<FavoriteItem>("/favorites/", {
      label,
      type,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * 즐겨찾기 삭제
 * - 백엔드 엔드포인트: /api/favorites/{id}/
 */
export const deleteFavorite = async (id: number): Promise<void> => {
  try {
    await api_client.delete(`/favorites/${id}/`);
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * 저장된 경로 목록 조회
 * - 백엔드 엔드포인트: /api/saved-routes/
 */
export const getSavedRoutes = async (): Promise<SavedRouteItem[]> => {
  try {
    const response = await api_client.get<SavedRouteItem[]>("/saved-routes/");
    return response.data;
  } catch (error: any) {
    console.error("저장된 경로 조회 실패:", error);
    return [];
  }
};

/**
 * 저장된 경로 추가
 * - 백엔드 엔드포인트: /api/saved-routes/
 */
export const addSavedRoute = async (
  from: string,
  to: string,
  detail: string,
  type: "bus" | "stop" = "bus"
): Promise<SavedRouteItem> => {
  try {
    const response = await api_client.post<SavedRouteItem>("/saved-routes/", {
      from,
      to,
      detail,
      type,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * 저장된 경로 삭제
 * - 백엔드 엔드포인트: /api/saved-routes/{id}/
 */
export const deleteSavedRoute = async (id: number): Promise<void> => {
  try {
    await api_client.delete(`/saved-routes/${id}/`);
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

