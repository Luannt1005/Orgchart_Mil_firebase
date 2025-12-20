/**
 * Centralized API Client
 * Handles all HTTP requests with consistent error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: any) {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: any) {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: any) {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: any) {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();

/**
 * SWR Fetcher function with intelligent caching
 * Uses browser cache for GET requests
 */
export const swrFetcher = async (url: string) => {
  try {
    const response = await fetch(url, {
      // Use browser cache - only revalidate if cache is stale (default behavior)
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    console.log(`✓ Fetched from ${response.headers.get('x-from-cache') ? 'cache' : 'server'}: ${url}`);
    return data;
  } catch (error) {
    console.error('SWR Fetch Error:', error);
    throw error;
  }
};
