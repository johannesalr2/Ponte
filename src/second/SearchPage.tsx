import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/content/locale';
import { Icon } from '@/components/Icon';
import { Button, Chip, PageHeader, Panel } from '@/components/ui';
import { esco, toId } from './esco/config';
import { langDir, langName, type EscoLang } from './esco/languages';
import type { OccupationHit } from './esco/types';
import { AsyncView, LangTag, LangText } from './bits';
import type { LangPair } from './prefs';
import type { Async } from './useAsync';

/** Sugestões de busca por idioma (nomes de profissão comuns). */
const EXAMPLES: Partial<Record<EscoLang, string[]>> = {
  de: ['Industriemechaniker', 'Pflegefachkraft', 'Koch', 'Fachinformatiker', 'Lagerlogistik'],
  en: ['industrial mechanic', 'nurse', 'cook', 'software developer', 'warehouse worker'],
  pt: ['mecânico industrial', 'enfermeiro', 'cozinheiro', 'programador', 'armazém'],
  es: ['mecánico industrial', 'enfermero', 'cocinero', 'programador', 'almacén'],
  fr: ['mécanicien industriel', 'infirmier', 'cuisinier', 'développeur', 'magasinier'],
  it: ['meccanico industriale', 'infermiere', 'cuoco', 'sviluppatore', 'magazziniere'],
  nl: ['monteur', 'verpleegkundige', 'kok', 'softwareontwikkelaar', 'magazijnmedewerker'],
  pl: ['mechanik', 'pielęgniarka', 'kucharz', 'programista', 'magazynier'],
};

interface Results {
  q: string;
  lang: EscoLang;
  items: OccupationHit[];
  total: number;
}

export default function SearchPage({ pair }: { pair: LangPair }) {
  const { t, tp } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const searchLang: EscoLang = params.get('in') === pair.know ? pair.know : pair.learn;
  const [input, setInput] = useState(q);
  const [state, setState] = useState<Async<Results>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [moreLoading, setMoreLoading] = useState(false);

  // digita → atualiza a URL depois de uma pausa curta
  useEffect(() => {
    const id = setTimeout(() => {
      if (input.trim() !== q)
        setParams(
          (p) => {
            const n = new URLSearchParams(p);
            if (input.trim()) n.set('q', input.trim());
            else n.delete('q');
            return n;
          },
          { replace: true },
        );
    }, 350);
    return () => clearTimeout(id);
  }, [input, q, setParams]);

  useEffect(() => {
    if (!q) return;
    let alive = true;
    setState({ status: 'loading' });
    esco.searchOccupations(q, searchLang).then(
      (page) =>
        alive &&
        setState({
          status: 'ok',
          data: { q, lang: searchLang, items: page.items, total: page.total },
        }),
      (error: unknown) =>
        alive && setState({ status: 'error', error, retry: () => setAttempt((n) => n + 1) }),
    );
    return () => {
      alive = false;
    };
  }, [q, searchLang, attempt]);

  const loadMore = async (r: Results) => {
    setMoreLoading(true);
    try {
      const page = await esco.searchOccupations(r.q, r.lang, r.items.length);
      setState({ status: 'ok', data: { ...r, items: [...r.items, ...page.items] } });
    } finally {
      setMoreLoading(false);
    }
  };

  const examples = EXAMPLES[searchLang] ?? EXAMPLES.en ?? [];
  const setLang = (lang: EscoLang) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (lang === pair.learn) n.delete('in');
      else n.set('in', lang);
      return n;
    });

  return (
    <>
      <PageHeader
        title={t('esco.search.title')}
        kicker={`ESCO · ${langName(pair.learn)} ↔ ${langName(pair.know)}`}
      />
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-3">
        <label htmlFor="esco-q" className="sr-only">
          {t('esco.search.label')}
        </label>
        <div className="relative">
          <Icon
            name="search"
            className="text-muted pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2"
          />
          <input
            id="esco-q"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('esco.search.placeholder', { example: examples[0] ?? '' })}
            lang={searchLang}
            dir={langDir(searchLang)}
            autoComplete="off"
            className="border-line-strong bg-surface min-h-12 w-full rounded-xl border ps-10 pe-3 text-lg"
          />
        </div>
      </form>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{t('esco.search.in')}</span>
        {[pair.learn, pair.know].map((l) => (
          <Chip key={l} active={l === searchLang} onClick={() => setLang(l)}>
            {langName(l)}
          </Chip>
        ))}
      </div>

      {!q ? (
        <Panel className="p-5">
          <p className="text-muted max-w-prose">{t('esco.search.intro')}</p>
          <p className="label-tech mt-4 mb-2">{t('esco.search.examples')}</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <Chip key={ex} onClick={() => setInput(ex)} lang={searchLang}>
                {ex}
              </Chip>
            ))}
          </div>
        </Panel>
      ) : (
        <AsyncView state={state}>
          {(r) =>
            r.items.length === 0 ? (
              <p className="text-muted">{t('esco.search.empty', { q: r.q })}</p>
            ) : (
              <>
                <p className="text-muted mb-2 text-sm" aria-live="polite">
                  {tp('esco.search.results', r.total)}
                </p>
                <ul className="border-line bg-surface divide-line divide-y rounded-xl border">
                  {r.items.map((o) => (
                    <li key={o.uri}>
                      <Link
                        to={`/second/o/${toId(o.uri)}`}
                        className="hover:bg-surface-2 flex min-h-12 items-center justify-between gap-3 px-4 py-3"
                      >
                        <LangText lang={r.lang} text={o.title} className="min-w-0 font-medium" />
                        <span className="flex shrink-0 items-center gap-2">
                          <LangTag lang={r.lang} />
                          <Icon name="chevron" className="text-muted size-4" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {r.items.length < r.total && (
                  <Button className="mt-4" disabled={moreLoading} onClick={() => void loadMore(r)}>
                    {t('esco.search.more')}
                  </Button>
                )}
              </>
            )
          }
        </AsyncView>
      )}
    </>
  );
}
