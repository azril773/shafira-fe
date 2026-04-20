import { getErrorMessage } from "../utils/utils";
import api from "./api";

export const productService = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export async function createProduct({ name, barcode, price, category }) {
  try {
    const response = await api.post("/products", {
      name,
      barcode,
      price,
      category,
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

export async function searchProduct({ page, code, barcode }) {
  try {
    console.log(page);
    const params = new URLSearchParams({ page });
    if (code) params.code = code;
    if (barcode) params.barcode = barcode;
    console.log(params.toString());
    const response = await api.get(`/products/search?${params.toString()}`, {});
    return {
      data: response.data.products,
      totalPages: response.data.totalPages,
      error: "",
    };
  } catch (error) {
    return {
      data: null,
      totalPages: 0,
      error: getErrorMessage(error),
    };
  }
}
