import type { RequestInfo, RequestInit } from "node-fetch";
import _importDynamic from "./_importDynamic";

export default async function fetch(url: RequestInfo, init?: RequestInit) {
    const { default: fetch } = await _importDynamic<
        typeof import("node-fetch")
    >("node-fetch");
    return fetch(url, init);
}
