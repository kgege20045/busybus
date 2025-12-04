export type RouteLocation = {
  title: string;
  description?: string;
};

type EndpointKey = "origin" | "destination";

export type RouteSelection = {
  origin: RouteLocation;
  destination: RouteLocation;
};

const defaultSelection: RouteSelection = {
  origin: { title: "뗏골마을앞" },
  destination: { title: "양재역" },
};

let selection: RouteSelection = defaultSelection;

const listeners = new Set<(value: RouteSelection) => void>();

export const getRouteSelection = (): RouteSelection => selection;

export const setRouteLocation = (key: EndpointKey, location: RouteLocation): void => {
  selection = {
    ...selection,
    [key]: location,
  };
  listeners.forEach((listener) => listener(selection));

  // persist in future if needed
};

export const subscribeRouteSelection = (listener: (value: RouteSelection) => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

