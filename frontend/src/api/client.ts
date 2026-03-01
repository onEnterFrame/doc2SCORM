import axios from "axios";

const api = axios.create({
  baseURL: "/",
  timeout: 300000, // 5 min for long generation calls
});

export default api;
