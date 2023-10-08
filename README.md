## Magda Ckan Connector

![CI Workflow](https://github.com/magda-io/magda-ckan-connector/workflows/Main%20CI%20Workflow/badge.svg?branch=main) [![Release](https://img.shields.io/github/release/magda-io/magda-ckan-connector.svg)](https://github.com/magda-io/magda-ckan-connector/releases)

[Magda](https://github.com/magda-io/magda) connectors go out to external datasources and copy their metadata into the Registry, so that they can be searched and have other aspects attached to them. A connector is simply a docker-based microservice that is invoked as a job. It scans the target datasource (usually an open-data portal), then completes and shuts down.

Magda Ckan Connector is created for crawling data from Ckan data source.

### Release Registry

Since v2.0.0, we use [Github Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) as our official Helm Chart & Docker Image release registry.

It's recommended to deploy connectors with as [dependencies](https://helm.sh/docs/topics/chart_best_practices/dependencies/) of a Magda helm deployment.

```yaml
dependencies:
  - name: magda-ckan-connector
    version: "2.0.0"
    alias: connector-xxx
    repository: "oci://ghcr.io/magda-io/charts"
    tags:
      - connectors
      - connector-xxx
```

## Requirements

Kubernetes: `>= 1.21.0`

| Repository | Name | Version |
|------------|------|---------|
| oci://ghcr.io/magda-io/charts | magda-common | 2.0.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| config.allowedOrganisationNames | string | `nil` | allowOrganisationNames: a list of organisation names that will be allowed to be harvested. should an array of string; |
| config.customJsFilterCode | string | `""` | Custome JS filter code to filter out records the code will be executed with the following variables available in the context: - jsonData: the rawJson record data retrieved by connector directly from remote API. Also the record to be filtered; - recordType: a string represent the type of the record. e.g. "Organization" | "Dataset" | "Distribution" the code should return a boolean value to indicate whether the record should be filtered out (true) or not (false) Any non-false return value (or no return value) will be treated as `false` |
| config.extras | string | `nil` | extras: an object whose data will be copied to records' source aspect as additional data automatically should be an object with key-value pairs |
| config.id | string | `"dga"` | Unique id to identify this connector and records that are harvested from it |
| config.ignoreHarvestSources | list | `["*"]` | CKAN-specific config: what harvest sources to ignore. * will ignore everything that's been harvested from another portal |
| config.ignoreOrganisationNames | string | `nil` | ignoreOrganisationNames: a list of organisation names that will be ignored to be harvested. should an array of string; |
| config.name | string | `"data.gov.au"` | Friendly readable name |
| config.pageSize | int | `100` | When crawling through from beginning to end, how big should the individual requests be in records? |
| config.presetRecordAspects | string | `nil` | Any aspects that will be `preset` on any records created by the connector  This field should be an array of objects with the following fields:    - `id`: aspect id   - `opType`: operation type; Describe how to add the aspect to the record (Default value (If not specified) will be `MERGE_LEFT`)    - MERGE_LEFT: merge `presetAspect` with records aspects.      - i.e. `presetAspect` will be overwritten by records aspects data if any    - MEREG_RIGHT: merge records aspects with `presetAspect`.      - i.e. records aspects data (if any) will be overwritten by `presetAspect`    - REPLACE: `presetAspect` will replace any existing records aspect    - FILL: `presetAspect` will be added if no existing aspect   - `recordType``: Describes which type of records this aspect will be added to;  If this field is omitted, the aspect will be added to every records.   - `data`: Object; aspect data |
| config.schedule | string | `""` | Crontab schedule for how often this should happen. default = "0 14 * * 6" i.e. 12am Sydney time on Sunday |
| config.sourceUrl | string | `"https://data.gov.au/data/"` | The base URL of the place to source data from |
| createConfigMap | bool | `true` |  |
| createFunction | bool | `false` |  |
| defaultImage.imagePullSecret | bool | `false` |  |
| defaultImage.pullPolicy | string | `"IfNotPresent"` |  |
| defaultImage.repository | string | `"ghcr.io/magda-io"` |  |
| defaultSettings | object | `{"includeCronJobs":true,"includeInitialJobs":false}` | defaultSettings Chart level .Values.includeInitialJobs is higher priority than  .Values.global.includeInitialJobs The value of includeInitialJobs or includeCronJobs is determined by: - .Values.includeInitialJobs if its value is set - Then .Values.global.includeInitialJobs if its value is set - Then .Values.defaultSettings.includeInitialJobs By default, .Values.includeInitialJobs is not set.  Therefore, if .Values.global.includeInitialJobs is not set, .Values.defaultSettings.includeInitialJobs will be used. |
| defaultTenantId | int | `0` |  |
| global.connectors.image | object | `{}` |  |
| global.image | object | `{}` |  |
| global.openfaas | object | `{}` |  |
| image.name | string | `"magda-ckan-connector"` |  |
| includeCronJobs | bool | `true` | see `defaultSettings` |
| includeInitialJobs | string | `nil` | see `defaultSettings` |
| resources.limits.cpu | string | `"100m"` |  |
| resources.requests.cpu | string | `"50m"` |  |
| resources.requests.memory | string | `"30Mi"` |  |
| secrets | string | `nil` | Set a list of secrets that pass to function (this config field is only for deploying connector code as openfaas functions) Secrets are accessible from `/var/openfaas/secrets/<secret-name>` as file |
