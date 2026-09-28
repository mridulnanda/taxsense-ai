import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document } from '@types/index';
import { STORAGE_KEYS } from '@constants/index';

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setDocuments: (docs: Document[]) => void;
  addDocument: (doc: Document) => void;
  removeDocument: (docId: string) => void;
  updateDocument: (docId: string, updates: Partial<Document>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (doc: Document) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  getDocumentsByType: (type: string) => Document[];
  reset: () => void;
}

const initialState = {
  documents: [],
  isLoading: false,
  error: null,
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDocuments: (documents) => set({ documents }),

      addDocument: (doc) => {
        const { documents } = get();
        set({ documents: [doc, ...documents] });
      },

      removeDocument: (docId) => {
        const { documents } = get();
        set({ documents: documents.filter((d) => d.id !== docId) });
      },

      updateDocument: (docId, updates) => {
        const { documents } = get();
        const updated = documents.map((d) =>
          d.id === docId ? { ...d, ...updates } : d
        );
        set({ documents: updated });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      fetchDocuments: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('https://api.taxsense.global/documents');

          if (!response.ok) {
            throw new Error('Failed to fetch documents');
          }

          const data = await response.json();
          set({ documents: data });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Fetch failed';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      uploadDocument: async (doc) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', doc as any);
          formData.append('type', doc.type);

          const response = await fetch('https://api.taxsense.global/documents/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const data = await response.json();
          get().addDocument(data);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteDocument: async (docId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(
            `https://api.taxsense.global/documents/${docId}`,
            { method: 'DELETE' }
          );

          if (!response.ok) {
            throw new Error('Delete failed');
          }

          get().removeDocument(docId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Delete failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getDocumentsByType: (type) => {
        const { documents } = get();
        return documents.filter((d) => d.type === type);
      },

      reset: () => set(initialState),
    }),
    {
      name: STORAGE_KEYS.DOCUMENTS,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
