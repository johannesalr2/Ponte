import { describe, expect, it, vi } from 'vitest';
import { parseOccupation, parseSearch, parseSkill } from '../src/second/esco/parse';
import { createHttpSource } from '../src/second/esco/source';
import { buildQuiz } from '../src/second/quiz';
import { parsePair } from '../src/second/prefs';
import { seeded } from '../src/lib/exercises';

// Amostras no formato HAL da Web Service API da ESCO (resumidas).
const OCC = 'http://data.europa.eu/esco/occupation/abc';
const SK = (n: number) => `http://data.europa.eu/esco/skill/s${n}`;

const occupationJson = {
  className: 'Occupation',
  uri: OCC,
  title: 'Industriemechaniker/Industriemechanikerin',
  code: '7233.1',
  preferredLabel: {
    de: 'Industriemechaniker/Industriemechanikerin',
    pt: 'mecânico industrial',
    xx: 'ignorado',
  },
  alternativeLabel: { de: ['Maschinenschlosser'], pt: [] },
  description: { de: { literal: 'Industriemechaniker warten Maschinen.', mimetype: 'plain/text' } },
  _links: {
    self: { href: 'x', uri: OCC, title: 'Industriemechaniker' },
    broaderIscoGroup: [
      { href: 'x', uri: 'http://data.europa.eu/esco/isco/C7233', title: 'Landmaschinenmechaniker' },
    ],
    hasEssentialSkill: [
      { href: 'x', uri: SK(1), title: 'Präzisionsmessgeräte verwenden' },
      { href: 'x', uri: SK(2) },
    ],
    hasOptionalSkill: { href: 'x', uri: SK(3), title: 'Hydraulik' },
  },
};

describe('parse da ESCO', () => {
  it('lê a ocupação com rótulos, descrição e habilidades', () => {
    const o = parseOccupation(occupationJson);
    expect(o.code).toBe('7233.1');
    expect(o.labels).toEqual({
      de: 'Industriemechaniker/Industriemechanikerin',
      pt: 'mecânico industrial',
    });
    expect(o.altLabels).toEqual({ de: ['Maschinenschlosser'] });
    expect(o.descriptions.de).toMatch(/warten/);
    expect(o.essential).toEqual([{ uri: SK(1), title: 'Präzisionsmessgeräte verwenden' }]);
    expect(o.optional).toHaveLength(1); // link único (objeto, não lista)
    expect(o.isco[0]?.title).toBe('Landmaschinenmechaniker');
  });

  it('lê tipo e alcance da habilidade', () => {
    const s = parseSkill({
      uri: SK(1),
      preferredLabel: { de: 'Hydraulik', pt: 'hidráulica' },
      description: { pt: 'texto' },
      _links: {
        hasSkillType: [{ uri: 'http://data.europa.eu/esco/skill-type/knowledge', title: 'Wissen' }],
        hasReuseLevel: [
          { uri: 'http://data.europa.eu/esco/skill-reuse-level/sector-specific', title: 'x' },
        ],
        isEssentialForOccupation: [{ uri: OCC, title: 'Industriemechaniker' }],
      },
    });
    expect(s.type).toBe('knowledge');
    expect(s.reuse).toBe('sector-specific');
    expect(s.descriptions).toEqual({ pt: 'texto' });
    expect(s.essentialFor).toHaveLength(1);
    expect(parseSkill({ uri: SK(2) }).type).toBe('unknown');
  });

  it('lê resultados da busca e recusa resposta sem uri', () => {
    const page = parseSearch({
      total: 42,
      offset: 20,
      _embedded: { results: [{ uri: OCC, title: 'Koch/Köchin' }, { title: 'sem uri' }] },
    });
    expect(page).toEqual({
      items: [{ uri: OCC, title: 'Koch/Köchin', code: undefined }],
      total: 42,
      offset: 20,
    });
    expect(parseSearch({}).items).toEqual([]);
    expect(() => parseOccupation({})).toThrow(/uri/);
  });
});

describe('fonte HTTP', () => {
  const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)));

  it('monta a URL com idioma e versão e guarda a resposta', async () => {
    const fetch = vi.fn(() => ok(occupationJson));
    const src = createHttpSource({ baseUrl: 'https://local/esco/api/', version: 'v1.2.0', fetch });
    await src.occupation(OCC, 'de');
    await src.occupation(OCC, 'de');
    expect(fetch).toHaveBeenCalledTimes(1);
    const url = new URL(String((fetch.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe('https://local/esco/api/resource/occupation');
    expect(url.searchParams.get('uri')).toBe(OCC);
    expect(url.searchParams.get('language')).toBe('de');
    expect(url.searchParams.get('selectedVersion')).toBe('v1.2.0');
  });

  it('erro HTTP vira EscoError e não fica no cache', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('x', { status: 503 }))
      .mockImplementationOnce(() => ok({ total: 0, _embedded: { results: [] } }));
    const src = createHttpSource({ baseUrl: 'https://x', fetch });
    await expect(src.searchOccupations('koch', 'de')).rejects.toThrow(/503/);
    await expect(src.searchOccupations('koch', 'de')).resolves.toMatchObject({ total: 0 });
  });
});

describe('exercício com rótulos da ESCO', () => {
  const items = Array.from({ length: 8 }, (_, i) => ({
    uri: SK(i),
    learn: `de${i}`,
    know: `pt${i}`,
  }));

  it('alterna a direção e sempre inclui a resposta', () => {
    const quiz = buildQuiz(items, seeded(1), 6);
    expect(quiz).toHaveLength(6);
    quiz.forEach((q, i) => {
      expect(q.fromLearn).toBe(i % 2 === 0);
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(4);
      expect(q.answer).toBe(q.fromLearn ? q.item.know : q.item.learn);
    });
  });

  it('ignora itens sem tradução real e exige ao menos 4', () => {
    const same = items.slice(0, 3).concat([{ uri: SK(9), learn: 'x', know: 'x' }]);
    expect(buildQuiz(same, seeded(1))).toEqual([]);
  });
});

describe('par de idiomas', () => {
  it('aceita só idiomas da ESCO e diferentes entre si', () => {
    expect(parsePair('{"learn":"de","know":"pt"}')).toEqual({ learn: 'de', know: 'pt' });
    expect(parsePair('{"learn":"de","know":"de"}')).toBeNull();
    expect(parsePair('{"learn":"de","know":"pt-BR"}')).toBeNull();
    expect(parsePair('lixo')).toBeNull();
    expect(parsePair(null)).toBeNull();
  });
});
