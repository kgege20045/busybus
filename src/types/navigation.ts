export type ScreenName = "home" | "bookmark" | "search" | "searching" | "station_search" | "bus_search" | "user" | "login" | "signup";

export type NavigateHandler = (screen: ScreenName) => void;

