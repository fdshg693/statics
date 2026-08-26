import createClient from 'openapi-fetch';
import type { paths } from '../generated/api-types';

let apiClient: ReturnType<typeof createClient<paths>>;

export function initApiClient(baseUrl: string): void {
  apiClient = createClient<paths>({ baseUrl });
}

export function getApiClient(): ReturnType<typeof createClient<paths>> {
  if (!apiClient) {
    throw new Error('API client not initialized. Call initApiClient() first.');
  }
  return apiClient;
}
