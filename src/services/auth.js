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
