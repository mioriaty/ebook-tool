const BASE_URL = typeof window !== "undefined" ? "" : "http://localhost:3000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }
  return response.json() as Promise<T>;
}

export const fetchClient = {
  async get<T>(url: string, options?: FetchOptions): Promise<T> {
    const searchParams = new URLSearchParams(options?.params);
    const queryString = searchParams.toString();
    const fullUrl = `${BASE_URL}${url}${queryString ? `?${queryString}` : ""}`;
    const response = await fetch(fullUrl, {
      ...options,
      method: "GET",
    });
    return handleResponse<T>(response);
  },

  async post<T>(
    url: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: "POST",
      headers: {
        ...(body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options?.headers,
      },
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async put<T>(
    url: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  async delete<T>(url: string, options?: FetchOptions): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      method: "DELETE",
    });
    return handleResponse<T>(response);
  },

  async download(url: string): Promise<Blob> {
    const response = await fetch(`${BASE_URL}${url}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  },

  async uploadFile<T>(url: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);
    return this.post<T>(url, formData);
  },
};
