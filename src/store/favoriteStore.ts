export type FavoriteItem = {
  id: string;
  label: string;
  type: "bus" | "stop";
};

type FavoritePayload = Omit<FavoriteItem, "id">;
type FavoriteListener = (items: FavoriteItem[]) => void;

const initialFavorites: FavoriteItem[] = [
  { id: "bus-3302", label: "3302", type: "bus" },
  { id: "bus-500-1", label: "500-1", type: "bus" },
  { id: "stop-apt", label: "쌍용아파트", type: "stop" },
  { id: "stop-moran", label: "모란역", type: "stop" },
];

let favorites = initialFavorites;
const listeners = new Set<FavoriteListener>();

const notify = () => {
  listeners.forEach((listener) => listener(favorites));
};

export const getFavorites = (): FavoriteItem[] => favorites;

export const subscribeFavorites = (listener: FavoriteListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const addFavorite = (item: FavoritePayload): FavoriteItem => {
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
  return newFavorite;
};

export const removeFavorite = (id: string): void => {
  favorites = favorites.filter((fav) => fav.id !== id);
  notify();
};


