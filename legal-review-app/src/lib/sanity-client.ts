import { PROJECT_ID, DATASET, API_VERSION } from "./constants";

/**
 * Lightweight fetch wrapper for Sanity APIs that need direct HTTP access
 * (History API, GROQ queries with joins).
 *
 * For most reads, prefer SDK hooks (useDocuments, useQuery).
 * This is for History API + complex mutations.
 */

const BASE_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}`;

interface FetchOptions {
  token?: string;
  signal?: AbortSignal;
}

/**
 * Execute a GROQ query directly.
 * Used when SDK hooks don't support the query pattern we need
 * (e.g., joining workflow-metadata with articles).
 */
export async function groqQuery<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}/data/query/${DATASET}`);
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  const headers: Record<string, string> = {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error(`GROQ query failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.result as T;
}

/**
 * Fetch a document at a specific revision via the History API.
 * Requires an API token with read access.
 */
export async function fetchDocumentAtRevision<T = unknown>(
  documentId: string,
  revision: string,
  options: FetchOptions = {}
): Promise<T | null> {
  const url = `${BASE_URL}/data/history/${DATASET}/documents/${documentId}?revision=${revision}`;

  const headers: Record<string, string> = {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, { headers, signal: options.signal });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(
      `History API failed: ${res.status} ${res.statusText}`
    );
  }

  // History API returns NDJSON — one document per line
  const text = await res.text();
  const firstLine = text.trim().split("\n")[0];
  if (!firstLine) return null;

  return JSON.parse(firstLine) as T;
}

/**
 * Fetch transaction history for a document.
 * Returns array of transactions with author + timestamp.
 */
export interface Transaction {
  id: string;
  timestamp: string;
  author: string;
  documentIDs: string[];
}

export async function fetchTransactions(
  documentId: string,
  options: FetchOptions & { since?: string } = {}
): Promise<Transaction[]> {
  let url = `${BASE_URL}/data/history/${DATASET}/transactions/${documentId}`;
  if (options.since) {
    url += `?fromTransaction=${options.since}`;
  }

  const headers: Record<string, string> = {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, { headers, signal: options.signal });

  if (!res.ok) {
    throw new Error(
      `Transactions API failed: ${res.status} ${res.statusText}`
    );
  }

  // NDJSON response
  const text = await res.text();
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Transaction);
}

/**
 * Mutate a document via the Mutations API.
 * Used for workflow state changes + approval log appends.
 */
export async function mutate(
  mutations: Record<string, unknown>[],
  options: FetchOptions = {}
): Promise<void> {
  const url = `${BASE_URL}/data/mutate/${DATASET}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ mutations }),
    signal: options.signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mutation failed: ${res.status} ${body}`);
  }
}
