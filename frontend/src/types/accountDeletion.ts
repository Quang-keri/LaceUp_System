export type AccountDeletionStatus =
  | "NONE"
  | "REQUESTED"
  | "WAITING_FOR_OBLIGATIONS"
  | "PROCESSING"
  | "COMPLETED";

export interface DeleteAccountRequest {
  password?: string | null;
  reason?: string | null;
  confirmation: string;
}

export interface DeleteAccountResponse {
  status: AccountDeletionStatus;
  message: string;
  blockers: string[];
}