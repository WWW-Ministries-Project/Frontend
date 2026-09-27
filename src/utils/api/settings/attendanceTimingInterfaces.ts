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
  /** When the current rules started to apply (ISO). */
  effective_from: string | null;
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
  /** false: rules apply only to attendance recorded after saving. */
  apply_to_existing: boolean;
  /** YYYY-MM; required when apply_to_existing is true. */
  apply_from?: string;
}
