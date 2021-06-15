var ckan = libraries.ckan;

const sourceData = {
    type: "ckan-dataset",
    url: ckan.getPackageShowUrl(dataset.id),
    id: ckan.id,
    name: ckan.name
};

if (dataset.extras && dataset.extras.harvest_portal) {
    sourceData.originalName = dataset.extras.harvest_portal;
}

if (dataset.extras && dataset.extras.harvest_url) {
    sourceData.originalUrl = dataset.extras.harvest_url;
}

return sourceData;
