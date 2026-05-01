import { useCallback, useState } from 'react';
/**
 * Reusable "required selection" validation for onboarding UIs (cards, radios, pickers).
 * Keeps error text stable and easy to clear on user action.
 */
export function useRequiredSelection(message) {
    const [error, setError] = useState(null);
    const clearError = useCallback(() => setError(null), []);
    const validate = useCallback((value) => {
        if (value == null) {
            setError(message);
            return false;
        }
        return true;
    }, [message]);
    return { error, setError, clearError, validate };
}
