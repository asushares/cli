library Label_SubstanceUse version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "LOINC": 'http://loinc.org'

define "Substance Use Codes":
  {
    Code 'LP263718-1' from "LOINC", // HEDIS 2018 Value Set - Alcohol Screening
    Code 'LP389374-2' from "LOINC", // Amphetamines screen method | Urine | Drug toxicology
    Code 'LP32820-0' from "LOINC",  // Amphetamines screen method
    Code '19359-9' from "LOINC",    // Cocaine [Presence] in Urine by Screen method
    Code 'LP173580-4' from "LOINC", // Alcohol use
    Code 'LP74101-4' from "LOINC",  // History of present alcohol & substance abuse
    Code 'LP419701-0' from "LOINC", // Cannabis substance involvement score
    Code 'LA6189-0' from "LOINC",   // Drug dependency
    Code 'LP63624-8' from "LOINC",  // Drugs of abuse panel
    Code 'LA31122-7' from "LOINC",  // Cannabis (marijuana, pot, grass, hash, etc.)
    Code 'LP173579-6' from "LOINC"  // Drug use
  }

define SubstanceUseObservations:
  [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "Substance Use Codes"
      )

define function AppliesToPatient():
  exists(SubstanceUseObservations)

define function GetSubstanceUseItems():
  SubstanceUseObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetSubstanceUseItems()