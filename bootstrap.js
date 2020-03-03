"use strict";

const getStdin = require("get-stdin");

const handler = require("./dist/index");

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
                console.log(JSON.stringify(res));
            } else {
                process.stdout.write(res);
            }
        }; // cb ...

        const result = handler(val, cb);
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
