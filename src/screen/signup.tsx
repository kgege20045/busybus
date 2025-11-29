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

// 이미지 리소스 import
const ICONS = {
  arrowNarrowLeft: require("../../assets/images/signup/arrow-narrow-left.png"),
  eyeOff: require("../../assets/images/signup/eye-off.png"),
  mobileSignal: require("../../assets/images/signup/Native/Mobile Signal.png"),
  wifi: require("../../assets/images/signup/Native/Wifi.png"),
  battery: require("../../assets/images/signup/Native/Battery.png"),
};

type SignUpProps = {
  onNavigate: NavigateHandler;
};

/**
 * SignUpVersion1 컴포넌트
 * 사용자 계정 생성 화면을 구성합니다.
 * 이름, 이메일, 비밀번호를 입력받아 회원가입을 처리합니다.
 */
const SignUpVersion1 = ({ onNavigate }: SignUpProps) => {
  // 입력 필드 상태 관리
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 비밀번호 보기/숨기기 상태
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  /**
   * 회원가입 처리 함수
   * 입력된 정보를 검증하고 회원가입을 진행합니다.
   */
  const handleSignUp = () => {
    // 간단한 유효성 검사
    if (!name.trim() || !email.trim() || !password.trim()) {
      // TODO: 에러 메시지 표시
      return;
    }

    // 회원가입 처리 (현재는 login 함수를 사용하여 로그인 상태로 전환)
    login(email, name);
    // 회원가입 후 사용자 화면으로 이동
    onNavigate("user");
  };

  /**
   * 비밀번호 보기/숨기기 토글 함수
   */
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  /**
   * 뒤로가기 버튼 클릭 핸들러
   * 로그인 화면으로 이동합니다.
   */
  const handleBackPress = () => {
    onNavigate("login");
  };

  /**
   * Login 링크 클릭 핸들러
   * 로그인 화면으로 이동합니다.
   */
  const handleLoginPress = () => {
    onNavigate("login");
  };

  return (
    <SafeAreaView style={styles.signUpVersion1}>
      <View style={styles.view}>
        {/* 메인 컨텐츠 영역 */}
        <View style={styles.content}>
          <View style={styles.field}>
            {/* 상단 헤드라인 영역 */}
            <View style={styles.headline}>
              {/* Bus.y 로고 */}
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

              {/* 타이틀 및 설명 */}
              <View style={styles.text}>
                <Text style={[styles.signUp, styles.signUpFlexBox]}>
                  Sign up
                </Text>
                <Text style={[styles.createAnAccount, styles.emailTypo]}>
                  Create an account to continue!
                </Text>
              </View>
            </View>

            {/* 입력 필드 영역 */}
            <View style={styles.input}>
              <View style={styles.field2}>
                {/* 이름 입력 필드 */}
                <View style={styles.inputField}>
                  <View style={[styles.title, styles.titleFlexBox]}>
                    <Text style={[styles.email, styles.emailTypo]}>이름</Text>
                  </View>
                  <View style={styles.inputBorder}>
                    <TextInput
                      style={[styles.inputText, styles.labelTextTypo]}
                      placeholder="이름을 입력하세요"
                      placeholderTextColor="#6c7278"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* 이메일 입력 필드 */}
                <View style={styles.inputField}>
                  <View style={[styles.title, styles.titleFlexBox]}>
                    <Text style={[styles.email, styles.emailTypo]}>Email</Text>
                  </View>
                  <View style={styles.inputBorder}>
                    <TextInput
                      style={[styles.inputText, styles.labelTextTypo]}
                      placeholder="aaa@gmail.com"
                      placeholderTextColor="#6c7278"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* 비밀번호 입력 필드 */}
                <View style={styles.inputField}>
                  <View style={[styles.title, styles.titleFlexBox]}>
                    <Text style={[styles.email, styles.emailTypo]}>
                      Set Password
                    </Text>
                  </View>
                  <View style={[styles.inputArea3, styles.inputBorder]}>
                    <TextInput
                      style={[styles.inputText, styles.labelTextTypo]}
                      placeholder="*******"
                      placeholderTextColor="#6c7278"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!isPasswordVisible}
                    />
                    <TouchableOpacity
                      onPress={togglePasswordVisibility}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={ICONS.eyeOff}
                        style={styles.eyeOffIcon}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 회원가입 버튼 */}
              <TouchableOpacity
                style={styles.buttons}
                activeOpacity={0.8}
                onPress={handleSignUp}
              >
                <LinearGradient
                  style={styles.button}
                  locations={[0, 1]}
                  colors={["#007AFF", "#007AFF"]}
                  useAngle
                  angle={180}
                >
                  <Text style={[styles.labelText, styles.labelTextTypo]}>
                    Register
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* 하단 Login 링크 */}
          <View style={[styles.signUp2, styles.titleFlexBox]}>
            <Text style={[styles.alreadyHaveAn, styles.emailTypo]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={handleLoginPress} activeOpacity={0.7}>
              <Text style={[styles.login, styles.loginLayout]}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  signUpVersion1: {
    flex: 1,
    backgroundColor: "#F7F7F6",
  },
  signUpFlexBox: {
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
  loginLayout: {
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
  backButton: {
    padding: 4,
    marginLeft: -16,
  },
  arrowNarrowLeftIcon: {
    width: 24,
    height: 24,
  },
  text: {
    gap: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  signUp: {
    width: 327,
    fontSize: 32,
    letterSpacing: -0.6,
    lineHeight: 42,
    fontWeight: "700",
    fontFamily: "Inter-Bold",
    textAlign: "left",
    color: "#1a1c1e",
  },
  createAnAccount: {
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
  inputText: {
    flex: 1,
    color: "#1a1c1e",
    textAlign: "left",
  },
  inputArea3: {
    gap: 10,
  },
  eyeOffIcon: {
    height: 16,
    width: 16,
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
  signUp2: {
    gap: 6,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  alreadyHaveAn: {
    fontFamily: "Inter-Medium",
    lineHeight: 17,
    letterSpacing: -0.1,
    color: "#6c7278",
    fontSize: 12,
  },
  login: {
    textAlign: "left",
  },
  nativeStatusBar: {
    top: 0,
    height: 44,
    backgroundColor: "#F7F7F6",
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

export default SignUpVersion1;
