import { StateCreator } from "zustand";
import { Position, PositionSlice } from "./settingsInterfaces";

const createPositionSlice: StateCreator<
  PositionSlice,
  [["zustand/devtools", never]],
  [],
  PositionSlice
> = (set, get) => ({
  positions: [],
  positionsOptions: [],
  addPosition: (position: Position) => {
    set((state) => ({
      positions: [...state.positions, position],
    }));
    get().setPositionsOptions();
  },
  removePosition: (positionId: string | number) => {
    set((state) => ({
      positions: state.positions.filter((pos) => pos.id !== positionId),
    }));
    get().setPositionsOptions();
  },
  updatePosition: (updatedPosition: Position) => {
    set((state) => ({
      positions: state.positions.map((pos) =>
        pos.id === updatedPosition.id ? updatedPosition : pos
      ),
    }));
    get().setPositionsOptions();
  },
  setPositions: (positions: Position[]) => {
    set({ positions });
    get().setPositionsOptions();
  },
  setPositionsOptions: () => {
    set((state) => ({
      positionsOptions: state.positions.map((position) => ({
        label: position.name,
        value: position.id,
      })),
    }));
  },
});

export default createPositionSlice;
