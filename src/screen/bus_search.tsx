import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import { getBusSearchState, setBusSearchNumber, subscribeBusSearch } from "../store/busSearchStore";
import { getRouteStops, RouteStop } from "../data";

type BusSearchProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const ICONS = {
  cellular: require("../../assets/images/bus_search/Cellular Connection.png"),
  wifi: require("../../assets/images/bus_search/Wifi.png"),
  battery: require("../../assets/images/bus_search/Battery.png"),
  bookmark: require("../../assets/images/bus_search/Bookmark.png"),
  home: require("../../assets/images/bus_search/Home.png"),
  search: require("../../assets/images/bus_search/Search.png"),
  user: require("../../assets/images/bus_search/User.png"),
  directionsBus: require("../../assets/images/bus_search/directions_bus.png"),
};

type TimeSlot = "6:00" | "6:30" | "7:00" | "7:30" | "8:00" | "8:30";

const TIME_TABS: Array<{ id: TimeSlot; label: string }> = [
  { id: "6:00", label: "6:00" },
  { id: "6:30", label: "6:30" },
  { id: "7:00", label: "7:00" },
  { id: "7:30", label: "7:30" },
  { id: "8:00", label: "8:00" },
  { id: "8:30", label: "8:30" },
];


const TIMELINE_LINE_WIDTH = 5;
const TIMELINE_DOT_SIZE = 16;
const TIMELINE_LINE_OFFSET = 22; // timelineContainer 내부에서 회색 라인이 위치할 X 좌표
const TIMELINE_TEXT_SPACING = 12;
const TIMELINE_TEXT_OFFSET = TIMELINE_LINE_OFFSET + TIMELINE_DOT_SIZE / 2 + TIMELINE_TEXT_SPACING;

/**
 * 잔여 좌석 수에 따라 색상을 반환한다.
 * - 여유(>=35) : 파란색
 * - 보통(>=25) : 초록색
 * - 혼잡(>=10) : 노란색
 * - 매우 혼잡(<10) : 빨간색
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
 * BusSearchScreen
 * 버스 검색 화면을 Figma 디자인 기반으로 구성한다.
 */
const BusSearchScreen = ({ currentScreen, onNavigate }: BusSearchProps): ReactElement => {
  const initialBusNumber = getBusSearchState().busNumber;
  const [busNumber, setBusNumber] = useState(initialBusNumber);
  const [selectedTime, setSelectedTime] = useState<TimeSlot>("6:30");
  const [selectedRoute, setSelectedRoute] = useState<string>(initialBusNumber || "1005");
  const [direction, setDirection] = useState<0 | 1>(0);

  // 선택된 노선과 방향에 따라 정류장 목록 가져오기
  const routeStops = useMemo(() => {
    return getRouteStops(selectedRoute, direction);
  }, [selectedRoute, direction]);

  useEffect(() => {
    const unsubscribe = subscribeBusSearch((state) => {
      setBusNumber(state.busNumber);
    });
    return unsubscribe;
  }, []);

  // 버스 번호가 변경될 때마다 선택된 노선도 동기화
  useEffect(() => {
    if (busNumber) {
      setSelectedRoute(busNumber);
    }
  }, [busNumber]);

  const handleBusNumberChange = (value: string) => {
    setBusNumber(value);
    setBusSearchNumber(value);
  };

  return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.content_wrapper}>
          <BusNumberField busNumber={busNumber} onBusNumberChange={handleBusNumberChange} />
          <TimeFilterTabs selectedTime={selectedTime} onTimeSelect={setSelectedTime} />
          <BusSeatsVisualization routeStops={routeStops} />
        </View>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

/**
 * BusNumberField
 * 버스 번호 입력 필드 (스크롤 가능)
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bus_number_scroll_content}
      >
        <View style={styles.bus_number_content}>
          <Text style={styles.bus_number_title}>버스 번호</Text>
          <TextInput
            style={styles.bus_number_input}
            value={busNumber}
            onChangeText={onBusNumberChange}
            placeholder="버스 번호 입력"
            placeholderTextColor={COLOR.grayDark}
          />
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * TimeFilterTabs
 * 시간 필터 탭 (6:00, 6:30, 7:00, 7:30, 8:00, 8:30)
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
 * BusSeatsVisualization
 * 버스 좌석/혼잡도 시각화 (Vertical Area Shape)
 * y축: 정류장 목록(카테고리), x축: 잔여좌석(연속값)
 */
const BusSeatsVisualization = ({ routeStops }: { routeStops: RouteStop[] }): ReactElement => {
  // 각 정류장의 높이 (일직선 배치를 위해)
  const stationHeight = 48;
  const MAX_WIDTH = 70; // 그래프 최대 너비 (60~80px 범위)
  const totalHeight = routeStops.length * stationHeight; // 전체 높이
  
  // 최대 좌석 수 (전체 좌석 수)
  const maxSeats = 45; // 기본값 사용 (실제 데이터에는 좌석 정보가 없으므로)
  
  // 각 정류장의 좌표 계산
  // y: 타임라인의 점들과 정확히 일치 (정류장 중앙)
  // x: 잔여좌석 수에 비례하여 계산
  // 정류장이 진행될수록 좌석이 자연스럽게 줄어드는 패턴
  const points: Array<{ x: number; y: number; seats: number }> = routeStops.map((stop, index) => {
    const y = index * stationHeight + stationHeight / 2; // 정류장 중앙 (타임라인과 일치)
    
    // 전체 정류장 수에 따라 좌석 감소 패턴 계산
    // 첫 정류장부터 마지막 정류장까지 자연스럽게 감소
    const progress = routeStops.length > 1 ? index / (routeStops.length - 1) : 0;
    // 좌석 수에 따라 그래프 모양이 자연스럽게 변하도록 계산
    // 진행률에 따라 좌석이 줄어들지만, 최소값은 0까지 가능
    const seats = Math.max(0, Math.floor(maxSeats * (1 - progress * 0.8))); // 최대 80%까지 감소 가능
    
    return { x: 0, y, seats }; // x는 나중에 정규화 후 계산
  });
  
  // 실제 좌석 수의 최대값과 최소값 계산
  const actualMaxSeats = Math.max(...points.map((p) => p.seats), maxSeats);
  const actualMinSeats = Math.min(...points.map((p) => p.seats), 0);
  const seatRange = actualMaxSeats - actualMinSeats || 1; // 0으로 나누기 방지
  
  // 정규화된 좌표로 계산 (전체 범위를 활용하여 그래프가 끝까지 이어지도록)
  const normalizedPoints = points.map((point) => {
    // 좌석 수를 0~1 범위로 정규화
    const normalizedSeats = (point.seats - actualMinSeats) / seatRange;
    // 정규화된 값을 MAX_WIDTH로 스케일링
    const x = normalizedSeats * MAX_WIDTH;
    return { ...point, x };
  });
  
  // Area Chart Path 생성 (직선 연결) - 모든 정류장을 포함하여 끝까지 이어지도록
  const createAreaPath = (): string => {
    if (normalizedPoints.length === 0) return "";
    
    const firstY = normalizedPoints[0].y;
    const lastY = normalizedPoints[normalizedPoints.length - 1].y;
    
    // 1) M 0, y0 - 왼쪽 위 시작점
    let path = `M 0 ${firstY}`;
    
    // 2) L x0, y0 - 첫 정류장 좌석 값까지 이동
    path += ` L ${normalizedPoints[0].x} ${normalizedPoints[0].y}`;
    
    // 3) L x1, y1 ... L xN, yN - 각 정류장 좌석 값까지 직선 연결 (끝까지)
    for (let i = 1; i < normalizedPoints.length; i++) {
      path += ` L ${normalizedPoints[i].x} ${normalizedPoints[i].y}`;
    }
    
    // 4) L 0, yN - 마지막 정류장에서 왼쪽 경계로 이동 (끝까지)
    path += ` L 0 ${lastY}`;
    
    // 5) L 0, y0 - 왼쪽 경계를 타고 위로 올라와 닫기
    path += ` L 0 ${firstY}`;
    
    // 6) Z - 닫기
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
      { offset: "100%", color: getSeatColor(normalizedPoints[normalizedPoints.length - 1].seats) },
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
        {/* 카드 내부 스크롤 영역 */}
        <ScrollView 
          style={styles.card_scroll_view}
          contentContainerStyle={[
            styles.card_scroll_content,
            { minHeight: totalHeight + 40 } // padding 20 * 2 = 40
          ]}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {/* 전체 레이아웃: 가로 방향 3컬럼 */}
          <View style={styles.main_row}>
          {/* [0] seatsAreaContainer: 좌석 수 그라디언트 면 */}
          <View style={[styles.seats_area_container, { height: totalHeight, width: MAX_WIDTH }]}>
            <Svg width={MAX_WIDTH} height={totalHeight} style={styles.svg_container}>
              <Defs>
                {/* 수직 그라데이션 (위에서 아래로) */}
              <LinearGradient id="congestionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                {gradientStops.map((stop, index) => (
                    <Stop
                      key={index}
                      offset={stop.offset}
                      stopColor={stop.color}
                    />
                  ))}
                </LinearGradient>
              </Defs>
              {/* Area Chart Path - 2차원 면 그래프 */}
              <Path
                d={areaPath}
                fill="url(#congestionGradient)"
              fillOpacity={0.5}
                stroke="none"
              />
            </Svg>
          </View>

          {/* [1] yAxisLabelContainer: y축 라벨 (45석, 44석...) */}
          <View style={[styles.y_axis_label_container, { height: totalHeight }]}>
            {normalizedPoints.map((point, index) => {
              const y = point.y; // 정류장 중앙 (타임라인과 일치)
              return (
                <Text
                  key={`${routeStops[index].stationId}-${index}`}
                  style={[
                    styles.y_axis_label,
                    {
                      position: "absolute",
                      top: y - 12, // 텍스트 중앙 정렬 (lineHeight 24 기준)
                    },
                  ]}
                >
                  {point.seats}석
                </Text>
              );
            })}
          </View>

          {/* [2] timelineContainer: 회색 세로 라인 + 정류장 원 + 버스 아이콘 + 정류장 이름 */}
          <View style={[styles.timeline_container, { height: totalHeight }]}>
            {/* 회색 세로 라인 */}
            <View style={styles.timeline_line} />
            
            {/* 정류장 정보 */}
            {normalizedPoints.map((point, index) => {
              const stop = routeStops[index];
              const color = getSeatColor(point.seats);
              const isBusPosition = index === 1 || index === 5; // 버스 위치
              const y = point.y; // 정류장 중앙

              return (
                <View
                  key={`${stop.stationId}-${index}`}
                  style={[
                    styles.station_row,
                    {
                      position: "absolute",
                      top: y - 24, // 텍스트 중앙 정렬 (lineHeight 24 기준)
                    },
                  ]}
                >
                  {/* 정류장 원 */}
                  <View style={styles.timeline_dot_wrapper}>
                    <View style={[styles.station_circle, { backgroundColor: color }]} />
                    {isBusPosition && (
                      <View style={styles.bus_icon_wrapper}>
                        <Image source={ICONS.directionsBus} style={styles.bus_icon} resizeMode="contain" />
                      </View>
                    )}
                  </View>
                  
                  {/* 정류장 이름 */}
                  <Text style={styles.station_text}>{stop.stationName}</Text>
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
  bus_number_field: {
    marginBottom: 20,
  },
  bus_number_scroll_content: {
    flexGrow: 1,
  },
  bus_number_content: {
    borderBottomWidth: 0.3,
    borderBottomColor: COLOR.border,
    paddingTop: 11,
    paddingBottom: 11,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    minWidth: "100%",
  },
  bus_number_title: {
    fontSize: 17,
    fontWeight: "600",
    color: COLOR.textPrimary,
    fontFamily: "SF Pro",
    letterSpacing: -0.43,
    width: 100,
    lineHeight: 22,
  },
  bus_number_input: {
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
  visualization_container: {
    marginBottom: 24,
  },
  visualization_card: {
    backgroundColor: COLOR.card,
    borderRadius: 10,
    height: 560, // 고정 높이
    width: "100%",
    overflow: "hidden", // 스크롤 시 내용이 카드 밖으로 나가지 않도록
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
  // [0] seatsAreaContainer: 좌석 수 그라디언트 면
  seats_area_container: {
    width: 70, // 60~80px 범위
    position: "relative",
    zIndex: 0, // 맨 뒤
  },
  svg_container: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // [1] yAxisLabelContainer: y축 라벨
  y_axis_label_container: {
    width: 45, // 40~50px
    position: "relative",
    paddingRight: 8,
  },
  y_axis_label: {
    fontSize: 13,
    color: COLOR.textPrimary,
    fontFamily: "Inter-Regular",
    lineHeight: 24,
    textAlign: "right", // 오른쪽 정렬
    width: "100%",
  },
  // [2] timelineContainer: 타임라인
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
    zIndex: 1, // seatsAreaContainer 위, 정류장 원/아이콘/텍스트 아래
  },
  station_row: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    left: 0,
    right: 0,
    paddingLeft: TIMELINE_TEXT_OFFSET,
    zIndex: 2, // 맨 앞
    position: "absolute",
    width: "100%",
  },
  timeline_dot_wrapper: {
    position: "absolute",
    width: TIMELINE_DOT_SIZE,
    height: TIMELINE_DOT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    left: TIMELINE_LINE_OFFSET + TIMELINE_LINE_WIDTH / 2 - TIMELINE_DOT_SIZE / 2,
    top: (48 - TIMELINE_DOT_SIZE) / 2,
  },
  station_circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  bus_icon_wrapper: {
    position: "absolute",
    left: -2,
    top: -2,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  bus_icon: {
    width: 20,
    height: 20,
    tintColor: COLOR.textPrimary,
  },
  station_text: {
    flex: 1,
    fontSize: 13,
    color: COLOR.textPrimary,
    fontFamily: "Inter-Regular",
    lineHeight: 24,
    textAlign: "left",
  },
  empty_text: {
    fontSize: 15,
    color: COLOR.grayDark,
    fontFamily: "SF Pro",
    textAlign: "center",
    paddingVertical: 20,
  },
});

export default BusSearchScreen;
