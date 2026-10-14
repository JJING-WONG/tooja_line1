import axios from "axios";

// axios 인스턴스 생성 함수
export const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true, // HttpOnly 세션 쿠키를 사용하는 방식
});