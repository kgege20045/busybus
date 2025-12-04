import React, { ReactElement, useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import {
  getBusSearchState,
  setBusSearchNumber,
  subscribeBusSearch,
} from "../store/busSearchStore";
import { getRouteStops, RouteStop, getRouteIdsByRouteNm } from "../data";
import { predictSeat, PredictSeatResponse } from "../api/bus";
import {
  addFavorite,
  FavoriteItem,
  getFavorites,
  removeFavorite,
  subscribeFavorites,
} from "../store/favoriteStore";
import { fetchLiveBus } from "../api/liveBus"; // 🔥 실시간 API 추가

type BusSearchProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const ICONS = {
  reload: require("../../assets/images/station_search/Examples/reload.png"),
  directionsBus: require("../../assets/images/bus_search/directions_bus.png"),
  bookmark: require("../../assets/images/bus_search/Bookmark.png"),
  marked: require("../../assets/images/home/marked.png"),
};

type TimeSlot = "6:00" | "6:30" | "7:00" | "7:30" | "8:00" | "8:30" | "9:00";

const TIME_TABS: Array<{ id: TimeSlot; label: string }> = [
  { id: "6:00", label: "6:00" },
  { id: "6:30", label: "6:30" },
  { id: "7:00", label: "7:00" },
  { id: "7:30", label: "7:30" },
  { id: "8:00", label: "8:00" },
  { id: "8:30", label: "8:30" },
  { id: "9:00", label: "9:00" },
];

const TIMELINE_LINE_WIDTH = 5;
const TIMELINE_DOT_SIZE = 16;
const TIMELINE_LINE_OFFSET = 22;
const TIMELINE_TEXT_SPACING = 12;
const TIMELINE_TEXT_OFFSET =
  TIMELINE_LINE_OFFSET + TIMELINE_DOT_SIZE / 2 + TIMELINE_TEXT_SPACING;

/** 실시간 한 정류장 응답 타입 */
type LiveBusPerStation = {
  stationId: string;
  staOrder: number;
  raw: any; // locationNo1, remainSeatCnt1, vehId1 ...
};

/** 여러 정류장 응답을 차량(버스) 기준으로 합친 후 구조 */
type MergedBus = {
  vehId: string;
  locationNo: number;
  remainSeat: number | null;
  index: number | null; // routeStops 상에서 몇 번째 정류장에 있는지 (0-based)
};

/**
 * 잔여 좌석 수에 따라 색상을 반환한다.
 */
const getSeatColor = (seats: number): string => {
  if (seats >= 35) return "#4680FF";
  if (seats >= 25) return "#00D578";
  if (seats >= 10) return "#FBBF4C";
  return "#F55858";
};

const COLOR = {
  bg: "#F7F7F6",
  card: "#FFFFFF",
  blue: "#007AFF",
  red: "#F55858",
  blueLight: "#007AFF",
  grayDark: "#868782",
  grayLight: "#EBEBEB",
  textPrimary: "#000000",
  textSecondary: "#1E1E1E",
  border: "rgba(84, 84, 86, 0.34)",
  chipBg: "rgba(120, 120, 128, 0.12)",
  sliderLine: "#EBEBEB",
};

/**
 * BusSearchPredictionScreen
 * - 예측 좌석 + 실시간 버스 아이콘(점 위에 겹치기)
 * - 새로고침 버튼은 "실시간 버스 위치만" 갱신
 */
const BusSearchPredictionScreen = ({
  currentScreen,
  onNavigate,
}: BusSearchProps): ReactElement => {
  const initialBusNumber = getBusSearchState().busNumber;
  const [busNumber, setBusNumber] = useState(initialBusNumber);
  const [selectedTime, setSelectedTime] = useState<TimeSlot>("6:30");
  const [selectedRoute, setSelectedRoute] = useState<string>(
    initialBusNumber || "3302"
  );
  const direction: 0 = 0;

  // 선택된 노선의 정류장 목록
  const routeStops = useMemo(() => {
    return getRouteStops(selectedRoute, 0);
  }, [selectedRoute]);

  // ===== 예측 좌석 상태 =====
  const [predictionData, setPredictionData] = useState<Map<number, number>>(
    new Map()
  );
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);

  // ===== 실시간 상태 =====
  const [realtimeData, setRealtimeData] = useState<LiveBusPerStation[]>([]);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState(false);

  // ===== 즐겨찾기 상태 =====
  const [favoriteItems, setFavoriteItems] =
    useState<FavoriteItem[]>(getFavorites());

  const is_current_bus_favorited = useMemo(() => {
    if (!busNumber) return false;
    return favoriteItems.some(
      (item) => item.type === "bus" && item.label === busNumber
    );
  }, [favoriteItems, busNumber]);

  /**
   * 시간 슬롯 → API 인덱스(0~6)
   */
  const convertTimeSlotToIndex = (timeSlot: TimeSlot): number => {
    const timeSlots: TimeSlot[] = [
      "6:00",
      "6:30",
      "7:00",
      "7:30",
      "8:00",
      "8:30",
      "9:00",
    ];
    return timeSlots.indexOf(timeSlot);
  };

  /**
   * 예측 좌석 데이터 조회
   */
  const fetchPredictionData = async () => {
    if (!selectedRoute) return;

    setIsLoadingPrediction(true);
    try {
      const routeIds = getRouteIdsByRouteNm(selectedRoute);
      if (routeIds.length === 0) {
        console.warn(
          `버스 번호 ${selectedRoute}에 해당하는 routeid를 찾을 수 없습니다.`
        );
        setPredictionData(new Map());
        return;
      }

      const selectedRouteId = routeIds[0];
      const routeidNum = parseInt(selectedRouteId, 10);
      if (isNaN(routeidNum)) {
        console.warn(
          `routeid를 숫자로 변환할 수 없습니다: ${selectedRouteId}`
        );
        setPredictionData(new Map());
        return;
      }

      const select_time = convertTimeSlotToIndex(selectedTime);
      if (select_time < 0) {
        console.warn(
          `시간 슬롯을 인덱스로 변환할 수 없습니다: ${selectedTime}`
        );
        setPredictionData(new Map());
        return;
      }

      const response: PredictSeatResponse = await predictSeat(
        routeidNum,
        select_time
      );

      if (response.predictions && response.predictions.length > 0) {
        const predictionMap = new Map<number, number>();
        response.predictions.forEach((pred) => {
          predictionMap.set(Number(pred.station_num), pred.remainseat_pred);
        });
        setPredictionData(predictionMap);
      } else {
        console.warn(
          "예측 좌석 데이터 조회 실패:",
          response.error || "예측 데이터가 없습니다."
        );
        setPredictionData(new Map());
      }
    } catch (error) {
      console.error("예측 좌석 데이터 조회 실패:", error);
      setPredictionData(new Map());
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  /**
   * 실시간 버스 데이터 조회
   * - 새로고침 버튼 / 노선 변경 시 사용
   */
  const fetchRealtimeData = async () => {
    if (!selectedRoute) return;
    if (!routeStops || routeStops.length === 0) {
      setRealtimeData([]);
      return;
    }

    setIsLoadingRealtime(true);
    try {
      const routeIds = getRouteIdsByRouteNm(selectedRoute);
      if (routeIds.length === 0) {
        console.warn(
          `버스 번호 ${selectedRoute}에 해당하는 routeId를 찾을 수 없습니다.`
        );
        setRealtimeData([]);
        return;
      }
      const routeId = routeIds[0];

      const stationsPayload = routeStops.map((stop, idx) => ({
        stationId: stop.stationId,
        staOrder: idx + 1, // 조회 순서
      }));

      const response = await fetchLiveBus(routeId, stationsPayload);

      console.log("🔥 [BusSearch] /bus/realtime 서버 응답:", response);

      setRealtimeData(response.results || []);
    } catch (error) {
      console.error("실시간 버스 데이터 조회 실패:", error);
      setRealtimeData([]);
    } finally {
      setIsLoadingRealtime(false);
    }
  };

  /**
   * 새로고침 버튼: "실시간만" 갱신
   */
  const handleRefresh = async () => {
    console.log("🔄 [BusSearch] handleRefresh 호출됨");
    await fetchRealtimeData();
  };

  // 예측은 시간/노선 바뀔 때마다 자동 갱신
  useEffect(() => {
    fetchPredictionData();
  }, [selectedRoute, selectedTime]);

  // 실시간은 노선/정류장 목록 바뀔 때 기본 1번 자동 조회
  useEffect(() => {
    if (routeStops.length > 0) {
      fetchRealtimeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute, routeStops.length]);

  // busSearchStore 구독
  useEffect(() => {
    const unsubscribe = subscribeBusSearch((state) => {
      setBusNumber(state.busNumber);
    });
    return unsubscribe;
  }, []);

  // 즐겨찾기 변경 구독
  useEffect(() => {
    const unsubscribe = subscribeFavorites((items) => {
      setFavoriteItems(items);
    });
    return unsubscribe;
  }, []);

  // 버스 번호 변경 시 노선 동기화
  useEffect(() => {
    if (busNumber) {
      setSelectedRoute(busNumber);
    }
  }, [busNumber]);

  const handleBusNumberChange = (value: string) => {
    setBusNumber(value);
    setBusSearchNumber(value);
  };

  /**
   * 즐겨찾기 토글
   */
  const handleToggleFavoriteBus = async () => {
    if (!busNumber) return;

    try {
      if (is_current_bus_favorited) {
        const existing = favoriteItems.find(
          (item) => item.type === "bus" && item.label === busNumber
        );
        if (existing) {
          await removeFavorite(existing.id);
        }
      } else {
        await addFavorite({
          label: busNumber,
          type: "bus",
        });
      }
    } catch (error) {
      console.error("버스 즐겨찾기 토글 중 오류가 발생했습니다.", error);
    }
  };

  /**
   * realtimeData + routeStops → 차량 기준 merge
   * - vehId 별로 하나만 남김
   * - locationNo(남은 정류장 수)가 더 작은 쪽 사용 (더 앞에 온 버스)
   * - locationNo → routeStops index 로 변환
   */
  const mergedBuses: MergedBus[] = useMemo(() => {
    if (!realtimeData || routeStops.length === 0) return [];

    const vehicleMap = new Map<string, MergedBus>();

    realtimeData.forEach((st) => {
      const raw = st.raw;
      if (!raw) return;

      ["1", "2"].forEach((n) => {
        const vehId = raw[`vehId${n}`];
        const locationNoRaw = raw[`locationNo${n}`];
        const remainSeatRaw = raw[`remainSeatCnt${n}`];

        if (!vehId || locationNoRaw == null || locationNoRaw === "") return;

        const locationNo = Number(locationNoRaw);
        if (Number.isNaN(locationNo)) return;

        const remainSeat =
          remainSeatRaw == null || remainSeatRaw === ""
            ? null
            : Number(remainSeatRaw);

        const existing = vehicleMap.get(vehId);
        if (!existing || existing.locationNo > locationNo) {
          vehicleMap.set(vehId, {
            vehId,
            locationNo,
            remainSeat,
            index: null,
          });
        }
      });
    });

    const totalStops = routeStops.length;

    const busesWithIndex: MergedBus[] = Array.from(vehicleMap.values())
      .map((bus) => {
        // ex) 전체 20개 정류장, locationNo=0 → 마지막 정류장(index=19)
        const idx = totalStops - 1 - bus.locationNo;
        const index =
          idx >= 0 && idx < totalStops ? idx : null;
        return { ...bus, index };
      })
      .filter((b) => b.index !== null)
      .sort((a, b) => (a.index! - b.index!));

    return busesWithIndex;
  }, [realtimeData, routeStops]);

  return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.content_wrapper}>
          <View style={styles.header_row}>
            <BusNumberField
              busNumber={busNumber}
              onBusNumberChange={handleBusNumberChange}
            />
            <View style={styles.header_actions}>
              <TouchableOpacity
                style={styles.bookmark_button}
                activeOpacity={0.7}
                onPress={handleToggleFavoriteBus}
                disabled={!busNumber}
              >
                <Image
                  source={is_current_bus_favorited ? ICONS.marked : ICONS.bookmark}
                  style={styles.bookmark_icon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reload_button}
                activeOpacity={0.7}
                onPress={handleRefresh}
                disabled={isLoadingRealtime}
              >
                <Image
                  source={ICONS.reload}
                  style={styles.reload_icon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
          <TimeFilterTabs
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
          <BusSeatsVisualization
            routeStops={routeStops}
            predictionData={predictionData}
            mergedBuses={mergedBuses} // 🔥 실시간 버스 오버레이
          />
        </View>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

/**
 * BusNumberField
 */
const BusNumberField = ({
  busNumber,
  onBusNumberChange,
}: {
  busNumber: string;
  onBusNumberChange: (value: string) => void;
}): ReactElement => {
  return (
    <View style={styles.bus_number_field}>
      <View style={styles.bus_number_content}>
        <View style={styles.bus_number_title_container}>
          <Text style={styles.bus_number_title}>버스 번호</Text>
          {busNumber && (
            <>
              <View style={styles.bus_number_title_spacer} />
              <Text style={styles.bus_number_value}>{busNumber}</Text>
            </>
          )}
        </View>
        <TextInput
          style={styles.bus_number_input}
          value={busNumber}
          onChangeText={onBusNumberChange}
          placeholder="버스 번호 입력"
          placeholderTextColor={COLOR.grayDark}
        />
      </View>
    </View>
  );
};

/**
 * TimeFilterTabs
 */
const TimeFilterTabs = ({
  selectedTime,
  onTimeSelect,
}: {
  selectedTime: TimeSlot;
  onTimeSelect: (time: TimeSlot) => void;
}): ReactElement => {
  return (
    <View style={styles.time_filter_wrapper}>
      <View style={styles.time_filter_container}>
        {TIME_TABS.map((tab) => {
          const isActive = tab.id === selectedTime;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.time_tab, isActive && styles.time_tab_active]}
              activeOpacity={0.8}
              onPress={() => onTimeSelect(tab.id)}
            >
              <Text
                style={[
                  styles.time_tab_label,
                  isActive && styles.time_tab_label_active,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/**
 * BusSeatsVisualization
 * - 예측 그래프 + y축 좌석 텍스트(기존 그대로)
 * - 타임라인 dot + 정류장 이름(기존 그대로)
 * - dot 위에 "실시간 버스 아이콘 + 잔여석" 오버레이
 */
const BusSeatsVisualization = ({
  routeStops,
  predictionData,
  mergedBuses,
}: {
  routeStops: RouteStop[];
  predictionData: Map<number, number>;
  mergedBuses: MergedBus[];
}): ReactElement => {
  const stationHeight = 48;
  const MAX_WIDTH = 70;
  const totalHeight = routeStops.length * stationHeight;

  const maxSeats =
    predictionData.size > 0
      ? Math.max(...Array.from(predictionData.values()), 45)
      : 45;

  const points: Array<{ x: number; y: number; seats: number }> = routeStops.map(
    (stop, index) => {
      const y = index * stationHeight + stationHeight / 2;

      let seats: number;
      const predictedSeats = predictionData.get(stop.order);
      if (predictedSeats !== undefined) {
        seats = predictedSeats;
      } else {
        seats = Math.max(
          0,
          Math.floor(
            maxSeats *
              (1 - (index / Math.max(routeStops.length - 1, 1)) * 0.8)
          )
        );
      }

      return {
        x: 0,
        y,
        seats,
      };
    }
  );

  const actualMaxSeats = Math.max(...points.map((p) => p.seats), maxSeats);
  const actualMinSeats = Math.min(...points.map((p) => p.seats), 0);
  const seatRange = actualMaxSeats - actualMinSeats || 1;

  const normalizedPoints = points.map((point) => {
    const normalizedSeats = (point.seats - actualMinSeats) / seatRange;
    const x = normalizedSeats * MAX_WIDTH;
    return { ...point, x };
  });

  const createAreaPath = (): string => {
    if (normalizedPoints.length === 0) return "";

    const firstY = normalizedPoints[0].y;
    const lastY = normalizedPoints[normalizedPoints.length - 1].y;

    let path = `M 0 ${firstY}`;
    path += ` L ${normalizedPoints[0].x} ${normalizedPoints[0].y}`;
    for (let i = 1; i < normalizedPoints.length; i++) {
      path += ` L ${normalizedPoints[i].x} ${normalizedPoints[i].y}`;
    }
    path += ` L 0 ${lastY}`;
    path += ` L 0 ${firstY}`;
    path += ` Z`;

    return path;
  };

  const areaPath = createAreaPath();

  const gradientStops = (() => {
    if (normalizedPoints.length === 0) {
      return [
        { offset: "0%", color: getSeatColor(0) },
        { offset: "100%", color: getSeatColor(0) },
      ];
    }

    const stops = normalizedPoints.map((point) => ({
      offset: `${((point.y / totalHeight) * 100).toFixed(2)}%`,
      color: getSeatColor(point.seats),
    }));

    return [
      { offset: "0%", color: getSeatColor(normalizedPoints[0].seats) },
      ...stops,
      {
        offset: "100%",
        color: getSeatColor(
          normalizedPoints[normalizedPoints.length - 1].seats
        ),
      },
    ];
  })();

  if (routeStops.length === 0) {
    return (
      <View style={styles.visualization_container}>
        <View style={styles.visualization_card}>
          <Text style={styles.empty_text}>정류장 정보가 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.visualization_container}>
      <View style={styles.visualization_card}>
        <ScrollView
          style={styles.card_scroll_view}
          contentContainerStyle={[
            styles.card_scroll_content,
            { minHeight: totalHeight + 40 },
          ]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.main_row}>
            {/* [0] 예측 그래프 */}
            <View
              style={[
                styles.seats_area_container,
                { height: totalHeight, width: MAX_WIDTH },
              ]}
            >
              <Svg
                width={MAX_WIDTH}
                height={totalHeight}
                style={styles.svg_container}
              >
                <Defs>
                  <LinearGradient
                    id="congestionGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    {gradientStops.map((stop, index) => (
                      <Stop
                        key={index}
                        offset={stop.offset}
                        stopColor={stop.color}
                      />
                    ))}
                  </LinearGradient>
                </Defs>
                <Path
                  d={areaPath}
                  fill="url(#congestionGradient)"
                  fillOpacity={0.5}
                  stroke="none"
                />
              </Svg>
            </View>

            {/* [1] y축 좌석 텍스트 */}
            <View
              style={[styles.y_axis_label_container, { height: totalHeight }]}
            >
              {normalizedPoints.map((point, index) => {
                const y = point.y;
                return (
                  <Text
                    key={`${routeStops[index].stationId}-${index}`}
                    style={[
                      styles.y_axis_label,
                      {
                        position: "absolute",
                        top: y - 12,
                      },
                    ]}
                  >
                    {point.seats}석
                  </Text>
                );
              })}
            </View>

            {/* [2] 타임라인 + 정류장 + 실시간 버스 */}
            <View
              style={[styles.timeline_container, { height: totalHeight }]}
            >
              <View style={styles.timeline_line} />

              {normalizedPoints.map((point, index) => {
                const stop = routeStops[index];
                const color = getSeatColor(point.seats);
                const y = point.y;

                const busesHere = mergedBuses.filter(
                  (b) => b.index === index
                );

                return (
                  <View
                    key={`${stop.stationId}-${index}`}
                    style={[
                      styles.station_row,
                      {
                        position: "absolute",
                        top: y - 24,
                      },
                    ]}
                  >
                    {/* dot + 버스 아이콘 오버레이 */}
                    <View style={styles.timeline_dot_wrapper}>
                      {/* 🔥 dot 위에 겹치는 실시간 버스 아이콘들 */}
                      {busesHere.length > 0 && (
                        <View style={styles.bus_overlay}>
                          {busesHere.map((bus) => (
                            <View
                              key={bus.vehId}
                              style={styles.bus_overlay_item}
                            >
                              <Image
                                source={ICONS.directionsBus}
                                style={styles.bus_icon}
                                resizeMode="contain"
                              />
                              {bus.remainSeat != null && (
                                <Text style={styles.bus_seat_text}>
                                  {bus.remainSeat}
                                  {"\n석"}
                                </Text>
                              )}
                            </View>
                          ))}
                        </View>
                      )}

                      {/* 기존 정류장 점은 그대로 두되, 버스가 있으면 뒤에 깔리는 느낌 */}
                      <View
                        style={[
                          styles.station_circle,
                          { backgroundColor: color },
                        ]}
                      />
                    </View>

                    {/* 정류장 이름 */}
                    <Text
                      style={styles.station_text}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {stop.stationName ||
                        stop.stationId ||
                        `정류장 ${stop.order}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe_area: {
    flex: 1,
    backgroundColor: COLOR.bg,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR.bg,
    paddingHorizontal: 26,
  },
  content_wrapper: {
    flex: 1,
  },
  header_row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  header_actions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  bookmark_button: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  bookmark_icon: {
    width: 26,
    height: 26,
  },
  reload_button: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  reload_icon: {
    width: 24,
    height: 24,
    tintColor: COLOR.textPrimary,
  },
  bus_number_field: {
    marginBottom: 20,
  },
  bus_number_content: {
    borderBottomWidth: 0.3,
    borderBottomColor: COLOR.border,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bus_number_title_container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 200,
  },
  bus_number_title: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.textPrimary,
    letterSpacing: -0.43,
    flexShrink: 0,
    lineHeight: 22,
  },
  bus_number_title_spacer: {
    width: 24,
  },
  bus_number_value: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.textPrimary,
    letterSpacing: -0.43,
    lineHeight: 22,
    flex: 1,
  },
  bus_number_input: {
    fontSize: 17,
    fontWeight: "400",
    color: COLOR.textSecondary,
    letterSpacing: -0.43,
    lineHeight: 22,
    flex: 1,
    padding: 0,
  },
  time_filter_wrapper: {
    marginBottom: 24,
  },
  time_filter_container: {
    backgroundColor: COLOR.chipBg,
    borderRadius: 50,
    padding: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  time_tab: {
    flex: 1,
    height: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  time_tab_active: {
    backgroundColor: COLOR.card,
    borderRadius: 100,
  },
  time_tab_label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#090909",
    lineHeight: 20,
    letterSpacing: -0.23,
  },
  time_tab_label_active: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
  visualization_container: {
    marginBottom: 24,
  },
  visualization_card: {
    backgroundColor: COLOR.card,
    borderRadius: 10,
    height: 560,
    width: "100%",
    overflow: "hidden",
  },
  card_scroll_view: {
    flex: 1,
  },
  card_scroll_content: {
    padding: 20,
  },
  main_row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  seats_area_container: {
    width: 70,
    position: "relative",
    zIndex: 0,
  },
  svg_container: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  y_axis_label_container: {
    width: 45,
    position: "relative",
    paddingRight: 8,
  },
  y_axis_label: {
    fontSize: 13,
    color: COLOR.textPrimary,
    lineHeight: 24,
    textAlign: "right",
    width: "100%",
  },
  timeline_container: {
    flex: 1,
    position: "relative",
    paddingLeft: TIMELINE_TEXT_OFFSET,
  },
  timeline_line: {
    position: "absolute",
    left: TIMELINE_LINE_OFFSET,
    width: TIMELINE_LINE_WIDTH,
    height: "100%",
    backgroundColor: "#EBEBEB",
    zIndex: 1,
  },
  station_row: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    left: 0,
    right: 0,
    zIndex: 2,
    position: "absolute",
    width: "100%",
  },
  timeline_dot_wrapper: {
    position: "absolute",
    width: TIMELINE_DOT_SIZE,
    height: TIMELINE_DOT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    left:
      TIMELINE_LINE_OFFSET +
      TIMELINE_LINE_WIDTH / 2 -
      TIMELINE_DOT_SIZE / 2,
    top: (48 - TIMELINE_DOT_SIZE) / 2,
  },
  station_circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  // 🔥 dot 위에 겹치는 실시간 버스 레이어
  bus_overlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    // 살짝 dot 위로 올리고 싶은 경우 아래 값 조정
    bottom: TIMELINE_DOT_SIZE / 2,
  },
  bus_overlay_item: {
    alignItems: "center",
    marginBottom: 2,
  },
  bus_icon: {
    width: 14,
    height: 14,
    tintColor: "#000000", // 검정색으로 설정
  },
  bus_seat_text: {
    fontSize: 8,
    color: "#000000",
    marginTop: 1,
    textAlign: "center",
    //  줄바꿈 되는 거 -> 숫자가 최대 4글자 정도까지 들어가도 줄바꿈 레이아웃이 깨지지 않도록 최소 너비 확보
    minWidth: 24,
  },
  station_text: {
    flex: 1,
    fontSize: 13,
    color: COLOR.textPrimary,
    lineHeight: 24,
    textAlign: "left",
    marginLeft: TIMELINE_DOT_SIZE / 2 + TIMELINE_TEXT_SPACING + 22,
    paddingRight: 8,
  },
  empty_text: {
    fontSize: 15,
    color: COLOR.grayDark,
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default BusSearchPredictionScreen;
