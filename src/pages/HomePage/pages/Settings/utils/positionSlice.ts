import { StateCreator } from "zustand";
import { Position, PositionSlice } from "./settingsInterfaces";

//TODO: Delete position store and fetch positions directly in settings page
const createPositionSlice: StateCreator<
  PositionSlice,
  [["zustand/devtools", never]],
  [],
  PositionSlice
> = (set, get) => ({
  positions: [],
  total: 0,
  // positionsOptions: [],
  addPosition: (position: Position) => {
    set((state) => ({
      positions: [...state.positions, position],
    }));
    // get().setPositionsOptions();
  },
  removePosition: (positionId: string | number) => {
    set((state) => ({
      positions: state.positions.filter((pos) => pos.id !== positionId),
    }));
    // get().setPositionsOptions();
  },
  updatePosition: (updatedPosition: Position) => {
    set((state) => ({
      positions: state.positions.map((pos) =>
        pos.id === updatedPosition.id ? updatedPosition : pos
      ),
    }));
    // get().setPositionsOptions();
  },
  setPositions: (positions: Position[], total: number) => {
    set({ positions, total });
    // get().setPositionsOptions();
  },
  // setPositionsOptions: () => {
  //   set((state) => ({
  //     positionsOptions: state.positions.map((position) => ({
  //       label: position.name,
  //       value: position.id,
  //     })),
  //   }));
  // },
});

export default createPositionSlice;
