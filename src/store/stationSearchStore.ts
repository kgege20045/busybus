export type StationSearchState = {
  departureStation: string;
};

let currentStationSearchState: StationSearchState = {
  departureStation: "뗏골마을앞",
};

let stationSubscribers: Array<(state: StationSearchState) => void> = [];

export const getStationSearchState = (): StationSearchState => ({ ...currentStationSearchState });

export const subscribeStationSearch = (callback: (state: StationSearchState) => void) => {
  stationSubscribers.push(callback);
  return () => {
    stationSubscribers = stationSubscribers.filter((sub) => sub !== callback);
  };
};

const notifyStationSubscribers = () => {
  const snapshot = getStationSearchState();
  stationSubscribers.forEach((callback) => callback(snapshot));
};

export const setDepartureStation = (departureStation: string): void => {
  currentStationSearchState = { ...currentStationSearchState, departureStation };
  notifyStationSubscribers();
};

