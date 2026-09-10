import { config } from '../../app/config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...customOptions } = options;

  let url = `${config.apiUrl}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('notifyiq_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const wsString = localStorage.getItem('notifyiq_workspace');
  if (wsString) {
    try {
      const ws = JSON.parse(wsString);
      const wsId = ws?.id || ws?._id;
      if (wsId) {
        defaultHeaders['x-workspace-id'] = wsId;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const mergedHeaders = { ...defaultHeaders, ...headers };

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers: mergedHeaders,
    });

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('notifyiq_token');
      }
      throw new ApiError(
        response.status,
        data?.message || response.statusText || 'API Request Failed',
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, (error as Error).message || 'Network Connection Error');
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
