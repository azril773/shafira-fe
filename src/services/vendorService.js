import { getErrorMessage } from "../utils/utils";
import api from "./api";

export async function createVendor({ name, phone }) {
  try {
    const response = await api.post("/vendors", {
      name,
      phone,
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
export async function updateVendor({id, name, phone }) {
  try {
    const response = await api.put(`/vendors/${id}`, {
      name,
      phone,
    });
    return { data: response.data, error: "" };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}


export async function searchVendor({ page, name, phone }) {
  try {
    console.log(page);
    const params = new URLSearchParams({ page });
    if (name) params.name = name;
    if (phone) params.phone = phone;
    console.log(params.toString());
    const response = await api.get(`/vendors/search?${params.toString()}`, {});
    return {
      data: response.data.vendors,
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
