# cql-cli
A helper CLI aimed at supporting CQL (Clinical Quality Language) operations on HAPI-FHIR servers. Uses [Commander](https://www.npmjs.com/package/commander).

## Commands

### 1. `convert <filePath> [outputPath]`
Converts a `.cql` file to a base64 encoded string.

- **Arguments:**
  - `<filePath>`: Path to the `.cql` file.
  - `[outputPath]` (optional): Path to save the base64 encoded output.
  
- **Usage:**
  ```bash
  ts-node index.ts convert myfile.cql output.txt
  ```
  - If `outputPath` is omitted, it outputs the base64 string to the console.

### 2. `createFHIRBundle <filePath> <outputPath> <description> [ipUrl]`
Creates a FHIR bundle from a `.cql` file and saves it as a JSON file.

- **Arguments:**
  - `<filePath>`: Path to the `.cql` file.
  - `<outputPath>`: Path to save the generated FHIR bundle JSON file.
  - `<description>`: Description of the library.
  - `[ipUrl]` (optional): Base URL for the FHIR Library (default is `http://localhost:8080/fhir/Library/`).
  
- **Usage:**
  ```bash
  ts-node index.ts createFHIRBundle myfile.cql bundle.json "Description of the CQL library"
  ```

### 3. `POSTtoHAPI <filePath> <url>`
Posts a FHIR bundle JSON file to a specified HAPI-FHIR server.

- **Arguments:**
  - `<filePath>`: Path to the JSON file containing the FHIR bundle.
  - `<url>`: URL of the HAPI-FHIR server.

- **Usage:**
  ```bash
  ts-node index.ts POSTtoHAPI bundle.json http://localhost:8080/fhir
  ```

### 4. `CreateAndPOST <filePath> <outputPath> <description> <url>`
Creates a FHIR bundle from a `.cql` file, saves it as a JSON file, and posts it to a specified URL.

- **Arguments:**
  - `<filePath>`: Path to the `.cql` file.
  - `<outputPath>`: Path to save the generated FHIR bundle JSON file.
  - `<description>`: Description of the library.
  - `<url>`: URL of the server to post the FHIR bundle.

- **Usage:**
  ```bash
  ts-node index.ts CreateAndPOST myfile.cql bundle.json "Description of the CQL library" http://localhost:8080/fhir
  ```

## Dependencies

 - commander: Command-line argument parsing.
 - fs: File system operations.
 - axios: Making HTTP requests.
