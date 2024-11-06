#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import axios from 'axios';
import { SharesCliVersion } from '../version';

const shares = program.version(SharesCliVersion.VERSION)
  .description('CLI tool for managing CQL files as FHIR resources by the ASU SHARES team.');

shares
  .command('convert <filePath> [outputPath]')
  .description('Converts a .cql file to a base64 string')
  .action((filePath, outputPath) => {
    try {
      const content = fs.readFileSync(filePath);
      const base64Content = content.toString('base64');
      if (outputPath) {
        fs.writeFileSync(outputPath, base64Content);
        console.log(`Base64 content written to ${outputPath}`);
      } else {
        console.log(base64Content);
      }
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
    }
  });

shares
  .command('createFHIRBundle <filePath> <outputPath> <description> [ipUrl]')
  .description('Creates a FHIR bundle as a JSON file from an input .cql file')
  .action((filePath, outputPath, description, ipUrl = 'http://localhost:8080/fhir/') => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Extract library name and version from the content using regex
      const libraryInfo = extractLibraryInfo(content);
      if (!libraryInfo) {
        console.error('Could not extract library name and version from the .cql file.');
        process.exit(1);
      }
      const { libraryName, version } = libraryInfo;

      const base64Content = Buffer.from(content).toString('base64');

      // Build the FHIR bundle JSON
      const fhirBundle = buildFHIRBundle(libraryName, version, description, base64Content, ipUrl);

      // Write the FHIR bundle JSON to outputPath
      fs.writeFileSync(outputPath, JSON.stringify(fhirBundle, null, 2));
      console.log(`FHIR bundle written to ${outputPath}`);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
    }
  });

shares
  .command('POSTtoHAPI <filePath> <url>')
  .description('Posts a FHIR bundle JSON file to a HAPI-FHIR server')
  .action(async (filePath, url) => {
    try {
      // Read the FHIR bundle JSON file
      const bundleContent = fs.readFileSync(filePath, 'utf8');
      const bundleJson = JSON.parse(bundleContent);

      // Perform POST request
      const response = await axios.post(url, bundleJson, {
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
      });

      console.log(`Response Status: ${response.status} ${response.statusText}`);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      if (error.response) {
        console.error(`HTTP Error: ${error.response.status} ${error.response.statusText}`);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(`Error: ${error.message}`);
      }
    }
  });

shares
  .command('CreateAndPOST <filePath> <outputPath> <description> <url>')
  .description('Creates a FHIR bundle from a .cql file and posts it to a specified URL')
  .action(async (filePath, outputPath, description, url) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      const libraryInfo = extractLibraryInfo(content);
      if (!libraryInfo) {
        console.error('Could not extract library name and version from the .cql file.');
        process.exit(1);
      }
      const { libraryName, version } = libraryInfo;
      const base64Content = Buffer.from(content).toString('base64');

      const baseUrl = url.endsWith('/') ? url : url + '/';
      const fhirBundle = buildFHIRBundle(libraryName, version, description, base64Content, baseUrl);

      fs.writeFileSync(outputPath, JSON.stringify(fhirBundle, null, 2));
      console.log(`FHIR bundle written to ${outputPath}`);

      const response = await axios.post(baseUrl, fhirBundle, {
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
      });

      console.log(`Response Status: ${response.status} ${response.statusText}`);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      if (error.response) {
        console.error(`HTTP Error: ${error.response.status} ${error.response.statusText}`);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(`Error: ${error.message}`);
      }
    }
  });

program.parse(process.argv);

function extractLibraryInfo(content: string) {
  const libraryRegex = /^library\s+(\w+)\s+version\s+'([^']+)'/m;
  const match = content.match(libraryRegex);
  if (match) {
    const libraryName = match[1];
    const version = match[2];
    return { libraryName, version };
  } else {
    return null;
  }
}

function buildFHIRBundle(
  libraryName: string,
  version: string,
  description: any,
  base64Content: string,
  baseUrl: string = 'http://localhost:8080/fhir/'
) {
  const libraryResource = {
    resourceType: 'Library',
    id: libraryName,
    url: `${baseUrl}Library/${libraryName}`,
    version: version,
    name: libraryName,
    title: libraryName,
    status: 'active',
    description: description,
    content: [
      {
        contentType: 'text/cql',
        data: base64Content,
      },
    ],
  };

  const bundle = {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: [
      {
        fullUrl: `urn:uuid:${libraryName}`,
        resource: libraryResource,
        request: {
          method: 'POST',
          url: `Library/${libraryName}`,
        },
      },
    ],
  };

  return bundle;
}
