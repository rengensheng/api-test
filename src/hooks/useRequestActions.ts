import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  createSavedRequest,
  updateSavedRequest,
  createHistoryItem,
  createArchivedRequest,
  deleteSavedRequest,
} from '../services/database';
import { sendRequest } from '../services/http';
import { message } from '../components/ui';
import { createEmptyRequest } from '../utils/requestFactory';
import type {
  RequestConfig,
  ResponseData,
  SavedRequest,
  HistoryItem,
  ArchivedRequest,
} from '../types';


interface UseRequestActionsResult {
  currentRequest: RequestConfig | null;
  response: ResponseData | null;
  loading: boolean;
  isNewRequest: boolean;
  selectedCollectionId: string | null;
  setResponse: (response: ResponseData | null) => void;
  setCurrentRequest: (request: RequestConfig | null) => void;
  onSend: () => Promise<void>;
  onSave: (collectionId: string | null, name: string) => Promise<void>;
  onArchive: () => Promise<void>;
  onSelectRequest: (request: SavedRequest | HistoryItem | ArchivedRequest) => void;
  onNewRequest: () => void;
  onImportCurl: (request: RequestConfig) => void;
  refreshTrigger: number;
}
export const useRequestActions = (): UseRequestActionsResult => {
  const [currentRequest, setCurrentRequest] = useState<RequestConfig | null>(null);

  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isNewRequest, setIsNewRequest] = useState(true);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onSend = useCallback(async () => {
    if (!currentRequest || !currentRequest.url) {
      message.warning('请输入请求 URL');
      return;
    }
    setLoading(true);
    try {
      const responseData = await sendRequest(currentRequest);
      setResponse(responseData);
      const historyItem: HistoryItem = {
        id: uuidv4(),
        requestId: null,
        name: currentRequest.name,
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        params: currentRequest.params,
        body: currentRequest.body,
        bodyType: currentRequest.bodyType,
        formData: currentRequest.formData || [],
        statusCode: responseData.status,
        responseTime: responseData.time,
        responseSize: responseData.size,
        createdAt: new Date().toISOString(),
      };
      await createHistoryItem(historyItem);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      message.error(`请求失败: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [currentRequest]);

  const onSave = useCallback(
    async (collectionId: string | null, name: string) => {
      if (!currentRequest) return;
      try {
        if (isNewRequest) {
          await createSavedRequest({
            ...currentRequest,
            id: uuidv4(),
            name,
            collectionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          message.success('请求已保存');
        } else {
          await updateSavedRequest({
            ...currentRequest,
            name,
            collectionId,
            updatedAt: new Date().toISOString(),
          });
          message.success('请求已更新');
        }
        setRefreshTrigger((prev) => prev + 1);
        setIsNewRequest(false);
      } catch (err) {
        message.error(`保存失败: ${err}`);
      }
    },
    [currentRequest, isNewRequest]
  );
  const onArchive = useCallback(async () => {
    if (!currentRequest || isNewRequest) return;
    if (!window.confirm('确定归档此请求？')) return;
    try {
      await createArchivedRequest({
        id: uuidv4(),
        name: currentRequest.name,
        method: currentRequest.method,
        url: currentRequest.url,
        headers: currentRequest.headers,
        params: currentRequest.params,
        body: currentRequest.body,
        bodyType: currentRequest.bodyType,
        formData: currentRequest.formData || [],
        archivedAt: new Date().toISOString(),
        createdAt: currentRequest.createdAt,
      });
      await deleteSavedRequest(currentRequest.id);
      message.success('请求已归档');
      setCurrentRequest(null);
      setResponse(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      message.error(`归档失败: ${err}`);
    }
  }, [currentRequest, isNewRequest]);


  const onSelectRequest = useCallback(
    (request: SavedRequest | HistoryItem | ArchivedRequest) => {
      const config: RequestConfig = {
        id: request.id,
        name: request.name,
        method: request.method,
        url: request.url,
        headers: request.headers,
        params: request.params,
        body: request.body,
        bodyType: request.bodyType,
        formData: request.formData || [],
        createdAt: 'createdAt' in request ? request.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentRequest(config);
      setResponse(null);
      const isSavedRequest = 'collectionId' in request;
      setIsNewRequest(!isSavedRequest);
      setSelectedCollectionId(isSavedRequest ? request.collectionId : null);
    },
    []
  );

  const onNewRequest = useCallback(() => {
    setCurrentRequest(createEmptyRequest());
    setResponse(null);
    setIsNewRequest(true);
    setSelectedCollectionId(null);
  }, []);

  const onImportCurl = useCallback((request: RequestConfig) => {
    setCurrentRequest(request);
    setResponse(null);
    setIsNewRequest(true);
    setSelectedCollectionId(null);
  }, []);

  return {
    currentRequest,
    response,
    loading,
    isNewRequest,
    selectedCollectionId,
    setResponse,
    setCurrentRequest,
    onSend,
    onSave,
    onArchive,
    onSelectRequest,
    onNewRequest,
    onImportCurl,
    refreshTrigger,
  };
};