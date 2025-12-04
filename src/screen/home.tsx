import React, { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import {
  addSavedRouteIfNotExists,
  getSavedRoutes,
  removeSavedRoute,
  SavedRouteItem,
  subscribeSavedRoutes,
} from "../store/savedRoutesStore";
import { getRouteSelection, RouteSelection, subscribeRouteSelection } from "../store/routeSelectionStore";
import { setSearchIntent } from "../store/searchIntentStore";
import {
  getBusesAtStation,
  getStationIdByName,
  findStationInRoute,
  canGoFromTo,
  getRouteIdsByRouteNm,
  ROUTES,
  RouteId,
} from "../data";

const COLOR = {
  bg: "#F7F7F6",
  card: "#FFFFFF",
  blue: "#007AFF",
  red: "#F55858",
  grayDark: "#6C6C6C",
  grayLight: "#F8F8F8",
  textPrimary: "#000000",
  chipBorder: "#D8D8D8",
};

type Weekday = "월요일" | "화요일" | "수요일" | "목요일" | "금요일";
type TimeType = "도착시간" | "출발시간";
type TimeSlot = "6:00" | "6:30" | "7:00" | "7:30" | "8:00" | "8:30" | "9:00";
type FastOption = "최단시간" | "최소대기";

const WEEKDAYS: Weekday[] = ["월요일", "화요일", "수요일", "목요일", "금요일"];
const TIME_TYPES: TimeType[] = ["도착시간", "출발시간"];
const TIME_SLOTS: TimeSlot[] = ["6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00"];
const FAST_OPTIONS: FastOption[] = ["최단시간", "최소대기"];

const ICONS = {
  house: require("../../assets/images/home/Home.png"),
  bus: require("../../assets/images/searching/bus.png"),
  arrow: require("../../assets/images/home/화살표.png"),
  bookmark: require("../../assets/images/home/Bookmark.png"),
  marked: require("../../assets/images/home/marked.png"),
};

/**
 * 하단 버스 카드에 표시할 경로 요약 정보 타입
 */
type RouteSummary = {
  from_label: string;
  to_label: string;
  bus_numbers_text: string;
  duration_text: string;
};

/**
 * 정류장당 평균 소요 시간(분)
 * - 실제 실시간 데이터가 없으므로, 정류장 개수에 비례한 대략적인 시간을 계산할 때 사용합니다.
 */
const AVERAGE_MIN_PER_STOP = 4;

type HomeProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const Home = ({ currentScreen, onNavigate }: HomeProps): ReactElement => {
  const [selectedWeekday, setSelectedWeekday] = useState<Weekday>("월요일");
  const [selectedTimeType, setSelectedTimeType] = useState<TimeType>("도착시간");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>("8:30");
  const [selectedFastOption, setSelectedFastOption] = useState<FastOption>("최단시간");
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [lastModifiedFilterId, setLastModifiedFilterId] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteItem[]>(getSavedRoutes());
  const [routeSelection, setRouteSelection] = useState<RouteSelection>(getRouteSelection());

  useEffect(() => {
    const unsubscribe = subscribeSavedRoutes(setSavedRoutes);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeRouteSelection(setRouteSelection);
    return unsubscribe;
  }, []);

  /**
   * 현재 선택된 출발/도착지에 맞는 버스 번호와 소요 시간 계산
   * - 로컬 정적 데이터(routes.json, stationBus.json)를 기반으로 추정합니다.
   * - 출발/도착지가 변경될 때마다 자동으로 재계산됩니다.
   */
  const routeSummary: RouteSummary = useMemo(() => {
    const origin_name = routeSelection.origin.title;
    const dest_name = routeSelection.destination.title;

    // 항상 현재 선택된 출발/도착 이름을 라벨로 사용
    const from_label = origin_name;
    const to_label = dest_name;

    // 기본 표시 값 (데이터를 찾지 못한 경우를 대비한 안전 장치)
    let bus_numbers_text = "3302";
    let duration_text = "32분 소요";

    // 1. 정류장 이름으로 stationId 조회
    const origin_id = getStationIdByName(origin_name);
    const dest_id = getStationIdByName(dest_name);

    if (!origin_id || !dest_id) {
      // 정류장 ID를 찾을 수 없는 경우, 기본 값 유지
      return { from_label, to_label, bus_numbers_text, duration_text };
    }

    // 2. 두 정류장을 지나는 버스 번호 목록 계산 (교집합)
    const origin_buses = getBusesAtStation(origin_id);
    const dest_buses = getBusesAtStation(dest_id);
    const common_buses = origin_buses.filter((bus) => dest_buses.includes(bus));

    if (common_buses.length === 0) {
      // 공통으로 지나는 버스가 없는 경우: 출발 정류장을 지나는 첫 번째 버스를 표시
      if (origin_buses.length > 0) {
        bus_numbers_text = origin_buses[0];
        duration_text = "경로 정보 없음";
      }
      return { from_label, to_label, bus_numbers_text, duration_text };
    }

    // 3. 실제로 갈 수 있는 버스만 필터링 (같은 routeid에서 출발지가 도착지보다 앞에 있어야 함)
    const validBuses = common_buses.filter((bus) => canGoFromTo(bus, origin_id, dest_id));

    if (validBuses.length === 0) {
      // 갈 수 있는 버스가 없는 경우: 공통 버스 중 첫 번째를 표시하되 "환승 필요"로 표시
      bus_numbers_text = common_buses[0];
      duration_text = "환승 필요";
      return { from_label, to_label, bus_numbers_text, duration_text };
    }

    // 4. 갈 수 있는 버스 중 첫 번째를 대표 버스로 사용
    const main_bus = validBuses[0];
    bus_numbers_text = main_bus;

    // 5. 이 버스 노선에서 출발/도착 정류장의 위치 찾기 (실제로 갈 수 있는 routeid 사용)
    // canGoFromTo가 true를 반환했으므로, 해당 routeid를 찾아야 함
    const routeIds = getRouteIdsByRouteNm(main_bus);
    let origin_pos: { routeId: RouteId; order: number } | null = null;
    let dest_pos: { routeId: RouteId; order: number } | null = null;

    for (const routeId of routeIds) {
      const stops = ROUTES[routeId];
      if (!stops) continue;

      const originStop = stops.find((stop) => stop.stationId === origin_id);
      const destStop = stops.find((stop) => stop.stationId === dest_id);

      if (originStop && destStop && originStop.order < destStop.order) {
        origin_pos = { routeId, order: originStop.order };
        dest_pos = { routeId, order: destStop.order };
        break;
      }
    }

    if (!origin_pos || !dest_pos) {
      duration_text = "경로 정보 없음";
      return { from_label, to_label, bus_numbers_text, duration_text };
    }

    // 5. 정류장 순서 차이로 대략적인 소요 시간 계산
    const stop_diff = Math.abs(dest_pos.order - origin_pos.order);
    if (stop_diff === 0) {
      duration_text = "0분 소요";
    } else {
      const minutes = stop_diff * AVERAGE_MIN_PER_STOP;
      duration_text = `약 ${minutes}분 소요`;
    }

    return { from_label, to_label, bus_numbers_text, duration_text };
  }, [routeSelection]);

  // 실제로 갈 수 있는 버스 번호 목록 계산 (bookmark.tsx와 동일한 로직)
  const availableBusesForBookmark = useMemo(() => {
    const origin_name = routeSelection.origin.title;
    const dest_name = routeSelection.destination.title;

    const origin_id = getStationIdByName(origin_name);
    const dest_id = getStationIdByName(dest_name);

    if (!origin_id || !dest_id) {
      return [];
    }

    const origin_buses = getBusesAtStation(origin_id);
    const dest_buses = getBusesAtStation(dest_id);
    const common_buses = origin_buses.filter((bus) => dest_buses.includes(bus));

    // 각 버스가 실제로 출발지에서 도착지로 갈 수 있는지 확인
    // 모든 routeid를 확인하여 실제로 갈 수 있는 버스만 필터링
    const validBuses = common_buses.filter((bus) => {
      return canGoFromTo(bus, origin_id, dest_id);
    });

    return validBuses;
  }, [routeSelection]);

  const busesTextForBookmark = availableBusesForBookmark.length > 0 
    ? availableBusesForBookmark.join(", ") 
    : "";

  const isRouteBookmarked = useMemo(() => {
    if (!busesTextForBookmark) return false;
    
    return savedRoutes.some(
      (route) =>
        route.from === routeSelection.origin.title &&
        route.to === routeSelection.destination.title &&
        route.detail === busesTextForBookmark &&
        route.type === "bus"
    );
  }, [savedRoutes, routeSelection, busesTextForBookmark]);

  const handleBookmarkRoute = async () => {
    if (!busesTextForBookmark) return;

    if (isRouteBookmarked) {
      const existing = savedRoutes.find(
        (route) =>
          route.from === routeSelection.origin.title &&
          route.to === routeSelection.destination.title &&
          route.detail === busesTextForBookmark &&
          route.type === "bus"
      );
      if (existing) {
        await removeSavedRoute(existing.id);
      }
    } else {
      await addSavedRouteIfNotExists({
        from: routeSelection.origin.title,
        to: routeSelection.destination.title,
        detail: busesTextForBookmark,
        type: "bus",
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 출발/도착 카드 + 북마크 버튼 */}
        <View style={styles.routeCardWrapper}>
          <View style={styles.routeCardHeader}>
            <Text style={styles.routeCardTitle}>길찾기</Text>
            <TouchableOpacity style={styles.routeBookmarkButton} activeOpacity={0.85} onPress={handleBookmarkRoute}>
              <Image
                source={isRouteBookmarked ? ICONS.marked : ICONS.bookmark}
                style={styles.routeBookmarkIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <TouchableOpacity
                style={styles.routeTextGroup}
                activeOpacity={0.8}
                onPress={() => {
                  setSearchIntent("select_origin");
                  onNavigate("searching");
                }}
              >
                <Text style={styles.routeLabelBlue}>출발</Text>
                <Text style={styles.routeStationText}>{routeSelection.origin.title}</Text>
              </TouchableOpacity>
              <Image source={ICONS.arrow} style={styles.routeArrow} resizeMode="contain" />
              <TouchableOpacity
                style={[styles.routeTextGroup, styles.routeColumnEnd]}
                activeOpacity={0.8}
                onPress={() => {
                  setSearchIntent("select_destination");
                  onNavigate("searching");
                }}
              >
                <Text style={styles.routeLabelBlue}>도착</Text>
                <Text style={styles.routeStationText}>{routeSelection.destination.title}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <FilterTabs
          selectedWeekday={selectedWeekday}
          selectedTimeType={selectedTimeType}
          selectedTimeSlot={selectedTimeSlot}
          selectedFastOption={selectedFastOption}
          activeFilterId={activeFilterId}
          lastModifiedFilterId={lastModifiedFilterId}
          onWeekdaySelect={(weekday) => {
            setSelectedWeekday(weekday);
            setLastModifiedFilterId("weekday");
          }}
          onTimeTypeSelect={(timeType) => {
            setSelectedTimeType(timeType);
            setLastModifiedFilterId("arrival");
          }}
          onTimeSlotSelect={(timeSlot) => {
            setSelectedTimeSlot(timeSlot);
            setLastModifiedFilterId("time");
          }}
          onFastOptionSelect={(option) => {
            setSelectedFastOption(option);
            setLastModifiedFilterId("fast");
          }}
          onFilterPress={setActiveFilterId}
        />

        {/* 버스 카드 */}
        <View style={styles.busCard}>
          <View style={styles.busRowTop}>
            <View style={styles.busCircle}>
              <Image source={ICONS.bus} style={styles.busIconImage} resizeMode="contain" />
            </View>
            <View style={styles.busBar}>
              <Text style={styles.busNumberText}>{routeSummary.bus_numbers_text}</Text>
            </View>
            <View style={styles.busCircle}>
              <Image source={ICONS.bus} style={styles.busIconImage} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.busRowBottom}>
            <Text style={styles.busLabel}>{routeSummary.from_label}</Text>
            <Text style={styles.busTimeLink}>{routeSummary.duration_text}</Text>
            <Text style={styles.busLabel}>{routeSummary.to_label}</Text>
          </View>
        </View>

        {/* 남는 공간 */}
        <View style={{ flex: 1 }} />

        {/* 하단 탭바 */}
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

type FilterTabsProps = {
  selectedWeekday: Weekday;
  selectedTimeType: TimeType;
  selectedTimeSlot: TimeSlot;
  selectedFastOption: FastOption;
  activeFilterId: string | null;
  lastModifiedFilterId: string | null;
  onWeekdaySelect: (weekday: Weekday) => void;
  onTimeTypeSelect: (timeType: TimeType) => void;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  onFastOptionSelect: (option: FastOption) => void;
  onFilterPress: (filterId: string | null) => void;
};

const FilterTabs = ({
  selectedWeekday,
  selectedTimeType,
  selectedTimeSlot,
  selectedFastOption,
  activeFilterId,
  lastModifiedFilterId,
  onWeekdaySelect,
  onTimeTypeSelect,
  onTimeSlotSelect,
  onFastOptionSelect,
  onFilterPress,
}: FilterTabsProps): ReactElement => {
  const tabs = [
    { id: "weekday", label: selectedWeekday },
    { id: "arrival", label: selectedTimeType },
    { id: "time", label: selectedTimeSlot },
    { id: "fast", label: selectedFastOption },
  ];

  return (
    <View style={styles.filterContainer}>
      <View style={styles.filterWrapper}>
        {tabs.map((tab) => {
          // 가장 최근에 수정된 탭만 활성 스타일 적용
          const isSelected = lastModifiedFilterId === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              activeOpacity={0.8}
              onPress={() => onFilterPress(activeFilterId === tab.id ? null : tab.id)}
            >
              <Text style={[styles.filterTabLabel, isSelected && styles.filterTabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 서브메뉴 영역 */}
      {activeFilterId && (
        <SubMenu
          filterId={activeFilterId}
          selectedWeekday={selectedWeekday}
          selectedTimeType={selectedTimeType}
          selectedTimeSlot={selectedTimeSlot}
          selectedFastOption={selectedFastOption}
          onWeekdaySelect={(weekday) => {
            onWeekdaySelect(weekday);
            onFilterPress(null);
          }}
          onTimeTypeSelect={(timeType) => {
            onTimeTypeSelect(timeType);
            onFilterPress(null);
          }}
          onTimeSlotSelect={(timeSlot) => {
            onTimeSlotSelect(timeSlot);
            onFilterPress(null);
          }}
          onFastOptionSelect={(option) => {
            onFastOptionSelect(option);
            onFilterPress(null);
          }}
          onClose={() => onFilterPress(null)}
        />
      )}

    </View>
  );
};

type SubMenuProps = {
  filterId: string;
  selectedWeekday: Weekday;
  selectedTimeType: TimeType;
  selectedTimeSlot: TimeSlot;
  selectedFastOption: FastOption;
  onWeekdaySelect: (weekday: Weekday) => void;
  onTimeTypeSelect: (timeType: TimeType) => void;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
  onFastOptionSelect: (option: FastOption) => void;
  onClose: () => void;
};

const SubMenu = ({
  filterId,
  selectedWeekday,
  selectedTimeType,
  selectedTimeSlot,
  selectedFastOption,
  onWeekdaySelect,
  onTimeTypeSelect,
  onTimeSlotSelect,
  onFastOptionSelect,
  onClose,
}: SubMenuProps): ReactElement => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // 서브메뉴가 나타날 때 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const getOptions = () => {
    switch (filterId) {
      case "weekday":
        return WEEKDAYS.map((weekday) => ({
          label: weekday,
          value: weekday,
          selected: selectedWeekday === weekday,
          onSelect: () => onWeekdaySelect(weekday),
        }));
      case "arrival":
        return TIME_TYPES.map((timeType) => ({
          label: timeType,
          value: timeType,
          selected: selectedTimeType === timeType,
          onSelect: () => onTimeTypeSelect(timeType),
        }));
      case "time":
        return TIME_SLOTS.map((timeSlot) => ({
          label: timeSlot,
          value: timeSlot,
          selected: selectedTimeSlot === timeSlot,
          onSelect: () => onTimeSlotSelect(timeSlot),
        }));
      case "fast":
        return FAST_OPTIONS.map((option) => ({
          label: option,
          value: option,
          selected: selectedFastOption === option,
          onSelect: () => onFastOptionSelect(option),
        }));
      default:
        return [];
    }
  };

  const options = getOptions();

  return (
    <Animated.View
      style={[
        styles.submenuContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.submenu} onStartShouldSetResponder={() => true}>
        {/* 옵션 리스트 */}
        <ScrollView style={styles.submenuScrollView} showsVerticalScrollIndicator={false}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.submenuItem,
                index === 0 && styles.submenuItemFirst,
                index === options.length - 1 && styles.submenuItemLast,
              ]}
              activeOpacity={0.8}
              onPress={option.onSelect}
            >
              <Text style={styles.submenuItemLabel}>{option.label}</Text>
              {option.selected && <Text style={styles.submenuCheckmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  /* 전체 배경 */
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR.bg,
    paddingHorizontal: 24,
  },

  /* ===== 상단 상태바 ===== */
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLOR.textPrimary,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    width: 18,
    height: 12,
  },
  batteryIcon: {
    width: 27,
    height: 13,
  },

  /* ===== 출발/도착 카드 ===== */
  routeCard: {
    backgroundColor: COLOR.card,
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  routeCardWrapper: {
    marginBottom: 20,
  },
  routeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeCardTitle: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Pretendard",
    color: COLOR.textPrimary,
  },
  routeBookmarkGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeBookmarkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E7E7E7",
    alignItems: "center",
    justifyContent: "center",
  },
  routeBookmarkIcon: {
    width: 16,
    height: 16,
    tintColor: "#0C79FE",
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeArrow: {
    width: 48,
    height: 48,
    tintColor: COLOR.blue,
    marginHorizontal: 24,
  },
  routeTextGroup: {
    flex: 1,
    gap: 6,
  },
  routeColumnEnd: {
    alignItems: 'flex-end',
  },
  routeLabelBlue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.blue,
    marginBottom: 4,
  },
  routeStationText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLOR.textPrimary,
  },
  alignRight: {
    textAlign: 'right',
  },
  filterContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  filterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 28,
    padding: 4,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: COLOR.card,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterTabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#090909',
  },
  filterTabLabelActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  submenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  submenuContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 8,
  },
  submenu: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 32,
    maxHeight: 400,
  },
  submenuScrollView: {
    maxHeight: 300,
  },
  submenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 31,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(128, 128, 128, 0.55)',
    minHeight: 45,
  },
  submenuItemFirst: {
    borderTopWidth: 0,
  },
  submenuItemLast: {
    borderBottomWidth: 0,
  },
  submenuItemLabel: {
    fontSize: 17,
    color: COLOR.textPrimary,
    flex: 1,
  },
  submenuCheckmark: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '600',
  },

  /* ===== 버스 카드 ===== */
  busCard: {
    backgroundColor: COLOR.card,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 24,
  },
  busRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  busCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLOR.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busIconImage: {
    width: 30,
    height: 30,
    tintColor: COLOR.card,
  },
  busBar: {
    flex: 1,
    height: 48,
    marginHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busNumberText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLOR.grayDark,
  },
  busRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  busLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLOR.textPrimary,
    width: 64,
    textAlign: 'center',
  },
  busTimeLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR.blue,
  },
});

export default Home;
