import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_CONFIG, STORAGE_KEYS, HTTP_STATUS } from '@constants/index';
import { useAuthStore } from '@store/authStore';
import { SecureStorageService } from '@utils/security';

interface ApiConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

class ApiClient {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStorageService.retrieveToken();
          if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error adding auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ApiConfig;

        // Handle 401 unauthorized
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest.skipAuth) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;

            try {
              const { refreshToken } = useAuthStore.getState();
              if (!refreshToken?.refreshToken) {
                throw new Error('No refresh token');
              }

              // Try to refresh token
              const response = await axios.post(
                `${API_CONFIG.BASE_URL}/auth/refresh`,
                { refreshToken: refreshToken.refreshToken }
              );

              const { token } = response.data;
              await SecureStorageService.storeToken(token.accessToken);

              // Update auth store
              useAuthStore.setState({ token });

              this.isRefreshing = false;

              // Retry failed requests
              this.processQueue(null);

              // Retry original request
              return this.instance(originalRequest);
            } catch (refreshError) {
              this.processQueue(refreshError);
              useAuthStore.setState({ isAuthenticated: false, user: null, token: null });
              this.isRefreshing = false;
              return Promise.reject(refreshError);
            }
          }

          // Queue request while token is being refreshed
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => this.instance(originalRequest));
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(null);
      }
    });
    this.failedQueue = [];
  }

  async get<T>(url: string, config?: ApiConfig) {
    try {
      const response = await this.instance.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: ApiConfig) {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: ApiConfig) {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch<T>(url: string, data?: any, config?: ApiConfig) {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: ApiConfig) {
    try {
      const response = await this.instance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          return { status, message, code: 'BAD_REQUEST' };
        case HTTP_STATUS.UNAUTHORIZED:
          return { status, message, code: 'UNAUTHORIZED' };
        case HTTP_STATUS.FORBIDDEN:
          return { status, message, code: 'FORBIDDEN' };
        case HTTP_STATUS.NOT_FOUND:
          return { status, message, code: 'NOT_FOUND' };
        case HTTP_STATUS.CONFLICT:
          return { status, message, code: 'CONFLICT' };
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return { status, message, code: 'INTERNAL_SERVER_ERROR' };
        default:
          return { status: error.response?.status || 0, message, code: 'UNKNOWN_ERROR' };
      }
    }

    return {
      status: 0,
      message: 'Network error',
      code: 'NETWORK_ERROR',
    };
  }

  getAxiosInstance() {
    return this.instance;
  }
}

export const apiClient = new ApiClient();
