export type SavedRouteItem = {
  id: string;
  from: string;
  to: string;
  detail: string;
  type: "bus" | "stop";
};

type SavedRoutePayload = Omit<SavedRouteItem, "id">;
type SavedRoutesListener = (routes: SavedRouteItem[]) => void;

const initialRoutes: SavedRouteItem[] = [
  { id: "route-1", from: "쌍용아파트", to: "강남역", detail: "3302, 3301, 500-1", type: "bus" },
  { id: "route-2", from: "뗏골마을앞", to: "잠실역", detail: "9600", type: "stop" },
  { id: "route-3", from: "뗏골마을앞", to: "양재", detail: "3302, 3301, 500-1", type: "stop" },
];

let savedRoutes: SavedRouteItem[] = initialRoutes;
const listeners = new Set<SavedRoutesListener>();

export const getSavedRoutes = (): SavedRouteItem[] => savedRoutes;

const isSameRoute = (a: SavedRouteItem, b: SavedRoutePayload): boolean => {
  return a.from === b.from && a.to === b.to && a.detail === b.detail && a.type === b.type;
};

export const addSavedRoute = (route: SavedRoutePayload): SavedRouteItem => {
  const newRoute: SavedRouteItem = {
    id: `route-${Date.now()}`,
    ...route,
  };
  savedRoutes = [newRoute, ...savedRoutes];
  listeners.forEach((listener) => listener(savedRoutes));
  return newRoute;
};

export const addSavedRouteIfNotExists = (route: SavedRoutePayload): { added: boolean; route: SavedRouteItem } => {
  const existing = savedRoutes.find((item) => isSameRoute(item, route));
  if (existing) {
    return { added: false, route: existing };
  }
  const newRoute = addSavedRoute(route);
  return { added: true, route: newRoute };
};

export const subscribeSavedRoutes = (listener: SavedRoutesListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const removeSavedRoute = (id: string): void => {
  savedRoutes = savedRoutes.filter((route) => route.id !== id);
  listeners.forEach((listener) => listener(savedRoutes));
};


