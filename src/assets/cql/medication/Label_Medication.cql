library Label_Medication version '1.0.0'

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1' called FHIRHelpers

codesystem "RxNorm": 'http://www.nlm.nih.gov/research/umls/rxnorm'

define "Medication Codes":
  {
    Code '94610' from "RxNorm", // Xanax (alprazolam)
    Code '900169' from "RxNorm", // Lamotrigine
    Code '216459' from "RxNorm"  // Depakote (divalproex)
  }

define PatientMedications:
  [MedicationRequest] M
    where M.medication is CodeableConcept
      and exists (M.medication.coding Cc
      where Code {
            code: Cc.code.value,
            system: Cc.system.value
          } in "Medication Codes")

define function AppliesToPatient():
  exists(PatientMedications)

define function GetMedicationItems():
  PatientMedications

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetMedicationItems()