## Magda Ckan Connector

![CI Workflow](https://github.com/magda-io/magda-ckan-connector/workflows/Main%20CI%20Workflow/badge.svg?branch=master) [![Release](https://img.shields.io/github/release/magda-io/magda-ckan-connector.svg)](https://github.com/magda-io/magda-ckan-connector/releases)

[Magda](https://github.com/magda-io/magda) connectors go out to external datasources and copy their metadata into the Registry, so that they can be searched and have other aspects attached to them. A connector is simply a docker-based microservice that is invoked as a job. It scans the target datasource (usually an open-data portal), then completes and shuts down. 

Magda Ckan Connector is created for crawling data from Ckan data source.


### Helm Chart

It's recommanded to deploy connectors with as [dependencies](https://helm.sh/docs/topics/chart_best_practices/dependencies/) of a Magda helm deployment. Example can be found from [here](https://github.com/magda-io/magda-config).

- Helm Chart Repository Url: 

https://magda-io.github.io/magda-ckan-connector

The [helm chart](https://helm.sh/docs/topics/charts/) for this connector is auto released when a [Github Release](https://help.github.com/en/github/administering-a-repository/creating-releases) is created for this repo. 

- Add Repository:

```bash
helm repo add magda-ckan-connector https://magda-io.github.io/magda-ckan-connector
```

