export interface IHumanitecExtensionError {
  message(): string;
  details(): string;
}

export function isHumanitecExtensionError(
  error: any
): error is IHumanitecExtensionError {
  const isObject = error !== null && typeof error === 'object';
  if (isObject) {
    const hasMessage = 'message' in error;
    const hasDetails = 'details' in error;
    return hasMessage && hasDetails;
  }
  return false;
}
