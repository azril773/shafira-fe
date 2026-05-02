import { getErrorMessage } from "../utils/utils";
import api from "./api";

export const productService = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export async function getProducts() {
  try {
    const response = await api.get("/products");
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: [],
      error: getErrorMessage(error),
    };
  }
}
export async function createProduct({ name, barcode, category, prices, uomId }) {
  try {
    const response = await api.post("/products", {
      name,
      barcode,
      category,
      ...(prices ? { prices } : {}),
      ...(uomId ? { uomId } : {}),
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
export async function updateProduct({id, name, barcode, category, prices, uomId }) {
  try {
    const response = await api.put(`/products/${id}`, {
      name,
      barcode,
      category,
      ...(prices ? { prices } : {}),
      uomId: uomId ?? null,
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}


export async function searchProduct({ page, code, barcode, name }) {
  try {
    const params = new URLSearchParams({ page: String(page ?? 1) });
    if (code) params.append("code", code);
    if (barcode) params.append("barcode", barcode);
    if (name) params.append("name", name);
    const response = await api.get(`/products/search?${params.toString()}`, {});
    return {
      data: response.data.products,
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
