export type AttendanceTimingUnit = "MINUTES" | "HOURS";

export interface AttendanceTimingRuleConfig {
  value: number;
  unit: AttendanceTimingUnit;
  minutes: number;
}

export interface AttendanceTimingSettingsConfig {
  early: AttendanceTimingRuleConfig;
  on_time: AttendanceTimingRuleConfig;
  late: AttendanceTimingRuleConfig;
  updated_at: string | null;
  updated_by: {
    id: number;
    name: string;
  } | null;
}

export interface AttendanceTimingRulePayload {
  value: number;
  unit: AttendanceTimingUnit;
}

export interface AttendanceTimingSettingsPayload {
  early: AttendanceTimingRulePayload;
  on_time: AttendanceTimingRulePayload;
  late: AttendanceTimingRulePayload;
}
