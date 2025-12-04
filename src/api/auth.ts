import api_client from "./client";

/**
 * 인증 관련 응답에서 사용할 사용자 타입 정의
 * - 백엔드 Django User 모델에 맞춤
 */
export type Auth_user = {
  id: number;
  username: string;
  email?: string;
  name?: string; // name은 username과 동일하게 사용
};

/**
 * 로그인 / 회원가입 성공 시 공통 응답 타입
 * - 백엔드 응답 형식에 맞춤
 */
export type Auth_response = {
  message?: string;
  username?: string;
  user?: Auth_user;
  token?: string;
};

/**
 * 현재 사용자 정보 응답 타입
 */
export type CurrentUserResponse = {
  is_authenticated: boolean;
  username?: string;
};

/**
 * 회원가입 API
 * - 백엔드 엔드포인트: /api/auth/signup/
 * - 백엔드는 username과 password만 받습니다.
 * - email을 username으로 사용합니다.
 */
export const register_user = async (
  name: string,
  email: string,
  password: string
): Promise<Auth_response> => {
  try {
    // 백엔드는 username과 password만 받으므로 email을 username으로 사용
    const response = await api_client.post<Auth_response>("/auth/signup/", {
      username: email, // email을 username으로 사용
      password,
    });

    // 백엔드 응답 형식에 맞게 변환
    return {
      message: response.data.message,
      username: response.data.username,
      user: {
        id: 0, // 백엔드에서 제공하지 않음
        username: response.data.username || email,
        email: email,
        name: name,
      },
    };
  } catch (error: any) {
    // 에러 응답 처리
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * 로그인 API
 * - 백엔드 엔드포인트: /api/auth/login/
 * - 백엔드는 username과 password를 받습니다.
 * - email을 username으로 사용합니다.
 */
export const login_user = async (
  email: string,
  password: string
): Promise<Auth_response> => {
  try {
    console.log("로그인 요청 시작:", { email, password: "***" });
    
    // 백엔드는 username과 password만 받으므로 email을 username으로 사용
    const response = await api_client.post<Auth_response>("/auth/login/", {
      username: email, // email을 username으로 사용
      password,
    });

    console.log("로그인 응답:", response.data);

    // 백엔드 응답 형식에 맞게 변환
    return {
      message: response.data.message,
      username: response.data.username,
      user: {
        id: 0, // 백엔드에서 제공하지 않음
        username: response.data.username || email,
        email: email,
        name: response.data.username || email,
      },
    };
  } catch (error: any) {
    console.error("로그인 API 에러 상세:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        data: error?.config?.data,
      },
    });
    
    // 에러 응답 처리
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * 로그아웃 API
 * - 백엔드 엔드포인트: /api/auth/logout/
 */
export const logout_user = async (): Promise<void> => {
  try {
    await api_client.post("/auth/logout/");
  } catch (error: any) {
    // 에러 응답 처리
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

/**
 * 현재 사용자 정보 조회 API
 * - 백엔드 엔드포인트: /api/auth/me/
 * - 앱 시작 시 로그인 상태 확인에 사용
 */
export const get_current_user = async (): Promise<CurrentUserResponse> => {
  try {
    const response = await api_client.get<CurrentUserResponse>("/auth/me/");
    return response.data;
  } catch (error: any) {
    // 에러 발생 시 로그인되지 않은 것으로 처리
    return { is_authenticated: false };
  }
};


