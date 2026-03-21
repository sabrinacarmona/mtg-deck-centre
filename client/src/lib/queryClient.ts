import { QueryClient, QueryFunction } from "@tanstack/react-query";

// In dev mode both frontend and backend share the same port (5000),
// so relative URLs work. For deployed builds, __PORT_5000__ is replaced
// by the deploy proxy prefix.
const API_BASE = "";

/** Make a fetch request to the Express backend */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const fullUrl = `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(errBody.error || `Request failed: ${res.status}`);
  }

  return res;
}

// ===== Query client setup =====

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: _unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    const res = await apiRequest("GET", url);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
