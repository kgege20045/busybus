import axios, { AxiosInstance } from "axios";

/**
 * 공통 API 클라이언트
 * - 모든 HTTP 요청에 공통 설정(baseURL, timeout 등)을 적용합니다.
 * - 나중에 토큰 기반 인증이 필요해지면 이 파일의 인터셉터만 수정하면 됩니다.
 */
const create_api_client = (): AxiosInstance => {
  /**
   * 기본 axios 인스턴스 생성
   * TODO: 백엔드 개발자가 실제 서버 주소 및 프리픽스를 확인 후 baseURL을 수정해야 합니다.
   *
   * - 안드로이드 에뮬레이터: http://10.0.2.2:8000
   * - iOS 시뮬레이터: http://localhost:8000
   * - 실제 기기: http://<PC_로컬_IP>:8000
   */
  const api_client = axios.create({
    baseURL: "http://10.0.2.2:8000/api",
    timeout: 10000,
    withCredentials: true,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  /**
   * 요청 인터셉터
   * - 향후 JWT 토큰 등을 사용할 경우, 이 지점에서 Authorization 헤더를 설정합니다.
   */
  api_client.interceptors.request.use(
    (config) => {
      // 디버깅: 요청 정보 로깅
      console.log("API 요청:", {
        url: config.url,
        method: config.method,
        baseURL: config.baseURL,
        withCredentials: config.withCredentials,
      });
      
      // TODO: 토큰 기반 인증을 사용할 경우, 여기에 토큰을 추가합니다.
      // const token = await load_auth_token();
      // if (token) {
      //   config.headers = config.headers ?? {};
      //   config.headers.Authorization = `Bearer ${token}`;
      // }

      return config;
    },
    (error) => {
      // 요청 설정 중 에러가 발생한 경우
      console.error("요청 설정 중 오류가 발생했습니다.", error);
      return Promise.reject(error);
    }
  );

  /**
   * 응답 인터셉터
   * - 공통 에러 로깅을 수행합니다.
   * - 실제 화면에서는 구체적인 에러 메시지를 숨기고 일반적인 안내 문구를 사용해야 합니다.
   */
  api_client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error("서버 통신 중 오류가 발생했습니다.", {
        message: error.message,
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );

  return api_client;
};

/**
 * 외부에서 사용할 공통 API 클라이언트 인스턴스
 */
const api_client = create_api_client();

export default api_client;


