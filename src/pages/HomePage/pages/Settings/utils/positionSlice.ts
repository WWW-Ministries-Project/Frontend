import { PositionSlice, Position, PositionOption } from "./settingsInterfaces";

const createPositionSlice = (set: any, get: any): PositionSlice => ({
  positions: [],
  positionsOptions: [],
  addPosition: (position) => {
    set((state: any) => ({
      positions: [...state.positions, position],
    }));
    get().setPositionsOptions();
  },
  removePosition: (positionId) => {
    set((state: any) => ({
      positions: state.positions.filter((pos: Position) => pos.id !== positionId),
    }));
    get().setPositionsOptions();
  },
  updatePosition: (updatedPosition) => {
    set((state: any) => ({
      positions: state.positions.map((pos: Position) =>
        pos.id === updatedPosition.id ? updatedPosition : pos
      ),
    }));
    get().setPositionsOptions();
  },
  setPositions: (positions) => {
    set({ positions });
    get().setPositionsOptions();
  },
  setPositionsOptions: () => {
    set((state: any) => ({
      positionsOptions: state.positions.map((position: Position) => ({
        name: position.name,
        value: position.id,
      })),
    }));
  },
});

export default createPositionSlice;
