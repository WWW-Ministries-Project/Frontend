/** Annual theme shown on the mobile Home screen and the dashboard. At most one
 *  theme per branch is current (`isActive`). */
export interface AnnualTheme {
  id: number;
  year: number;
  title: string;
  verseReference: string;
  verse: string;
  message: string;
  imageUrl: string | null;
  isActive: boolean;
  branch_id: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Create/update body. `PUT theme/update-theme?id=` only writes these keys. */
export interface AnnualThemePayload {
  year: number;
  title: string;
  verseReference: string;
  verse: string;
  message: string;
  imageUrl: string | null;
  isActive: boolean;
}
