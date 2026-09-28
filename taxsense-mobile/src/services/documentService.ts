import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { Document, DocumentType } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.taxsense.ai';

const documentApi = axios.create({
  baseURL: `${API_URL}/api/documents`,
});

export const documentService = {
  async pickDocument(): Promise<any> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      throw new Error('Failed to pick document');
    }
  },

  async uploadDocument(
    file: any,
    documentType: DocumentType,
    userId: string
  ): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
      formData.append('type', documentType);
      formData.append('userId', userId);

      const response = await documentApi.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Failed to upload document');
    }
  },

  async scanDocument(uri: string, documentType: DocumentType): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `scan_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('type', documentType);

      const response = await documentApi.post('/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error('Failed to scan document');
    }
  },

  async extractDataFromDocument(
    documentId: string
  ): Promise<Record<string, any>> {
    try {
      const response = await documentApi.get(`/${documentId}/extract`);
      return response.data.extractedData;
    } catch (error) {
      throw new Error('Failed to extract document data');
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      await documentApi.delete(`/${documentId}`);
    } catch (error) {
      throw new Error('Failed to delete document');
    }
  },

  async downloadDocument(documentId: string, fileName: string): Promise<void> {
    try {
      const response = await documentApi.get(`/${documentId}/download`, {
        responseType: 'arraybuffer',
      });

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        Buffer.from(response.data).toString('base64'),
        { encoding: FileSystem.EncodingType.Base64 }
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      throw new Error('Failed to download document');
    }
  },

  async getDocuments(userId: string, type?: DocumentType): Promise<Document[]> {
    try {
      const params = new URLSearchParams();
      if (type) {
        params.append('type', type);
      }

      const response = await documentApi.get(`/user/${userId}?${params}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch documents');
    }
  },

  async generatePDF(data: any, fileName: string): Promise<string> {
    try {
      // This would typically call a backend service to generate PDF
      const response = await documentApi.post('/generate-pdf', {
        data,
        fileName,
      });

      const fileUri = `${FileSystem.documentDirectory}${fileName}.pdf`;
      await FileSystem.downloadAsync(response.data.url, fileUri);

      return fileUri;
    } catch (error) {
      throw new Error('Failed to generate PDF');
    }
  },

  async shareDocument(uri: string, mimeType: string = 'application/pdf') {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(uri, {
        mimeType,
      });
    } catch (error) {
      throw new Error('Failed to share document');
    }
  },
};
