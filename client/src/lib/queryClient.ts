import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Support both REST-style (method, url, data) and simple GET (url) API requests
export async function apiRequest<T = any>(
  urlOrConfig: string | { method: string; url: string; body?: string | object },
  options?: RequestInit
): Promise<T> {
  let url: string;
  let config: RequestInit = { ...options };
  
  // Handle different calling styles
  if (typeof urlOrConfig === 'string') {
    url = urlOrConfig;
    config.method = options?.method || 'GET';
  } else {
    url = urlOrConfig.url;
    config.method = urlOrConfig.method;
    if (urlOrConfig.body) {
      config.headers = { 
        ...config.headers,
        'Content-Type': 'application/json'
      };
      config.body = typeof urlOrConfig.body === 'string' 
        ? urlOrConfig.body 
        : JSON.stringify(urlOrConfig.body);
    }
  }
  
  config.credentials = 'include';
  
  const res = await fetch(url, config);
  await throwIfResNotOk(res);
  
  // Parse JSON response if it exists
  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  
  return res.text() as unknown as T;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
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
