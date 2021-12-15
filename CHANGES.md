# 1.3.0

-   Remove labels from metadata ( use labels in `spec` instead)
-   Release multi-arch docker images (linux/amd64, linux/arm64) from CI pipeline

# 1.2.1

-   Better secret support for openfaas function

# 1.2.0

-   Use magda-common for docker image related logic as per ticket: https://github.com/magda-io/magda/issues/3229

# 1.1.0

-   #6 Auto detect fields from CKAN package extra data array
-   Add support of searching contact_point, licence_title, spatial_coverage, temporal_coverage_from, and temporal_coverage_to from ckan dataset extras field if they are not found at dataset fields.

# 1.0.1

-   #2 CKAN crawler shouldn't attempt crawling user info
-   Use chart version as default docker image version
