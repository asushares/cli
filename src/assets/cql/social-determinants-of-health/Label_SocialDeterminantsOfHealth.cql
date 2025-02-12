library Label_SocialDeterminantsOfHealth version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "LOINC": 'http://loinc.org'

define "SDOH Codes":
  {
    Code '93030-5' from "LOINC", // Transportation insecurity - kept from medical appointments, work, etc
    Code 'LP264604-2' from "LOINC", // Food insecurity risk
    Code 'LP437574-9' from "LOINC", // Housing insecurity - could also be mistaken for a survey question
    Code 'LP75645-9' from "LOINC"  // Social isolation
  }

define SDOHObservations:
   [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "SDOH Codes"
      )

define function AppliesToPatient():
  exists(SDOHObservations)

define function GetSDOHItems():
  SDOHObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetSDOHItems()