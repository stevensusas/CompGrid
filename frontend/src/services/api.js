// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000'; // Adjust as needed

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getInstances = async () => {
  const response = await api.get('/user/instances');
  return response.data;
};

export const addInstance = async (instanceData) => {
  const response = await api.post('/owner/instances', instanceData);
  return response.data;
};

export const startInstance = async (instanceName) => {
  const response = await api.post(`/user/instances/${instanceName}/start`);
  return response.data;
};

export const stopInstance = async (instanceName, stopType = "stop") => {
  const response = await api.post(`/user/instances/${instanceName}/stop`, { stop_type: stopType });
  return response.data;
};

export const requestInstance = async (instanceName) => {
  const response = await api.post(`/user/instances/${instanceName}/request`);
  return response.data;
};
