import { ApiResponse } from "../interfaces/api-response";
import { PaginatedResponse } from "../interfaces/paginated-response";

export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data as T;
  }
  throw new Error(response.message);
}
export function handlePaginatedResponse<T>(
  response: PaginatedResponse<T>
): PaginatedResponse<T> {
  if (response.success) {
    return response;
  }
  throw new Error(response.message);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();
}

export function formatCustomDateTime(dateString: string): string {
  const date = new Date(dateString);

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12; // Convert to 12-hour format
  const formattedTime = `${hours
    .toString()
    .padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;

  return `${day} ${month} ${year}, ${formattedTime}`;
}
