import { AxiosError } from "axios";
import api from "./api";
import { getErrorMessage } from "../utils/utils";

export async function loginApi(username, password) {
  try {
    const response = await api.post("/auth/login", { username, password });
    const data = response.data;
    return { data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

export async function verifyAdminApi(username, password) {
  try {
    const response = await api.post("/auth/verify-admin", { username, password });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
