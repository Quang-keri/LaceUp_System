import type { BookingShortResponse } from "./court";

export interface SlotResponse {
  slotId?: string;
  courtCopyId?: string;
  courtCode?: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  slotStatus?: string;
  bookingShortResponse?: BookingShortResponse;
}
