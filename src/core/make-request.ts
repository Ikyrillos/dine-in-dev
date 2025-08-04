import {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import axiosInterceptorInstance from './axios-config';

/**
 * Simulates a fake asynchronous Axios request with a specified loading time.
 *
 * @template TRequest - The type of data to be sent in the request.
 * @template TResponse - The expected type of the response.
 * @param {AxiosRequestConfig<TRequest>} config - The Axios request
 * configuration object.
 * @param {TResponse} response - The fake response to be resolved after the
 * specified loading time.
 * @param {Object} [options] - Optional settings for the fake request.
 * @param {number} [options.loadingTime=1000] - The duration (in milliseconds)
 * to simulate the request loading time.
 * @param {boolean} [options.error=AxiosError] - If true, simulates an error
 * being thrown during the request.
 * @returns {Promise<TResponse>} A Promise that resolves with the fake response
 * after the loading time.
 *
 * @example
 * // Simulate a successful request with a custom loading time of 500 milliseconds
 * const response = await makeFakeRequest(config, fakeData, { loadingTime: 500 });
 *
 * @example
 * // Simulate a request that throws an error after the default loading time (1000 milliseconds)
 * try {
 *   const response = await makeFakeRequest(config, fakeData, { error: new AxiosError('Something went wrong') });
 * } catch (error) {
 *   console.error(error.message); // Output: Error: Something went wrong
 * }
 */
export function makeFakeRequest<TRequest, TResponse>(
  config: AxiosRequestConfig<TRequest>,
  response: TResponse,
  options?: { loadingTime?: number; error?: AxiosError }
): Promise<AxiosResponse<TResponse, TRequest>> {
  return new Promise((resolve, reject) => {
    setTimeout(
      () => {
        if (options?.error) {
          reject(options.error);
        } else {
          resolve({
            data: response,
            status: 200,
            statusText: 'OK',
            config: config as InternalAxiosRequestConfig<TRequest>,
            headers: {},
            request: {},
          });
        }
      },
      options?.loadingTime ?? 1000
    );
  });
}

/**
 * Makes an HTTP request using Axios.
 *
 * @param config - The config parameter is an object that contains the
 * configuration options for making an HTTP request using Axios. It can include
 * properties such as url, method, headers, params, data, and more.
 *
 */
export const makeRequest = async <TRequest, TResponse>(
  config: AxiosRequestConfig<TRequest> & { isFormData?: boolean }
): Promise<AxiosResponse<TResponse, TRequest>> => {
  try {
    // Handle FormData configuration
    const headers = {
      ...config.headers,
      ...(config.isFormData
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' }),
    };

    // If data is FormData, don't transform it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformRequest = config.isFormData ? [(data: any) => data] : undefined;

    return await axiosInterceptorInstance.request({
      ...config,
      headers,
      transformRequest,
      withCredentials: true,
      params: config.params,
    });
  } catch (error) {
    throw error;
  }
};