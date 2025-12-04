import React, { ReactElement } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { NavigateHandler, ScreenName } from "../types/navigation";

const TAB_ICONS = {
  bookmark: require("../../assets/images/home/Bookmark.png"),
  home: require("../../assets/images/home/Home.png"),
  search: require("../../assets/images/home/Search.png"),
  user: require("../../assets/images/home/User.png"),
};

type BottomTabBarProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const BottomTabBar = ({ currentScreen, onNavigate }: BottomTabBarProps): ReactElement => {
  const tabs: Array<{
    id: "bookmark" | "home" | "search" | "user";
    icon: number;
    screen?: ScreenName;
  }> = [
    { id: "bookmark", icon: TAB_ICONS.bookmark, screen: "bookmark" },
    { id: "home", icon: TAB_ICONS.home, screen: "home" },
    { id: "search", icon: TAB_ICONS.search, screen: "search" },
    { id: "user", icon: TAB_ICONS.user, screen: "user" },
  ];

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        const isActive = tab.screen ? currentScreen === tab.screen : false;
        // search 화면일 때는 항상 #007AFF 색상 적용
        const isSearchActive =
          tab.id === "search" &&
          (currentScreen === "search" ||
            currentScreen === "searching" ||
            currentScreen === "station_search" ||
            currentScreen === "bus_search");
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            activeOpacity={tab.screen ? 0.85 : 1}
            onPress={tab.screen ? () => onNavigate(tab.screen as ScreenName) : undefined}
            disabled={!tab.screen}
          >
            <Image
              source={tab.icon}
              style={[
                styles.tabIcon,
                isActive && styles.tabIconActive,
                isSearchActive && styles.tabIconSearchActive,
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "center",   // 아이콘 묶음을 가운데로
    alignItems: "center",
    gap: 35,                    // 아이콘 사이 간격
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 20,
    width: "100%",              // 바를 화면 전체 너비로
  },
  tabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    width: 40,
    height: 40,
    tintColor: "#1c1c1e",
  },
  tabIconActive: {
    tintColor: "#0074ff",
  },
  tabIconSearchActive: {
    tintColor: "#007AFF",
  },
});


export default BottomTabBar;

