"use strict";

const getStdin = require("get-stdin");

const handlers = require("./dist/handlers");

getStdin()
    .then(val => {
        const cb = (err, res) => {
            if (err) {
                return console.error(err);
            }
            if (!res) {
                return;
            }
            if (Array.isArray(res) || isObject(res)) {
                process.stdout.write(JSON.stringify(res));
            } else {
                process.stdout.write(res);
            }
        }; // cb ...

        const inputData = JSON.parse(val);
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

        const result = handler(data, cb);
        if (result instanceof Promise) {
            result
                .then(data => cb(undefined, data))
                .catch(err => cb(err, undefined));
        }
    })
    .catch(e => {
        console.error(e.stack);
    });

const isObject = a => {
    return !!a && a.constructor === Object;
};
