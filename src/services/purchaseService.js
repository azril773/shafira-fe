import { getErrorMessage } from "../utils/utils";
import api from "./api";

export const purchaseService = {
  getAll: (params) => api.get("/purchases", { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post("/purchases", data),
  updateStatus: (id, data) => api.patch(`/purchases/${id}/status`, data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
};

export async function getVendors() {
  try {
    const response = await api.get("/purchases/vendors");
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
export async function createPurchase({ productId, vendorId, qty, purchaseDate }) {
  try {
    const response = await api.post("/purchases", {
      productId,
      vendorId,
      qty,
      purchaseDate
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
