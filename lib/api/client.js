import axios from 'axios';

export const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong while contacting the server.';

    return Promise.reject(new Error(message));
  }
);

export function extractApiData(response) {
  return response?.data?.data ?? response?.data ?? {};
}

export function getErrorMessage(error) {
  return error?.message || 'Request failed';
}
