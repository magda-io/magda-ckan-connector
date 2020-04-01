import { AspectBuilder } from "@magda/connector-sdk";
import path from "path";
import readFilesWithCache from "./readFilesWithCache";
import getJsonSchema from "./getJsonSchema";

async function loadAspectBuilderFiles(
    aspectBuilders: AspectBuilder[]
): Promise<AspectBuilder[]> {
    const schemaList: string[] = [];
    const textFileList: string[] = [];

    aspectBuilders.forEach(ab => {
        if (typeof ab.aspectDefinition.jsonSchema === "string") {
            const filePath = ab.aspectDefinition.jsonSchema;
            const fileName = path.basename(ab.aspectDefinition.jsonSchema);
            if (
                ab.aspectDefinition.jsonSchema.indexOf(
                    "@magda/registry-aspects/"
                ) === 0
            ) {
                schemaList.push(fileName);
            } else {
                textFileList.push(filePath);
            }
        }

        if (ab.builderFunctionString) {
            textFileList.push(ab.builderFunctionString);
        }

        if (ab.setupFunctionString) {
            textFileList.push(ab.setupFunctionString);
        }
    });

    const [schemaResult, textFileResult] = await Promise.all([
        getJsonSchema(schemaList),
        readFilesWithCache(textFileList)
    ]);

    aspectBuilders.forEach(ab => {
        if (typeof ab.aspectDefinition.jsonSchema === "string") {
            const filePath = ab.aspectDefinition.jsonSchema;
            const fileName = path.basename(ab.aspectDefinition.jsonSchema);
            if (
                ab.aspectDefinition.jsonSchema.indexOf(
                    "@magda/registry-aspects/"
                ) === 0
            ) {
                ab.aspectDefinition.jsonSchema = schemaResult[fileName];
            } else {
                ab.aspectDefinition.jsonSchema = textFileResult[filePath];
            }
        }

        if (ab.builderFunctionString) {
            ab.builderFunctionString = textFileResult[ab.builderFunctionString];
        }

        if (ab.setupFunctionString) {
            ab.setupFunctionString = textFileResult[ab.setupFunctionString];
        }
    });

    return aspectBuilders;
}

export default loadAspectBuilderFiles;
