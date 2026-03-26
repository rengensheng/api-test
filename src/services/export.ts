import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import type { ExportData, FormDataField } from '../types';
import * as db from './database';

export async function exportData(): Promise<void> {
  const collections = await db.getCollections();
  const savedRequests = await db.getSavedRequests();
  const archivedRequests = await db.getArchivedRequests();

  const exportData: ExportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    collections,
    savedRequests,
    archivedRequests,
  };

  const filePath = await save({
    defaultPath: `api-test-export-${Date.now()}.json`,
    filters: [
      { name: 'JSON', extensions: ['json'] },
    ],
  });

  if (filePath) {
    await writeTextFile(filePath, JSON.stringify(exportData, null, 2));
  }
}

export async function importData(): Promise<{ success: boolean; message: string }> {
  const filePath = await open({
    multiple: false,
    filters: [
      { name: 'JSON', extensions: ['json'] },
    ],
  });

  if (!filePath || typeof filePath !== 'string') {
    return { success: false, message: '未选择文件' };
  }

  try {
    const content = await readTextFile(filePath);
    const data: ExportData = JSON.parse(content);

    if (!data.version || !data.collections || !data.savedRequests || !data.archivedRequests) {
      return { success: false, message: '无效的导入文件格式' };
    }

    for (const collection of data.collections) {
      try {
        await db.createCollection(collection);
      } catch {
        await db.updateCollection(collection);
      }
    }

    for (const request of data.savedRequests) {
      try {
        await db.createSavedRequest(request);
      } catch {
        await db.updateSavedRequest(request);
      }
    }

    for (const request of data.archivedRequests) {
      try {
        await db.createArchivedRequest(request);
      } catch {
        // 忽略重复
      }
    }

    return { success: true, message: `成功导入 ${data.collections.length} 个集合, ${data.savedRequests.length} 个请求, ${data.archivedRequests.length} 个归档` };
  } catch (error) {
    return { success: false, message: `导入失败: ${error}` };
  }
}

export async function exportRequestToCurl(config: {
  method: string;
  url: string;
  headers: { key: string; value: string; enabled: boolean }[];
  body: string;
  bodyType?: string;
  formData?: FormDataField[];
}): Promise<void> {
  const parts: string[] = ['curl'];

  if (config.method !== 'GET') {
    parts.push(`-X ${config.method}`);
  }

  config.headers.forEach(h => {
    if (h.enabled && h.key) {
      parts.push(`-H '${h.key}: ${h.value}'`);
    }
  });

  if (config.bodyType === 'multipart' && config.formData && config.formData.length > 0) {
    config.formData.forEach(field => {
      if (field.enabled && field.key) {
        if (field.type === 'file') {
          parts.push(`-F '${field.key}=@${field.value}'`);
        } else {
          parts.push(`-F '${field.key}=${field.value}'`);
        }
      }
    });
  } else if (config.body) {
    const escapedBody = config.body.replace(/'/g, "'\\''");
    parts.push(`-d '${escapedBody}'`);
  }

  parts.push(`'${config.url}'`);

  const curlCommand = parts.join(' ');

  const filePath = await save({
    defaultPath: `request.sh`,
    filters: [
      { name: 'Shell Script', extensions: ['sh'] },
      { name: 'Text', extensions: ['txt'] },
    ],
  });

  if (filePath) {
    await writeTextFile(filePath, curlCommand);
  }
}