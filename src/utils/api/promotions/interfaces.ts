/** Home-screen promotional banners for the mobile app.
 *
 *  Deliberately unrelated to `Announcement`: publishing a promotion is silent
 *  (no member inbox row, no push notification), whereas publishing an
 *  announcement fans out to resolved recipients. A banner that should open an
 *  announcement sets `deep_link` to that announcement's route instead. */

export type PromotionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Promotion {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  deep_link: string | null;
  sort_order: number | null;
  status: PromotionStatus;
  start_date: string | null;
  end_date: string | null;
  branch_id: number | null;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  branch?: { id: number; name: string } | null;
}

export interface CreatePromotionDto {
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  deep_link?: string | null;
  sort_order?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

export type UpdatePromotionDto = Partial<CreatePromotionDto>;
