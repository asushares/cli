curl -X POST -H 'Accept: application/fhir+json' -H 'Content-Type: application/fhir+json' -d @`pwd`src/assets/cql/curl-data.json http://localhost:8080/fhir/Library/1/\$evaluate
