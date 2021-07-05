import { expect } from "chai";
import "mocha";
import nock from "nock";
import randomstring from "randomstring";
import handlerRemoteDataUrl, {
    RemoteDataHandlingResult
} from "../handlers/handlerRemoteDataUrl";
// use ckan api dataset example with extras
import sampleDatasetData from "./ckan-server-dataset-sample-response-with-extras.json";
import sampleDatasetDataUrlResult from "./dataset-data-extra-result.json";

const URL_SEGMENT_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID_OR_NAME_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-";
const CKAN_SERVER_BASE = /example\.com/;
// const CKAN_SERVER_BASE =  'ckan.dev.ecocommons.org.au/'
let ckanServerScope;

function getRndString(
    chars = "abcdefghijklmnopqrstuvwxyz0123456789",
    length = 20
) {
    return randomstring.generate({
        length,
        charset: chars
    });
}

function getRndSegments() {
    const segmentNummber = Math.floor(Math.random() * 10);
    const segments = new Array(segmentNummber)
        .fill("")
        .map(item => getRndString(URL_SEGMENT_CHARS, 5));
    return segments.length ? `/${segments.join("/")}` : "";
}

function removeUnwantedFields(result: RemoteDataHandlingResult) {
    // --- remove url fields as we are testing random server urls
    delete result.dataset.aspects["dcat-dataset-strings"].landingPage;
    delete result.dataset.aspects["source"].url;

    result.distributions = result.distributions.map(dis => {
        const disCopy = { ...dis };
        delete disCopy.aspects["source"].url;
        return disCopy;
    });
    return result;
}

describe("handlerRemoteDataUrl", () => {
    before(() => {
        nock.disableNetConnect();

        ckanServerScope = nock(CKAN_SERVER_BASE);
        ckanServerScope.persist();

        ckanServerScope
            .get(uri => uri.includes("/api/3/action/package_show"))
            .reply(200, sampleDatasetData);
    });

    after(() => {
        nock.cleanAll();
        nock.enableNetConnect();
    });

    it("ckan dataset dataset field from extras should be mapped to dcat dataset and dcat distribution", async () => {
        const result = await handlerRemoteDataUrl({
            req: {
                body: `https://example.com${getRndSegments()}/api/3/action/package_show?id=${getRndString(
                    ID_OR_NAME_CHARS,
                    16
                )}`
            },
            handler: "handlerRemoteDataUrl"
        });

        // --- this will strip any undefined fields during the json un/serialization
        const testData = JSON.parse(JSON.stringify(result));

        expect(removeUnwantedFields(testData)).to.deep.equal(
            removeUnwantedFields(
                sampleDatasetDataUrlResult as RemoteDataHandlingResult
            )
        );
    });
});
