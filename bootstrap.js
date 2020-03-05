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
            process.stdout.write(JSON.stringify(result));
        } else {
            process.stdout.write(result);
        }
    } catch (e) {
        console.error(e);
    }
})();
