import type { RequestInfo, RequestInit } from "node-fetch";
import fetch from "./fetch";

async function requestJson<T = any>(
    url: RequestInfo,
    init?: RequestInit
): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(
            `Request to ${url} failed. Status code: ${res.status} ${res.statusText}`
        );
    }
    return (await res.json()) as T;
}

export default requestJson;
