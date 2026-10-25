export type DoseStatus = "pending" | "taken" | "snoozed" | "missed" | "not_recorded";

export type Medication = {
  id: string;
  name: string;
  strength: string;
  instructions: string;
  frequencyLabel: string;
  scheduledTime: string;
  status: DoseStatus;
  prescriber: string;
  courseLabel: string;
};

export type Appointment = {
  date: string;
  clinician: string;
  department: string;
};
