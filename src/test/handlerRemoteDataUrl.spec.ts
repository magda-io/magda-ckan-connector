import { expect } from "chai";
import "mocha";
import nock from "nock";
import randomstring from "randomstring";
import handlerRemoteDataUrl, {
    RemoteDataHandlingResult
} from "../handlerRemoteDataUrl";
import sampleDatasetData from "./ckan-server-dataset-sample-response.json";
import sampleDistributionData from "./ckan-server-distribution-sample-response.json";
import sampleDatasetDataUrlResult from "./dataset-data-url-result.json";
import sampleDistributionDataUrlResult from "./distribution-data-url-result.json";

//import sinon from "sinon";

const URL_SEGMENT_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const ID_OR_NAME_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789-";
const CKAN_SERVER_BASE = /example\.com/;
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

        ckanServerScope
            .get(uri => uri.includes("/api/3/action/resource_show"))
            .reply(200, sampleDistributionData);
    });

    after(() => {
        nock.cleanAll();
        nock.enableNetConnect();
    });

    it("should process ckan dataset web url and return correct data", async () => {
        const result = await handlerRemoteDataUrl({
            remoteDataUrl: `https://example.com${getRndSegments()}/dataset/${getRndString(
                ID_OR_NAME_CHARS,
                16
            )}`,
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

    it("should process ckan distribution web url and return correct data", async () => {
        const result = await handlerRemoteDataUrl({
            remoteDataUrl: `https://example.com${getRndSegments()}/dataset/${getRndString(
                ID_OR_NAME_CHARS,
                16
            )}/resource/${getRndString(ID_OR_NAME_CHARS, 16)}`,
            handler: "handlerRemoteDataUrl"
        });

        // --- this will strip any undefined fields during the json un/serialization
        const testData = JSON.parse(JSON.stringify(result));

        expect(removeUnwantedFields(testData)).to.deep.equal(
            removeUnwantedFields(
                sampleDistributionDataUrlResult as RemoteDataHandlingResult
            )
        );
    });

    it("should process ckan dataset API url and return correct data", async () => {
        const result = await handlerRemoteDataUrl({
            remoteDataUrl: `https://example.com${getRndSegments()}/api/3/action/package_show?id=${getRndString(
                ID_OR_NAME_CHARS,
                16
            )}`,
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

    it("should process ckan distribution API url and return correct data", async () => {
        const result = await handlerRemoteDataUrl({
            remoteDataUrl: `https://example.com${getRndSegments()}/api/3/action/resource_show?id=${getRndString(
                ID_OR_NAME_CHARS,
                16
            )}`,
            handler: "handlerRemoteDataUrl"
        });

        // --- this will strip any undefined fields during the json un/serialization
        const testData = JSON.parse(JSON.stringify(result));

        expect(removeUnwantedFields(testData)).to.deep.equal(
            removeUnwantedFields(
                sampleDistributionDataUrlResult as RemoteDataHandlingResult
            )
        );
    });
});
