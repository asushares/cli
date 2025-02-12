library Label_Genetics version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "LOINC": 'http://loinc.org'

define "Genetic Factors Codes":
  {
    Code '87759-7' from "LOINC", // Lifetime risk for developing genetic disease assessed Lifetime
    Code '48018-6' from "LOINC" // Family history of disorder - Genes assessed
  }

define GeneticsObservations:

  [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "Genetic Factors Codes"
      )

define function AppliesToPatient():
  exists(GeneticsObservations)

define function GetGeneticsItems():
  GeneticsObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetGeneticsItems()