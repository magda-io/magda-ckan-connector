import { AspectBuilder } from "@magda/connector-sdk";
import loadAspectBuilderFiles from "./loadAspectBuilderFiles";

async function createBuilderOptions() {
    const datasetAspectBuilders: AspectBuilder[] = [
        {
            aspectDefinition: {
                id: "ckan-dataset",
                name: "CKAN Dataset",
                jsonSchema: "@magda/registry-aspects/ckan-dataset.schema.json"
            },
            builderFunctionString: "aspect-templates/ckan-dataset.js"
        },
        {
            aspectDefinition: {
                id: "dcat-dataset-strings",
                name: "DCAT Dataset properties as strings",
                jsonSchema:
                    "@magda/registry-aspects/dcat-dataset-strings.schema.json"
            },
            builderFunctionString: "aspect-templates/dcat-dataset-strings.js"
        },
        {
            aspectDefinition: {
                id: "source",
                name: "Source",
                jsonSchema: "@magda/registry-aspects/source.schema.json"
            },
            builderFunctionString: "aspect-templates/dataset-source.js"
        },
        {
            aspectDefinition: {
                id: "temporal-coverage",
                name: "Temporal Coverage",
                jsonSchema:
                    "@magda/registry-aspects/temporal-coverage.schema.json"
            },
            setupFunctionString: "aspect-templates/temporal-coverage-setup.js",
            builderFunctionString: "aspect-templates/temporal-coverage.js"
        }
    ];

    const distributionAspectBuilders: AspectBuilder[] = [
        {
            aspectDefinition: {
                id: "ckan-resource",
                name: "CKAN Resource",
                jsonSchema: "@magda/registry-aspects/ckan-resource.schema.json"
            },
            builderFunctionString: "aspect-templates/ckan-resource.js"
        },
        {
            aspectDefinition: {
                id: "dcat-distribution-strings",
                name: "DCAT Distribution properties as strings",
                jsonSchema:
                    "@magda/registry-aspects/dcat-distribution-strings.schema.json"
            },
            builderFunctionString:
                "aspect-templates/dcat-distribution-strings.js"
        },
        {
            aspectDefinition: {
                id: "source",
                name: "Source",
                jsonSchema: "@magda/registry-aspects/source.schema.json"
            },
            builderFunctionString: "aspect-templates/distribution-source.js"
        }
    ];

    const organizationAspectBuilders: AspectBuilder[] = [
        {
            aspectDefinition: {
                id: "source",
                name: "Source",
                jsonSchema: "@magda/registry-aspects/source.schema.json"
            },
            builderFunctionString: "aspect-templates/organization-source.js"
        },
        {
            aspectDefinition: {
                id: "organization-details",
                name: "Organization",
                jsonSchema:
                    "@magda/registry-aspects/organization-details.schema.json"
            },
            builderFunctionString: "aspect-templates/organization-details.js"
        }
    ];

    const result = await Promise.all([
        loadAspectBuilderFiles(datasetAspectBuilders),
        loadAspectBuilderFiles(distributionAspectBuilders),
        loadAspectBuilderFiles(organizationAspectBuilders)
    ]);

    return {
        datasetAspectBuilders: result[0],
        distributionAspectBuilders: result[1],
        organizationAspectBuilders: result[2]
    };
}

export default createBuilderOptions;
