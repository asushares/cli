library Label_SexualReproductiveHealth version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "SNOMEDCT": 'http://snomed.info/sct'

define "Sexual and Reproductive Health Codes":
  {
    Code '10761341000119105' from "SNOMEDCT", // Preterm labor without delivery (finding)
    Code '87527008' from "SNOMEDCT", // Term pregnancy (finding)
    Code '83911000119104' from "SNOMEDCT"   // Severe obesity (disorder) (as it relates to reproductive health) in a Mengyi note
  }

define SRHConditions:
    [Condition] C
    where exists (
        C.code.coding Cc
          where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Sexual and Reproductive Health Codes"
      )

define function AppliesToPatient():
  exists(SRHConditions)

define function GetSRHItems():
  SRHConditions

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetSRHItems()