"use strict";

const getStdin = require("get-stdin");

const handlers = require("./dist/handlers");

const isObject = a => {
    return !!a && a.constructor === Object;
};

(async () => {
    try {
        const input = await getStdin();
        const inputData = JSON.parse(input);
        if (!inputData) {
            throw new Error("Invalid input data, require an object.");
        }

        // --- merge with env variables
        const data = {
            ...(process.env ? process.env : {}),
            ...inputData
        };

        let handler;

        if (!data.handler) {
            handler = handlers.default;
        } else {
            handler = handlers[data.handler];
        }

        if (typeof handler !== "function") {
            throw new Error(
                `Can't locate requested handler: ${
                    data.handler ? data.handler : "default"
                }`
            );
        }

        const result = await handler(data);

        if (Array.isArray(result) || isObject(result)) {
            process.stdout.end(JSON.stringify(result), "utf8");
        } else if (typeof result === "string") {
            process.stdout.end(result, "utf8");
        } else {
            process.stdout.end(" ", "utf8");
        }
        process.stdout.destroy();
        process.exit();
    } catch (e) {
        process.stderr.end(JSON.stringify(e), "utf8");
        process.exit(1);
    }
})();
