import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import {
  getStationSearchState,
  setDepartureStation,
  subscribeStationSearch,
} from "../store/stationSearchStore";
import {
  findStationInRoute,
  getBusesAtStation,
  getRouteStops,
  getRouteStopsByRouteId,
  getStationBusInfo,
  getStationIdByName,
  getRouteIdsByRouteNm,
  StationBusInfo,
} from "../data";
import { getStationRealtimeData, getBusRealtimeData, BusRealtimeData, getCongestionLevel, predictSeat, PredictSeatResponse } from "../api/bus";
import { addFavorite, FavoriteItem, getFavorites, removeFavorite, subscribeFavorites } from "../store/favoriteStore";

type CongestionLevel = "empty" | "normal" | "crowded" | "veryCrowded";

const CONGESTION_COLORS = {
  empty: "#007AFF",
  normal: "#00D578",
  crowded: "#FBBF4C",
  veryCrowded: "#F55858",
};

type StationSearchProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const ICONS = {
  cellular: require("../../assets/images/station_search/Examples/Cellular Connection.png"),
  wifi: require("../../assets/images/station_search/Examples/Wifi.png"),
  battery: require("../../assets/images/station_search/Examples/Battery.png"),
  bookmark: require("../../assets/images/station_search/Examples/Bookmark.png"),
  marked: require("../../assets/images/home/marked.png"),
  home: require("../../assets/images/station_search/Examples/Home.png"),
  search: require("../../assets/images/station_search/Examples/Search.png"),
  user: require("../../assets/images/station_search/Examples/User.png"),
  mapPin: require("../../assets/images/station_search/Examples/Map pin.png"),
  directionsBus: require("../../assets/images/station_search/Examples/directions_bus.png"),
  icon: require("../../assets/images/station_search/Examples/icon.png"),
  reload: require("../../assets/images/station_search/Examples/reload.png"),
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
  routeLine: "#EBEBEB",
  myPositionBg: "#000000",
};

/**
 * StationSearchScreen
 * 정류장 검색 화면을 Figma 디자인 기반으로 구성한다.
 */
const StationSearchScreen = ({ currentScreen, onNavigate }: StationSearchProps): ReactElement => {
  const [selectedTime, setSelectedTime] = useState<TimeSlot>("6:30");
  const [departureStationValue, setDepartureStationValue] = useState(
    getStationSearchState().departureStation
  );

  // 즐겨찾기 상태 (현재 로그인한 사용자의 즐겨찾기 목록)
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>(getFavorites());

  // 정류장 이름으로 stationId 찾기
  const selectedStationId = useMemo(() => {
    if (!departureStationValue) return null;
    return getStationIdByName(departureStationValue);
  }, [departureStationValue]);

  // 선택된 정류장 ID에 따라 정류장 정보 가져오기
  const stationBusInfo = useMemo(() => {
    if (selectedStationId === null) return null;
    return getStationBusInfo(selectedStationId);
  }, [selectedStationId]);

  // 현재 선택된 출발 정류장이 즐겨찾기에 포함되어 있는지 여부
  const is_current_station_favorited = useMemo(() => {
    if (!departureStationValue) {
      return false;
    }
    return favoriteItems.some((item) => item.type === "stop" && item.label === departureStationValue);
  }, [favoriteItems, departureStationValue]);

  // 실시간 정류장 데이터 조회
  const [realtimeData, setRealtimeData] = useState<BusRealtimeData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  /**
   * 실시간 정류장 데이터 조회 함수
   */
  const fetchRealtimeData = async () => {
    if (!selectedStationId) return;

    setIsLoadingData(true);
    try {
      // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
      const today = new Date();
      const service_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const data = await getStationRealtimeData(selectedStationId, service_date, selectedTime);
      setRealtimeData(data);
    } catch (error) {
      console.error("실시간 정류장 데이터 조회 실패:", error);
      setRealtimeData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  /**
   * 새로고침 함수
   * 실시간 정류장 데이터를 다시 조회한다.
   */
  const handleRefresh = async () => {
    await fetchRealtimeData();
  };

  useEffect(() => {
    fetchRealtimeData();
  }, [selectedStationId, selectedTime]);

  useEffect(() => {
    const unsubscribe = subscribeStationSearch((state) => {
      setDepartureStationValue(state.departureStation);
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

  const handleDepartureChange = (value: string) => {
    setDepartureStationValue(value);
    setDepartureStation(value);
  };

  /**
   * 현재 출발 정류장 즐겨찾기 토글 함수
   * - 이미 즐겨찾기인 경우: 즐겨찾기에서 제거
   * - 즐겨찾기가 아닌 경우: 즐겨찾기에 추가
   */
  const handleToggleFavoriteStation = async () => {
    if (!departureStationValue) {
      return;
    }

    try {
      if (is_current_station_favorited) {
        const existing = favoriteItems.find(
          (item) => item.type === "stop" && item.label === departureStationValue
        );
        if (existing) {
          await removeFavorite(existing.id);
        }
      } else {
        await addFavorite({
          label: departureStationValue,
          type: "stop",
        });
      }
    } catch (error) {
      console.error("정류장 즐겨찾기 토글 중 오류가 발생했습니다.", error);
    }
  };

  return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll_content} showsVerticalScrollIndicator={false}>
          <View style={styles.header_row}>
            <DepartureField value={departureStationValue} onChange={handleDepartureChange} />
            <View style={styles.header_actions}>
              <TouchableOpacity
                style={styles.bookmark_button}
                activeOpacity={0.7}
                onPress={handleToggleFavoriteStation}
                disabled={!departureStationValue}
              >
                <Image
                  source={is_current_station_favorited ? ICONS.marked : ICONS.bookmark}
                  style={styles.bookmark_icon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reload_button}
                activeOpacity={0.7}
                onPress={handleRefresh}
                disabled={isLoadingData}
              >
                <Image source={ICONS.reload} style={styles.reload_icon} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
          <TimeFilterTabs selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
          {selectedStationId !== null && stationBusInfo && (
            <StationBusList
              stationBusInfo={stationBusInfo}
              stationId={selectedStationId}
              selectedTime={selectedTime}
              realtimeData={realtimeData}
            />
          )}
        </ScrollView>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

/**
 * DepartureField
 * 출발 정류장 검색 입력 필드
 * 선택된 정류장이 있으면 "출발 정류장 {정류장이름}" 형태로 표시
 * "출발 정류장"과 정류장 이름 사이에 간격을 두고 전체 길이를 길게 표시
 */
const DepartureField = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}): ReactElement => {
  return (
    <View style={styles.departure_field}>
      <View style={styles.departure_content}>
        <View style={styles.departure_title_container}>
          <Text style={styles.departure_title}>출발 정류장</Text>
          {value && (
            <>
              <View style={styles.departure_title_spacer} />
              <Text style={styles.departure_station_name}>{value}</Text>
            </>
          )}
        </View>
        <TextInput
          style={styles.departure_input}
          value={value}
          onChangeText={onChange}
          placeholder="정류장 검색"
          placeholderTextColor={COLOR.grayDark}
        />
      </View>
    </View>
  );
};

/**
 * TimeFilterTabs
 * 시간 필터 탭 (6:00, 6:30, 7:00, 7:30, 8:00, 8:30)
 * 시간대 선택 시 하얀색 배경과 #007AFF 텍스트 색상으로 표시
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
              <Text style={[styles.time_tab_label, isActive && styles.time_tab_label_active]}>
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
 * StationBusList
 * 선택된 정류장을 지나가는 각 버스 노선을 카드로 표시
 * 각 카드에는 가로 타임라인, 버스 위치, 내 위치가 표시됨
 */
const StationBusList = ({
  stationBusInfo,
  stationId,
  selectedTime,
  realtimeData,
}: {
  stationBusInfo: StationBusInfo;
  stationId: string;
  selectedTime: TimeSlot;
  realtimeData: BusRealtimeData[];
}): ReactElement => {
  return (
    <View style={styles.bus_routes_section}>
      {stationBusInfo.busNums.map((busNum) => {
        // 해당 버스 번호의 실시간 데이터 찾기 (routename으로 매칭)
        // 이 데이터는 선택된 정류장에서의 데이터이므로, BusRouteCard에서 노선 전체 데이터를 별도로 조회함
        const busRealtimeData = realtimeData.find((data) => data.routename === busNum);
        return (
          <BusRouteCard
            key={busNum}
            busNum={busNum}
            stationId={stationId}
            selectedTime={selectedTime}
            stationRealtimeData={busRealtimeData}
          />
        );
      })}
    </View>
  );
};

/**
 * BusRouteCard
 * 개별 버스 노선 카드
 * 가로 타임라인, 혼잡도, 버스 위치, 내 위치 표시
 */
const BusRouteCard = ({
  busNum,
  stationId,
  selectedTime,
  stationRealtimeData,
}: {
  busNum: string;
  stationId: string;
  selectedTime: TimeSlot;
  stationRealtimeData?: BusRealtimeData;
}): ReactElement => {
  // 해당 버스 노선에서 정류장의 위치 찾기
  const stationPosition = findStationInRoute(busNum, stationId);

  // routeid와 order 정보 가져오기
  const routeId = stationPosition?.routeId;
  const myPosition = stationPosition?.order ?? -1;

  // 해당 routeid의 정류장 목록 가져오기
  const routeStops = routeId ? getRouteStopsByRouteId(routeId) : [];
  const totalStops = routeStops.length;

  // 목적지 정류장 이름 (마지막 정류장)
  const destinationName = routeStops.length > 0 ? routeStops[routeStops.length - 1].stationName : "";

  // 모든 정류장을 표시 (order와 1:1 매핑)
  const displayStops = totalStops;

  // 해당 버스 노선의 모든 정류장별 실시간 데이터 조회
  const [routeRealtimeData, setRouteRealtimeData] = useState<BusRealtimeData[]>([]);
  const [isLoadingRouteData, setIsLoadingRouteData] = useState(false);

  // 예측 좌석 데이터 조회 (station_num -> remainseat_pred 맵)
  const [predictionData, setPredictionData] = useState<Map<number, number>>(new Map());
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);

  /**
   * 시간 슬롯을 API 요청 형식으로 변환 (0~7 인덱스)
   * 백엔드에서 select_time을 0~7 범위의 정수로 받습니다.
   * "6:00" -> 0, "6:30" -> 1, "7:00" -> 2, "7:30" -> 3, "8:00" -> 4, "8:30" -> 5, "9:00" -> 6
   */
  const convertTimeSlotToIndex = (timeSlot: TimeSlot): number => {
    const timeSlots: TimeSlot[] = ["6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00"];
    return timeSlots.indexOf(timeSlot);
  };

  /**
   * 실시간 버스 위치 데이터 조회
   * routeid에 따라 현재 버스의 위치 정보를 실시간 API에서 받아옴
   * - 버스 위치는 vehid1과 stationid로 표시됨
   * - 잔여좌석 정보는 예측 모델에서 따로 받음
   */
  useEffect(() => {
    const fetchRouteRealtimeData = async () => {
      if (!routeId) return;

      setIsLoadingRouteData(true);
      try {
        // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
        const today = new Date();
        const service_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        // routeid로 실시간 버스 위치 데이터 조회 (버스 위치만, 잔여좌석 제외)
        const data = await getBusRealtimeData(routeId, service_date, selectedTime);
        console.log(`[BusRouteCard] 버스 ${busNum} (routeId: ${routeId}) 실시간 데이터:`, {
          데이터_개수: data.length,
          vehid1_있는_데이터: data.filter((d) => d.vehid1 && d.vehid1.trim() !== "").length,
          샘플_데이터: data.slice(0, 3).map((d) => ({
            stationid: d.stationid,
            vehid1: d.vehid1,
            station_num: d.station_num,
          })),
        });
        setRouteRealtimeData(data);
      } catch (error) {
        console.error(`버스 ${busNum} 노선 실시간 데이터 조회 실패:`, error);
        setRouteRealtimeData([]);
      } finally {
        setIsLoadingRouteData(false);
      }
    };

    fetchRouteRealtimeData();
  }, [routeId, selectedTime, busNum]);

  /**
   * 혼잡도 예측 데이터 조회
   * routeid와 timeslot에 따라 예측 모델에서 잔여좌석을 받아 혼잡도로 변환
   * - 각 버스 노선(routeid)별로 예측
   * - timeslot에 따라 예측값이 달라짐
   * - 예측된 좌석 수를 혼잡도 레벨로 변환하여 색깔로 표시
   */
  useEffect(() => {
    const fetchPredictionData = async () => {
      if (!routeId) return;

      setIsLoadingPrediction(true);
      try {
        // routeid를 숫자로 변환
        const routeidNum = parseInt(routeId, 10);
        if (isNaN(routeidNum)) {
          console.warn(`[BusRouteCard] routeid를 숫자로 변환할 수 없습니다: ${routeId}`);
          setPredictionData(new Map());
          return;
        }

        // 시간 슬롯을 API 형식으로 변환 (0~7 인덱스)
        const select_time = convertTimeSlotToIndex(selectedTime);
        if (select_time < 0) {
          console.warn(`[BusRouteCard] 시간 슬롯을 인덱스로 변환할 수 없습니다: ${selectedTime}`);
          setPredictionData(new Map());
          return;
        }

        // routeid와 timeslot에 따라 예측 모델에서 잔여좌석 예측값 조회
        const response: PredictSeatResponse = await predictSeat(routeidNum, select_time);

        if (response.predictions && response.predictions.length > 0) {
          // predictions 배열을 station_num -> remainseat_pred 맵으로 변환
          const predictionMap = new Map<number, number>();
          response.predictions.forEach((pred) => {
            predictionMap.set(pred.station_num, pred.remainseat_pred);
          });
          setPredictionData(predictionMap);
          console.log(`[BusRouteCard] 버스 ${busNum} 예측 좌석 데이터 조회 성공:`, {
            routeid: routeidNum,
            select_time,
            예측값_개수: response.predictions.length,
            샘플_예측값: response.predictions.slice(0, 5),
          });
        } else {
          console.warn(`[BusRouteCard] 버스 ${busNum} 예측 좌석 데이터 조회 실패:`, response.error || "예측 데이터가 없습니다.");
          setPredictionData(new Map());
        }
      } catch (error) {
        console.error(`[BusRouteCard] 버스 ${busNum} 예측 좌석 데이터 조회 실패:`, error);
        setPredictionData(new Map());
      } finally {
        setIsLoadingPrediction(false);
      }
    };

    fetchPredictionData();
  }, [routeId, selectedTime, busNum]);

  // 실시간 데이터를 정류장별로 매핑 (stationid 기준)
  const realtimeDataMap = new Map<string, BusRealtimeData>();
  routeRealtimeData.forEach((data) => {
    realtimeDataMap.set(data.stationid, data);
  });

  /**
   * 좌석 수를 혼잡도 레벨로 변환
   * - 여유(>=35): "empty"
   * - 보통(>=25): "normal"
   * - 혼잡(>=10): "crowded"
   * - 매우 혼잡(<10): "veryCrowded"
   */
  const getCongestionLevelFromSeats = (seats: number): CongestionLevel => {
    if (seats >= 35) return "empty";
    if (seats >= 25) return "normal";
    if (seats >= 10) return "crowded";
    return "veryCrowded";
  };

  // 각 정류장의 혼잡도 데이터: 예측 데이터 > 기본값 순으로 우선순위 적용
  // routeid와 timeslot에 따라 예측 모델에서 받은 잔여좌석을 혼잡도로 변환하여 색깔로 표시
  // 모든 정류장을 order와 1:1로 매핑
  const congestionData: CongestionLevel[] = routeStops.map((stop) => {
    // 우선순위: 예측 데이터의 좌석 수를 혼잡도로 변환
    // routeid와 timeslot에 따라 예측 모델에서 받은 잔여좌석 사용
    // stop.order가 station_num과 일치한다고 가정
    const predictedSeats = predictionData.get(stop.order);
    if (predictedSeats !== undefined) {
      // 예측된 좌석 수를 혼잡도 레벨로 변환 (색깔로 표시)
      return getCongestionLevelFromSeats(predictedSeats);
    }

    // 기본값: normal
    return "normal";
  });

  // 버스 현재 위치: 실시간 API에서 받은 데이터로 표시
  // 각 정류장별로 vehid1이 있는지 확인 (bus_search_prediction.tsx와 동일한 방식)
  // vehid1이 있으면 해당 정류장에 현재 버스가 있음
  // 모든 정류장을 order와 1:1로 매핑
  const busPositions = routeStops.map((stop) => {
    // 해당 정류장의 실시간 API 데이터 찾기
    const stopRealtimeData = realtimeDataMap.get(stop.stationId);
    // 실시간 API에서 받은 vehid1이 있고 빈 문자열이 아니면 현재 버스가 해당 정류장에 있음
    const hasBus = !!(stopRealtimeData?.vehid1 && stopRealtimeData.vehid1.trim() !== "");
    if (hasBus) {
      console.log(`[BusRouteCard] 버스 ${busNum} 현재 위치 발견 (실시간 API):`, {
        정류장_order: stop.order,
        정류장_ID: stop.stationId,
        정류장_이름: stop.stationName,
        vehid1: stopRealtimeData.vehid1,
      });
    }
    return hasBus;
  });

  // 버스가 있는 첫 번째 정류장의 인덱스 찾기
  const busPositionIndex = busPositions.findIndex((hasBus) => hasBus);

  // 디버깅: 버스 위치 정보 출력
  if (routeRealtimeData.length > 0) {
    console.log(`[BusRouteCard] 버스 ${busNum} 위치 요약:`, {
      전체_데이터_개수: routeRealtimeData.length,
      vehid1_있는_데이터_개수: routeRealtimeData.filter((d) => d.vehid1 && d.vehid1.trim() !== "").length,
      타임라인_버스_위치: busPositions.map((hasBus, idx) => hasBus ? idx : -1).filter((idx) => idx >= 0),
      첫_버스_위치_인덱스: busPositionIndex,
    });
  }

  // 내 위치를 타임라인 인덱스로 변환
  // order와 1:1 매핑: routeStops에서 order가 myPosition과 일치하는 정류장의 인덱스를 찾음
  let myPositionIndex = -1;
  if (myPosition > 0 && routeStops.length > 0) {
    // routeStops에서 order가 myPosition과 일치하는 정류장의 인덱스 찾기
    const foundIndex = routeStops.findIndex((stop) => stop.order === myPosition);
    if (foundIndex >= 0) {
      myPositionIndex = foundIndex;
    }
  }

  return (
    <View style={styles.bus_card}>
      {/* 버스 번호와 목적지 */}
      <View style={styles.bus_header}>
        <Text style={styles.bus_number}>{busNum}</Text>
        {destinationName && <Text style={styles.bus_station}>{destinationName}</Text>}
      </View>

      {/* 노선 시각화 영역 */}
      <View style={styles.route_visualization}>
        {/* 혼잡도 표시 영역 */}
        <View style={styles.congestion_area}>
          {/* 혼잡도 원들 - 가로 스크롤 가능 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.congestion_dots_scroll_content}
            style={styles.congestion_dots_scroll}
          >
            <View style={styles.congestion_dots_container}>
              {/* 연결선 - 스크롤 가능한 영역의 전체 너비를 차지 */}
              <View style={[styles.route_line, { width: routeStops.length * 40 }]} />

              {routeStops.map((stop, index) => {
                const congestionLevel = congestionData[index] || "normal";
                const color = CONGESTION_COLORS[congestionLevel];
                // 버스 위치: 해당 정류장에 vehid1이 있으면 버스가 있음
                const isBusPosition = busPositions[index] === true;
                const isMyPosition = index === myPositionIndex;

                return (
                  <View key={`${stop.stationId}-${stop.order}`} style={styles.congestion_dot_wrapper}>
                    {/* 혼잡도 원 */}
                    <View style={[styles.congestion_dot, { backgroundColor: color }]} />

                    {/* 버스 위치 표시 */}
                    {isBusPosition && (
                      <View style={styles.bus_position_indicator}>
                        <Image source={ICONS.directionsBus} style={styles.bus_position_icon} resizeMode="contain" />
                      </View>
                    )}

                    {/* 내 위치 표시 */}
                    {isMyPosition && (
                      <View style={styles.my_position_indicator}>
                        <Image source={ICONS.mapPin} style={styles.my_position_icon} resizeMode="contain" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
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
  scroll_content: {
    paddingBottom: 140,
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
    color: COLOR.textPrimary,
    fontFamily: "SF Pro",
  },
  status_icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  status_icon: {
    width: 19,
    height: 12,
  },
  status_battery: {
    width: 27,
    height: 13,
  },
  departure_field: {
    marginBottom: 20,
  },
  departure_content: {
    borderBottomWidth: 0.3,
    borderBottomColor: COLOR.border,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  departure_title_container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 240,
  },
  departure_title: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.textPrimary,
    fontFamily: "SF Pro",
    letterSpacing: -0.43,
    flexShrink: 0,
    lineHeight: 22,
  },
  departure_title_spacer: {
    width: 10,
  },
  departure_station_name: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.textPrimary,
    fontFamily: "SF Pro",
    letterSpacing: -0.43,
    lineHeight: 22,
    flex: 1,
  },
  departure_input: {
    fontSize: 17,
    fontWeight: "400",
    color: COLOR.textSecondary,
    fontFamily: "SF Pro",
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
    fontFamily: "SF Pro",
    lineHeight: 20,
    letterSpacing: -0.23,
  },
  time_tab_label_active: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
  bus_routes_section: {
    gap: 21,
    marginBottom: 24,
  },
  bus_card: {
    height: 146,
    borderRadius: 10,
    backgroundColor: COLOR.card,
    paddingTop: 15,
    paddingLeft: 17,
    paddingRight: 17,
    position: "relative",
  },
  bus_header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  bus_number: {
    fontSize: 24,
    fontWeight: "600",
    color: COLOR.textPrimary,
    fontFamily: "Pretendard",
    marginRight: 8,
  },
  bus_station: {
    fontSize: 15,
    fontWeight: "600",
    color: COLOR.grayDark,
    fontFamily: "Pretendard",
  },
  route_visualization: {
    flexDirection: "row",
    alignItems: "center",
    height: 54,
    position: "relative",
    marginTop: 8,
  },
  congestion_area: {
    width: "100%",
    height: 54,
    position: "relative",
    justifyContent: "center",
  },
  route_line: {
    position: "absolute",
    left: 0,
    height: 3,
    backgroundColor: COLOR.routeLine,
    top: "50%",
    marginTop: -1.5,
    zIndex: 1,
  },
  congestion_dots_scroll: {
    width: "100%",
    height: "100%",
  },
  congestion_dots_scroll_content: {
    paddingHorizontal: 8,
  },
  congestion_dots_container: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    position: "relative",
    zIndex: 2,
  },
  congestion_dot_wrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    zIndex: 3,
  },
  congestion_dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLOR.card,
    zIndex: 2,
  },
  bus_position_indicator: {
    position: "absolute",
    top: -14,
    left: "50%",
    marginLeft: -12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  bus_position_icon: {
    width: 24,
    height: 24,
    tintColor: COLOR.textPrimary,
  },
  my_position_indicator: {
    position: "absolute",
    top: -14,
    left: "50%",
    marginLeft: -12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
  },
  my_position_icon: {
    width: 24,
    height: 24,
    tintColor: COLOR.textPrimary,
  },
});

export default StationSearchScreen;