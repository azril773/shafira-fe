import { getErrorMessage } from "../utils/utils";
import api from "./api";

export async function getUoms() {
  try {
    const response = await api.get("/uoms");
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: [], error: getErrorMessage(error) };
  }
}

export async function createUom({ code, name, description }) {
  try {
    const response = await api.post("/uoms", { code, name, description });
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateUom(id, { code, name, description }) {
  try {
    const response = await api.put(`/uoms/${id}`, { code, name, description });
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteUom(id) {
  try {
    const response = await api.delete(`/uoms/${id}`);
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
