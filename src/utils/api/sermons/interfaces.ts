export type SermonStatus = "DRAFT" | "PUBLISHED";

export interface SermonTag {
  id: number;
  name: string;
  slug: string;
}

export interface SermonSeriesRef {
  id: number;
  title: string;
}

export interface Sermon {
  id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  video_id: string | null;
  thumbnail_url: string | null;
  status: SermonStatus;
  series_id: number | null;
  branch_id: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  series: SermonSeriesRef | null;
  tags: SermonTag[];
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

export interface CreateSermonDto {
  title: string;
  description?: string | null;
  youtube_url: string;
  series_id?: number | null;
  tags?: string[];
}

export interface UpdateSermonDto {
  title?: string;
  description?: string | null;
  youtube_url?: string;
  series_id?: number | null;
  tags?: string[];
}

export interface CreateSermonSeriesDto {
  title: string;
  description?: string | null;
}

export interface UpdateSermonSeriesDto {
  title?: string;
  description?: string | null;
}
