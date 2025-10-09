# ASU SHARES CLI
Command-line utilities aimed at supporting FHIR Consent management and CQL (Clinical Quality Language) operations on FHIR servers. Written and maintained in TypeScript using the [Commander](https://www.npmjs.com/package/commander) library.


## CLI Usage

`asushares --version` for CLI utility version information
`asushares --help` for subcommand documentation and examples


## Subcommands

### 1. `convert <filePath> [outputPath]`
Converts a `.cql` file to a base64 encoded string.

- **Arguments:**
  - `<filePath>`: Path to the `.cql` file.
  - `[outputPath]` (optional): Path to save the base64 encoded output.
  
- **Usage:**
  ```bash
  ts-node asushares.ts convert myfile.cql output.txt
  ```
  - If `outputPath` is omitted, it outputs the base64 string to the console.

### 2. `create-fhir-bundle <filePath> <outputPath> <description> [ipUrl]`
Creates a FHIR bundle from a `.cql` file and saves it as a JSON file.

- **Arguments:**
  - `<filePath>`: Path to the `.cql` file.
  - `<outputPath>`: Path to save the generated FHIR bundle JSON file.
  - `<description>`: Description of the library.
  - `[ipUrl]` (optional): Base URL for the FHIR Library (default is `http://localhost:8080/fhir/Library/`).
  
- **Usage:**
  ```bash
  ts-node asushares.ts create-fhir-bundle myfile.cql bundle.json "Description of the CQL library"
  ```

### 3. `post-fhir <filePath> <url>`
Posts a FHIR bundle JSON file to a specified FHIR server.

- **Arguments:**
  - `<filePath>`: Path to the JSON file containing the FHIR bundle.
  - `<url>`: Base URL of the FHIR server.

- **Usage:**
  ```bash
  ts-node asushares.ts post-fhir bundle.json http://localhost:8080/fhir
  ```

### 4. `create-and-post <filePath> <outputPath> <description> <url>`
Creates a FHIR bundle from a `.cql` file, saves it as a JSON file, and posts it to a specified URL.

- **Arguments:**
  - `<filePath>`: Path to the `.cql` file.
  - `<outputPath>`: Path to save the generated FHIR bundle JSON file.
  - `<description>`: Description of the library.
  - `<url>`: URL of the server to post the FHIR bundle.

- **Usage:**
  ```bash
  ts-node asushares.ts create-and-post myfile.cql bundle.json "Description of the CQL library" http://localhost:8080/fhir
  ```

### 5. `synthea-upload <directory> <url> --dry-run -d`
Upload a directory of Synthea-generated FHIR resources to a FHIR URL using Synthea file naming conventions and loading order.

- **Arguments:**
  - `<directory>`: Directory with Synthea-generate "fhir" resource files.
  - `<url>`: URL of the FHIR server to upload the resources to.
  - `--dry-run -d`: Perform a dry run without uploading any resources.

- **Usage:**
  ```bash
  ts-node asushares.ts synthea-upload /dir/to/synthea-files http://localhost:8080/fhir 
  ```

### 6. `verify-codes <fhirPath> <csvFilePath> --delete`
Verifies JSON files for relevant codes based on a provided CSV and deletes irrelevant files if the delete flag is set.

- **Arguments:**
  - `<fhirPath>`: Path to the directory containing JSON files.
  - `<csvFilePath>`: Path to the CSV file containing relevant codes. The following columns are expected, with no empty rows - Index,Code_Type,Code,Description,Category. The code maps code types eg. SNOWMED-CT to the required URL in the backend. A sample csv is present in the assets folder for reference purposes.
  - `--delete`: URL of the server to post the FHIR bundle. Optional.

- **Usage:**
  ```bash
  ts-node asushares.ts verify-codes /Users/username/Documents/synthea/output/fhir /Users/username/Documents/synthea/Verification_CSV.csv
  ```

### 7. `valueset <ids...> [options]`
Downloads VSAC ValueSets and optionally uploads them to a HAPI-FHIR server.

- **Arguments:**
  - `<ids...>`: VSAC OIDs or canonical URLs to process.

- **Options:**
  - `--mode <m>`: Specify the operation mode (`definition`, `expansion`, or `both`). Default: `expansion`.
  - `--version <yyyymmdd>`: Specify a specific VSAC ValueSet version.
  - `--filter <text>`: Apply a server-side filter for `$expand` (optional).
  - `--out <dir>`: Output directory for downloaded files. Default: `./valuesets`.
  - `--post <fhirBaseUrl>`: Post the downloaded ValueSets to a FHIR server.
  - `--post-mode <m>`: Specify the upload mode (`definition` or `expanded`). Default: `expanded`.
  - `--bundle`: Wrap uploads in a transaction Bundle.
  - `--umls-key <key>`: UMLS API key (overrides the `UMLS_API_KEY` environment variable).
  - `--count <n>`: Expansion page size. Default: `1000`.
  - `--concurrency <n>`: Number of concurrent OIDs to fetch. Default: `4`.
  - `--retry <n>`: Maximum retries for transient errors. Default: `3`.
  - `--cache <dir>`: Cache directory for fetched pages. Default: `.vsac_cache`.
  - `--dry-run`: Print actions without making changes. Default: `false`.

- **Usage:**
  ```bash
  ts-node asushares.ts valueset 2.16.840.1.113762.1.4.1110.71 2.16.840.1.113883.3.464.1003.106.11.1001 --out ./valuesets
  ```

  ```bash
  ts-node asushares.ts valueset 2.16.840.1.113762.1.4.1110.71 --mode both --post http://hapi.fhir.server/baseR4
  ```

  ```bash
  ts-node asushares.ts valueset 2.16.840.1.113762.1.4.1110.71 --umls-key your-umls-key --cache ./custom_cache
  ```
```

## Dependencies

 - commander: Command-line argument parsing.
 - fs: File system operations.
 - axios: Making HTTP requests.
 - ts-progress: Simple progress bar.
 - csv-parser: Used for parsing input csvs.

## Attribution

Authors:

- Abhishek Dhadwal
- Preston Lee

Released under the Apache 2.0 license.
