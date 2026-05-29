import "server-only";

const DAILY_BASE = "https://api.daily.co/v1";

function getApiKey(): string {
  const key = process.env.DAILY_CO_API_KEY;
  if (!key) throw new DailyApiError(500, "DAILY_CO_API_KEY ortam değişkeni eksik");
  return key;
}

export class DailyApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "DailyApiError";
  }
}

async function dailyFetch<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${DAILY_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new DailyApiError(res.status, detail);
  }

  if (method === "DELETE") return {} as T;
  return res.json() as Promise<T>;
}

export const dailyApi = {
  get:    <T>(path: string)                => dailyFetch<T>("GET",    path),
  post:   <T>(path: string, body: unknown) => dailyFetch<T>("POST",   path, body),
  delete: <T>(path: string)               => dailyFetch<T>("DELETE", path),
};
