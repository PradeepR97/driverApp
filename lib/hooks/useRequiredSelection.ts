import { useCallback, useState } from 'react';

/**
 * Reusable "required selection" validation for onboarding UIs (cards, radios, pickers).
 * Keeps error text stable and easy to clear on user action.
 */
export function useRequiredSelection<T>(message: string) {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const validate = useCallback(
    (value: T | null | undefined): value is T => {
      if (value == null) {
        setError(message);
        return false;
      }
      return true;
    },
    [message],
  );

  return { error, setError, clearError, validate };
}

