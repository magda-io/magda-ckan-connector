import { expect } from "chai";
import "mocha";
import nock from "nock";
import Ckan from "../Ckan";
import CkanTransformer from "../CkanTransformer";
import {
    JsonConnector,
    JsonConnectorConfig,
    AuthorizedRegistryClient as Registry,
    AspectBuilder
} from "@magda/connector-sdk";

describe("JsonTransformer", () => {
    before(() => {
        nock.disableNetConnect();
    });

    after(() => {
        nock.enableNetConnect();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    const TENANT_ID_1 = 1;

    function setupCrawlTest(
        config: JsonConnectorConfig,
        datasetAspectBuilders: AspectBuilder[] = undefined,
        distributionAspectBuilders: AspectBuilder[] = undefined,
        organizationAspectBuilders: AspectBuilder[] = undefined,
        libraries: any = undefined
    ) {
        const source = new Ckan({
            baseUrl: config.sourceUrl,
            id: config.id,
            name: config.name,
            pageSize: config.pageSize,
            ignoreHarvestSources: config.ignoreHarvestSources,
            allowedOrganisationNames: config.allowedOrganisationNames,
            ignoreOrganisationNames: config.ignoreOrganisationNames
        });

        const transformer = new CkanTransformer({
            sourceId: config.id,
            datasetAspectBuilders,
            distributionAspectBuilders,
            organizationAspectBuilders,
            libraries,
            tenantId: TENANT_ID_1
        });

        const registryScope = nock("http://example.com").log(console.log);
        const sourceScope = nock(config.sourceUrl).log(console.log);

        const registry = new Registry({
            baseUrl: "http://example.com",
            jwtSecret: "squirrel",
            userId: "1",
            maxRetries: 0,
            tenantId: TENANT_ID_1
        });

        const connector = new JsonConnector({
            source,
            transformer,
            registry
        });

        return {
            sourceScope,
            registryScope,
            registry,
            source,
            transformer,
            connector
        };
    }

    const ckanPackageSearchResponse = {
        help:
            "https://data.gov.au/data/api/3/action/help_show?name=package_search",
        success: true,
        result: {
            count: 1,
            sort: "metadata_created asc",
            facets: {},
            results: [
                {
                    id: "e99b2a9e-8f60-4121-b35e-b788a35f982d",
                    type: "dataset",
                    num_resources: 0,
                    name: "wels",
                    isopen: true,
                    notes: "xxxx",
                    title: "test dataset title"
                }
            ],
            search_facets: {}
        }
    };

    const ckanOrgResponse = {
        help:
            "https://data.gov.au/data/api/3/action/help_show?name=organization_show",
        success: true,
        result: {
            display_name: "Test department",
            description: "test description",
            package_count: 1,
            name: "deptxxx",
            is_organization: true,
            state: "active",
            type: "organization",
            title: "Test department",
            id: "f4833158-3d11-4d3a-897e-b4e5fa9c11d0"
        }
    };

    const ckanOrgListResponse = {
        help:
            "https://data.gov.au/data/api/3/action/help_show?name=organization_list",
        success: true,
        result: [
            {
                display_name: "ABS (SA Data)",
                description:
                    "Australian Bureau of Statistics - SA Data Released\r\n\r\n",
                image_display_url:
                    "https://data.sa.gov.au/data/uploads/group/2017-01-11-044253.549195abslogowh2.gif",
                package_count: 19,
                created: "2013-04-12T05:32:42.492379",
                name: "abs-sa-data",
                is_organization: true,
                state: "active",
                extras: [
                    {
                        value:
                            "https://www4.abs.gov.au/web/survey.nsf/inquiryform/",
                        state: "active",
                        key: "email",
                        revision_id: "79d91443-47e6-4504-bb65-ac8c17019d55",
                        group_id: "774dc75c-cfce-4040-bd52-d3893dc71090",
                        id: "366b7c4b-206e-4542-86f5-6722037944fd"
                    },
                    {
                        value: "Government of South Australia",
                        state: "active",
                        key: "jurisdiction",
                        revision_id: "abed455f-6c4e-4dcb-986e-b31cc8b0d90e",
                        group_id: "774dc75c-cfce-4040-bd52-d3893dc71090",
                        id: "1c53d201-3ab6-4f3d-a740-f62d43fcfc36"
                    }
                ],
                image_url: "2017-01-11-044253.549195abslogowh2.gif",
                type: "organization",
                title: "ABS (SA Data)",
                revision_id: "b3bd9583-f683-48bf-941d-03e498e215a2",
                num_followers: 0,
                id: "774dc75c-cfce-4040-bd52-d3893dc71090",
                tags: ["abs;"],
                approval_status: "approved"
            }
        ]
    };

    it("Should filter by organisation if one `allowedOrganisationNames` is specified", function() {
        this.timeout(5000000);
        const organisationName = "deptxxx";
        const { sourceScope, registryScope, connector } = setupCrawlTest({
            id: "test-ckan-connector",
            name: "Test Ckan Connector",
            ignoreHarvestSources: ["*"],
            pageSize: 100,
            allowedOrganisationNames: [organisationName],
            ignoreOrganisationNames: [],
            sourceUrl: "http://test-ckan.com"
        });

        /**
         * Connector should call organization_show api instead with org name as id parameter
         */
        sourceScope
            .get(/\/organization_show/)
            .query({
                id: organisationName
            })
            .reply(200, ckanOrgResponse);

        /**
         * Connector should call package_search api with extra `fq` query
         */
        sourceScope
            .get(/\/package_search/)
            .query((q: any) => {
                const fq: string = q.fq;
                expect(fq).include(`(organization:"${organisationName}")`);
                expect(fq).include("-harvest_source_title:*");
                return true;
            })
            .reply(200, ckanPackageSearchResponse);

        registryScope
            .persist()
            .put(new RegExp("/records"), (body: any) => {
                return body.sourceTag === connector.sourceTag;
            })
            .reply(200);

        registryScope.delete(/.*/).reply(201, { count: 0 });

        return connector.run().then(result => {
            // --- make sure all mocks are satisfied
            sourceScope.done();
            registryScope.done();
        });
    });

    it("Should filter by organisations if multiple `allowedOrganisationNames` is specified", function() {
        this.timeout(5000000);
        const organisationName = "deptxxx";
        const organisationName2 = "deptyyy";
        const { sourceScope, registryScope, connector } = setupCrawlTest({
            id: "test-ckan-connector",
            name: "Test Ckan Connector",
            ignoreHarvestSources: ["*"],
            pageSize: 100,
            allowedOrganisationNames: [organisationName, organisationName2],
            ignoreOrganisationNames: [],
            sourceUrl: "http://test-ckan.com"
        });
        sourceScope
            .get(/\/organization_show/)
            .query({
                id: organisationName
            })
            .reply(200, ckanOrgResponse);
        sourceScope
            .get(/\/organization_show/)
            .query({
                id: organisationName2
            })
            .reply(200, ckanOrgResponse);
        /**
         * Connector should call package_search api with extra `fq` query
         */
        sourceScope
            .get(/\/package_search/)
            .query((q: any) => {
                const fq: string = q.fq;
                expect(fq).include(
                    `(organization:"${organisationName}" OR organization:"${organisationName2}")`
                );
                expect(fq).include("-harvest_source_title:*");
                return true;
            })
            .reply(200, ckanPackageSearchResponse);

        registryScope
            .persist()
            .put(new RegExp("/records"), (body: any) => {
                return body.sourceTag === connector.sourceTag;
            })
            .reply(200);

        registryScope.delete(/.*/).reply(201, { count: 0 });

        return connector.run().then(result => {
            // --- make sure all mocks are satisfied
            sourceScope.done();
            registryScope.done();
        });
    });

    it("Should filter by organisation if `ignoreOrganisationNames` is specified", function() {
        this.timeout(5000000);
        const organisationName = "deptxxx";
        const { sourceScope, registryScope, connector } = setupCrawlTest({
            id: "test-ckan-connector",
            name: "Test Ckan Connector",
            ignoreHarvestSources: ["*"],
            pageSize: 1,
            allowedOrganisationNames: [],
            ignoreOrganisationNames: [organisationName, organisationName],
            sourceUrl: "http://test-ckan.com"
        });

        /**
         * Connector should call organization_show api
         */
        sourceScope
            .get(/\/organization_list/)
            .query({
                all_fields: "true",
                include_groups: "true",
                include_extras: "true",
                include_tags: "true",
                offset: 0,
                limit: 1
            })
            .reply(200, ckanOrgListResponse);
        sourceScope
            .get(/\/organization_list/)
            .query({
                all_fields: "true",
                include_groups: "true",
                include_extras: "true",
                include_tags: "true",
                offset: 1,
                limit: 1
            })
            .reply(200, ckanOrgListResponse);
        /**
         * Connector should call package_search api with no extra `fq` query
         */
        sourceScope
            .get(/\/package_search/)
            .query((q: any) => {
                const fq: string = q.fq;
                expect(fq).include(`-organization:"${organisationName}"`);
                expect(fq).include("-harvest_source_title:*");
                return true;
            })
            .reply(200, ckanPackageSearchResponse);

        registryScope
            .persist()
            .put(new RegExp("/records"), (body: any) => {
                return body.sourceTag === connector.sourceTag;
            })
            .reply(200);
        registryScope
            .persist()
            .delete(new RegExp("/records"))
            .reply(200);
        return connector.run().then(result => {
            // --- make sure all mocks are satisfied
            sourceScope.done();
            registryScope.done();
        });
    });
});
