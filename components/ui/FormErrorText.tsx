import { FormError } from "./FormError";

export function FormErrorText({ error }: { error?: string | null }) {
  return <FormError message={error} visible={!!error} />;
}
