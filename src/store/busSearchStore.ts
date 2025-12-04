export type BusSearchState = {
  busNumber: string;
};

let currentBusSearchState: BusSearchState = {
  busNumber: "3201",
};

let subscribers: Array<(state: BusSearchState) => void> = [];

export const getBusSearchState = (): BusSearchState => ({ ...currentBusSearchState });

export const subscribeBusSearch = (callback: (state: BusSearchState) => void) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter((sub) => sub !== callback);
  };
};

const notifySubscribers = () => {
  const snapshot = getBusSearchState();
  subscribers.forEach((callback) => callback(snapshot));
};

export const setBusSearchNumber = (busNumber: string): void => {
  currentBusSearchState = { ...currentBusSearchState, busNumber };
  notifySubscribers();
};

