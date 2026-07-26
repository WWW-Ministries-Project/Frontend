export type SermonStatus = "DRAFT" | "PUBLISHED";

export interface Sermon {
  id: number;
  youtube_url: string;
  title: string;
  video_id: string | null;
  position: number;
}

export interface SermonSeries {
  id: number;
  title: string;
  description: string | null;
  status: SermonStatus;
  branch_id: number | null;
  created_by: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  sermons: Sermon[];
}

export interface SermonLinkDto {
  id?: number;
  youtube_url: string;
}

export interface CreateSermonSeriesDto {
  title: string;
  description?: string | null;
  sermons: SermonLinkDto[];
}

export interface UpdateSermonSeriesDto {
  title?: string;
  description?: string | null;
  sermons?: SermonLinkDto[];
}
