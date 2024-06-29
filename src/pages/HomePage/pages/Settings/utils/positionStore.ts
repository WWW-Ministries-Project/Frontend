import { create } from "zustand";

interface Position {
  id: number;
  name: string;
}

interface PositionOption {
  name: string;
  value: number;
}

interface PositionStore {
  positions: Position[];
  positionsOptions: PositionOption[];
  addPosition: (position: Position) => void;
  removePosition: (positionId: number) => void;
  updatePosition: (updatedPosition: Position) => void;
  setPositions: (positions: Position[]) => void;
  setPositionsOptions: () => void;
}

const usePositionStore = create<PositionStore>((set, get) => ({
  positions: [],
  positionsOptions: [],
  addPosition: (position) => {
    set((state) => ({
      positions: [...state.positions, position],
    }));
    get().setPositionsOptions();
  },
  removePosition: (positionId) => {
    set((state) => ({
      positions: state.positions.filter((pos) => pos.id !== positionId),
    }));
    get().setPositionsOptions();
  },
  updatePosition: (updatedPosition) => {
    set((state) => ({
      positions: state.positions.map((pos) =>
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
    set((state) => ({
      positionsOptions: state.positions.map((position) => ({
        name: position.name,
        value: +position.id,
      })),
    }));
  },
}));

export default usePositionStore;
