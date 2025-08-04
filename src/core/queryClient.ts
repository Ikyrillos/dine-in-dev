// src/queryClient.ts
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";

interface ValidationError {
	type: string;
	message: string;
	path: string;
	location: string;
}
interface DetailedErrorResponse {
	error: {
		status: number;
		message: string;
		hints: string[];
		errors: ValidationError[];
		stack?: string;
	};
}

const queryClient = new QueryClient({
	queryCache: new QueryCache({ onError: (error) => handleQueryError(error) }),
	mutationCache: new MutationCache({
		onError: (error) => handleQueryError(error),
	}),
});

const ERROR_MESSAGES: {
	[key: number]: string;
} = {
	400: "Bad Request: The server couldn't understand the request.",
	401: "Unauthorized: Please log in again.",
	403: "Forbidden: You don't have permission to access this resource.",
	404: "Not Found: The requested resource doesn't exist.",
	409: "Conflict: There's a problem with the current state of the resource.",
	422: "Validation Error: Please check your input.",
	500: "Server Error: Something went wrong on our end.",
	502: "Bad Gateway: The server is temporarily unavailable.",
	503: "Service Unavailable: The server is overloaded or down for maintenance.",
	504: "Gateway Timeout: The server didn't respond in time."
};

const handleQueryError = (error: unknown) => {
	let message = "";
	// get the current path 
	// log the path
	if (axios.isAxiosError(error)) {
		const axiosError = error as AxiosError<DetailedErrorResponse>;

		if (axiosError.response) {
			// The request was made and the server responded with a status code
			const status = axiosError.response.status;

			if (status >= 400 && status < 500) {
				// Client errors (4xx) - Show a warning toast
				const errorMessage = ERROR_MESSAGES[status] || "Client Error: Something went wrong.";

				if (process.env.NODE_ENV === "development") {
					message += `HTTP ${status}: `;
				}
				message += `${errorMessage}`;
			} else if (status >= 500) {
				// Server errors (5xx) - Show an error toast
				if (process.env.NODE_ENV === "development") {
					message += `HTTP ${status}: `;
				}
				message += "Internal Server Error";
			}

			
			
		}
	}
};
export default queryClient;
