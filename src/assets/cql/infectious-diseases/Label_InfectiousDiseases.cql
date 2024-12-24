library Label_InfectiousDiseases version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "SNOMEDCT": 'http://snomed.info/sct'
codesystem "LOINC": 'http://loinc.org'

define "Infectious Disease Condition Codes":
  {
    Code '86406008' from "SNOMEDCT", // HIV infection
    Code '66071002' from "SNOMEDCT", // Hepatitis B
    Code '56717001' from "SNOMEDCT", // Tuberculosis
    Code '6142004'  from "SNOMEDCT", // Influenza
    Code '840539006' from "SNOMEDCT" // COVID-19
  }

define "Infectious Disease Observation Codes":
  {
    Code '5220-9'   from "LOINC", // HIV 1 Ab [Presence] in Serum or Plasma
    Code '5196-1'   from "LOINC", // Hepatitis B surface Ag [Presence] in Serum or Plasma
    Code '100968-7'  from "LOINC", // Tuberculosis skin test
    Code '62462-7'  from "LOINC", // Influenza virus A+B Ag [Presence] in Respiratory specimen
    Code '94500-6'  from "LOINC"  // SARS-CoV-2 (COVID-19) RNA [Presence] in Respiratory specimen by NAA with probe detection
  }

define InfectiousDiseaseConditions:
  [Condition] C
    where exists (
        C.code.coding Cc
          where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Infectious Disease Condition Codes"
      )


define InfectiousDiseaseObservations:
  [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "Infectious Disease Observation Codes"
      )

define function AppliesToPatient():
  exists(InfectiousDiseaseConditions)
    or exists(InfectiousDiseaseObservations)

define function GetInfectiousDiseaseItems():
  InfectiousDiseaseConditions
    union
  InfectiousDiseaseObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetInfectiousDiseaseItems()