import { FormError } from "./FormError";
export function FormErrorText({ error }) {
    return <FormError message={error} visible={!!error}/>;
}
