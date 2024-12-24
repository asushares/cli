library Label_Diagnoses version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers


codesystem "SNOMEDCT": 'http://snomed.info/sct'
codesystem "LOINC": 'http://loinc.org'

define "Diagnoses Condition Codes":
  {
    Code '83911000119104' from "SNOMEDCT", // Severe obesity (disorder)
    Code '13644009' from "SNOMEDCT", // Hypercholesterolemia (disorder)
    Code '68566005' from "SNOMEDCT", // Urinary tract infectious disease (disorder)
    Code '6471006' from "SNOMEDCT", // Suicidal thoughts (finding)
    Code '10761341000119105' from "SNOMEDCT" // Preterm labor without delivery (finding)
  }

define "Diagnoses Observation Codes":
  {
    Code '13457-7' from "LOINC", // LDL Cholesterol - 	Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation
    Code '18262-6' from "LOINC", // VLDL Cholesterol - 	Cholesterol in LDL [Mass/volume] in Serum or Plasma by Direct assay
    Code '630-4' from "LOINC"   // Bacteria identified in Urine by Culture
  }

define DiagnosesConditions:
  [Condition] C
    where exists (
        C.code.coding Cc
          where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Diagnoses Condition Codes"
      )

define DiagnosesObservations:
  [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "Diagnoses Observation Codes"
      )

define function AppliesToPatient():
  exists(DiagnosesConditions)
    or exists(DiagnosesObservations)

define function GetDiagnosesItems():
  DiagnosesConditions
    union
  DiagnosesObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetDiagnosesItems()