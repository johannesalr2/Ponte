import { createHttpSource, type EscoSource } from './source';

/**
 * De onde vêm os dados da ESCO. Para usar um servidor próprio, defina no .env:
 *   VITE_ESCO_API_URL=https://meu-servidor/esco/api
 *   VITE_ESCO_VERSION=v1.2.0        (opcional)
 */
export const ESCO_API_URL: string =
  import.meta.env.VITE_ESCO_API_URL || 'https://ec.europa.eu/esco/api';
export const ESCO_VERSION: string = import.meta.env.VITE_ESCO_VERSION || '';

export const esco: EscoSource = createHttpSource({ baseUrl: ESCO_API_URL, version: ESCO_VERSION });

const PREFIX = {
  occupation: 'http://data.europa.eu/esco/occupation/',
  skill: 'http://data.europa.eu/esco/skill/',
} as const;

/** URI da ESCO ↔ id curto para a URL da página (o UUID final). */
export const toId = (uri: string) => uri.split('/').pop() ?? uri;
export const toUri = (kind: keyof typeof PREFIX, id: string) =>
  id.startsWith('http') ? id : PREFIX[kind] + id;
