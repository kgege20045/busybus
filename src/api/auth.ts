import api_client from "./client";

/**
 * 인증 관련 응답에서 사용할 사용자 타입 정의
 * - 백엔드 개발자가 실제 응답 스키마에 맞게 수정할 수 있습니다.
 */
export type Auth_user = {
  id: number;
  name: string;
  email: string;
};

/**
 * 로그인 / 회원가입 성공 시 공통 응답 타입
 * - token 필드는 JWT 등을 사용할 경우 선택적으로 포함될 수 있습니다.
 */
export type Auth_response = {
  user: Auth_user;
  token?: string;
};

/**
 * 회원가입 API
 * - 이름, 이메일, 비밀번호를 받아 Django 백엔드로 전송합니다.
 * - 백엔드에서는 동일한 요청 바디를 처리하도록 구현해야 합니다.
 */
export const register_user = async (
  name: string,
  email: string,
  password: string
): Promise<Auth_response> => {
  /**
   * TODO(백엔드 개발자용):
   * - 실제 엔드포인트 URL을 확인하여 경로를 수정하세요.
   *   예) /auth/register/ 또는 /users/register/ 등
   * - 현재는 /auth/register/ 로 가정합니다.
   */
  const response = await api_client.post<Auth_response>("/auth/register/", {
    name,
    email,
    password,
  });

  return response.data;
};

/**
 * 로그인 API
 * - 이메일, 비밀번호를 받아 Django 백엔드로 전송합니다.
 * - 성공 시 사용자 정보와 선택적으로 토큰을 반환받습니다.
 */
export const login_user = async (
  email: string,
  password: string
): Promise<Auth_response> => {
  /**
   * TODO(백엔드 개발자용):
   * - 실제 로그인 엔드포인트 URL을 확인하여 경로를 수정하세요.
   *   예) /auth/login/ 또는 /token/ 등
   * - 현재는 /auth/login/ 으로 가정합니다.
   */
  const response = await api_client.post<Auth_response>("/auth/login/", {
    email,
    password,
  });

  return response.data;
};
