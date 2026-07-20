export type PositionType = {
  id: number;
  name: string;
  description?: string;
  branch_id?: number | null;
  department?: { id: number; name: string };
}