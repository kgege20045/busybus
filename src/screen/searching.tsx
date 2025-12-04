import React, { ReactElement, useMemo, useRef, useState } from "react";
import { Animated, FlatList, Image, PanResponder, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import { addFavorite } from "../store/favoriteStore";
import { getSearchIntent, setSearchIntent } from "../store/searchIntentStore";
import { setRouteLocation } from "../store/routeSelectionStore";
import { setBusSearchNumber } from "../store/busSearchStore";
import { setDepartureStation } from "../store/stationSearchStore";
import { addSearchHistory } from "../store/searchHistoryStore";
import { getAllRouteNumbers, getAllStations, getBusesAtStation, getStationsForRoute, RouteStop } from "../data";

type SearchingProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

type SearchResult = {
  id: string;
  title: string;
  description: string;
  type: "bus" | "station";
  stationId?: string;
};

const ICONS = {
  cellular: require("../../assets/images/search/Examples/Cellular Connection.png"),
  wifi: require("../../assets/images/search/Examples/Wifi.png"),
  battery: require("../../assets/images/search/Examples/Battery.png"),
  search: require("../../assets/images/search/Examples/icnSearch.png"),
  searchSecondary: require("../../assets/images/search/Examples/icnSearch-1.png"),
  plus: require("../../assets/images/bookmark/icnPlus2.png"),
  bus: require("../../assets/images/searching/bus.png"),
  pin: require("../../assets/images/searching/pin.png"),
};

// 실제 데이터에서 모든 버스 번호와 정류장 목록 가져오기
const ALL_ROUTE_NUMBERS = getAllRouteNumbers();
const ALL_STATIONS = getAllStations();

const ADD_ACTION_WIDTH = 78;

const SearchingScreen = ({ currentScreen, onNavigate }: SearchingProps): ReactElement => {
  const [query, setQuery] = useState("");
  const currentIntent = getSearchIntent();
  const isAddMode = currentIntent === "add_favorite";
  const isEndpointSelection = currentIntent === "select_origin" || currentIntent === "select_destination";

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  // 실제 데이터에서 버스 검색 결과 생성
  const filteredBus = useMemo(() => {
    const busResults: SearchResult[] = ALL_ROUTE_NUMBERS.map((routeNum) => {
      // route_nm에 해당하는 모든 routeid의 정류장을 합쳐서 계산
      const allStops = getStationsForRoute(routeNum);
      const totalStops = allStops.length;
      const description = totalStops > 0 ? `${totalStops}개의 정류장` : "경로 정보 없음";
      return {
        id: `bus-${routeNum}`,
        title: routeNum,
        description,
        type: "bus" as const,
      };
    });

    if (!normalizedQuery) return busResults.slice(0, 10); // 쿼리가 없으면 처음 10개만
    return busResults.filter((item) => item.title.toLowerCase().includes(normalizedQuery)).slice(0, 20);
  }, [normalizedQuery]);

  // 실제 데이터에서 정류장 검색 결과 생성
  const filteredStations = useMemo(() => {
    const stationResults: SearchResult[] = ALL_STATIONS.map((station) => {
      const buses = getBusesAtStation(station.stationId);
      const description = buses.length > 0 ? `${buses.length}개 노선` : "노선 정보 없음";
      return {
        id: `station-${station.stationId}`,
        title: station.name,
        description,
        type: "station" as const,
        stationId: station.stationId,
      };
    });

    if (!normalizedQuery) return stationResults.slice(0, 10); // 쿼리가 없으면 처음 10개만
    return stationResults
      .filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, 20);
  }, [normalizedQuery]);

  const handleSubmit = () => {
    if (!normalizedQuery) return;
    if (isAddMode || isEndpointSelection) {
      return;
    }

    // 정적 데이터에 존재하는 버스 번호인지 확인
    const isBusQuery = ALL_ROUTE_NUMBERS.includes(trimmedQuery);

    if (isBusQuery) {
      addSearchHistory({
        title: trimmedQuery,
        description: "버스 검색",
        type: "bus",
      });
      setBusSearchNumber(trimmedQuery);
      onNavigate("bus_search");
    } else {
      addSearchHistory({
        title: trimmedQuery,
        description: "정류장 검색",
        type: "station",
      });
      setDepartureStation(trimmedQuery);
      onNavigate("station_search");
    }
    setSearchIntent("default");
  };

  const handleAddResultToFavorite = async (result: SearchResult) => {
    try {
      await addFavorite({
        label: result.title,
        type: result.type === "bus" ? "bus" : "stop",
      });
      setSearchIntent("default");
      onNavigate("bookmark");
    } catch (error) {
      console.error("즐겨찾기 추가 중 오류가 발생했습니다.", error);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    if (isAddMode) {
      return;
    }

    if (isEndpointSelection) {
      setRouteLocation(currentIntent === "select_origin" ? "origin" : "destination", {
        title: result.title,
        description: result.description,
      });
      setSearchIntent("default");
      onNavigate("home");
      return;
    }

    addSearchHistory({
      title: result.title,
      description: result.description,
      type: result.type,
    });

    if (result.type === "bus") {
      // 버스를 선택하면 버스 상세 화면으로 이동
      setBusSearchNumber(result.title);
      onNavigate("bus_search");
    } else {
      setDepartureStation(result.title);
      onNavigate("station_search");
    }
    setSearchIntent("default");
  };

  return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.search_row}>
          <View style={styles.search_box}>
            <Image source={ICONS.search} style={styles.search_icon} resizeMode="contain" />
            <TextInput
              style={styles.search_input}
              placeholder={isEndpointSelection ? "정류장 검색" : "정류장·버스 검색"}
              placeholderTextColor="#6C6C6C"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoFocus
            />
          </View>
          <TouchableOpacity
            style={styles.cancel_button}
            onPress={() => {
              setSearchIntent("default");
              onNavigate("search");
            }}
          >
            <Text style={styles.cancel_text}>취소</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll_content} showsVerticalScrollIndicator={false}>
          {!isEndpointSelection && (
            <ResultSection
              title="버스"
              results={filteredBus}
              onItemPress={handleResultPress}
              onAddFavorite={handleAddResultToFavorite}
            />
          )}
          <ResultSection
            title="정류장"
            results={filteredStations}
            onItemPress={handleResultPress}
            onAddFavorite={handleAddResultToFavorite}
          />
        </ScrollView>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

const ResultSection = ({
  title,
  results,
  onItemPress,
  onAddFavorite,
}: {
  title: string;
  results: SearchResult[];
  onItemPress: (result: SearchResult) => void;
  onAddFavorite: (result: SearchResult) => void;
}): ReactElement => {
  return (
    <View style={styles.result_section}>
      <Text style={styles.section_title}>{title}</Text>
      <View style={styles.result_card}>
        {results.map((result, index) => (
          <SwipeableResultRow
            key={result.id}
            onAdd={() => onAddFavorite(result)}
            showDivider={index !== results.length - 1}
          >
            <TouchableOpacity
              style={styles.result_row}
              activeOpacity={0.85}
              onPress={() => onItemPress(result)}
            >
              <View style={styles.result_icon_wrapper}>
                <Image
                  source={result.type === "bus" ? ICONS.bus : ICONS.pin}
                  style={styles.result_icon_image}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.result_texts}>
                <Text style={styles.result_title}>{result.title}</Text>
                <Text style={styles.result_subtitle}>{result.description}</Text>
              </View>
              <Image source={ICONS.searchSecondary} style={styles.result_arrow} resizeMode="contain" />
            </TouchableOpacity>
          </SwipeableResultRow>
        ))}
      </View>
    </View>
  );
};

/**
 * RouteTimelineSection
 * 선택된 route에 따라 vertical timeline을 그리는 컴포넌트
 * 각 station에 지나가는 버스 목록도 표시
 * (상행만 있으므로 direction은 항상 0으로 고정)
 */
const RouteTimelineSection = ({
  routeNm,
  onBack,
  routeStops,
}: {
  routeNm: string;
  onBack: () => void;
  routeStops: RouteStop[];
}): ReactElement => {
  const stationHeight = 60;

  return (
    <View style={styles.route_timeline_container}>
      {/* 헤더: 버스 번호 (상행만 있으므로 방향 선택 제거) */}
      <View style={styles.route_header}>
        <TouchableOpacity onPress={onBack} style={styles.back_button}>
          <Text style={styles.back_text}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.route_title}>{routeNm}</Text>
      </View>

      {/* Vertical Timeline */}
      {routeStops.length > 0 ? (
        <View style={[styles.timeline_wrapper, { minHeight: routeStops.length * stationHeight }]}>
          <View style={[styles.timeline_line, { height: routeStops.length * stationHeight }]} />
          {routeStops.map((item, index) => {
            const buses = getBusesAtStation(item.stationId);
            const y = index * stationHeight;

            return (
              <View key={`${item.stationId}-${item.order}`} style={[styles.station_timeline_item, { top: y }]}>
                {/* Station Dot */}
                <View style={styles.station_dot_wrapper}>
                  <View style={styles.station_dot} />
                </View>

                {/* Station Info */}
                <View style={styles.station_info}>
                  <Text style={styles.station_order_text}>{item.order}</Text>
                  <View style={styles.station_details}>
                    <Text style={styles.station_name_text}>{item.stationName}</Text>
                    {buses.length > 0 && (
                      <View style={styles.bus_tags_wrapper}>
                        {buses.slice(0, 5).map((busNum) => (
                          <View key={busNum} style={styles.bus_tag_timeline}>
                            <Text style={styles.bus_tag_text_timeline}>{busNum}</Text>
                          </View>
                        ))}
                        {buses.length > 5 && (
                          <Text style={styles.more_buses_text}>+{buses.length - 5}</Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty_timeline}>
          <Text style={styles.empty_text}>정류장 정보가 없습니다.</Text>
        </View>
      )}
    </View>
  );
};

const SwipeableResultRow = ({
  children,
  onAdd,
  showDivider,
}: {
  children: ReactElement;
  onAdd: () => void;
  showDivider: boolean;
}): ReactElement => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);

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
   * 오른쪽으로 스와이프하면 왼쪽에 즐겨찾기 추가 버튼이 나타남
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

  const handleAdd = () => {
    animateRow(0);
    onAdd();
  };

  return (
    <View style={styles.result_swipe_container}>
      <TouchableOpacity style={styles.result_add_action} activeOpacity={0.9} onPress={handleAdd}>
        <Image source={ICONS.plus} style={styles.result_add_icon} resizeMode="contain" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.result_swipeable_content,
          showDivider && styles.result_row_divider,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe_area: {
    flex: 1,
    backgroundColor: "#F7F7F6",
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F7F6",
    paddingHorizontal: 24,
  },
  scroll_content: {
    paddingBottom: 140,
    gap: 28,
  },
  status_bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 18,
  },
  status_time: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "Pretendard",
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
  search_row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 12,
  },
  search_box: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBEBEB",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  search_icon: {
    width: 18,
    height: 18,
  },
  search_input: {
    flex: 1,
    fontSize: 16,
    color: "#000000",
    fontFamily: "Pretendard",
    padding: 0,
  },
  cancel_button: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  cancel_text: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    fontFamily: "Pretendard",
  },
  result_section: {
    gap: 12,
  },
  section_title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
  result_card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EC",
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: "hidden",
  },
  result_swipe_container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    position: "relative",
    marginHorizontal: -12,
  },
  result_swipeable_content: {
    backgroundColor: "#FFFFFF",
  },
  result_row_container: {
    width: "100%",
  },
  result_row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 14,
  },
  result_row_divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF3",
  },
  result_icon_wrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  result_icon_image: {
    width: 20,
    height: 20,
    tintColor: "#007AFF",
  },
  result_texts: {
    flex: 1,
  },
  result_title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
    fontFamily: "Pretendard",
  },
  result_subtitle: {
    fontSize: 13,
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
  result_arrow: {
    width: 16,
    height: 16,
    tintColor: "#A4A7B0",
  },
  result_add_action: {
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
  result_add_icon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  route_timeline_container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EC",
    padding: 16,
    marginBottom: 28,
  },
  route_header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  back_button: {
    paddingVertical: 4,
  },
  back_text: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    fontFamily: "Pretendard",
  },
  route_title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "Pretendard",
    flex: 1,
  },
  direction_buttons: {
    flexDirection: "row",
    gap: 8,
  },
  direction_button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#EBEBEB",
  },
  direction_button_active: {
    backgroundColor: "#007AFF",
  },
  direction_text: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
  direction_text_active: {
    color: "#FFFFFF",
  },
  timeline_wrapper: {
    position: "relative",
    paddingLeft: 30,
    minHeight: 100,
  },
  timeline_line: {
    position: "absolute",
    left: 15,
    width: 2,
    backgroundColor: "#EBEBEB",
  },
  station_timeline_item: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    left: 0,
    right: 0,
  },
  station_dot_wrapper: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -6,
    width: 30,
    alignItems: "center",
  },
  station_dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  station_info: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 40,
    flex: 1,
  },
  station_order_text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6C6C6C",
    fontFamily: "Pretendard",
    width: 30,
    marginRight: 8,
  },
  station_details: {
    flex: 1,
  },
  station_name_text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "Pretendard",
    marginBottom: 4,
  },
  bus_tags_wrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  bus_tag_timeline: {
    backgroundColor: "rgba(120, 120, 128, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bus_tag_text_timeline: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
    fontFamily: "Pretendard",
  },
  more_buses_text: {
    fontSize: 12,
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
  empty_timeline: {
    padding: 40,
    alignItems: "center",
  },
  empty_text: {
    fontSize: 14,
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
});

export default SearchingScreen;

