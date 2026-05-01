import { useAppLoadingStore } from '@/lib/stores/app-loading-store';
/**
 * Counts in-flight API calls so {@link AppLoader} can show after a short delay (reduces flicker).
 */
export function attachGlobalLoaderInterceptor(api) {
    api.interceptors.request.use((config) => {
        if (!config.skipGlobalLoader) {
            useAppLoadingStore.getState().pushRequest();
        }
        return config;
    });
    const popIfTracked = (config) => {
        if (config?.skipGlobalLoader)
            return;
        useAppLoadingStore.getState().popRequest();
    };
    api.interceptors.response.use((response) => {
        popIfTracked(response.config);
        return response;
    }, (error) => {
        const cfg = error?.config;
        popIfTracked(cfg);
        return Promise.reject(error);
    });
}
