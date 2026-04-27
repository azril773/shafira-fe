import { getErrorMessage } from "../utils/utils";
import api from "./api";

export const transactionService = {
  getAll: (params) => api.get("/transactions", { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post("/transactions", data),
  void: (id) => api.put(`/transactions/${id}/void`),
  refund: (id, data) => api.put(`/transactions/${id}/refund`, data),
};

export async function searchTransactions({ page, status, transactionNo, date }) {
  try {
    const params = new URLSearchParams({ page: String(page ?? 1) });
    if (status) params.append("status", status);
    if (transactionNo) params.append("transactionNo", transactionNo);
    if (date) params.append("date", date);
    const response = await api.get(`/transactions?${params.toString()}`);
    return {
      data: response.data.transactions,
      totalPages: response.data.totalPages,
      error: "",
    };
  } catch (error) {
    return { data: [], totalPages: 0, error: getErrorMessage(error) };
  }
}

export async function getTransactionById(id) {
  try {
    const response = await api.get(`/transactions/${id}`);
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createTransaction(payload) {
  try {
    const response = await api.post("/transactions", payload);
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function voidTransaction(id) {
  try {
    const response = await api.put(`/transactions/${id}/void`);
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function refundTransaction(id, { detailIds, reason }) {
  try {
    const response = await api.put(`/transactions/${id}/refund`, {
      detailIds,
      reason,
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
