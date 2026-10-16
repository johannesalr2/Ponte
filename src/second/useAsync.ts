import { useCallback, useEffect, useState } from 'react';

export type Async<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown; retry: () => void }
  | { status: 'ok'; data: T };

/** Carrega `load()` sempre que `key` muda; ignora respostas antigas. */
export function useAsync<T>(key: string | null, load: () => Promise<T>): Async<T> {
  const [state, setState] = useState<Async<T> & { key?: string | null }>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (key === null) return;
    let alive = true;
    setState({ status: 'loading' });
    load().then(
      (data) => alive && setState({ status: 'ok', data, key }),
      (error: unknown) => alive && setState({ status: 'error', error, retry, key }),
    );
    return () => {
      alive = false;
    };
    // `load` muda a cada render; `key` identifica o pedido
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  return state.key === key ? state : { status: 'loading' };
}
