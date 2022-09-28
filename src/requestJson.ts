import type { RequestInfo, RequestInit } from "node-fetch";
import fetch from "./fetch";
import fse from "fs-extra";
import path from "path";

const pkgPromise = fse.readJSON(path.resolve(__dirname, "../package.json"), {
    encoding: "utf-8"
});

async function requestJson<T = any>(
    url: RequestInfo,
    init?: RequestInit
): Promise<T> {
    const pkg = await pkgPromise;
    const res = await fetch(url, {
        headers: {
            "User-Agent": `${pkg.name}/${pkg.version}`
        }
    });
    if (!res.ok) {
        throw new Error(
            `Request to ${url} failed. Status code: ${res.status} ${res.statusText}`
        );
    }
    return (await res.json()) as T;
}

export default requestJson;
