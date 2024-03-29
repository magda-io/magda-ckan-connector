import {
    AsyncPage,
    forEachAsync,
    formatServiceError,
    retry
} from "@magda/utils";
import CkanUrlBuilder from "./CkanUrlBuilder";
import { ConnectorSource } from "@magda/connector-sdk";
import URI from "urijs";
import requestJson from "./requestJson";

export interface CkanThing {
    id: string;
    name: string;
    [propName: string]: any;
}

export interface CkanResource extends CkanThing {}

export interface CkanDataset extends CkanThing {
    resources: CkanResource[];
}

export interface CkanOrganization extends CkanThing {}

export interface CkanPackageSearchResponse {
    result: CkanPackageSearchResult;
    [propName: string]: any;
}

export interface CkanPackageSearchResult {
    count: number;
    results: CkanDataset[];
    [propName: string]: any;
}

export interface CkanOrganizationListResponse {
    result: CkanOrganization[];
    [propName: string]: any;
}

export interface CkanOptions {
    baseUrl: string;
    id: string;
    name: string;
    apiBaseUrl?: string;
    pageSize?: number;
    maxRetries?: number;
    secondsBetweenRetries?: number;
    ignoreHarvestSources?: string[];
    allowedOrganisationNames?: string[];
    ignoreOrganisationNames?: string[];
}

export default class Ckan implements ConnectorSource {
    public readonly id: string;
    public readonly name: string;
    public readonly pageSize: number;
    public readonly maxRetries: number;
    public readonly secondsBetweenRetries: number;
    public readonly urlBuilder: CkanUrlBuilder;
    private ignoreHarvestSources: string[];
    private allowedOrganisationNames: string[];
    private ignoreOrganisationNames: string[];

    constructor({
        baseUrl,
        id,
        name,
        apiBaseUrl,
        pageSize = 1000,
        maxRetries = 10,
        secondsBetweenRetries = 10,
        ignoreHarvestSources = [],
        allowedOrganisationNames = [],
        ignoreOrganisationNames = []
    }: CkanOptions) {
        this.id = id;
        this.name = name;
        this.pageSize = pageSize;
        this.maxRetries = maxRetries;
        this.secondsBetweenRetries = secondsBetweenRetries;
        this.ignoreHarvestSources = ignoreHarvestSources;
        this.allowedOrganisationNames = allowedOrganisationNames;
        this.ignoreOrganisationNames = ignoreOrganisationNames;
        this.urlBuilder = new CkanUrlBuilder({
            id: id,
            name: name,
            baseUrl,
            apiBaseUrl
        });
    }

    public packageSearch(options?: {
        allowedOrganisationNames?: string[];
        ignoreOrganisationNames?: string[];
        ignoreHarvestSources?: string[];
        title?: string;
        sort?: string;
        start?: number;
        maxResults?: number;
    }): AsyncPage<CkanPackageSearchResponse> {
        const url = new URI(this.urlBuilder.getPackageSearchUrl());

        const solrQueries = [];

        if (
            options &&
            options.allowedOrganisationNames &&
            options.allowedOrganisationNames.length > 0
        ) {
            const encOrgs = options.allowedOrganisationNames.map((title) => {
                const encoded =
                    title === "*"
                        ? title
                        : encodeURIComponent('"' + title + '"');
                return `organization:${encoded}`;
            });
            solrQueries.push("(" + encOrgs.join(" OR ") + ")");
        }

        if (
            options &&
            options.ignoreOrganisationNames &&
            options.ignoreOrganisationNames.length > 0
        ) {
            solrQueries.push(
                ...options.ignoreOrganisationNames.map((title) => {
                    const encoded =
                        title === "*"
                            ? title
                            : encodeURIComponent('"' + title + '"');
                    return `-organization:${encoded}`;
                })
            );
        }

        if (
            options &&
            options.ignoreHarvestSources &&
            options.ignoreHarvestSources.length > 0
        ) {
            solrQueries.push(
                ...options.ignoreHarvestSources.map((title) => {
                    const encoded =
                        title === "*"
                            ? title
                            : encodeURIComponent('"' + title + '"');
                    return `-harvest_source_title:${encoded}`;
                })
            );
        }

        if (options && options.title && options.title.length > 0) {
            const encoded = encodeURIComponent('"' + options.title + '"');
            solrQueries.push(`title:${encoded}`);
        }

        let fqComponent = "";

        if (solrQueries.length > 0) {
            fqComponent = "&fq=" + solrQueries.join("%20");
        }

        if (options && options.sort) {
            url.addSearch("sort", options.sort);
        }

        const startStart = options.start || 0;
        let startIndex = startStart;

        return AsyncPage.create<CkanPackageSearchResponse>((previous) => {
            if (previous) {
                startIndex += this.pageSize;
                if (
                    startIndex >= previous.result.count ||
                    (options.maxResults &&
                        startIndex - startStart >= options.maxResults)
                ) {
                    return undefined;
                }
            }

            const remaining = options.maxResults
                ? options.maxResults - (startIndex - startStart)
                : undefined;
            return this.requestPackageSearchPage(
                url,
                fqComponent,
                startIndex,
                remaining
            );
        });
    }

    public organizationList(): AsyncPage<CkanOrganizationListResponse> {
        const url = new URI(this.urlBuilder.getOrganizationListUrl())
            .addSearch("all_fields", "true")
            .addSearch("include_groups", "true")
            .addSearch("include_extras", "true")
            .addSearch("include_tags", "true");

        let startIndex = 0;
        return AsyncPage.create<CkanOrganizationListResponse>((previous) => {
            if (previous) {
                if (previous.result.length === 0) {
                    return undefined;
                }
                startIndex += previous.result.length;
            }

            return this.requestOrganizationListPage(url, startIndex, previous);
        });
    }

    public getJsonDatasets(): AsyncPage<any[]> {
        const packagePages = this.packageSearch({
            ignoreHarvestSources: this.ignoreHarvestSources,
            allowedOrganisationNames: this.allowedOrganisationNames,
            ignoreOrganisationNames: this.ignoreOrganisationNames,
            sort: "id asc"
        });
        return packagePages.map((packagePage) => packagePage.result.results);
    }

    public async getJsonDataset(id: string): Promise<any> {
        const url = this.urlBuilder.getPackageShowUrl(id);
        const data = await requestJson(url);
        return data.result;
    }

    public searchDatasetsByTitle(
        title: string,
        maxResults: number
    ): AsyncPage<any[]> {
        const packagePages = this.packageSearch({
            ignoreHarvestSources: this.ignoreHarvestSources,
            allowedOrganisationNames: this.allowedOrganisationNames,
            ignoreOrganisationNames: this.ignoreOrganisationNames,
            title: title,
            maxResults: maxResults
        });
        return packagePages.map((packagePage) => packagePage.result.results);
    }

    public getJsonDistributions(dataset: any): AsyncPage<object[]> {
        return AsyncPage.single<object[]>(dataset.resources || []);
    }

    public readonly hasFirstClassOrganizations = true;

    public getJsonFirstClassOrganizations(): AsyncPage<object[]> {
        if (
            this.allowedOrganisationNames &&
            this.allowedOrganisationNames.length > 0
        ) {
            return new AsyncPage(undefined, false, async () => {
                return new AsyncPage(
                    await Promise.all(
                        this.allowedOrganisationNames.map((name) => {
                            return this.getJsonFirstClassOrganization(name);
                        })
                    ),
                    true,
                    undefined
                );
            });
        }
        const organizationPages = this.organizationList();
        return organizationPages.map(
            (organizationPage) => organizationPage.result
        );
    }

    public async getJsonFirstClassOrganization(id: string): Promise<object> {
        const url = this.urlBuilder.getOrganizationShowUrl(id);
        const data = await requestJson(url);
        return data.result;
    }

    public searchFirstClassOrganizationsByTitle(
        title: string,
        maxResults: number
    ): AsyncPage<any[]> {
        // CKAN doesn't have an equivalent of package_search for organizations, so we'll use
        // organization_autocomplete plus separate requests to look up the complete organization details.
        const url = new URI(
            this.urlBuilder.getOrganizationAutocompleteUrl(title)
        )
            .addSearch("limit", maxResults)
            .toString();

        const promise = (async () => {
            const data = await requestJson(url);
            return data.result;
        })();

        // CKAN (at least v2.5.2 currently on data.gov.au) doesn't honor the `limit` parameter.  So trim the results here.
        const trimmedResults = AsyncPage.singlePromise<any[]>(promise).map(
            (organizations) => organizations.slice(0, maxResults)
        );

        const result: any[] = [];
        return AsyncPage.singlePromise<any[]>(
            forEachAsync(trimmedResults, 6, (organization: any) => {
                return this.getJsonFirstClassOrganization(organization.id).then(
                    (organizationDetails) => {
                        result.push(organizationDetails);
                    }
                );
            }).then(() => result)
        );
    }

    public getJsonDatasetPublisherId(dataset: any): string {
        if (!dataset.organization) {
            return undefined;
        }
        return dataset.organization.id;
    }

    public getJsonDatasetPublisher(dataset: any): Promise<any> {
        if (!dataset.organization) {
            return undefined;
        }
        return this.getJsonFirstClassOrganization(dataset.organization.id);
    }

    private requestPackageSearchPage(
        url: URI,
        fqComponent: string,
        startIndex: number,
        maxResults: number
    ): Promise<CkanPackageSearchResponse> {
        const pageUrl = url.clone();
        pageUrl.addSearch("start", startIndex);
        pageUrl.addSearch("rows", this.pageSize);

        const operation = async () => {
            const requestUrl = pageUrl.toString() + fqComponent;
            console.log("Requesting " + requestUrl);

            const data = await requestJson<CkanPackageSearchResponse>(
                requestUrl
            );

            console.log("Received@" + startIndex);
            if (!data?.result?.count) {
                throw new Error(
                    "Invalid 0 count CKAN package_search response: " +
                        JSON.stringify(data)
                );
            }
            return data;
        };

        return retry(
            operation,
            this.secondsBetweenRetries,
            this.maxRetries,
            (e, retriesLeft) =>
                console.log(
                    formatServiceError(
                        `Failed to GET ${pageUrl.toString()}.`,
                        e,
                        retriesLeft
                    )
                )
        );
    }

    private requestOrganizationListPage(
        url: URI,
        startIndex: number,
        previous: CkanOrganizationListResponse
    ): Promise<CkanOrganizationListResponse> {
        const pageUrl = url.clone();
        pageUrl.addSearch("offset", startIndex);
        pageUrl.addSearch("limit", this.pageSize);

        const operation = async () => {
            console.log("Requesting " + pageUrl.toString());
            const data = await requestJson<CkanOrganizationListResponse>(
                pageUrl.toString()
            );
            console.log("Received@" + startIndex);

            //Older versions of CKAN ignore the offset and limit parameters and just return all orgs.
            // To avoid paging forever in that scenario, we check if this page is identical to the last one
            // and ignore the items if so.
            if (
                previous?.result &&
                data?.result &&
                previous.result.length === data.result.length &&
                JSON.stringify(previous.result) === JSON.stringify(data.result)
            ) {
                data.result = [];
            }
            return data;
        };

        return retry(
            operation,
            this.secondsBetweenRetries,
            this.maxRetries,
            (e, retriesLeft) =>
                console.log(
                    formatServiceError(
                        `Failed to GET ${pageUrl.toString()}.`,
                        e,
                        retriesLeft
                    )
                )
        );
    }
}
