export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyType = 'none' | 'json' | 'form' | 'multipart' | 'raw';

export interface FormDataField {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

export interface RequestConfig {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: string;
  bodyType: BodyType;
  formData: FormDataField[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  requestId: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: string;
  bodyType: BodyType;
  formData: FormDataField[];
  statusCode: number | null;
  responseTime: number | null;
  responseSize: number | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedRequest {
  id: string;
  collectionId: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: string;
  bodyType: BodyType;
  formData: FormDataField[];
  createdAt: string;
  updatedAt: string;
}

export interface ArchivedRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  params: KeyValue[];
  body: string;
  bodyType: BodyType;
  formData: FormDataField[];
  archivedAt: string;
  createdAt: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  time: number;
  size: number;
}

export type SidebarTab = 'collections' | 'history' | 'archives';

export interface ExportData {
  version: string;
  exportedAt: string;
  collections: Collection[];
  savedRequests: SavedRequest[];
  archivedRequests: ArchivedRequest[];
}