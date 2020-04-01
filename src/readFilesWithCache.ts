import * as fse from "fs-extra";

type PlainObject = {
    [key: string]: string;
};

const filePromiseList: {
    [key: string]: Promise<string>;
} = {};

async function readFileWithCache(path: string) {
    if (!filePromiseList[path]) {
        filePromiseList[path] = fse.readFile(path, { encoding: "utf8" });
    }
    return await filePromiseList[path];
}

/**
 * Read a list of text file asynchronously at the same time
 *
 * @param {string[]} filePaths
 * @returns
 */
async function readFilesWithCache(filePaths: string[]) {
    const fileResult = await Promise.all(
        filePaths.map(fp => readFileWithCache(fp))
    );
    const result: PlainObject = {};
    filePaths.forEach((filePath, idx) => {
        result[filePath] = fileResult[idx];
    });
    return result;
}

export default readFilesWithCache;
