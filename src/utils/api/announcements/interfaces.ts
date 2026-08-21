export type AudienceType =
  | "ALL_MEMBERS"
  | "MINISTRY_WORKERS"
  | "HEADS_OF_DEPARTMENT"
  | "SPECIFIC_DEPARTMENT"
  | "SPECIFIC_POSITION";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED";

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience_type: AudienceType;
  department_id: number | null;
  position_id: number | null;
  status: AnnouncementStatus;
  branch_id: number | null;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: number; name: string } | null;
  position?: { id: number; name: string } | null;
  /** Banner Carousel fields (wwm-mobile Home screen) — all optional, only
   *  meaningful when is_promoted is true. */
  image_url?: string | null;
  cta_label?: string | null;
  deep_link?: string | null;
  sort_order?: number | null;
  is_promoted?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  audience_type: AudienceType;
  department_id?: number | null;
  position_id?: number | null;
  image_url?: string | null;
  cta_label?: string | null;
  deep_link?: string | null;
  sort_order?: number | null;
  is_promoted?: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;
