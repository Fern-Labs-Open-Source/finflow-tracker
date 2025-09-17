import { signOut } from 'next-auth/react';

interface FetchOptions extends RequestInit {
  data?: any;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      // Unauthorized - sign out the user
      await signOut({ redirect: true, callbackUrl: '/login' });
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    try {
      return JSON.parse(text);
    } catch {
      return text as unknown as T;
    }
  }

  async request<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { data, ...customOptions } = options;
    
    const config: RequestInit = {
      ...customOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(customOptions.headers || {}),
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    return this.handleResponse<T>(response);
  }

  // GET request
  get<T = any>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  post<T = any>(endpoint: string, data?: any, options?: Omit<FetchOptions, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  // PATCH request
  patch<T = any>(endpoint: string, data?: any, options?: Omit<FetchOptions, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', data });
  }

  // DELETE request
  delete<T = any>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'data'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
