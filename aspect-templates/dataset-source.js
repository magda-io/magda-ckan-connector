var ckan = libraries.ckan;
var getExtraData = libraries.getExtraData;

const sourceData = {
    type: "ckan-dataset",
    url: ckan.getPackageShowUrl(dataset.id),
    id: ckan.id,
    name: ckan.name
};

var harvestPortal = getExtraData(dataset, "harvest_portal");
var harvestUrl = getExtraData(dataset, "harvest_url");

if (harvestPortal) {
    sourceData.originalName = harvestPortal;
}

if (harvestUrl) {
    sourceData.originalUrl = harvestUrl;
}

return sourceData;
