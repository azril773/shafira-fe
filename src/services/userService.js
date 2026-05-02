import api from "./api";
import { getErrorMessage } from "../utils/utils";

export async function listUsers({ page = 1, status, role, search } = {}) {
  try {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append("status", status);
    if (role) params.append("role", role);
    if (search) params.append("search", search);
    const res = await api.get(`/users?${params.toString()}`);
    return {
      data: res.data.users || [],
      totalPages: res.data.totalPages || 1,
      error: "",
    };
  } catch (error) {
    return { data: [], totalPages: 0, error: getErrorMessage(error) };
  }
}

export async function createUser(payload) {
  try {
    const res = await api.post("/users", payload);
    return { data: res.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function registerUser(payload) {
  try {
    const res = await api.post("/users/register", payload);
    return { data: res.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function updateUser(id, payload) {
  try {
    const res = await api.put(`/users/${id}`, payload);
    return { data: res.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function approveUser(id, payload) {
  try {
    const res = await api.post(`/users/${id}/approve`, payload);
    return { data: res.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteUser(id) {
  try {
    const res = await api.delete(`/users/${id}`);
    return { data: res.data, error: "" };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
