#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import { program } from 'commander';
import axios from 'axios';

import { SharesCliVersion } from '../version';
import { Bundle, Consent } from 'fhir/r5';
import { RemoteCdsResourceLabeler } from '../simulator/remote_cds_resource_labeler';
import { ConsentCategorySettings, ConsoleDataSharingEngine, DummyRuleProvider } from '@asushares/core';

import csvParser from 'csv-parser';
import { performance } from 'perf_hooks';
import Progress from 'ts-progress';



let dryRun = false;

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
	.command('create-fhir-bundle <filePath> <outputPath> <description> [ipUrl]')
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
	.command('post-fhir <filePath> <url>')
	.description('Posts a FHIR bundle JSON file to a FHIR server')
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
	.command('create-and-post <filePath> <outputPath> <description> <url>')
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

shares.command('synthea-upload')
	.description('Upload a directory of Synthea-generated FHIR resources to a FHIR URL using Synthea file naming conventions and loading order.')
	.argument('<directory>', 'Directory with Synthea-generate "fhir" resource files')
	.argument('<url>', 'URL of the FHIR server to upload the resources to')
	.option('-d, --dry-run', 'Perform a dry run without uploading any resources')
	.action((directory, fhirUrl, options) => {
		dryRun = options.dryRun;
		if (dryRun) {
			console.log('Dry run enabled. No resources will be uploaded.');
		}
		const sDirectory = safeFilePathFor(directory);
		console.log(`Uploading Synthea-generated FHIR resources from ${sDirectory} to ${fhirUrl}`);
		const files = fs.readdirSync(sDirectory).filter(file => path.extname(file).toLowerCase() === '.json');
		const hospitals: string[] = [];
		const pratitioners: string[] = [];
		const patients: string[] = [];
		files.forEach((file, i) => {
			if (file.startsWith('hospitalInformation')) {
				hospitals.push(file);
			} else if (file.startsWith('practitionerInformation')) {
				pratitioners.push(file);
			} else {
				patients.push(file);
			}
		});
		// const sFiles = files.map((file) => path.join(sDirectory, file));
		uploadResources(hospitals, sDirectory, fhirUrl).then(() => {
			uploadResources(pratitioners, sDirectory, fhirUrl).then(() => {
				uploadResources(patients, sDirectory, fhirUrl).then(() => {
					console.log('Done');
				});
			});
		});
	});

shares.command('simulate-consent-cds')
	.description('Headless consent simulator')
	.argument('<cdsBaseUrl>', 'URL of the FHIR server from which to fetch Consent documents')
	.argument('<confidenceThreshold>', 'Confidence threshold for the simulator')
	.argument('<fhirBaseUrl>', 'URL of the FHIR server from which to fetch Consent documents')
	.argument('<consentId>', 'Identifier of a Consent resource to simulate')
	.argument('<bundleDirectory>', 'Local arbitrary directory of JSON FHIR Bundle files to use as patient record content. Each Bundle must contain a Patient resource.')
	.argument('<outputDirectory>', 'Directory in which to write simulator output')
	.action((cdsBaseUrl, confidenceThreshold, fhirBaseUrl, consentId, bundleDirectory, outputDirectory, options) => {
		fs.readdirSync(bundleDirectory).forEach((file) => {
			if (!file.endsWith('.json')) {
				console.warn(`Ignoring file that does not end in '.json': ${file}`);
			} else {
				const sBundleFile = safeFilePathFor(path.join(bundleDirectory, file));
				const url = `${fhirBaseUrl}/Consent/${consentId}`;
				axios.get(url, { headers: { 'Accept': 'application/fhir+json' } }).then((response) => {
					const consent = response.data as Consent;
					const sOutputDirectory = safeFilePathFor(outputDirectory);
					const json: Bundle = JSON.parse(fs.readFileSync(sBundleFile).toString());
					simulateConsent(cdsBaseUrl, confidenceThreshold, consent, json, sOutputDirectory);
				}).catch((error) => {
					console.error(`Error fetching Consent resource:`, error);
				});
			}
		});
	});

shares
	.command('verify-codes')
	.description(
		'Verifies JSON files for relevant codes based on a provided CSV and deletes irrelevant files if the delete flag is set.'
	)
	.argument('<fhirPath>', 'Path to the directory containing JSON files')
	.argument('<csvFilePath>', 'Path to the CSV file containing codes')
	.option('--delete', 'Delete irrelevant files')
	.action((fhirPath, csvFilePath, options) => {
		const { delete: deleteFlag } = options;
		verifyCodes(fhirPath, csvFilePath, deleteFlag);
	});

program.parse(process.argv);

function firstFirstPatientId(bundle: Bundle) {
	let id = null;
	bundle.entry?.forEach((entry) => {
		if (entry.resource?.resourceType == 'Patient' && entry.resource?.id) {
			id = entry.resource.id;
		}
	})
	return id;
}

function simulateConsent(cdsBaseUrl: string, confidenceThreshold: number, consent: Consent, bundle: Bundle, outputDirectory: string) {
	const labeler = new RemoteCdsResourceLabeler(consent, bundle, cdsBaseUrl, confidenceThreshold);
	console.log(`Simulating Consent/${consent.id} from server with local Bundle of ${bundle.entry?.length} resources`);

	const ruleProvider = new DummyRuleProvider();
	const engine = new ConsoleDataSharingEngine(ruleProvider, confidenceThreshold, false);
	const sharingContextSettings = new ConsentCategorySettings();
	sharingContextSettings.treatment.enabled = true;
	sharingContextSettings.research.enabled = true;

	labeler.recomputeLabels().then(() => {
		// console.log('Labeling complete');
		const decisions = engine.computeConsentDecisionsForResources(labeler.labeledResources, consent, sharingContextSettings);
		let data = engine.exportDecisionsForCsv(sharingContextSettings, labeler.labeledResources, decisions);
		let patientId = firstFirstPatientId(bundle);
		if(patientId) {
		const csvPath = path.join(outputDirectory, `consent-${consent.id}-patient-${patientId}-simulation.csv`);
		fs.writeFileSync(csvPath, data);
		console.log(`CSV data written to ${csvPath}`);
		} else {
			console.warn(`No patient ID found in data file. Not writing CSV data for this file.`);
		}
	}).catch((error) => {
		console.error(`Error simulating Consent resource:`, error);
	});
}

async function uploadResources(_paths: string[], directory: string, fhirUrl: string) {
	let next = _paths.shift();
	if (next) {
		await uploadResource(next, directory, fhirUrl);
		if (_paths.length > 0) {
			await uploadResources(_paths, directory, fhirUrl);
		}
	}
}

async function uploadResource(fileName: string, directory: string, fhirUrl: string) {
	const file = path.join(directory, fileName);
	const raw = fs.readFileSync(file).toString();
	const json = JSON.parse(raw) as any;
	// console.log(json);

	if (dryRun) {
		return new Promise<void>((resolve, reject) => {
			console.log(`Dry run: Would have uploaded ${fileName}`);
			resolve();

		});
	} else {
		return axios.post(fhirUrl, json, {
			headers: {
				'Content-Type': 'application/fhir+json',
				'Accept': 'application/fhir+json',
			},
		}).then((response) => {
			console.log(`[SUCCESS]: ${response.status} ${response.statusText}`, file);
			// console.log('Response Data:', JSON.stringify(response.data, null, 2));
		}).catch((error) => {
			if (error.response) {
				console.error(`[FAILURE]: ${error.response.status} ${error.response.statusText}`, file);
				console.error(JSON.stringify(error.response.data, null, 2));
			} else {
				console.error(`[ERROR]: ${error.message}`, file);
			}
		});
	}
}

function safeFilePathFor(fileName: string) {
	let safePath = fileName;
	if (!path.isAbsolute(fileName)) {
		safePath = path.join(process.cwd(), fileName);
	}
	// console.debug(`Safe path: ${safePath}`);
	return safePath;
}

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
		url: `${baseUrl}Library / ${libraryName}`,
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
				fullUrl: `urn: uuid: ${libraryName}`,
				resource: libraryResource,
				request: {
					method: 'POST',
					url: `Library / ${libraryName}`,
				},
			},
		],
	};

	return bundle;
}

// Interfaces generated for mapping functions
interface CodeSystemMapping {
	[key: string]: string;
}

interface Instance {
	code: string;
	system: string;
	lineNumber: number;
}

interface FileInstance {
	file: string;
	instances: Instance[];
}

// Maps code formats in CSV to the formats present in FHIR bundles
const codeSystemMapping: CodeSystemMapping = {
	"SNOMED-CT": "http://snomed.info/sct",
	"LOINC": "http://loinc.org",
	"RxNorm": "http://www.nlm.nih.gov/research/umls/rxnorm",
};

async function parseCSV(filePath: string): Promise<Set<[string, string]>> {
	return new Promise((resolve, reject) => {
		const codes = new Set<[string, string]>();
		fs.createReadStream(filePath)
			.pipe(csvParser())
			.on('data', (row) => {
				if (row.Code && row.Code_Type && codeSystemMapping[row.Code_Type]) {
					codes.add([row.Code, codeSystemMapping[row.Code_Type]]);
				}
			})
			.on('end', () => resolve(codes))
			.on('error', reject);
	});
}

// TODO - Add option for custom paths for generated reports.
async function verifyCodes(inputPath: string, inputCsv: string, deleteFlag: boolean) {
	try {
		const codes = await parseCSV(inputCsv);
		// Other than non json files, selection ignores practitioner and hospital information
		const totalFiles = fs.readdirSync(inputPath).filter(
			(file) =>
				file.endsWith('.json') &&
				!file.startsWith('practitionerInformation') &&
				!file.startsWith('hospitalInformation')
		);

		let relevantFiles = 0;
		let irrelevantFiles = 0;
		const deletedFiles: string[] = [];
		const textSearchInstances: FileInstance[] = [];
		const progressBar = Progress.create({
			total: totalFiles.length,
			pattern: 'Progress: {bar} | {current}/{total} Files | Elapsed: {elapsed}s | {percent}%',
			textColor: 'green',
		});

		const startTime = performance.now();

		for (const [index, filename] of totalFiles.entries()) {
			const filePath = path.join(inputPath, filename);
			const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

			let found = false;
			const instances: Instance[] = [];

			lines.forEach((line, lineIndex) => {
				codes.forEach(([code, system]) => {
					if (line.includes(code)) {
						const above = lineIndex > 0 ? lines[lineIndex - 1] : '';
						const below = lineIndex < lines.length - 1 ? lines[lineIndex + 1] : '';

						if (above.includes(system) || below.includes(system)) {
							instances.push({
								code,
								system,
								lineNumber: lineIndex + 1,
							});
							found = true;
						}
					}
				});
			});

			if (instances.length > 0) {
				textSearchInstances.push({
					file: filename,
					instances,
				});
			}

			if (found) {
				relevantFiles++;
			} else {
				irrelevantFiles++;
				if (deleteFlag) {
					fs.unlinkSync(filePath);
					deletedFiles.push(filename);
				}
			}
			progressBar.update();
		}

		progressBar.done();
		const endTime = performance.now();
		const totalTime = ((endTime - startTime) / 1000).toFixed(2);

		const report = {
			totalFiles: totalFiles.length,
			relevantFiles,
			irrelevantFiles,
			deletedFiles,
			textSearchInstances,
			totalTime: `${totalTime} seconds`,
		};

		const reportPath = path.join(inputPath, 'verification_report.json');
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

		console.log('Verification complete:');
		console.log(`  Total files processed: ${totalFiles.length}`);
		console.log(`  Relevant files: ${relevantFiles}`);
		console.log(`  Irrelevant files: ${irrelevantFiles}`);
		if (deleteFlag) {
			console.log(`  Files deleted: ${deletedFiles.length}`);
		}
		console.log(`  Total time: ${totalTime} seconds`);
		console.log(`  Report saved to: ${reportPath}`);
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error: ${error.message}`);
		}
	}
}


