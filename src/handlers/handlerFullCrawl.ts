import Ckan from "../Ckan";
import {
    JsonConnector,
    AuthorizedRegistryClient as Registry
} from "@magda/connector-sdk";
import createTransformer from "../createTransformer";
import { builderOptions } from "../setup";
import getSecret from "../getSecret";

async function handlerDefault(context: any) {
    const argv = context;
    argv.jwtSecret = getSecret("jwt-secret");

    const ckan = new Ckan({
        baseUrl: argv.sourceUrl,
        id: argv.id,
        name: argv.name,
        pageSize: argv.pageSize,
        ignoreHarvestSources: argv.ignoreHarvestSources,
        allowedOrganisationNames: argv.allowedOrganisationNames,
        ignoreOrganisationNames: argv.ignoreOrganisationNames
    });

    const registry = new Registry({
        baseUrl: argv.registryUrl,
        jwtSecret: argv.jwtSecret,
        userId: argv.userId,
        tenantId: argv.tenantId
    });

    const transformerOptions = {
        ...builderOptions,
        id: argv.id,
        name: argv.name,
        sourceUrl: argv.sourceUrl,
        tenantId: argv.tenantId
    };

    const connector = new JsonConnector({
        source: ckan,
        transformer: createTransformer(transformerOptions),
        registry: registry
    });

    return connector.run().then(result => {
        return result.summarize();
    });
}

export default handlerDefault;
