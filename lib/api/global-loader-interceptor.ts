import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { useAppLoadingStore } from '@/lib/stores/app-loading-store';

/**
 * Counts in-flight API calls so {@link AppLoader} can show after a short delay (reduces flicker).
 */
export function attachGlobalLoaderInterceptor(api: AxiosInstance): void {
  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!config.skipGlobalLoader) {
      useAppLoadingStore.getState().pushRequest();
    }
    return config;
  });

  const popIfTracked = (config?: InternalAxiosRequestConfig) => {
    if (config?.skipGlobalLoader) return;
    useAppLoadingStore.getState().popRequest();
  };

  api.interceptors.response.use(
    (response) => {
      popIfTracked(response.config as InternalAxiosRequestConfig);
      return response;
    },
    (error) => {
      const cfg = error?.config as InternalAxiosRequestConfig | undefined;
      popIfTracked(cfg);
      return Promise.reject(error);
    },
  );
}
