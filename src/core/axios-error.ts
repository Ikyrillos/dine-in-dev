import { AxiosError } from "axios";

export function parseAxiosError(error: AxiosError): string {
    const message = (error.response?.data as { message?: string })?.message;
    return message || error.message;
}
