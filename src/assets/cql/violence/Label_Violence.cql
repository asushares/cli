library Label_Violence version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers
codesystem "SNOMEDCT": 'http://snomed.info/sct'


define "Violence Related Codes":
  {
    Code '412732008' from "SNOMEDCT", // History of domestic violence
    Code '90774003' from "SNOMEDCT", // Victim of physical assault
    Code '248062006'  from "SNOMEDCT"  // Self-injurious behavior
  }

define ViolenceConditions:
  [Condition] C
    where exists (
        C.code.coding Cc
          where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Violence Related Codes"
      )

define ViolenceObservations:
  [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "Violence Related Codes"
      )

define function AppliesToPatient():
  exists(ViolenceConditions)
    or exists(ViolenceObservations)

define function GetViolenceItems():
  ViolenceConditions
    union
  ViolenceObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetViolenceItems()