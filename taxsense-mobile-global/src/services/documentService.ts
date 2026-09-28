import { apiClient } from '@api/client';
import { Document, OCRResult } from '@types/index';

export const DocumentService = {
  /**
   * Get all documents
   */
  async getDocuments(filters?: { type?: string; year?: number }) {
    let query = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.year) params.append('year', filters.year.toString());
      query = params.toString();
    }

    const response = await apiClient.get<Document[]>(
      `/documents${query ? `?${query}` : ''}`
    );
    return response;
  },

  /**
   * Get single document
   */
  async getDocument(id: string) {
    const response = await apiClient.get<Document>(`/documents/${id}`);
    return response;
  },

  /**
   * Upload document
   */
  async uploadDocument(file: any, type: string, metadata?: any) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await apiClient.post<Document>(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  },

  /**
   * Update document
   */
  async updateDocument(id: string, data: Partial<Document>) {
    const response = await apiClient.put<Document>(
      `/documents/${id}`,
      data
    );
    return response;
  },

  /**
   * Delete document
   */
  async deleteDocument(id: string) {
    const response = await apiClient.delete<{ success: boolean }>(
      `/documents/${id}`
    );
    return response;
  },

  /**
   * Process document with OCR
   */
  async processDocumentOCR(documentId: string) {
    const response = await apiClient.post<OCRResult>(
      `/documents/${documentId}/ocr`
    );
    return response;
  },

  /**
   * Extract data from document
   */
  async extractDocumentData(documentId: string) {
    const response = await apiClient.post<any>(
      `/documents/${documentId}/extract`
    );
    return response;
  },

  /**
   * Classify document
   */
  async classifyDocument(documentId: string) {
    const response = await apiClient.post<any>(
      `/documents/${documentId}/classify`
    );
    return response;
  },

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category: string) {
    const response = await apiClient.get<Document[]>(
      `/documents/category/${category}`
    );
    return response;
  },

  /**
   * Search documents
   */
  async searchDocuments(query: string) {
    const response = await apiClient.get<Document[]>(
      `/documents/search?q=${encodeURIComponent(query)}`
    );
    return response;
  },

  /**
   * Get document by external reference
   */
  async linkDocumentToCalculation(documentId: string, calculationId: string) {
    const response = await apiClient.post<Document>(
      `/documents/${documentId}/link`,
      { calculationId }
    );
    return response;
  },

  /**
   * Batch upload documents
   */
  async batchUploadDocuments(files: any[], type: string) {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append('type', type);

    const response = await apiClient.post<Document[]>(
      '/documents/batch-upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response;
  },

  /**
   * Export documents
   */
  async exportDocuments(documentIds: string[], format: 'pdf' | 'zip') {
    const response = await apiClient.post<Blob>(
      `/documents/export`,
      { documentIds, format },
      { responseType: 'blob' as any }
    );
    return response;
  },

  /**
   * Get document storage quota
   */
  async getStorageQuota() {
    const response = await apiClient.get<{
      used: number;
      limit: number;
      percentage: number;
    }>('/documents/storage-quota');
    return response;
  },

  /**
   * Scan receipt with camera
   */
  async scanReceiptWithCamera(imageData: string, type: string) {
    const response = await apiClient.post<{
      amount?: number;
      date?: string;
      vendor?: string;
      extractedData?: any;
    }>('/documents/scan-receipt', { imageData, type });
    return response;
  },
};
