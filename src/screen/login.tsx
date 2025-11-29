import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigateHandler } from "../types/navigation";
import { login } from "../store/authStore";

const ICONS = {
  arrowNarrowLeft: require("../../assets/images/signup/arrow-narrow-left.png"),
  eyeOff: require("../../assets/images/login/eye-off.png"),
  mobileSignal: require("../../assets/images/login/Native/Mobile Signal.png"),
  wifi: require("../../assets/images/login/Native/Wifi.png"),
  battery: require("../../assets/images/login/Native/Battery.png"),
  rectangle: require("../../assets/images/login/Native/rectangle.png"),
};

type LoginProps = {
  onNavigate: NavigateHandler;
};

const LoginVersion1 = ({ onNavigate }: LoginProps) => {
  // 4) 실제 입력 값 상태
  const [email, setEmail] = useState("aaaa@gmail.com");
  const [password, setPassword] = useState("*******");

  const handleLogin = () => {
    login(email, "User");
    onNavigate("user");
  };

  /**
   * Sign Up 버튼 클릭 핸들러
   * 회원가입 화면으로 이동합니다.
   */
  const handleSignUpPress = () => {
    onNavigate("signup");
  };

  /**
   * 뒤로가기 버튼 클릭 핸들러
   * 사용자 화면으로 이동합니다.
   */
  const handleBackPress = () => {
    onNavigate("user");
  };

  return (
    <SafeAreaView style={styles.loginVersion1}>
      <View style={styles.view}>
        {/* 메인 컨텐츠 영역 */}
        <View style={styles.content}>
          {/* 상단 로고 + 타이틀 */}
          <View style={styles.field}>
            <View style={styles.headline}>
              {/* 3) Bus.y 왼쪽 정렬 */}
              <View style={styles.logo}>
                <Text style={styles.busy}>
                  <Text style={styles.bus}>Bus.</Text>
                  <Text style={styles.y}>y</Text>
                </Text>
              </View>

              {/* 뒤로가기 버튼 */}
              <TouchableOpacity
                onPress={handleBackPress}
                activeOpacity={0.7}
                style={styles.backButton}
              >
                <Image
                  source={ICONS.arrowNarrowLeft}
                  style={styles.arrowNarrowLeftIcon}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              <View style={styles.text}>
                {/* 2) 강제 줄바꿈 */}
                <Text style={[styles.signInTo, styles.signInToFlexBox]}>
                  {"Sign in to your\nAccount"}
                </Text>
                <Text style={[styles.enterYourEmail, styles.emailTypo]}>
                  Enter your email and password to log in
                </Text>
              </View>
            </View>

            {/* 입력 필드 영역 */}
            <View style={styles.input}>
              <View style={styles.field2}>
                {/* Email */}
                <View style={styles.inputField}>
                  <View style={[styles.title, styles.titleFlexBox]}>
                    <Text style={[styles.email, styles.emailTypo]}>Email</Text>
                  </View>
                  <View style={styles.inputBorder}>
                    <TextInput
                      style={[styles.inputText, styles.labelTextTypo]}
                      placeholder="aaaa@gmail.com"
                      placeholderTextColor="#6c7278"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputField}>
                  <View style={[styles.title, styles.titleFlexBox]}>
                    <Text style={[styles.email, styles.emailTypo]}>
                      Password
                    </Text>
                  </View>
                  <View style={[styles.inputArea2, styles.inputBorder]}>
                    <TextInput
                      style={[styles.inputText, styles.labelTextTypo]}
                      placeholder="*******"
                      placeholderTextColor="#6c7278"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    <Image
                      source={ICONS.eyeOff}
                      style={styles.eyeOffIcon}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* Forgot Password */}
                <Text style={[styles.forgotPassword, styles.signUp2Typo]}>
                  Forgot Password ?
                </Text>
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity
                style={styles.buttons}
                activeOpacity={0.8}
                onPress={handleLogin}
              >
                <LinearGradient
                  style={styles.button}
                  locations={[0, 1]}
                  colors={["#007AFF", "#007AFF"]}
                  useAngle
                  angle={180}
                >
                  <Text style={[styles.labelText, styles.labelTextTypo]}>
                    Log In
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* 하단 Sign Up 텍스트 */}
          <View style={[styles.signUp, styles.titleFlexBox]}>
            <Text style={[styles.dontHaveAn, styles.emailTypo]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={handleSignUpPress} activeOpacity={0.7}>
              <Text style={[styles.signUp2, styles.signUp2Typo]}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loginVersion1: {
    flex: 1,
    backgroundColor: "#F7F7F6",
  },
  signInToFlexBox: {
    alignItems: "flex-start",
  },
  emailTypo: {
    color: "#6c7278",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "left",
  },
  titleFlexBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  labelTextTypo: {
    lineHeight: 20,
    fontSize: 14,
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  inputBorder: {
    zIndex: 0,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderColor: "#EBEBEB",
    backgroundColor: "#fff",
    minHeight: 46,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 10,
    elevation: 2,
    flexDirection: "row",
    alignSelf: "stretch",
    alignItems: "center",
    overflow: "hidden",
  },
  signUp2Typo: {
    fontFamily: "Inter-SemiBold",
    fontWeight: "600",
    lineHeight: 17,
    letterSpacing: -0.1,
    fontSize: 12,
    color: "#007aff",
  },
  nativePosition: {
    width: "100%",
    left: 0,
    position: "absolute",
  },
  view: {
    flex: 1,
    backgroundColor: "#F7F7F6",
    position: "relative",
  },
  content: {
    flex: 1,
    paddingTop: 68,
    paddingBottom: 100,
    paddingHorizontal: 24,
    gap: 60,
    width: "100%",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  field: {
    gap: 32,
    width: "100%",
  },
  headline: {
    justifyContent: "center",
    gap: 32,
    width: "100%",
    alignItems: "flex-start",
  },
  logo: {
    alignItems: "flex-start",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  backButton: {
    padding: 4,
    marginTop: 4,
  },
  arrowNarrowLeftIcon: {
    width: 24,
    height: 24,
  },
  busy: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "Pretendard",
    textAlign: "left",
  },
  bus: {
    color: "#007aff",
  },
  y: {
    color: "rgba(134, 135, 130, 0.6)",
  },
  text: {
    gap: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  signInTo: {
    width: 327,
    fontSize: 32,
    letterSpacing: -0.6,
    lineHeight: 42,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "left",
    color: "#1a1c1e",
  },
  enterYourEmail: {
    width: 300,
    fontFamily: "Inter-Medium",
    lineHeight: 17,
    letterSpacing: -0.1,
    color: "#6c7278",
    fontSize: 12,
  },
  input: {
    gap: 24,
    alignSelf: "stretch",
  },
  field2: {
    gap: 16,
    alignSelf: "stretch",
  },
  inputField: {
    gap: 2,
    alignSelf: "stretch",
  },
  title: {
    zIndex: 1,
    borderRadius: 100,
    height: 21,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  email: {
    letterSpacing: -0.2,
    lineHeight: 19,
    fontFamily: "PlusJakartaSans-Medium",
    color: "#6c7278",
    fontSize: 12,
  },
  // 1) 입력 텍스트 왼쪽 정렬용
  inputText: {
    flex: 1,
    color: "#1a1c1e",
    textAlign: "left",
  },
  inputArea2: {
    gap: 10,
  },
  eyeOffIcon: {
    height: 16,
    width: 16,
  },
  forgotPassword: {
    textAlign: "right",
    alignSelf: "stretch",
  },
  buttons: {
    alignSelf: "stretch",
  },
  button: {
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
  labelText: {
    color: "#fff",
    textAlign: "center",
  },
  signUp: {
    gap: 6,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  dontHaveAn: {
    fontFamily: "Inter-Medium",
    lineHeight: 17,
    letterSpacing: -0.1,
    color: "#6c7278",
    fontSize: 12,
  },
  signUp2: {
    textAlign: "left",
  },
  nativeStatusBar: {
    top: 0,
    height: 44,
  },
  text2: {
    marginTop: -8,
    top: "50%",
    left: 30,
    fontSize: 16,
    lineHeight: 16,
    color: "#021433",
    fontFamily: "Inter-Medium",
    fontWeight: "500",
    textAlign: "left",
    position: "absolute",
  },
  statusPhone: {
    top: 15,
    right: 24,
    gap: 5,
    position: "absolute",
  },
  mobileSignalIcon: {
    height: 10,
    width: 18,
  },
  wifiIcon: {
    height: 11,
    width: 15,
  },
  batteryIcon: {
    height: 13,
    width: 27,
  },
});

export default LoginVersion1;
