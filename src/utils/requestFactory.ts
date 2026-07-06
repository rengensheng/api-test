import { v4 as uuidv4 } from 'uuid';
import type { RequestConfig } from '../types';

export const createEmptyRequest = (): RequestConfig => ({
  id: uuidv4(),
  name: '未命名请求',
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  body: '',
  bodyType: 'none',
  formData: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
