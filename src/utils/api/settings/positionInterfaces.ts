export type PositionType = {
  id: number;
  name: string;
  description?: string;
  department?: { id: number; name: string };
}