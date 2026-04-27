import { getErrorMessage } from "../utils/utils";
import api from "./api";

export const purchaseService = {
  getAll: (params) => api.get("/purchases", { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post("/purchases", data),
  updateStatus: (data) => api.put(`/purchases/change-status`, data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
};

export async function getVendors() {
  try {
    const response = await api.get("/vendors");
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
    };
  }
}

export async function createPurchase({ vendorId, purchaseDate, details }) {
  try {
    const response = await api.post("/purchases", {
      vendorId,
      purchaseDate,
      details,
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

export async function searchPurchase({ page, status, vendorId, productId, purchaseDate }) {
  try {
    const params = new URLSearchParams({ page: page || 1 });
    if (status) params.append("status", status);
    if (vendorId) params.append("vendorId", vendorId);
    if (productId) params.append("productId", productId);
    if (purchaseDate) params.append("purchaseDate", purchaseDate);
    const response = await api.get(`/purchases?${params.toString()}`);
    return {
      data: response.data.purchases,
      totalPages: response.data.totalPages,
      error: "",
    };
  } catch (error) {
    return {
      data: [],
      totalPages: 0,
      error: getErrorMessage(error),
    };
  }
}

export async function getPurchaseById(id) {
  try {
    const response = await api.get(`/purchases/${id}`);
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updatePurchase({ id, vendorId, purchaseDate, details }) {
  try {
    const response = await api.put(`/purchases/${id}`, {
      ...(vendorId ? { vendorId } : {}),
      ...(purchaseDate ? { purchaseDate } : {}),
      ...(details ? { details } : {}),
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updatePurchaseStatus({ id, status }) {
  try {
    const response = await api.put(`/purchases/change-status`, { id, status });
    return { data: response.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
