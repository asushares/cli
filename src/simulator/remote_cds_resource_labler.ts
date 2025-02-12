// Author: Preston Lee

import { Card, DataSharingCDSHookRequest, DataSharingEngineContext } from "@asushares/core";
import { Bundle, Consent, FhirResource } from "fhir/r5";
import axios from "axios";

export class RemoteCdsResourceLabeler {

    public labeledResources: FhirResource[] = [];
    public consentDecisions: { [key: string]: Card } = {};

    constructor(public consent: Consent, public bundle: Bundle, public cdsBaseUrl: string, public threshold: number) {
        // super(input);
    }

    reset() {
        this.labeledResources = [];
    }

    // simulate() {
    //     return this.recomputeLabels().then(() => {
    // this.recomputeConsentDecisions();
    //     });
    // }

    recomputeLabels() {
        let patientId = this.consent?.subject?.reference || ('Patient/' + this.consent?.subject?.id);
        const data = new DataSharingCDSHookRequest();
        data.context.patientId = [{ value: patientId }];
        data.context.content = this.bundle;
        const headers: { [key: string]: string } = {};
        headers[DataSharingEngineContext.HEADER_CDS_REDACTION_ENABLED] = 'false';
        headers[DataSharingEngineContext.HEADER_CDS_CONFIDENCE_THRESHOLD] = this.threshold.toString();
        const url = this.cdsBaseUrl + '/cds-services/' + (new DataSharingCDSHookRequest().hook);
        console.log('Invoking remote CDS labeling service at:', url);
        // console.debug('Data:', JSON.stringify(data.context));
        return axios.post<Card>(url, data, { headers: headers }).then((result) => {
            const data = result.data;
            // console.debug('Result: ', data);
            if (data.extension.content?.entry) {
                console.log('Entries:', data.extension.content.entry.length);
                this.labeledResources = data.extension.content.entry.map(e => e.resource).filter(r => r !== undefined);
            }
            console.log('Security labeling completed.');
        });
    }

}