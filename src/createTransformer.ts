import { AspectBuilder, cleanOrgTitle } from "@magda/connector-sdk";
import CkanTransformer from "./CkanTransformer";
import CkanUrlBuilder from "./CkanUrlBuilder";
import moment from "moment";
import URI from "urijs";

export interface CreateTransformerOptions {
    name: string;
    id: string;
    sourceUrl: string;
    datasetAspectBuilders: AspectBuilder[];
    distributionAspectBuilders: AspectBuilder[];
    organizationAspectBuilders: AspectBuilder[];
    tenantId: number;
}

type ExtraDataType = {
    key: string;
    value: any;
}[];

function getExtraData<T = any>(dataset: any, key: string): T | undefined {
    if (!dataset?.extras?.length) {
        return undefined;
    }
    const extraData = dataset.extras as ExtraDataType;
    const item = extraData.find(item => item.key === key);
    if (!item) {
        return undefined;
    }
    return item?.value;
}

export default function createTransformer({
    name,
    id,
    sourceUrl,
    datasetAspectBuilders,
    distributionAspectBuilders,
    organizationAspectBuilders,
    tenantId
}: CreateTransformerOptions) {
    return new CkanTransformer({
        sourceId: id,
        datasetAspectBuilders: datasetAspectBuilders,
        distributionAspectBuilders: distributionAspectBuilders,
        organizationAspectBuilders: organizationAspectBuilders,
        tenantId: tenantId,
        libraries: {
            cleanOrgTitle: cleanOrgTitle,
            moment: moment,
            getExtraData: getExtraData,
            URI: URI,
            ckan: new CkanUrlBuilder({
                id: id,
                name: name,
                baseUrl: sourceUrl
            })
        }
    });
}
