export type SearchIntent = "default" | "add_favorite" | "select_origin" | "select_destination";

let currentIntent: SearchIntent = "default";

export const setSearchIntent = (intent: SearchIntent): void => {
  currentIntent = intent;
};

export const getSearchIntent = (): SearchIntent => currentIntent;


