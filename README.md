## Magda Ckan Connector

![CI Workflow](https://github.com/magda-io/magda-ckan-connector/workflows/Main%20CI%20Workflow/badge.svg?branch=master) [![Release](https://img.shields.io/github/release/magda-io/magda-ckan-connector.svg)](https://github.com/magda-io/magda-ckan-connector/releases)

[Magda](https://github.com/magda-io/magda) connectors go out to external datasources and copy their metadata into the Registry, so that they can be searched and have other aspects attached to them. A connector is simply a docker-based microservice that is invoked as a job. It scans the target datasource (usually an open-data portal), then completes and shuts down.

Magda Ckan Connector is created for crawling data from Ckan data source.

### Release Registry

Since v2.0.0, we use [Github Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) as our official Helm Chart & Docker Image release registry.

It's recommended to deploy minions with as [dependencies](https://helm.sh/docs/topics/chart_best_practices/dependencies/) of a Magda helm deployment.

```yaml
dependencies:
    - name: magda-ckan-connector
      version: "2.0.0"
      repository: "oci://ghcr.io/magda-io/charts"
```

## Requirements

Kubernetes: `>= 1.14.0-0`

| Repository                    | Name         | Version |
| ----------------------------- | ------------ | ------- |
| oci://ghcr.io/magda-io/charts | magda-common | 2.0.1   |

## Values

| Key                                | Type   | Default                       | Description |
| ---------------------------------- | ------ | ----------------------------- | ----------- |
| config.id                          | string | `"dga"`                       |             |
| config.ignoreHarvestSources[0]     | string | `"*"`                         |             |
| config.name                        | string | `"data.gov.au"`               |             |
| config.pageSize                    | int    | `100`                         |             |
| config.sourceUrl                   | string | `"https://data.gov.au/data/"` |             |
| createConfigMap                    | bool   | `true`                        |             |
| createFunction                     | bool   | `false`                       |             |
| defaultImage.imagePullSecret       | bool   | `false`                       |             |
| defaultImage.pullPolicy            | string | `"IfNotPresent"`              |             |
| defaultImage.repository            | string | `"ghcr.io/magda-io"`          |             |
| defaultSettings.includeCronJobs    | bool   | `true`                        |             |
| defaultSettings.includeInitialJobs | bool   | `false`                       |             |
| defaultTenantId                    | int    | `0`                           |             |
| global.connectors.image            | object | `{}`                          |             |
| global.image                       | object | `{}`                          |             |
| global.openfaas                    | object | `{}`                          |             |
| image.name                         | string | `"magda-ckan-connector"`      |             |
| resources.limits.cpu               | string | `"100m"`                      |             |
| resources.requests.cpu             | string | `"50m"`                       |             |
| resources.requests.memory          | string | `"30Mi"`                      |             |
