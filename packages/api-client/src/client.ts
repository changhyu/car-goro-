import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// 응답 데이터를 위한 기본 인터페이스
export interface ApiResponse {
  [key: string]: unknown;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey }),
        ...config.headers,
      },
    });

    // 응답 인터셉터 추가
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // 에러 처리 로직
        return Promise.reject(error);
      }
    );
  }

  async get<T = ApiResponse>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(path, config);
    return response.data;
  }

  async post<T = ApiResponse>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(path, data, config);
    return response.data;
  }

  async put<T = ApiResponse>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(path, data, config);
    return response.data;
  }

  async patch<T = ApiResponse>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(path, data, config);
    return response.data;
  }

  async delete<T = ApiResponse>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(path, config);
    return response.data;
  }

  // 인증 토큰 설정 메서드
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // 인증 토큰 제거 메서드
  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
} 