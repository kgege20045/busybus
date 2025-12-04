import AsyncStorage from "@react-native-async-storage/async-storage";
import * as userDataApi from "../api/userData";

/**
 * 마스터 계정 이메일 (AsyncStorage 사용)
 */
const MASTER_ACCOUNT_EMAIL = "aaaa@gmail.com";

/**
 * 저장된 경로 타입 정의
 * - 마스터 계정: id는 string (AsyncStorage)
 * - 일반 사용자: id는 number (백엔드 API)
 */
export type SavedRouteItem = {
  id: string | number;
  from: string;
  to: string;
  detail: string;
  type: "bus" | "stop";
};

type SavedRoutePayload = Omit<SavedRouteItem, "id">;
type SavedRoutesListener = (routes: SavedRouteItem[]) => void;

const initialRoutes: SavedRouteItem[] = [];

let savedRoutes = initialRoutes;
let currentUserEmail: string | null = null;
const listeners = new Set<SavedRoutesListener>();

/**
 * 현재 사용자가 마스터 계정인지 확인
 */
const isMasterAccount = (): boolean => {
  return currentUserEmail === MASTER_ACCOUNT_EMAIL;
};

/**
 * 사용자별 저장된 경로 데이터를 AsyncStorage에 저장하는 키 생성
 */
const getStorageKey = (email: string): string => {
  return `savedRoutes_${email}`;
};

/**
 * AsyncStorage에서 사용자별 저장된 경로 데이터 로드
 */
const loadSavedRoutesFromStorage = async (email: string): Promise<SavedRouteItem[]> => {
  try {
    const key = getStorageKey(email);
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("저장된 경로 데이터 로드 실패:", error);
    return [];
  }
};

/**
 * AsyncStorage에 사용자별 저장된 경로 데이터 저장
 */
const saveSavedRoutesToStorage = async (email: string, routes: SavedRouteItem[]): Promise<void> => {
  try {
    const key = getStorageKey(email);
    await AsyncStorage.setItem(key, JSON.stringify(routes));
  } catch (error) {
    console.error("저장된 경로 데이터 저장 실패:", error);
  }
};

/**
 * 사용자별 저장된 경로 데이터 초기화 (로그인 시 호출)
 * - 마스터 계정: AsyncStorage에서 로드
 * - 일반 사용자: 백엔드 API에서 로드
 */
export const loadUserSavedRoutes = async (email: string): Promise<void> => {
  currentUserEmail = email;
  
  if (email === MASTER_ACCOUNT_EMAIL) {
    // 마스터 계정: AsyncStorage에서 로드
    savedRoutes = await loadSavedRoutesFromStorage(email);
  } else {
    // 일반 사용자: 백엔드 API에서 로드
    try {
      const apiRoutes = await userDataApi.getSavedRoutes();
      savedRoutes = apiRoutes;
    } catch (error) {
      console.error("백엔드에서 저장된 경로 로드 실패:", error);
      savedRoutes = [];
    }
  }
  
  listeners.forEach((listener) => listener(savedRoutes));
};

/**
 * 저장된 경로 데이터 초기화 (로그아웃 시 호출)
 */
export const clearSavedRoutes = (): void => {
  currentUserEmail = null;
  savedRoutes = [];
  listeners.forEach((listener) => listener(savedRoutes));
};

export const getSavedRoutes = (): SavedRouteItem[] => savedRoutes;

const isSameRoute = (a: SavedRouteItem, b: SavedRoutePayload): boolean => {
  return a.from === b.from && a.to === b.to && a.detail === b.detail && a.type === b.type;
};

/**
 * 저장된 경로 추가
 * - 마스터 계정: AsyncStorage에 저장
 * - 일반 사용자: 백엔드 API에 저장
 */
export const addSavedRoute = async (route: SavedRoutePayload): Promise<SavedRouteItem> => {
  if (!currentUserEmail) {
    console.warn("로그인이 필요합니다.");
    throw new Error("로그인이 필요합니다.");
  }

  if (isMasterAccount()) {
    // 마스터 계정: AsyncStorage 사용
    const newRoute: SavedRouteItem = {
      id: `route-${Date.now()}`,
      ...route,
    };
    savedRoutes = [newRoute, ...savedRoutes];
    listeners.forEach((listener) => listener(savedRoutes));
    
    await saveSavedRoutesToStorage(currentUserEmail, savedRoutes);
    return newRoute;
  } else {
    // 일반 사용자: 백엔드 API 사용
    try {
      const newRoute = await userDataApi.addSavedRoute(route.from, route.to, route.detail, route.type);
      savedRoutes = [newRoute, ...savedRoutes];
      listeners.forEach((listener) => listener(savedRoutes));
      return newRoute;
    } catch (error) {
      console.error("백엔드에 저장된 경로 추가 실패:", error);
      throw error;
    }
  }
};

/**
 * 저장된 경로 추가 (중복 체크)
 * - 마스터 계정: 프론트엔드에서 중복 체크 후 AsyncStorage에 저장
 * - 일반 사용자: 백엔드 API에서 중복 체크 (백엔드가 중복 시 기존 항목 반환)
 */
export const addSavedRouteIfNotExists = async (route: SavedRoutePayload): Promise<{ added: boolean; route: SavedRouteItem }> => {
  if (!currentUserEmail) {
    console.warn("로그인이 필요합니다.");
    throw new Error("로그인이 필요합니다.");
  }

  if (isMasterAccount()) {
    // 마스터 계정: 프론트엔드에서 중복 체크
    const existing = savedRoutes.find((item) => isSameRoute(item, route));
    if (existing) {
      return { added: false, route: existing };
    }
    const newRoute = await addSavedRoute(route);
    return { added: true, route: newRoute };
  } else {
    // 일반 사용자: 백엔드 API가 중복 체크를 처리
    // 백엔드는 중복 시 기존 항목을 반환 (status 200), 새로 생성 시 status 201 반환
    try {
      const result = await userDataApi.addSavedRoute(route.from, route.to, route.detail, route.type);
      
      // 백엔드 응답에서 이미 존재하는 항목인지 확인 (프론트엔드 상태와 비교)
      const existing = savedRoutes.find((item) => isSameRoute(item, route));
      const wasAdded = !existing;
      
      // 백엔드에서 반환한 항목을 상태에 추가/업데이트
      if (wasAdded) {
        savedRoutes = [result, ...savedRoutes];
      } else {
        // 이미 존재하는 경우, 백엔드에서 반환한 항목으로 업데이트
        savedRoutes = savedRoutes.map((item) => 
          isSameRoute(item, route) ? result : item
        );
      }
      listeners.forEach((listener) => listener(savedRoutes));
      
      return { added: wasAdded, route: result };
    } catch (error) {
      console.error("백엔드에 저장된 경로 추가 실패:", error);
      throw error;
    }
  }
};

export const subscribeSavedRoutes = (listener: SavedRoutesListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * 저장된 경로 삭제
 * - 마스터 계정: AsyncStorage에서 삭제
 * - 일반 사용자: 백엔드 API에서 삭제
 */
export const removeSavedRoute = async (id: string | number): Promise<void> => {
  if (!currentUserEmail) {
    console.warn("로그인이 필요합니다.");
    return;
  }

  if (isMasterAccount()) {
    // 마스터 계정: AsyncStorage 사용
    savedRoutes = savedRoutes.filter((route) => route.id !== id);
    listeners.forEach((listener) => listener(savedRoutes));
    await saveSavedRoutesToStorage(currentUserEmail, savedRoutes);
  } else {
    // 일반 사용자: 백엔드 API 사용
    try {
      if (typeof id !== "number") {
        throw new Error("일반 사용자의 저장된 경로 ID는 number여야 합니다.");
      }
      await userDataApi.deleteSavedRoute(id);
      savedRoutes = savedRoutes.filter((route) => route.id !== id);
      listeners.forEach((listener) => listener(savedRoutes));
    } catch (error) {
      console.error("백엔드에서 저장된 경로 삭제 실패:", error);
      throw error;
    }
  }
};
