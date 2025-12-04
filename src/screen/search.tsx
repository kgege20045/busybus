import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Animated, Image, PanResponder, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import { setSearchIntent } from "../store/searchIntentStore";
import { getSearchHistory, SearchHistoryItem, subscribeSearchHistory } from "../store/searchHistoryStore";
import { setBusSearchNumber } from "../store/busSearchStore";
import { setDepartureStation } from "../store/stationSearchStore";
import { addFavorite } from "../store/favoriteStore";

type SearchProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const ICONS = {
  cellular: require("../../assets/images/search/Examples/Cellular Connection.png"),
  wifi: require("../../assets/images/search/Examples/Wifi.png"),
  battery: require("../../assets/images/search/Examples/Battery.png"),
  search: require("../../assets/images/search/Examples/icnSearch.png"),
  searchSecondary: require("../../assets/images/search/Examples/icnSearch-1.png"),
  plus: require("../../assets/images/bookmark/icnPlus2.png"),
};

const ADD_ACTION_WIDTH = 78;

/**
 * SearchScreen
 * 정류장/버스 검색 화면을 Figma 디자인 기반으로 구성한다.
 */
const SearchScreen = ({ currentScreen, onNavigate }: SearchProps): ReactElement => {
  const [recentItems, setRecentItems] = useState<SearchHistoryItem[]>(getSearchHistory());

  useEffect(() => {
    const unsubscribe = subscribeSearchHistory(setRecentItems);
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll_content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SearchBar onNavigate={onNavigate} />
          <RecentSection items={recentItems} onNavigate={onNavigate} />
        </ScrollView>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

/**
 * SearchBar
 * 상단 검색 영역을 렌더링한다. 누르면 상세 검색 화면으로 이동.
 */
const SearchBar = ({ onNavigate }: { onNavigate: NavigateHandler }): ReactElement => {
  return (
    <View style={styles.search_bar}>
      <TouchableOpacity
        style={styles.search_box}
        activeOpacity={0.85}
        onPress={() => {
          setSearchIntent("default");
          onNavigate("searching");
        }}
      >
        <Image source={ICONS.search} style={styles.search_icon} resizeMode="contain" />
        <Text style={styles.search_placeholder}>정류장·버스 검색</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * RecentSection
 * 최근 검색/경로 리스트
 */
const RecentSection = ({
  items,
  onNavigate,
}: {
  items: SearchHistoryItem[];
  onNavigate: NavigateHandler;
}): ReactElement => {
  const handleRecentPress = (item: SearchHistoryItem) => {
    setSearchIntent("default");
    if (item.type === "bus") {
      setBusSearchNumber(item.title);
      onNavigate("bus_search");
    } else {
      setDepartureStation(item.title);
      onNavigate("station_search");
    }
  };

  const handleAddToFavorite = async (item: SearchHistoryItem) => {
    try {
      await addFavorite({
        label: item.title,
        type: item.type === "bus" ? "bus" : "stop",
      });
    } catch (error) {
      console.error("즐겨찾기 추가 중 오류가 발생했습니다.", error);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.section_title}>Recent</Text>
      <View style={styles.recent_list}>
        {items.length === 0 ? (
          <View style={styles.recent_empty_state}>
            <Text style={styles.recent_empty_text}>최근 검색 기록이 없습니다</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <SwipeableRecentRow
              key={item.id}
              showDivider={index !== items.length - 1}
              onAddToFavorite={() => handleAddToFavorite(item)}
            >
              <TouchableOpacity
                style={styles.recent_row}
                activeOpacity={0.85}
                onPress={() => handleRecentPress(item)}
              >
                <View style={styles.recent_icon_wrapper}>
                  <Image source={ICONS.searchSecondary} style={styles.recent_icon} resizeMode="contain" />
                </View>
                <View style={styles.recent_texts}>
                  <Text style={styles.recent_title}>{item.title}</Text>
                  <Text style={styles.recent_subtitle}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            </SwipeableRecentRow>
          ))
        )}
      </View>
    </View>
  );
};

/**
 * SwipeableRecentRow
 * 오른쪽으로 스와이프하면 즐겨찾기 추가 버튼이 나타나는 행 컴포넌트
 */
type SwipeableRecentRowProps = {
  children: ReactElement;
  showDivider?: boolean;
  onAddToFavorite: () => void;
};

const SwipeableRecentRow = ({ children, showDivider, onAddToFavorite }: SwipeableRecentRowProps): ReactElement => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

  /**
   * 행 애니메이션 함수
   * @param toValue - 이동할 X 좌표 값
   */
  const animateRow = (toValue: number) => {
    Animated.timing(translateX, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      isOpenRef.current = toValue !== 0;
    });
  };

  /**
   * PanResponder를 사용하여 스와이프 제스처 처리
   */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        let translation = gestureState.dx;
        if (isOpenRef.current) {
          translation += ADD_ACTION_WIDTH;
        }
        const clamped = Math.max(0, Math.min(ADD_ACTION_WIDTH, translation));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        let translation = gestureState.dx;
        if (isOpenRef.current) {
          translation += ADD_ACTION_WIDTH;
        }
        const shouldOpen = translation > ADD_ACTION_WIDTH / 2 || gestureState.vx > 0.5;
        animateRow(shouldOpen ? ADD_ACTION_WIDTH : 0);
      },
      onPanResponderTerminate: () => {
        animateRow(0);
      },
    })
  ).current;

  /**
   * 즐겨찾기 추가 핸들러
   */
  const handleAddToFavorite = () => {
    animateRow(0);
    onAddToFavorite();
  };

  return (
    <View style={styles.swipe_row_container}>
      <TouchableOpacity style={styles.add_action} activeOpacity={0.9} onPress={handleAddToFavorite}>
        <Image source={ICONS.plus} style={styles.add_action_icon} resizeMode="contain" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.swipeable_content,
          showDivider && styles.recent_row_divider,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const COLOR = {
  labelPrimary: "#000000",
  blueAccent: "#007AFF",
  blueCircle: "#007AFF",
  gray30: "#EBEBEB",
  gray80: "#6C6C6C",
  gray60: "#868782",
  grayBorder: "#EBEBEB",
  grayBg: "#F7F7F6",
  recentIconBg: "#F0F0F5",
  card: "#FFFFFF",
};

const styles = StyleSheet.create({
  safe_area: {
    flex: 1,
    backgroundColor: COLOR.grayBg,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR.grayBg,
    paddingHorizontal: 24,
  },
  scroll_content: {
    paddingBottom: 140,
  },
  status_bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  status_time: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.labelPrimary,
  },
  status_icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  status_icon: {
    width: 18,
    height: 12,
  },
  status_battery: {
    width: 27,
    height: 13,
  },
  search_bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 18,
  },
  search_box: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EBEBEB",
    paddingHorizontal: 6,
    gap: 4,
  },
  search_icon: {
    width: 20,
    height: 20,
  },
  search_placeholder: {
    flex: 1,
    fontSize: 17,
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#C7C7CB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar_text: {
    color: "#F7F7F6",
    fontWeight: "600",
    fontFamily: "Pretendard",
  },
  section: {
    marginBottom: 28,
  },
  section_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  section_title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLOR.labelPrimary,
  },
  recent_list: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLOR.grayBorder,
    overflow: "hidden",
  },
  recent_empty_state: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  recent_empty_text: {
    fontSize: 14,
    color: COLOR.gray60,
    fontFamily: "Pretendard",
  },
  recent_row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  recent_row_divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#eceff3",
  },
  recent_icon_wrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff1f7",
    alignItems: "center",
    justifyContent: "center",
  },
  recent_icon: {
    width: 20,
    height: 20,
    tintColor: "#7d8698",
  },
  recent_texts: {
    flex: 1,
  },
  recent_title: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.labelPrimary,
    marginBottom: 4,
  },
  recent_subtitle: {
    fontSize: 13,
    color: COLOR.gray60,
  },
  swipe_row_container: {
    width: "100%",
    backgroundColor: COLOR.card,
    position: "relative",
    marginHorizontal: -18,
  },
  swipeable_content: {
    backgroundColor: COLOR.card,
  },
  add_action: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ADD_ACTION_WIDTH,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  add_action_icon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
});

export default SearchScreen;
