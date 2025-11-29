import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Animated, Image, PanResponder, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import BottomTabBar from "../components/BottomTabBar";
import { NavigateHandler, ScreenName } from "../types/navigation";
import { FavoriteItem, getFavorites, removeFavorite, subscribeFavorites } from "../store/favoriteStore";
import { setSearchIntent } from "../store/searchIntentStore";
import { setBusSearchNumber } from "../store/busSearchStore";
import { setDepartureStation } from "../store/stationSearchStore";
import { getAuthState, subscribeAuth, logout } from "../store/authStore";

type UserProps = {
  currentScreen: ScreenName;
  onNavigate: NavigateHandler;
};

const ICONS = {
  cellular: require("../../assets/images/user/Cellular Connection.png"),
  wifi: require("../../assets/images/user/Wifi.png"),
  battery: require("../../assets/images/user/Battery.png"),
  icon: require("../../assets/images/user/Icon.png"),
  chevronForward: require("../../assets/images/user/SF Symbol/chevron.forward.png"),
  bus: require("../../assets/images/bookmark/Icon.png"),
  pin: require("../../assets/images/bookmark/Map pin.png"),
  bin: require("../../assets/images/bookmark/bin.png"),
};

const DELETE_ACTION_WIDTH = 78;

/**
 * UserScreen
 * 사용자 프로필 화면을 구성한다.
 */
const UserScreen = ({ currentScreen, onNavigate }: UserProps): ReactElement => {
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>(getFavorites());
  const [isEditing, setIsEditing] = useState(false);
  const [authState, setAuthState] = useState(getAuthState());

  useEffect(() => {
    const unsubscribe = subscribeFavorites(setFavoriteItems);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuth(setAuthState);
    return unsubscribe;
  }, []);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  const handleDeleteFavorite = (id: string) => {
    removeFavorite(id);
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

  /**
   * 로그아웃 처리 함수
   * 로그아웃 후 로그인 화면으로 이동합니다.
   */
  const handleLogout = () => {
    logout();
    onNavigate("login");
  };

  return (
    <SafeAreaView style={styles.safe_area}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll_content} showsVerticalScrollIndicator={false}>
          <HeaderSection />
          <DetailCardSection 
            isLoggedIn={authState.isLoggedIn}
            email={authState.email}
            name={authState.name}
            onNavigate={onNavigate}
          />
          <FavoriteSection 
            isEditing={isEditing} 
            onEditToggle={toggleEditMode}
            favoriteItems={favoriteItems}
            onDeleteFavorite={handleDeleteFavorite}
            onSelectFavorite={handleFavoritePress}
          />
          {/* 로그아웃 버튼 - 로그인 상태일 때만 표시 */}
          {authState.isLoggedIn && (
            <LogoutButtonSection onLogout={handleLogout} />
          )}
        </ScrollView>
        <BottomTabBar currentScreen={currentScreen} onNavigate={onNavigate} />
      </View>
    </SafeAreaView>
  );
};

/**
 * HeaderSection
 * "Bus.y" 타이틀을 렌더링한다.
 */
const HeaderSection = (): ReactElement => {
  return (
    <View style={styles.header_section}>
      <Text style={styles.header_title}>
        <Text style={styles.header_title_bus}>Bus.</Text>
        <Text style={styles.header_title_y}>y</Text>
      </Text>
    </View>
  );
};

/**
 * DetailCardSection
 * 사용자 정보 카드 섹션 (이름, 이메일 등)
 */
type DetailCardSectionProps = {
  isLoggedIn: boolean;
  email?: string;
  name?: string;
  onNavigate: NavigateHandler;
};

const DetailCardSection = ({ isLoggedIn, email, name, onNavigate }: DetailCardSectionProps): ReactElement => {
  if (!isLoggedIn) {
    return (
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.detail_card}
          activeOpacity={0.8}
          onPress={() => onNavigate("login")}
        >
          <Image source={ICONS.icon} style={styles.detail_card_icon} resizeMode="contain" />
          <View style={styles.detail_card_content}>
            <View style={styles.detail_card_texts}>
              <Text style={styles.login_prompt_text}>로그인 해주세요</Text>
            </View>
            <Image source={ICONS.chevronForward} style={styles.detail_card_chevron} resizeMode="contain" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.detail_card}>
        <Image source={ICONS.icon} style={styles.detail_card_icon} resizeMode="contain" />
        <View style={styles.detail_card_content}>
          <View style={styles.detail_card_texts}>
            <Text style={styles.detail_card_label}>이름</Text>
            <Text style={styles.detail_card_value}>{email || "aaaa@gmail.com"}</Text>
          </View>
          <Image source={ICONS.chevronForward} style={styles.detail_card_chevron} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
};

/**
 * LogoutButtonSection
 * 로그아웃 버튼 섹션 - signup.tsx의 Register 버튼과 유사한 스타일
 */
type LogoutButtonSectionProps = {
  onLogout: () => void;
};

const LogoutButtonSection = ({ onLogout }: LogoutButtonSectionProps): ReactElement => {
  return (
    <View style={styles.logout_section}>
      <TouchableOpacity
        style={styles.logout_button_container}
        activeOpacity={0.8}
        onPress={onLogout}
      >
        <LinearGradient
          style={styles.logout_button}
          locations={[0, 1]}
          colors={["#007AFF", "#007AFF"]}
          useAngle
          angle={180}
        >
          <Text style={styles.logout_button_text}>로그아웃</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

/**
 * FavoriteSection
 * 즐겨찾기 섹션 - bookmark.tsx의 FavoriteCard 사용
 */
type FavoriteSectionProps = {
  isEditing: boolean;
  onEditToggle: () => void;
  favoriteItems: FavoriteItem[];
  onDeleteFavorite: (id: string) => void;
  onSelectFavorite: (item: FavoriteItem) => void;
};

const FavoriteSection = ({ 
  isEditing, 
  onEditToggle,
  favoriteItems,
  onDeleteFavorite,
  onSelectFavorite,
}: FavoriteSectionProps): ReactElement => {
  return (
    <View style={styles.section}>
      <View style={styles.section_header}>
        <View style={styles.header_row}>
          <Text style={styles.section_title}>즐겨찾기</Text>
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
      <FavoriteCard
        items={favoriteItems}
        isEditing={isEditing}
        onDeleteFavorite={onDeleteFavorite}
        onSelectFavorite={onSelectFavorite}
      />
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
  onDeleteFavorite: (id: string) => void;
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
  onDeleteFavorite: (id: string) => void;
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

const COLOR = {
  bg: "#F7F7F6",
  card: "#FFFFFF",
  blue: "#007AFF",
  blueAccent: "#007AFF",
  blueLight: "#EBEBEB",
  grayText: "#868782",
  gray60: "#868782",
  border: "#EBEBEB",
  grayBorder: "#EBEBEB",
  textPrimary: "#000000",
  iconBg: "#EBEBEB",
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
  header_section: {
    marginBottom: 24,
  },
  header_title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Pretendard",
  },
  header_title_bus: {
    color: COLOR.blue,
  },
  header_title_y: {
    color: "rgba(134, 135, 130, 0.6)",
  },
  section: {
    marginBottom: 28,
  },
  section_header: {
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
  section_title: {
    fontSize: 24,
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
    color: COLOR.blueAccent,
  },
  detail_card: {
    backgroundColor: COLOR.card,
    borderRadius: 13,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  detail_card_icon: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  detail_card_content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detail_card_texts: {
    gap: 2,
  },
  detail_card_label: {
    fontSize: 13,
    color: "rgba(60, 60, 67, 0.6)",
    fontFamily: "Pretendard",
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  detail_card_value: {
    fontSize: 15,
    color: COLOR.textPrimary,
    fontFamily: "Pretendard",
    lineHeight: 20,
    letterSpacing: -0.24,
    fontWeight: "400",
  },
  detail_card_chevron: {
    width: 8,
    height: 14,
    tintColor: COLOR.textPrimary,
  },
  login_prompt_text: {
    fontSize: 15,
    letterSpacing: -0.24,
    lineHeight: 20,
    fontFamily: "Pretendard",
    color: COLOR.textPrimary,
    fontWeight: "400",
  },
  favorite_card: {
    backgroundColor: COLOR.card,
    borderRadius: 20,
    paddingVertical: 6,
    marginBottom: 0,
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
    tintColor: COLOR.blueAccent,
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
  logout_section: {
    marginTop: 8,
    marginBottom: 28,
    paddingHorizontal: 0,
  },
  logout_button_container: {
    alignSelf: "stretch",
  },
  logout_button: {
    height: 48,
    borderRadius: 10,
    elevation: 2,
    flexDirection: "row",
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  logout_button_text: {
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    letterSpacing: -0.1,
    lineHeight: 20,
  },
});

export default UserScreen;