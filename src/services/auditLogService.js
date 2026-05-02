import api from "./api";
import { getErrorMessage } from "../utils/utils";

export async function createAuditLog(payload) {
  try {
    const res = await api.post("/audit-logs", payload);
    return { data: res.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function listAuditLogs({ page = 1, action } = {}) {
  try {
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.append("action", action);
    const res = await api.get(`/audit-logs?${params.toString()}`);
    return {
      data: res.data.logs || [],
      totalPages: res.data.totalPages || 1,
      error: "",
    };
  } catch (error) {
    return { data: [], totalPages: 0, error: getErrorMessage(error) };
  }
}
