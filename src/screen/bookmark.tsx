import React, { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, PanResponder, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import { getSavedRoutes, removeSavedRoute, SavedRouteItem, subscribeSavedRoutes } from "../store/savedRoutesStore";
import { FavoriteItem, getFavorites, removeFavorite, subscribeFavorites } from "../store/favoriteStore";
import { setSearchIntent } from "../store/searchIntentStore";
import { setBusSearchNumber } from "../store/busSearchStore";
import { setDepartureStation } from "../store/stationSearchStore";
import { setRouteLocation } from "../store/routeSelectionStore";
import { getStationIdByName, getBusesAtStation, canGoFromTo } from "../data";

const ICONS = {
  cellular: require("../../assets/images/bookmark/Cellular Connection.png"),
  wifi: require("../../assets/images/bookmark/Wifi.png"),
  battery: require("../../assets/images/bookmark/Battery.png"),
  bus: require("../../assets/images/bookmark/Icon.png"),
  pin: require("../../assets/images/bookmark/Map pin.png"),
  direction: require("../../assets/images/bookmark/direction.png"),
  bin: require("../../assets/images/bookmark/bin.png"),
};

type BookmarkProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

/**
 * BookmarkScreen
 * 즐겨찾기 화면을 Figma 시안과 동일하게 구성한다.
 */
const DELETE_ACTION_WIDTH = 78;

const BookmarkScreen = ({ currentScreen, onNavigate }: BookmarkProps): ReactElement => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>(getFavorites());
  const [isEditing, setIsEditing] = useState(false);
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteItem[]>(getSavedRoutes());

  useEffect(() => {
    const unsubscribe = subscribeSavedRoutes(setSavedRoutes);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeFavorites(setFavoriteItems);
    return unsubscribe;
  }, []);

  const handleDeleteFavorite = async (id: string | number) => {
    try {
      await removeFavorite(id);
    } catch (error) {
      console.error("즐겨찾기 삭제 중 오류가 발생했습니다.", error);
    }
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  const handleFavoritePress = (item: FavoriteItem) => {
    if (isEditing) {
      return;
    }
    setSearchIntent("default");
    if (item.type === "bus") {
      setBusSearchNumber(item.label);
      onNavigate("bus_search");
    } else {
      setDepartureStation(item.label);
      onNavigate("station_search");
    }
  };

  const handleDeleteSavedRoute = async (id: string | number) => {
    try {
      await removeSavedRoute(id);
    } catch (error) {
      console.error("저장된 경로 삭제 중 오류가 발생했습니다.", error);
    }
  };

  /**
   * 저장된 경로를 선택했을 때 호출되는 함수
   * home.tsx에서 해당 경로가 표시되도록 routeSelectionStore를 업데이트하고 home 화면으로 이동한다.
   */
  const handleSavedRoutePress = (route: SavedRouteItem) => {
    if (isEditing) {
      return;
    }
    // routeSelectionStore에 출발지와 도착지 설정
    setRouteLocation("origin", { title: route.from });
    setRouteLocation("destination", { title: route.to });
    // home 화면으로 이동
    setSearchIntent("default");
    onNavigate("home");
  };

  	return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll_content} showsVerticalScrollIndicator={false}>
          <HeaderSection isEditing={isEditing} onEditToggle={toggleEditMode} />
          <FavoriteCard
            items={favoriteItems}
            isEditing={isEditing}
            onDeleteFavorite={handleDeleteFavorite}
            onSelectFavorite={handleFavoritePress}
          />
          <Text style={styles.section_title}>저장된 경로</Text>
          <SavedRouteCard 
            routes={savedRoutes} 
            onDeleteRoute={handleDeleteSavedRoute}
            onSelectRoute={handleSavedRoutePress}
            isEditing={isEditing}
          />
        </ScrollView>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
                								</View>
    </SafeAreaView>
  );
};


/**
 * HeaderSection
 * "즐겨찾기" 타이틀과 편집 버튼을 렌더링한다.
 */
type HeaderSectionProps = {
  isEditing: boolean;
  onEditToggle: () => void;
};

const HeaderSection = ({ isEditing, onEditToggle }: HeaderSectionProps): ReactElement => {
  return (
    <View style={styles.header_section}>
      <View style={styles.header_row}>
        <Text style={styles.header_title}>즐겨찾기</Text>
        <TouchableOpacity style={styles.edit_text_button} activeOpacity={0.8} onPress={onEditToggle}>
          <Text style={[styles.edit_text_label, isEditing && styles.edit_text_label_active]}>
            {isEditing ? "완료" : "편집"}
          </Text>
        </TouchableOpacity>
              							</View>
      <View style={styles.header_sub_row}>
        <Text style={styles.header_subtitle}>버스· 정류장</Text>
            						</View>
          					</View>
  );
};

/**
 * FavoriteCard
 * 즐겨찾는 버스/정류장을 리스트로 보여준다.
 */
type FavoriteCardProps = {
  items: FavoriteItem[];
  isEditing: boolean;
  onDeleteFavorite: (id: string | number) => void;
  onSelectFavorite: (item: FavoriteItem) => void;
};

const FavoriteCard = ({ items, isEditing, onDeleteFavorite, onSelectFavorite }: FavoriteCardProps): ReactElement => {
  return (
    <View style={styles.favorite_card}>
      {items.map((item, index) => (
        <FavoriteRow
          key={item.id}
          item={item}
          showDivider={index !== items.length - 1}
          isEditing={isEditing}
          onDeleteFavorite={onDeleteFavorite}
          onPress={() => onSelectFavorite(item)}
        />
      ))}
            						</View>
  );
};

type FavoriteRowProps = {
  item: FavoriteItem;
  showDivider: boolean;
  isEditing: boolean;
  onDeleteFavorite: (id: string | number) => void;
  onPress: () => void;
};

/**
 * FavoriteRow
 * 즐겨찾기 카드 안의 단일 행.
 */
const FavoriteRow = ({
  item,
  showDivider,
  isEditing,
  onDeleteFavorite,
  onPress,
}: FavoriteRowProps): ReactElement => {
  const iconSource = item.type === "bus" ? ICONS.bus : ICONS.pin;
  const circleStyle = item.type === "bus" ? styles.bus_circle : styles.pin_circle;

  return (
    <SwipeableFavoriteRow showDivider={showDivider} onDelete={() => onDeleteFavorite(item.id)}>
      <TouchableOpacity
        style={styles.favorite_row_content}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isEditing}
      >
        {isEditing && (
          <TouchableOpacity style={styles.inline_delete_button} activeOpacity={0.85} onPress={() => onDeleteFavorite(item.id)}>
            <Text style={styles.inline_delete_text}>-</Text>
          </TouchableOpacity>
        )}
        <View style={[styles.favorite_icon_circle, circleStyle]}>
          <Image source={iconSource} style={styles.row_icon_image} resizeMode="contain" />
            						</View>
        <Text style={styles.favorite_label}>{item.label}</Text>
      </TouchableOpacity>
    </SwipeableFavoriteRow>
  );
};

type SwipeableFavoriteRowProps = {
  children: ReactElement;
  showDivider?: boolean;
  onDelete: () => void;
};

const SwipeableFavoriteRow = ({ children, showDivider, onDelete }: SwipeableFavoriteRowProps): ReactElement => {
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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        let translation = gestureState.dx;
        if (isOpenRef.current) {
          translation -= DELETE_ACTION_WIDTH;
        }
        const clamped = Math.min(0, Math.max(-DELETE_ACTION_WIDTH, translation));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gestureState) => {
        let translation = gestureState.dx;
        if (isOpenRef.current) {
          translation -= DELETE_ACTION_WIDTH;
        }
        const shouldOpen = translation < -DELETE_ACTION_WIDTH / 2 || gestureState.vx < -0.5;
        animateRow(shouldOpen ? -DELETE_ACTION_WIDTH : 0);
      },
      onPanResponderTerminate: () => {
        animateRow(0);
      },
    })
  ).current;

  const handleDelete = () => {
    animateRow(0);
    onDelete();
  };

  return (
    <View style={styles.swipe_row_container}>
      <TouchableOpacity style={styles.delete_action} activeOpacity={0.9} onPress={handleDelete}>
        <Image source={ICONS.bin} style={styles.delete_action_icon} resizeMode="contain" />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.swipeable_content,
          showDivider && styles.row_divider,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
            						</View>
  );
};

/**
 * SavedRouteCard
 * 저장된 경로 리스트 카드.
 */
type SavedRouteCardProps = {
  routes: SavedRouteItem[];
  onDeleteRoute: (id: string | number) => void;
  onSelectRoute: (route: SavedRouteItem) => void;
  isEditing: boolean;
};

const SavedRouteCard = ({ routes, onDeleteRoute, onSelectRoute, isEditing }: SavedRouteCardProps): ReactElement => {
  return (
    <View style={styles.saved_card}>
      {routes.map((route, index) => (
        <SavedRouteRow
          key={route.id}
          route={route}
          showDivider={index !== routes.length - 1}
          onDelete={() => onDeleteRoute(route.id)}
          onPress={() => onSelectRoute(route)}
          isEditing={isEditing}
        />
      ))}
                  									</View>
  );
};

type SavedRouteRowProps = {
  route: SavedRouteItem;
  showDivider: boolean;
  onDelete: () => void;
  onPress: () => void;
  isEditing: boolean;
};

/**
 * SavedRouteRow
 * 저장된 경로 카드 안의 행.
 * 클릭 시 home.tsx에서 해당 경로가 표시되도록 한다.
 * 출발지와 도착지를 모두 지나는 실제 버스 번호만 표시한다.
 */
const SavedRouteRow = ({ route, showDivider, onDelete, onPress, isEditing }: SavedRouteRowProps): ReactElement => {
  // 출발지와 도착지를 모두 지나는 실제 버스 번호 목록 계산
  // 같은 노선(routeid)에서 출발지가 도착지보다 앞에 있어야 갈 수 있음
  const availableBuses = useMemo(() => {
    // 1. 정류장 이름으로 stationId 조회
    const origin_id = getStationIdByName(route.from);
    const dest_id = getStationIdByName(route.to);

    if (!origin_id || !dest_id) {
      // 정류장 ID를 찾을 수 없는 경우 빈 배열 반환
      return [];
    }

    // 2. 두 정류장을 지나는 버스 번호 목록 계산 (교집합)
    const origin_buses = getBusesAtStation(origin_id);
    const dest_buses = getBusesAtStation(dest_id);
    const common_buses = origin_buses.filter((bus) => dest_buses.includes(bus));

    // 3. 각 버스가 실제로 출발지에서 도착지로 갈 수 있는지 확인
    // (같은 routeid에서 출발지가 도착지보다 앞에 있어야 함)
    // 모든 routeid를 확인하여 실제로 갈 수 있는 버스만 필터링
    const validBuses = common_buses.filter((bus) => {
      return canGoFromTo(bus, origin_id, dest_id);
    });

    return validBuses;
  }, [route.from, route.to]);

  // 버스 번호를 쉼표로 구분한 문자열로 변환
  const busesText = availableBuses.length > 0 ? availableBuses.join(", ") : "경로 정보 없음";

  return (
    <SwipeableFavoriteRow showDivider={showDivider} onDelete={onDelete}>
      <TouchableOpacity
        style={styles.saved_row}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isEditing}
      >
        <View style={styles.saved_icon_circle}>
          <Image source={ICONS.direction} style={[styles.row_icon_image, styles.saved_direction_icon]} resizeMode="contain" />
        </View>
        <View style={styles.saved_text_block}>
          <Text style={styles.saved_title}>
            {route.from} → {route.to}
          </Text>
          <Text style={styles.saved_detail}>{busesText}</Text>
        </View>
      </TouchableOpacity>
    </SwipeableFavoriteRow>
  );
};

const COLOR = {
  bg: "#F7F7F6",
  card: "#FFFFFF",
  border: "#EBEBEB",
  blue: "#007AFF",
  blueLight: "#EBEBEB",
  grayText: "#868782",
  grayIconBg: "#EBEBEB",
  textPrimary: "#000000",
};

const styles = StyleSheet.create({
  safe_area: {
    flex: 1,
    backgroundColor: COLOR.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR.bg,
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
    marginBottom: 28,
  },
  time_text: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    fontFamily: "Pretendard",
  },
  status_icons: {
    		flexDirection: "row",
    		alignItems: "center",
    gap: 6,
  },
  status_icon_small: {
    width: 18,
    height: 12,
  },
  status_icon_large: {
    width: 27,
    height: 13,
  },
  header_section: {
    marginBottom: 20,
  },
  header_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  header_sub_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header_title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLOR.textPrimary,
    fontFamily: "Pretendard",
  },
  header_subtitle: {
    fontSize: 15,
    color: COLOR.grayText,
    fontFamily: "Pretendard",
  },
  edit_text_button: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  edit_text_label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6C6C6C",
    fontFamily: "Pretendard",
  },
  edit_text_label_active: {
    color: COLOR.blue,
  },
  favorite_card: {
    backgroundColor: COLOR.card,
    borderRadius: 20,
    paddingVertical: 6,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLOR.border,
  },
  swipe_row_container: {
    width: "100%",
    backgroundColor: COLOR.card,
    position: "relative",
  },
  swipeable_content: {
    backgroundColor: COLOR.card,
  },
  delete_action: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_ACTION_WIDTH,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  delete_action_icon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  favorite_row_content: {
    		flexDirection: "row",
    		alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  favorite_icon_circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    		justifyContent: "center",
    marginRight: 16,
  },
  bus_circle: {
    backgroundColor: COLOR.blueLight,
  },
  pin_circle: {
    backgroundColor: "#EBEBEB",
  },
  row_icon_image: {
    width: 24,
    height: 24,
    tintColor: COLOR.blue,
  },
  favorite_label: {
    fontSize: 18,
    		fontWeight: "600",
    color: COLOR.textPrimary,
    fontFamily: "Pretendard",
  },
  inline_delete_button: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inline_delete_text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
    fontFamily: "Pretendard",
  },
  row_divider: {
    borderBottomColor: COLOR.border,
    borderBottomWidth: 1,
  },
  section_title: {
    fontSize: 15,
    		fontWeight: "600",
    color: COLOR.grayText,
    marginBottom: 14,
    fontFamily: "Pretendard",
  },
  saved_card: {
    backgroundColor: COLOR.card,
    borderRadius: 20,
    paddingVertical: 6,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLOR.border,
  },
  saved_row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  saved_icon_circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    backgroundColor: "#EBEBEB",
  },
  saved_direction_icon: {
    width: 24,
    height: 24,
    tintColor: "#0C79FE",
  },
  saved_text_block: {
    flex: 1,
  },
  saved_title: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.textPrimary,
    marginBottom: 4,
    fontFamily: "Pretendard",
  },
  saved_detail: {
    fontSize: 13,
    color: COLOR.grayText,
    fontFamily: "Pretendard",
  },
});

export default BookmarkScreen;