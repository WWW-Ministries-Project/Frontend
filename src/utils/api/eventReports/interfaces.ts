export type EventReportIdentifier = string | number;

export type EventReportGeneratePayload = {
  event_id: EventReportIdentifier;
  event_date: string;
};

export type EventReportServiceSummaryFormat = "docx" | "pdf";

export type EventReportEligibleEvent = {
  event_id: EventReportIdentifier;
  event_name: string;
  event_date: string;
  event_type?: string | null;
  location?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  poster?: string | null;
};

export type EventReportOverviewItem = {
  id?: EventReportIdentifier;
  event_id: EventReportIdentifier;
  event_name: string;
  event_date: string;
  event_type?: string | null;
  location?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  poster?: string | null;
  generated_at?: string | null;
  report_status?: string | null;
};

export type EventReportGenerateResult = {
  event_id?: EventReportIdentifier | null;
  event_date?: string | null;
  message?: string | null;
};

export type EventReportGenerateResponse = {
  data: EventReportGenerateResult | null;
  status: number;
  error: string;
  success: boolean;
  message?: string;
};

export type EventReportDepartmentAttendee = {
  id: string;
  user_id?: EventReportIdentifier | null;
  name: string;
  arrival_time?: string | null;
  arrival_at?: string | null;
  reported_time?: string | null;
  relative_to_start?: string | null;
  status?: string | null;
};

export type EventReportDepartment = {
  department_id: EventReportIdentifier;
  department_name: string;
  head_user_id?: EventReportIdentifier | null;
  head_name?: string | null;
  total_members?: number | null;
  present_members?: number | null;
  absent_members?: number | null;
  attendance_percentage?: number | null;
  attendees?: EventReportDepartmentAttendee[];
};

export type EventReportChurchAttendance = {
  adult_male?: number | null;
  adult_female?: number | null;
  children_male?: number | null;
  children_female?: number | null;
  youth_male?: number | null;
  youth_female?: number | null;
  visitors_male?: number | null;
  visitors_female?: number | null;
  visitors?: number | null;
  visiting_pastors?: number | null;
  visitor_clergy_male?: number | null;
  visitor_clergy_female?: number | null;
  visitor_clergy_total?: number | null;
  visitor_total_male?: number | null;
  visitor_total_female?: number | null;
  visitor_total?: number | null;
};

export type EventReportDetail = {
  event_id: EventReportIdentifier;
  event_name: string;
  event_date: string;
  event_type?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  poster?: string | null;
  available_dates?: string[] | null;
  generated_at?: string | null;
  departments?: EventReportDepartment[];
  church_attendance?: EventReportChurchAttendance | null;
};

export type DownloadedFile = {
  blob: Blob;
  fileName: string;
  contentType?: string | null;
};
