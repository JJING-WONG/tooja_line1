import { apiClient } from "../../../apis/client";

interface CsrfResponse {
  csrfToken: string;
}

export const getInvestorCsrf = async (): Promise<CsrfResponse> => {
  const response = await apiClient.get<CsrfResponse>("/investor/csrf");

  return response.data;
};