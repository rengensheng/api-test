import { fetch } from '@tauri-apps/plugin-http';
import { readFile } from '@tauri-apps/plugin-fs';
import type { RequestConfig, KeyValue, ResponseData, FormDataField } from '../types';

function buildUrlWithParams(url: string, params: KeyValue[]): string {
  try {
    const urlObj = new URL(url);
    params.forEach(p => {
      if (p.enabled && p.key) {
        urlObj.searchParams.append(p.key, p.value);
      }
    });
    return urlObj.toString();
  } catch {
    const enabledParams = params.filter(p => p.enabled && p.key);
    if (enabledParams.length === 0) return url;
    const separator = url.includes('?') ? '&' : '?';
    const queryString = enabledParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    return `${url}${separator}${queryString}`;
  }
}

function buildHeaders(headers: KeyValue[]): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach(h => {
    if (h.enabled && h.key) {
      result[h.key] = h.value;
    }
  });
  return result;
}

function getFileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || 'file';
}

async function buildMultipartBody(formData: FormDataField[]): Promise<{ body: Uint8Array; contentType: string }> {
  const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
  const parts: Uint8Array[] = [];
  const encoder = new TextEncoder();

  for (const field of formData) {
    if (!field.enabled || !field.key) continue;

    const partHeader = field.type === 'file'
      ? `--${boundary}\r\nContent-Disposition: form-data; name="${field.key}"; filename="${getFileName(field.value)}"\r\nContent-Type: application/octet-stream\r\n\r\n`
      : `--${boundary}\r\nContent-Disposition: form-data; name="${field.key}"\r\n\r\n${field.value}\r\n`;

    parts.push(encoder.encode(partHeader));

    if (field.type === 'file' && field.value) {
      try {
        const fileData = await readFile(field.value);
        parts.push(fileData);
        parts.push(encoder.encode('\r\n'));
      } catch (error) {
        console.error('Failed to read file:', field.value, error);
      }
    }
  }

  parts.push(encoder.encode(`--${boundary}--\r\n`));

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    combined.set(part, offset);
    offset += part.length;
  }

  return { body: combined, contentType: `multipart/form-data; boundary=${boundary}` };
}

export async function sendRequest(config: RequestConfig): Promise<ResponseData> {
  const startTime = performance.now();
  const url = buildUrlWithParams(config.url, config.params);
  const headers = buildHeaders(config.headers);

  let body: Uint8Array | string | undefined;

  if (config.bodyType === 'multipart' && config.formData.length > 0) {
    const { body: multipartBody, contentType } = await buildMultipartBody(config.formData);
    body = multipartBody;
    headers['Content-Type'] = contentType;
  } else if (config.bodyType !== 'none' && config.body) {
    if (config.bodyType === 'json') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = config.body;
    } else if (config.bodyType === 'form') {
      headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';
      body = config.body;
    } else {
      body = config.body;
    }
  }

  const response = await fetch(url, {
    method: config.method,
    headers,
    body,
    connectTimeout: 30000,
  });

  const endTime = performance.now();
  const responseTime = Math.round(endTime - startTime);

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value: string, key: string) => {
    responseHeaders[key] = value;
  });

  let responseData: string;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const json = await response.json();
      responseData = JSON.stringify(json, null, 2);
    } catch {
      responseData = await response.text();
    }
  } else if (contentType.includes('text/') || contentType.includes('application/xml')) {
    responseData = await response.text();
  } else {
    try {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      if (bytes.length > 10000) {
        responseData = `[Binary data: ${bytes.length} bytes]`;
      } else {
        responseData = Array.from(bytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ');
      }
    } catch {
      responseData = '[Unable to read response body]';
    }
  }

  const size = new Blob([responseData]).size;

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    data: responseData,
    time: responseTime,
    size,
  };
}