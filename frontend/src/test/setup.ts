import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

export const mockUser = {
  uid: "user-123",
  displayName: "Maria Silva",
  email: "maria@test.com",
  photoURL: null as string | null,
  getIdToken: vi.fn().mockResolvedValue("fake-token"),
};

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: unknown }) => children,
  PieChart: ({ children }: { children: unknown }) => children,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock("../services/firebase", () => ({
  auth: { currentUser: mockUser },
  db: {},
  app: {},
  storage: {},
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, callback: (user: typeof mockUser | null) => void) => {
    callback(mockUser);
    return vi.fn();
  }),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  getAuth: vi.fn(),
}));

const emptyQuerySnapshot = {
  docs: [] as Array<{ id: string; data: () => Record<string, unknown> }>,
  empty: true,
  forEach: () => undefined,
  exists: () => false,
  data: () => ({}),
};

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  query: vi.fn((...args: unknown[]) => args),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((_ref: unknown, callback: (snapshot: unknown) => void) => {
    callback(emptyQuerySnapshot);
    return vi.fn();
  }),
  getDocs: vi.fn().mockResolvedValue(emptyQuerySnapshot),
  getDoc: vi.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ categoryPreset: "personal" }),
  }),
  addDoc: vi.fn().mockResolvedValue({ id: "new-doc-id" }),
  setDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  Timestamp: {
    fromDate: vi.fn((date: Date) => date),
    now: vi.fn(() => new Date()),
  },
}));

class MockFileReader {
  result: string | ArrayBuffer | null = "data:image/png;base64,abc";
  onloadend: (() => void) | null = null;

  readAsDataURL() {
    this.onloadend?.();
  }
}

vi.stubGlobal("FileReader", MockFileReader);

afterEach(() => {
  cleanup();
  localStorage.clear();
});
