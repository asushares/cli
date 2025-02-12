library Label_BehavioralHealth version '1.0.0'

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "SNOMEDCT": 'http://snomed.info/sct'
codesystem "LOINC": 'http://loinc.org'
codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'

define "Behavioral Health Condition Codes":
  {
    Code '13746004' from "SNOMEDCT",   // Bipolar disorder
    Code '65971000052100' from "SNOMEDCT",   // Acute psychosis
    Code '35489007' from "SNOMEDCT",  // Major depressive disorder
    Code '48694002' from "SNOMEDCT",   // Anxiety disorder
    Code '6471006' from "SNOMEDCT"   // Suicidal ideation
  }

define "Behavioral Health Medication Codes":
  {
    Code '94610' from "RxNorm",   // Xanax (alprazolam)
    Code '900169' from "RxNorm",   // Lamotrigine
    Code '216459' from "RxNorm"    // Depakote (divalproex)
  }

define "Behavioral Health Observation Codes":
  {
    Code '19359-9' from "LOINC"    // Cocaine [Presence] in Urine by Screen method
  }

define BehavioralHealthConditions:
  [Condition] C
    where exists (
        C.code.coding Cc
          where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Behavioral Health Condition Codes"
      )


define BehavioralHealthMedications:
    [MedicationRequest] M
    where M.medication is CodeableConcept
            and exists (M.medication.coding Cc
      where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Behavioral Health Medication Codes")

define BehavioralHealthObservations:
    [Observation] O
    where exists (
        O.code.coding Oc
          where Code {
            code: Oc.code.value,
            system: Oc.system.value
          } in "Behavioral Health Observation Codes"
      )

define function AppliesToPatient():
  exists(BehavioralHealthConditions)
    or exists(BehavioralHealthMedications)
    or exists(BehavioralHealthObservations)

define function GetBehavioralHealthItems():
  BehavioralHealthConditions
    union
  BehavioralHealthMedications
    union
  BehavioralHealthObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetBehavioralHealthItems()