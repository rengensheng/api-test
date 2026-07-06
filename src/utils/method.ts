import type { HttpMethod } from '../types';

export const getMethodTagColor = (method: HttpMethod) => {
  switch (method) {
    case 'GET':
      return 'green';
    case 'POST':
      return 'blue';
    case 'PUT':
      return 'orange';
    case 'DELETE':
      return 'red';
    case 'PATCH':
      return 'cyan';
    case 'HEAD':
    case 'OPTIONS':
      return 'purple';
    default:
      return 'default';
  }
};
