export type SearchHistoryItem = {
  id: string;
  title: string;
  description: string;
  type: "bus" | "station";
  timestamp: number;
};

const MAX_HISTORY = 3;

let historyItems: SearchHistoryItem[] = [];
let historySubscribers: Array<(items: SearchHistoryItem[]) => void> = [];

export const getSearchHistory = (): SearchHistoryItem[] => [...historyItems];

export const subscribeSearchHistory = (callback: (items: SearchHistoryItem[]) => void) => {
  historySubscribers.push(callback);
  return () => {
    historySubscribers = historySubscribers.filter((sub) => sub !== callback);
  };
};

const notifyHistorySubscribers = () => {
  const snapshot = getSearchHistory();
  historySubscribers.forEach((callback) => callback(snapshot));
};

export const addSearchHistory = (item: { title: string; description: string; type: "bus" | "station" }) => {
  const timestamp = Date.now();
  historyItems = historyItems.filter(
    (history) => !(history.title === item.title && history.type === item.type && history.description === item.description)
  );
  const newEntry: SearchHistoryItem = {
    id: `history-${timestamp}`,
    title: item.title,
    description: item.description,
    type: item.type,
    timestamp,
  };
  historyItems = [newEntry, ...historyItems];
  if (historyItems.length > MAX_HISTORY) {
    historyItems = historyItems.slice(0, MAX_HISTORY);
  }
  notifyHistorySubscribers();
};

export const clearSearchHistory = () => {
  if (historyItems.length === 0) {
    return;
  }
  historyItems = [];
  notifyHistorySubscribers();
};

