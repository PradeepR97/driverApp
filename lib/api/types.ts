export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  message?: string;
  errorCode?: string;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export function isApiFailure(e: ApiEnvelope<unknown>): e is ApiFailure {
  return e.success === false;
}
