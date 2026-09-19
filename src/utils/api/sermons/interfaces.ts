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

/**
 * Sermons nested inside a series come back as raw rows: the Backend's series
 * include hydrates neither tags nor the parent series reference. Only a
 * sermon fetched through the sermon endpoints carries those.
 */
export type SermonInSeries = Omit<Sermon, "tags" | "series">;

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
  sermons: SermonInSeries[];
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
