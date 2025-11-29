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
type TimeSlot = "6:00" | "6:30" | "7:00" | "7:30" | "8:00" | "8:30";
type FastOption = "최단시간" | "최소대기";

const WEEKDAYS: Weekday[] = ["월요일", "화요일", "수요일", "목요일", "금요일"];
const TIME_TYPES: TimeType[] = ["도착시간", "출발시간"];
const TIME_SLOTS: TimeSlot[] = ["6:00", "6:30", "7:00", "7:30", "8:00", "8:30"];
const FAST_OPTIONS: FastOption[] = ["최단시간", "최소대기"];

const ICONS = {
  house: require("../../assets/images/home/Home.png"),
  bus: require("../../assets/images/home/Rectangle 19.png"),
  arrow: require("../../assets/images/home/화살표.png"),
  bookmark: require("../../assets/images/home/Bookmark.png"),
  marked: require("../../assets/images/home/marked.png"),
};

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

  const isRouteBookmarked = useMemo(() => {
    return savedRoutes.some(
      (route) =>
        route.from === routeSelection.origin.title &&
        route.to === routeSelection.destination.title &&
        route.detail === "3302, 3301, 500-1" &&
        route.type === "bus"
    );
  }, [savedRoutes, routeSelection]);

  const handleBookmarkRoute = () => {
    if (isRouteBookmarked) {
      const existing = savedRoutes.find(
        (route) =>
          route.from === routeSelection.origin.title &&
          route.to === routeSelection.destination.title &&
          route.detail === "3302, 3301, 500-1" &&
          route.type === "bus"
      );
      if (existing) {
        removeSavedRoute(existing.id);
      }
    } else {
      addSavedRouteIfNotExists({
        from: routeSelection.origin.title,
        to: routeSelection.destination.title,
        detail: "3302, 3301, 500-1",
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
              <Image source={ICONS.house} style={styles.busIconImage} resizeMode="contain" />
            </View>
            <View style={styles.busBar}>
              <Text style={styles.busNumberText}>3302</Text>
            </View>
            <View style={styles.busCircle}>
              <Image source={ICONS.bus} style={styles.busIconImage} resizeMode="contain" />
            </View>
          </View>
          <View style={styles.busRowBottom}>
            <Text style={styles.busLabel}>집</Text>
            <Text style={styles.busTimeLink}>32분 소요</Text>
            <Text style={styles.busLabel}>양재역</Text>
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
