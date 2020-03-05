"use strict";

const express = require("express");
const app = express();
const handlers = require("./dist/handlers");
const bodyParser = require("body-parser");

const isArray = a => {
    return !!a && a.constructor === Array;
};

const isObject = a => {
    return !!a && a.constructor === Object;
};

if (process.env.RAW_BODY === "true") {
    app.use(bodyParser.raw({ type: "*/*" }));
} else {
    var jsonLimit = process.env.MAX_JSON_SIZE || "100kb"; //body-parser default
    app.use(bodyParser.json({ limit: jsonLimit }));
    app.use(bodyParser.raw()); // "Content-Type: application/octet-stream"
    app.use(bodyParser.text({ type: "text/*" }));
}

app.disable("x-powered-by");

function parseJson(str) {
    try {
        const data = JSON.parse(str);
        return data;
    } catch (e) {
        return null;
    }
}

const middleware = async (req, res) => {
    try {
        let inputData = {
            req: {
                body: req.body,
                headers: req.headers,
                method: req.method,
                query: req.query,
                path: req.path
            },
            ...(process.env ? process.env : {})
        };

        // --- consolidate all input (including possible env vars)
        if (req.body) {
            if (typeof req.body === "string") {
                const jsonData = parseJson(req.body);
                if (isObject(inputData)) {
                    inputData = {
                        ...inputData,
                        ...jsonData
                    };
                } else if (isArray(inputData)) {
                    inputData.req.body = inputData;
                }
            } else if (isObject(req.body)) {
                inputData = {
                    ...inputData,
                    ...req.body
                };
            }
        }

        let handler;

        if (!inputData.handler) {
            handler = handlers.default;
        } else {
            handler = handlers[inputData.handler];
        }

        if (typeof handler !== "function") {
            throw new Error(
                `Can't locate requested handler: ${
                    inputData.handler ? inputData.handler : "default"
                }`
            );
        }

        const result = await handler(inputData);

        if (Array.isArray(result) || isObject(result)) {
            res.status(200).json(result);
        } else if (typeof result === "string") {
            res.set("Content-Type", "text/plain");
            res.status(200).send(result);
        } else {
            res.set("Content-Type", "text/plain");
            if (typeof result === "undefined" || result === null) {
                res.status(200).end();
            } else {
                res.status(200).send("" + result);
            }
        }
    } catch (e) {
        console.error(e);
        res.status(500).send(e);
    }
};

app.post("/*", middleware);
app.get("/*", middleware);
app.patch("/*", middleware);
app.put("/*", middleware);
app.delete("/*", middleware);

const port = process.env.http_port || 3000;

app.listen(port, () => {
    console.log(`OpenFaaS Node.js listening on port: ${port}`);
});
