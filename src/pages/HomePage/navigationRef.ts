export const navigateRef = {
  current: null as
    | ((path: string, options?: { state: { mode: string } }) => void)
    | null,
};
