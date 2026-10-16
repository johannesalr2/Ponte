interface ImportMetaEnv {
  /** URL da API da ESCO (padrão: API pública da Comissão Europeia) */
  readonly VITE_ESCO_API_URL?: string;
  /** versão da ESCO, ex.: "v1.2.0" (padrão: a do servidor) */
  readonly VITE_ESCO_VERSION?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
