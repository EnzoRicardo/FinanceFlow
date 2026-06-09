import { getDocs, onSnapshot } from "firebase/firestore";
import { vi } from "vitest";

type FirestoreDoc = {
  id: string;
  data: Record<string, unknown>;
};

export function createQuerySnapshot(docs: FirestoreDoc[]) {
  const mappedDocs = docs.map((doc) => ({
    id: doc.id,
    data: () => doc.data,
  }));

  return {
    docs: mappedDocs,
    empty: docs.length === 0,
    forEach: (fn: (doc: (typeof mappedDocs)[number]) => void) => {
      mappedDocs.forEach(fn);
    },
    exists: () => docs.length > 0,
    data: () => docs[0]?.data ?? {},
  };
}

export function mockOnSnapshotData(docs: FirestoreDoc[]) {
  vi.mocked(onSnapshot).mockImplementation(((
    _ref: unknown,
    callback: (snapshot: ReturnType<typeof createQuerySnapshot>) => void,
  ) => {
    callback(createQuerySnapshot(docs));
    return vi.fn();
  }) as unknown as typeof onSnapshot);
}

export function mockGetDocsData(docs: FirestoreDoc[]) {
  vi.mocked(getDocs).mockResolvedValue(
    createQuerySnapshot(docs) as unknown as Awaited<ReturnType<typeof getDocs>>,
  );
}
