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

  let url = endpoint?.startsWith("https://") ? endpoint : `${config.apiUrl}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const isFormData = typeof FormData !== 'undefined' && customOptions.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {};
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

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
  // If sending FormData, delete Content-Type so fetch/browser automatically generates multipart boundary
  if (isFormData) {
    delete (mergedHeaders as any)['Content-Type'];
    delete (mergedHeaders as any)['content-type'];
  }

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

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  },

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  },

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) => {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  },

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
