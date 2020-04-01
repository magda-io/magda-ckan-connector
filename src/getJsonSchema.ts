import resolvePkg from "resolve";
import path from "path";
import * as fse from "fs-extra";

type PlainObject = {
    [key: string]: string;
};

// --- cache resolve module dir promise
let resolveSchemaDirPromise: Promise<string> | null = null;
// --- cache load all schema promise
let loadAllSchemaPromise: Promise<PlainObject> | null = null;
// --- cache load one schema promies
const schemaPromiseList: {
    [key: string]: Promise<string>;
} = {};
// --- cache load one file promies
const filePromiseList: {
    [key: string]: Promise<string>;
} = {};

function resolveSchemaDir(): Promise<string> {
    return new Promise((resolve, reject) => {
        resolvePkg("@magda/registry-aspects/package.json", (err, res) => {
            if (err) {
                reject(err);
            } else {
                resolve(path.dirname(res));
            }
        });
    });
}

async function loadAllJsonSchemaFiles(dirPath: string): Promise<PlainObject> {
    const dirList = await fse.readdir(dirPath);
    if (!dirList.length) {
        return {};
    }
    const fileList: string[] = (
        await Promise.all(
            dirList
                .filter(p => path.extname(p).toLowerCase() === ".json")
                .map(async p => {
                    const state = await fse.lstat(p);
                    if (state.isDirectory()) {
                        return false;
                    }
                    return p;
                })
        )
    ).filter(item => item !== false) as string[];

    const schemaList = await Promise.all(
        fileList.map(async filePath => {
            if (!filePromiseList[filePath]) {
                filePromiseList[filePath] = fse.readJSON(filePath, {
                    encoding: "utf8"
                });
            }
            return await filePromiseList[filePath];
        })
    );

    const result: PlainObject = {};
    fileList.forEach((filePath, idx) => {
        const fileName = path.basename(filePath);
        result[fileName] = schemaList[idx];
    });
    return result;
}

async function schemaNameToPromise(
    schemaName: string,
    dirPath: string
): Promise<string> {
    let fileName = schemaName;
    const ext = path.extname(fileName);

    if (!ext || ext.toLowerCase() !== ".json") {
        fileName = fileName + ".json";
    }

    const filePath = path.resolve(dirPath, fileName);
    if (!filePromiseList[filePath]) {
        filePromiseList[filePath] = fse.readJSON(filePath, {
            encoding: "utf8"
        });
    }
    return await filePromiseList[filePath];
}

async function getJsonSchema(schemaNameList: string[] = []) {
    if (!resolveSchemaDirPromise) {
        resolveSchemaDirPromise = resolveSchemaDir();
    }
    const dirPath = await resolveSchemaDirPromise;
    if (!schemaNameList.length) {
        if (!loadAllSchemaPromise) {
            loadAllSchemaPromise = loadAllJsonSchemaFiles(dirPath);
        }
        return await loadAllSchemaPromise;
    } else {
        const schemaListPromise = schemaNameList.map(schemaName => {
            if (!schemaPromiseList[schemaName]) {
                schemaPromiseList[schemaName] = schemaNameToPromise(
                    schemaName,
                    dirPath
                );
            }
            return schemaPromiseList[schemaName];
        });
        const schemaList = await Promise.all(schemaListPromise);
        const result: PlainObject = {};
        schemaNameList.forEach(
            (schemaName, idx) => (result[schemaName] = schemaList[idx])
        );
        return result;
    }
}

export default getJsonSchema;
