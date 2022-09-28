import Ckan from "../Ckan";
import createBuilderOptions from "../createBuilderOptions";
import URI from "urijs";
import { forEachAsync } from "@magda/utils";
import { Record } from "@magda/connector-sdk";
import requestJson from "../requestJson";
import createTransformerFromOption from "../createTransformer";

export type RemoteDataHandlingResult = {
    dataset: Record;
    distributions: Record[];
};

const REGEX_CKAN_DATASET_API_URL = /\/api\/3\/action\/package_show/i;
const REGEX_CKAN_DISTRIBUTION_API_URL = /\/api\/3\/action\/resource_show/i;
const REGEX_CKAN_SITE_DATASET_URL = /\/dataset\/.+/i;
const REGEX_CKAN_SITE_DISTRIBUTION_URL = /\/dataset\/.+\/resource\/.+/i;

/**
 * A handler takes a url (from params.remoteDataUrl) and then:
 * - Check whether it's a Ckan related URL. i.e. any of those:
 *   - Whether it's a ckan dataset API url. e.g. https://demo.ckan.org/api/3/action/package_show?id=nombres-masculinos-mas-frecuentes-en-la-provincia-de-barcelona
 *   - Whether it's a ckan distribution API url. e.g. https://demo.ckan.org/api/3/action/resource_show?id=a6a23cd9-f2b7-4ed2-a4b8-a7ab593b01d7
 *   - Whether it's a ckan system user facing dataset URL. e.g. https://demo.ckan.org/dataset/nombres-masculinos-mas-frecuentes-en-la-provincia-de-barcelona
 *   - Whether it's a ckan system user facing distribution URL. e.g. https://demo.ckan.org/dataset/nombres-masculinos-mas-frecuentes-en-la-provincia-de-barcelona/resource/a6a23cd9-f2b7-4ed2-a4b8-a7ab593b01d7
 * - If the url doesn't match any of those pattern above, throw an error
 * - Otherwise, process accordingly and return transformed data.
 *
 * This handler will try to retrieve both dataset & distribution data for any of url patterns above.
 *
 * @param {*} params
 * @returns {Promise<RemoteDataHandlingResult>}
 */
async function handlerRemoteDataUrl(
    context: any
): Promise<RemoteDataHandlingResult> {
    let remoteDataUrl =
        typeof context.req.body === "string" && !context.remoteDataUrl
            ? context.req.body
            : context.remoteDataUrl;

    if (!remoteDataUrl || typeof remoteDataUrl !== "string") {
        throw new Error("Can't locate remote data url!");
    }

    remoteDataUrl = remoteDataUrl.trim();

    if (REGEX_CKAN_DATASET_API_URL.test(remoteDataUrl)) {
        return await processDatasetAPIUrl(remoteDataUrl);
    } else if (REGEX_CKAN_DISTRIBUTION_API_URL.test(remoteDataUrl)) {
        return await processDistributionAPIUrl(remoteDataUrl);
    } else if (REGEX_CKAN_SITE_DISTRIBUTION_URL.test(remoteDataUrl)) {
        return await processDistributionWebUrl(remoteDataUrl);
    } else if (REGEX_CKAN_SITE_DATASET_URL.test(remoteDataUrl)) {
        return await processDatasetWebUrl(remoteDataUrl);
    } else {
        throw new Error("Not valid CKAN system URL.");
    }
}

function getHost(url: string) {
    const uri = new URI(url);
    const host = uri.domain();
    if (!host) {
        throw new Error(
            "Invalid remote data url: domain is missing from the URL."
        );
    }
    return host;
}

function getBaseUrl(url: string) {
    const uri = new URI(url);
    let segments;

    if (
        REGEX_CKAN_DATASET_API_URL.test(url) ||
        REGEX_CKAN_DISTRIBUTION_API_URL.test(url)
    ) {
        segments = uri.segment().slice(0, uri.segment().indexOf("api"));
    } else {
        segments = uri.segment().slice(0, uri.segment().indexOf("dataset"));
    }

    return uri.clone().segment(segments).query("").fragment("").toString();
}

function createSource(url: string) {
    const host = getHost(url);
    const baseUrl = getBaseUrl(url);

    return new Ckan({
        baseUrl: baseUrl,
        id: host,
        name: host
    });
}

async function createTransformer(url: string) {
    const host = getHost(url);
    const baseUrl = getBaseUrl(url);

    const transformerOptions = {
        ...(await createBuilderOptions()),
        id: host,
        name: host,
        sourceUrl: baseUrl,
        tenantId: 0
    };

    return createTransformerFromOption(transformerOptions);
}

async function processDatasetAPIUrl(
    url: string
): Promise<RemoteDataHandlingResult> {
    const uri = new URI(url);
    const query = uri.search(true);
    const datasetId = query.id;
    if (!datasetId) {
        throw new Error("Can't locate dataset ID from the URL.");
    }

    const source = createSource(url);
    const transformer = await createTransformer(url);

    const datasetJson = await source.getJsonDataset(datasetId);
    const datasetData = transformer.datasetJsonToRecord(datasetJson);
    const result: RemoteDataHandlingResult = {
        dataset: datasetData,
        distributions: []
    };

    const distributions = source.getJsonDistributions(datasetJson);
    if (distributions) {
        await forEachAsync(distributions, 1, async (distribution) => {
            result.distributions.push(
                transformer.distributionJsonToRecord(distribution, datasetJson)
            );
        });
    }

    return result;
}

async function processDistributionAPIUrl(
    url: string
): Promise<RemoteDataHandlingResult> {
    const uri = new URI(url);
    const query = uri.search(true);
    const distributionId = query.id;
    if (!distributionId) {
        throw new Error("Can't locate distribution ID from the URL.");
    }

    const source = createSource(url);
    const transformer = await createTransformer(url);

    const data = await requestJson(url);

    if (!data?.result?.package_id || !data?.result?.id) {
        throw new Error(
            `Failed to retrieve data from url : ${url} Error: can't locate dataset or distribution ID`
        );
    }

    const datasetId = data.result.package_id;
    const datasetJson = await source.getJsonDataset(datasetId);
    const datasetData = transformer.datasetJsonToRecord(datasetJson);
    const distributionData = transformer.distributionJsonToRecord(
        data.result,
        datasetJson
    );
    const result: RemoteDataHandlingResult = {
        dataset: datasetData,
        distributions: [distributionData]
    };

    return result;
}

async function processDatasetWebUrl(
    url: string
): Promise<RemoteDataHandlingResult> {
    const uri = new URI(url);
    const segments = uri.segment();
    const datasetId = segments[segments.indexOf("dataset") + 1];

    const source = createSource(url);
    const transformer = await createTransformer(url);

    const datasetJson = await source.getJsonDataset(datasetId);
    const datasetData = transformer.datasetJsonToRecord(datasetJson);
    const result: RemoteDataHandlingResult = {
        dataset: datasetData,
        distributions: []
    };

    const distributions = source.getJsonDistributions(datasetJson);
    if (distributions) {
        await forEachAsync(distributions, 1, async (distribution) => {
            result.distributions.push(
                transformer.distributionJsonToRecord(distribution, datasetJson)
            );
        });
    }

    return result;
}

async function processDistributionWebUrl(
    url: string
): Promise<RemoteDataHandlingResult> {
    const uri = new URI(url);
    const segments = uri.segment();
    const datasetId = segments[segments.indexOf("dataset") + 1];
    const distributionId = segments[segments.indexOf("resource") + 1];

    const source = createSource(url);
    const transformer = await createTransformer(url);

    const datasetJson = await source.getJsonDataset(datasetId);
    const datasetData = transformer.datasetJsonToRecord(datasetJson);
    const result: RemoteDataHandlingResult = {
        dataset: datasetData,
        distributions: []
    };

    const baseUrl = getBaseUrl(url);
    const apiUri = new URI(baseUrl);
    const apiUrl = apiUri
        .segment("api/3/action/resource_show")
        .search("")
        .search({ id: distributionId })
        .toString();

    const data = await requestJson(apiUrl);

    if (!data?.result?.package_id || !data?.result?.id) {
        throw new Error(
            `Failed to retrieve data from url : ${url} Error: can't locate dataset or distribution ID`
        );
    }

    const distributionData = transformer.distributionJsonToRecord(
        data.result,
        datasetJson
    );

    result.distributions.push(distributionData);
    return result;
}

export default handlerRemoteDataUrl;
