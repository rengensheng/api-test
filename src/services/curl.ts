import { v4 as uuidv4 } from 'uuid';
import type { RequestConfig, KeyValue, HttpMethod, BodyType, FormDataField } from '../types';

interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  body: string;
  bodyType: BodyType;
  formData: FormDataField[];
}

export function parseCurl(curlCommand: string): ParsedCurl | null {
  try {
    const result: ParsedCurl = {
      method: 'GET',
      url: '',
      headers: [],
      body: '',
      bodyType: 'none',
      formData: [],
    };

    let cleaned = curlCommand.trim();
    cleaned = cleaned.replace(/\\\s*\n/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');

    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];

      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuote) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    if (current) {
      tokens.push(current);
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token === 'curl') continue;

      if (token === '-X' || token === '--request') {
        const method = tokens[++i]?.toUpperCase();
        if (method && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(method)) {
          result.method = method as HttpMethod;
        }
      } else if (token === '-H' || token === '--header') {
        const header = tokens[++i];
        if (header) {
          const colonIndex = header.indexOf(':');
          if (colonIndex > 0) {
            result.headers.push({
              key: header.substring(0, colonIndex).trim(),
              value: header.substring(colonIndex + 1).trim(),
              enabled: true,
            });
          }
        }
      } else if (token === '-F' || token === '--form') {
        const formData = tokens[++i] || '';
        parseFormDataField(formData, result);
        result.bodyType = 'multipart';
      } else if (token === '-d' || token === '--data' || token === '--data-raw' || token === '--data-binary') {
        result.body = tokens[++i] || '';
        result.bodyType = 'raw';
        const contentType = result.headers.find(h => h.key.toLowerCase() === 'content-type');
        if (contentType) {
          if (contentType.value.includes('application/json')) {
            result.bodyType = 'json';
          } else if (contentType.value.includes('application/x-www-form-urlencoded')) {
            result.bodyType = 'form';
          }
        } else {
          result.bodyType = 'raw';
        }
      } else if (token === '--json') {
        result.body = tokens[++i] || '';
        result.bodyType = 'json';
        result.headers.push({
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
        });
      } else if (token.startsWith('http://') || token.startsWith('https://')) {
        result.url = token;
      } else if (!token.startsWith('-') && !tokens[i - 1]?.startsWith('-')) {
        if (!result.url && (token.startsWith('http://') || token.startsWith('https://'))) {
          result.url = token;
        }
      }
    }

    if (!result.url) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

function parseFormDataField(formData: string, result: ParsedCurl): void {
  const equalIndex = formData.indexOf('=');
  if (equalIndex === -1) return;

  const key = formData.substring(0, equalIndex);
  let value = formData.substring(equalIndex + 1);

  if (value.startsWith('@')) {
    result.formData.push({
      key,
      value: value.substring(1),
      type: 'file',
      enabled: true,
    });
  } else if (value.includes(';filename=')) {
    const filenameMatch = value.match(/filename=([^;]+)/i);
    const contentMatch = value.match(/^[^;]+/);

    if (contentMatch) {
      let content = contentMatch[0];
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1);
      }

      result.formData.push({
        key,
        value: filenameMatch ? filenameMatch[1].replace(/"/g, '') : content,
        type: 'file',
        enabled: true,
      });
    }
  } else {
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    result.formData.push({
      key,
      value,
      type: 'text',
      enabled: true,
    });
  }
}

export function parseMultipartBody(body: string, boundary: string): FormDataField[] {
  const fields: FormDataField[] = [];
  const parts = body.split(`--${boundary}`);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed === '--' || trimmed === '--\r\n') continue;

    const headerEndIndex = trimmed.indexOf('\r\n\r\n');
    if (headerEndIndex === -1) continue;

    const headers = trimmed.substring(0, headerEndIndex);
    let content = trimmed.substring(headerEndIndex + 4);

    if (content.endsWith('\r\n')) {
      content = content.slice(0, -2);
    }

    const nameMatch = headers.match(/name="([^"]+)"/i);
    const filenameMatch = headers.match(/filename="([^"]+)"/i);

    if (nameMatch) {
      const key = nameMatch[1];
      if (filenameMatch) {
        fields.push({
          key,
          value: filenameMatch[1],
          type: 'file',
          enabled: true,
        });
      } else {
        fields.push({
          key,
          value: content,
          type: 'text',
          enabled: true,
        });
      }
    }
  }

  return fields;
}

export function createRequestFromCurl(curlCommand: string, name?: string): RequestConfig | null {
  const parsed = parseCurl(curlCommand);
  if (!parsed) return null;

  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    name: name || parsed.url.substring(0, 50),
    method: parsed.method,
    url: parsed.url,
    headers: parsed.headers,
    params: [],
    body: parsed.body,
    bodyType: parsed.bodyType,
    formData: parsed.formData,
    createdAt: now,
    updatedAt: now,
  };
}

export function exportToCurl(config: RequestConfig): string {
  const parts: string[] = ['curl'];

  if (config.method !== 'GET') {
    parts.push(`-X ${config.method}`);
  }

  config.headers.forEach(h => {
    if (h.enabled && h.key) {
      parts.push(`-H '${h.key}: ${h.value}'`);
    }
  });

  if (config.bodyType === 'multipart' && config.formData.length > 0) {
    config.formData.forEach(field => {
      if (field.enabled && field.key) {
        if (field.type === 'file') {
          parts.push(`-F '${field.key}=@${field.value}'`);
        } else {
          parts.push(`-F '${field.key}=${field.value}'`);
        }
      }
    });
  } else if (config.body && config.bodyType !== 'none') {
    const escapedBody = config.body.replace(/'/g, "'\\''");
    parts.push(`-d '${escapedBody}'`);
  }

  parts.push(`'${config.url}'`);

  return parts.join(' ');
}