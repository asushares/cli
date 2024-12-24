library Label_Disabilities version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers


codesystem "SNOMEDCT": 'http://snomed.info/sct'

define "Disabilities Codes":
  {
    Code '82423001' from "SNOMEDCT",   // Chronic pain (finding)
    Code '248536006' from "SNOMEDCT",  // Physical disability - Finding of functional performance and activity (finding)
    Code '31748000' from "SNOMEDCT"   // Mental disability - Abnormal mental state (finding)
  }

define DisabilitiesConditions:
   [Condition] C
    where exists (
        C.code.coding Cc
          where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Disabilities Codes"
      )

define function AppliesToPatient():
  exists(DisabilitiesConditions)

define function GetDisabilitiesItems():
  DisabilitiesConditions

// Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetDisabilitiesItems()