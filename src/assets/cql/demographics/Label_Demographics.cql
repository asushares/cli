library Label_Demographics version '1.0.0'

using FHIR version '4.0.1'

define DemographicsConditions:
  [Condition] C

define DemographicsMedications:
    [MedicationRequest] M

define DemographicsObservations:
    [Observation] O

define function AppliesToPatient():
  true // Since demographics are always applicable

// Gets ALL data associated with the patient
define function GetDemographicsItems():
  DemographicsConditions
  union
  DemographicsMedications
  union
  DemographicsObservations

//Testing only
define Applies:
  AppliesToPatient()

define GetData:
  GetDemographicsItems()