import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../api";
import { jwtDecode } from "jwt-decode";

export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user")) || null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => !!user.value?.isAdmin);

  const register = async (payload) => {
    return await api.post("/users/register", payload);
  };

  const login = async (payload) => {
    const response = await api.post("/users/login", payload);

    token.value = response.data.access;
    localStorage.setItem("token", token.value);

    const decoded = jwtDecode(token.value);

    user.value = {
      id: decoded.id,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      mobileNo: decoded.mobileNo,
      isAdmin: decoded.isAdmin
    };

    localStorage.setItem("user", JSON.stringify(user.value));

    return response;
  };

  const updateProfile = (data) => {
    return api.patch("/users/profile", data)
  }

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
  };
});
