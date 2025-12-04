import AsyncStorage from "@react-native-async-storage/async-storage";
import * as userDataApi from "../api/userData";

/**
 * 마스터 계정 이메일 (AsyncStorage 사용)
 */
const MASTER_ACCOUNT_EMAIL = "aaaa@gmail.com";

/**
 * 즐겨찾기 타입 정의
 * - 마스터 계정: id는 string (AsyncStorage)
 * - 일반 사용자: id는 number (백엔드 API)
 */
export type FavoriteItem = {
  id: string | number;
  label: string;
  type: "bus" | "stop";
};

type FavoritePayload = Omit<FavoriteItem, "id">;
type FavoriteListener = (items: FavoriteItem[]) => void;

const initialFavorites: FavoriteItem[] = [];

let favorites = initialFavorites;
let currentUserEmail: string | null = null;
const listeners = new Set<FavoriteListener>();

/**
 * 현재 사용자가 마스터 계정인지 확인
 */
const isMasterAccount = (): boolean => {
  return currentUserEmail === MASTER_ACCOUNT_EMAIL;
};

/**
 * 사용자별 즐겨찾기 데이터를 AsyncStorage에 저장하는 키 생성
 */
const getStorageKey = (email: string): string => {
  return `favorites_${email}`;
};

/**
 * AsyncStorage에서 사용자별 즐겨찾기 데이터 로드
 */
const loadFavoritesFromStorage = async (email: string): Promise<FavoriteItem[]> => {
  try {
    const key = getStorageKey(email);
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("즐겨찾기 데이터 로드 실패:", error);
    return [];
  }
};

/**
 * AsyncStorage에 사용자별 즐겨찾기 데이터 저장
 */
const saveFavoritesToStorage = async (email: string, items: FavoriteItem[]): Promise<void> => {
  try {
    const key = getStorageKey(email);
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error("즐겨찾기 데이터 저장 실패:", error);
  }
};

/**
 * 사용자별 즐겨찾기 데이터 초기화 (로그인 시 호출)
 * - 마스터 계정: AsyncStorage에서 로드
 * - 일반 사용자: 백엔드 API에서 로드
 */
export const loadUserFavorites = async (email: string): Promise<void> => {
  currentUserEmail = email;
  
  if (email === MASTER_ACCOUNT_EMAIL) {
    // 마스터 계정: AsyncStorage에서 로드
    favorites = await loadFavoritesFromStorage(email);
  } else {
    // 일반 사용자: 백엔드 API에서 로드
    try {
      const apiFavorites = await userDataApi.getFavorites();
      favorites = apiFavorites;
    } catch (error) {
      console.error("백엔드에서 즐겨찾기 로드 실패:", error);
      favorites = [];
    }
  }
  
  notify();
};

/**
 * 즐겨찾기 데이터 초기화 (로그아웃 시 호출)
 */
export const clearFavorites = (): void => {
  currentUserEmail = null;
  favorites = [];
  notify();
};

const notify = () => {
  listeners.forEach((listener) => listener(favorites));
};

export const getFavorites = (): FavoriteItem[] => favorites;

export const subscribeFavorites = (listener: FavoriteListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * 즐겨찾기 추가
 * - 마스터 계정: AsyncStorage에 저장
 * - 일반 사용자: 백엔드 API에 저장
 */
export const addFavorite = async (item: FavoritePayload): Promise<FavoriteItem> => {
  if (!currentUserEmail) {
    console.warn("로그인이 필요합니다.");
    throw new Error("로그인이 필요합니다.");
  }

  if (isMasterAccount()) {
    // 마스터 계정: AsyncStorage 사용
    const existing = favorites.find((fav) => fav.label === item.label && fav.type === item.type);
    if (existing) {
      return existing;
    }

    const newFavorite: FavoriteItem = {
      id: `fav-${Date.now()}`,
      ...item,
    };
    favorites = [newFavorite, ...favorites];
    notify();
    
    await saveFavoritesToStorage(currentUserEmail, favorites);
    return newFavorite;
  } else {
    // 일반 사용자: 백엔드 API 사용
    try {
      // 이미 같은 label/type의 즐겨찾기가 있는 경우 중복 추가 방지
      const existing = favorites.find((fav) => fav.label === item.label && fav.type === item.type);
      if (existing) {
        return existing;
      }

      const newFavorite = await userDataApi.addFavorite(item.label, item.type);
      favorites = [newFavorite, ...favorites];
      notify();
      return newFavorite;
    } catch (error) {
      console.error("백엔드에 즐겨찾기 추가 실패:", error);
      throw error;
    }
  }
};

/**
 * 즐겨찾기 삭제
 * - 마스터 계정: AsyncStorage에서 삭제
 * - 일반 사용자: 백엔드 API에서 삭제
 */
export const removeFavorite = async (id: string | number): Promise<void> => {
  if (!currentUserEmail) {
    console.warn("로그인이 필요합니다.");
    return;
  }

  if (isMasterAccount()) {
    // 마스터 계정: AsyncStorage 사용
    favorites = favorites.filter((fav) => fav.id !== id);
    notify();
    await saveFavoritesToStorage(currentUserEmail, favorites);
  } else {
    // 일반 사용자: 백엔드 API 사용
    try {
      if (typeof id !== "number") {
        throw new Error("일반 사용자의 즐겨찾기 ID는 number여야 합니다.");
      }
      await userDataApi.deleteFavorite(id);
      favorites = favorites.filter((fav) => fav.id !== id);
      notify();
    } catch (error) {
      console.error("백엔드에서 즐겨찾기 삭제 실패:", error);
      throw error;
    }
  }
};