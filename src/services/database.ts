import Database from '@tauri-apps/plugin-sql';
import type { Collection, SavedRequest, HistoryItem, ArchivedRequest, KeyValue, FormDataField } from '../types';

let db: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  db = await Database.load('sqlite:api-test.db');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS saved_requests (
      id TEXT PRIMARY KEY,
      collection_id TEXT,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT NOT NULL,
      params TEXT NOT NULL,
      body TEXT NOT NULL,
      body_type TEXT NOT NULL,
      form_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (collection_id) REFERENCES collections(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT NOT NULL,
      params TEXT NOT NULL,
      body TEXT NOT NULL,
      body_type TEXT NOT NULL,
      form_data TEXT,
      status_code INTEGER,
      response_time INTEGER,
      response_size INTEGER,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS archived_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT NOT NULL,
      params TEXT NOT NULL,
      body TEXT NOT NULL,
      body_type TEXT NOT NULL,
      form_data TEXT,
      archived_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // 迁移：添加 form_data 列（如果不存在）
  try {
    await db.execute(`ALTER TABLE saved_requests ADD COLUMN form_data TEXT`);
  } catch { /* 列已存在，忽略 */ }

  try {
    await db.execute(`ALTER TABLE history ADD COLUMN form_data TEXT`);
  } catch { /* 列已存在，忽略 */ }

  try {
    await db.execute(`ALTER TABLE archived_requests ADD COLUMN form_data TEXT`);
  } catch { /* 列已存在，忽略 */ }

  return db;
}

function parseKeyValue(json: string): KeyValue[] {
  try {
    return JSON.parse(json) as KeyValue[];
  } catch {
    return [];
  }
}

function parseFormData(json: string | null): FormDataField[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as FormDataField[];
  } catch {
    return [];
  }
}

// Collections
export async function getCollections(): Promise<Collection[]> {
  if (!db) await initDatabase();
  const results = await db!.select<Collection[]>('SELECT * FROM collections ORDER BY created_at DESC');
  return results;
}

export async function createCollection(collection: Collection): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute(
    'INSERT INTO collections (id, name, parent_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
    [collection.id, collection.name, collection.parentId, collection.createdAt, collection.updatedAt]
  );
}

export async function updateCollection(collection: Collection): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute(
    'UPDATE collections SET name = $1, parent_id = $2, updated_at = $3 WHERE id = $4',
    [collection.name, collection.parentId, collection.updatedAt, collection.id]
  );
}

export async function deleteCollection(id: string): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute('DELETE FROM saved_requests WHERE collection_id = $1', [id]);
  await db!.execute('DELETE FROM collections WHERE id = $1', [id]);
}

// Saved Requests
export async function getSavedRequests(): Promise<SavedRequest[]> {
  if (!db) await initDatabase();
  const results = await db!.select<Array<{
    id: string;
    collection_id: string | null;
    name: string;
    method: string;
    url: string;
    headers: string;
    params: string;
    body: string;
    body_type: string;
    form_data: string | null;
    created_at: string;
    updated_at: string;
  }>>('SELECT * FROM saved_requests ORDER BY created_at DESC');

  return results.map(r => ({
    id: r.id,
    collectionId: r.collection_id,
    name: r.name,
    method: r.method as SavedRequest['method'],
    url: r.url,
    headers: parseKeyValue(r.headers),
    params: parseKeyValue(r.params),
    body: r.body,
    bodyType: r.body_type as SavedRequest['bodyType'],
    formData: parseFormData(r.form_data),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function createSavedRequest(request: SavedRequest): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute(
    'INSERT INTO saved_requests (id, collection_id, name, method, url, headers, params, body, body_type, form_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
    [
      request.id,
      request.collectionId,
      request.name,
      request.method,
      request.url,
      JSON.stringify(request.headers),
      JSON.stringify(request.params),
      request.body,
      request.bodyType,
      JSON.stringify(request.formData),
      request.createdAt,
      request.updatedAt,
    ]
  );
}

export async function updateSavedRequest(request: SavedRequest): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute(
    'UPDATE saved_requests SET name = $1, method = $2, url = $3, headers = $4, params = $5, body = $6, body_type = $7, collection_id = $8, form_data = $9, updated_at = $10 WHERE id = $11',
    [
      request.name,
      request.method,
      request.url,
      JSON.stringify(request.headers),
      JSON.stringify(request.params),
      request.body,
      request.bodyType,
      request.collectionId,
      JSON.stringify(request.formData),
      request.updatedAt,
      request.id,
    ]
  );
}

export async function deleteSavedRequest(id: string): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute('DELETE FROM saved_requests WHERE id = $1', [id]);
}

// History
export async function getHistory(): Promise<HistoryItem[]> {
  if (!db) await initDatabase();
  const results = await db!.select<Array<{
    id: string;
    request_id: string | null;
    name: string;
    method: string;
    url: string;
    headers: string;
    params: string;
    body: string;
    body_type: string;
    form_data: string | null;
    status_code: number | null;
    response_time: number | null;
    response_size: number | null;
    created_at: string;
  }>>('SELECT * FROM history ORDER BY created_at DESC LIMIT 100');

  return results.map(r => ({
    id: r.id,
    requestId: r.request_id,
    name: r.name,
    method: r.method as HistoryItem['method'],
    url: r.url,
    headers: parseKeyValue(r.headers),
    params: parseKeyValue(r.params),
    body: r.body,
    bodyType: r.body_type as HistoryItem['bodyType'],
    formData: parseFormData(r.form_data),
    statusCode: r.status_code,
    responseTime: r.response_time,
    responseSize: r.response_size,
    createdAt: r.created_at,
  }));
}

export async function createHistoryItem(item: HistoryItem): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute(
    'INSERT INTO history (id, request_id, name, method, url, headers, params, body, body_type, form_data, status_code, response_time, response_size, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
    [
      item.id,
      item.requestId,
      item.name,
      item.method,
      item.url,
      JSON.stringify(item.headers),
      JSON.stringify(item.params),
      item.body,
      item.bodyType,
      JSON.stringify(item.formData),
      item.statusCode,
      item.responseTime,
      item.responseSize,
      item.createdAt,
    ]
  );
}

export async function deleteHistoryItem(id: string): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute('DELETE FROM history WHERE id = $1', [id]);
}

export async function clearHistory(): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute('DELETE FROM history');
}

// Archived Requests
export async function getArchivedRequests(): Promise<ArchivedRequest[]> {
  if (!db) await initDatabase();
  const results = await db!.select<Array<{
    id: string;
    name: string;
    method: string;
    url: string;
    headers: string;
    params: string;
    body: string;
    body_type: string;
    form_data: string | null;
    archived_at: string;
    created_at: string;
  }>>('SELECT * FROM archived_requests ORDER BY archived_at DESC');

  return results.map(r => ({
    id: r.id,
    name: r.name,
    method: r.method as ArchivedRequest['method'],
    url: r.url,
    headers: parseKeyValue(r.headers),
    params: parseKeyValue(r.params),
    body: r.body,
    bodyType: r.body_type as ArchivedRequest['bodyType'],
    formData: parseFormData(r.form_data),
    archivedAt: r.archived_at,
    createdAt: r.created_at,
  }));
}

export async function createArchivedRequest(request: ArchivedRequest): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute(
    'INSERT INTO archived_requests (id, name, method, url, headers, params, body, body_type, form_data, archived_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
    [
      request.id,
      request.name,
      request.method,
      request.url,
      JSON.stringify(request.headers),
      JSON.stringify(request.params),
      request.body,
      request.bodyType,
      JSON.stringify(request.formData),
      request.archivedAt,
      request.createdAt,
    ]
  );
}

export async function deleteArchivedRequest(id: string): Promise<void> {
  if (!db) await initDatabase();
  await db!.execute('DELETE FROM archived_requests WHERE id = $1', [id]);
}

export async function restoreArchivedRequest(id: string): Promise<ArchivedRequest | null> {
  if (!db) await initDatabase();
  const results = await db!.select<Array<{
    id: string;
    name: string;
    method: string;
    url: string;
    headers: string;
    params: string;
    body: string;
    body_type: string;
    form_data: string | null;
    archived_at: string;
    created_at: string;
  }>>('SELECT * FROM archived_requests WHERE id = $1', [id]);

  if (results.length === 0) return null;

  const r = results[0];
  const request: ArchivedRequest = {
    id: r.id,
    name: r.name,
    method: r.method as ArchivedRequest['method'],
    url: r.url,
    headers: parseKeyValue(r.headers),
    params: parseKeyValue(r.params),
    body: r.body,
    bodyType: r.body_type as ArchivedRequest['bodyType'],
    formData: parseFormData(r.form_data),
    archivedAt: r.archived_at,
    createdAt: r.created_at,
  };

  await db!.execute('DELETE FROM archived_requests WHERE id = $1', [id]);

  return request;
}