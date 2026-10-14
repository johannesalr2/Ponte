# Ponte Técnica — Arquitetura

Este documento foi escrito **antes** do código, como pede o plano de trabalho.
Ele descreve a estrutura de pastas, o modelo de dados e as decisões que
orientam a implementação.

## 1. Princípios

1. **100% no navegador.** Nada sai do aparelho. Sem backend, sem login, sem
   chamadas a APIs. Links para sites oficiais (Anerkennung, IHK FOSA) são
   apenas links que o usuário escolhe abrir.
2. **Conteúdo é dado, não código.** Termos, diálogos, carreira e textos da
   interface vivem em `/content` como JSON. Adicionar uma profissão ou um
   idioma de explicação não exige mudar uma linha de TypeScript.
3. **Precisão acima de quantidade.** Todo termo carrega um status de revisão.
   O validador recusa o build se a forma do dado estiver errada, e também
   faz checagens linguísticas simples (artigo ↔ gênero, decomposição ↔
   palavra, referências cruzadas).
4. **Mobile first e acessível.** Navegação inferior no celular, barra lateral
   no desktop, teclado completo, contraste AA, `prefers-reduced-motion`.

## 2. Estrutura de pastas

```
/content                         ← todo o conteúdo versionado
  locales/
    pt-BR.json                   ← idioma de explicação + textos da interface
  professions/
    <profissao>/
      profession.json            ← nome, áreas, carreira (por idioma)
      terms/
        <area>.json              ← termos de uma área
      situations.json            ← diálogos de trabalho

/src
  main.tsx, App.tsx              ← entrada e rotas
  content/
    schema.ts                    ← esquemas Zod (fonte da verdade dos tipos)
    validate.ts                  ← validação completa + checagens cruzadas
    loader.ts                    ← carrega JSON sob demanda (code splitting)
    locale.ts                    ← i18n: t(), idioma ativo, fallback
  lib/
    fsrs.ts                      ← algoritmo FSRS-5 (puro, testado)
    search.ts                    ← busca sem acentos e tolerante a erros
    normalize.ts                 ← normalização de texto (ä/ae, ß/ss, acentos pt)
    exercises.ts                 ← gerador de exercícios
    speech.ts                    ← Web Speech API com fallback silencioso
    dates.ts                     ← dias locais, sequência, mapa de calor
    backup.ts                    ← exportar/importar progresso
    cv.ts                        ← montagem do currículo bilíngue
  db/
    db.ts                        ← Dexie (IndexedDB): tabelas e versões
    hooks.ts                     ← hooks reativos (useLiveQuery)
  components/                    ← UI reutilizável (ArticleBadge, TermCard…)
  features/
    onboarding/  dashboard/  glossary/  review/
    exercises/  situations/  career/  settings/
  styles/index.css               ← Tailwind v4 + tokens de design

/tests                           ← Vitest (fsrs, search, conteúdo, exercícios)
/scripts/validate-content.ts     ← `npm run validate` (também roda no build)
/public                          ← ícones do PWA
```

## 3. Modelo de dados do conteúdo

### 3.1 Idioma de explicação (`content/locales/<código>.json`)

```jsonc
{
  "code": "pt-BR",
  "name": "Português (Brasil)",
  "dir": "ltr",                       // "rtl" para árabe no futuro
  "speechLang": "pt-BR",
  "variants": [{ "code": "pt-PT", "label": "Portugal" }],
  "ui": { "nav.home": "Início", "…": "…" }   // todos os textos da interface
}
```

O código descobre os idiomas com `import.meta.glob`. Para adicionar turco,
basta criar `tr.json` (com todas as chaves de `ui`) e acrescentar `"tr"` nos
blocos `tr` dos termos. O validador mostra a cobertura de cada idioma.

### 3.2 Profissão (`profession.json`)

```jsonc
{
  "id": "industriemechaniker",
  "de": "Industriemechaniker/-in",
  "isco08": "7233",                   // código internacional da ocupação
  "regulated": false,                 // profissão regulamentada na Alemanha?
  "areas": [{ "id": "werkzeuge-messtechnik", "de": "Werkzeuge und Messtechnik",
              "tr": { "pt-BR": "Ferramentas e metrologia" } }],
  "industries": [{ "id": "giessharz", "tr": { "pt-BR": "Fundição de resina" } }],
  "tr": {
    "pt-BR": {
      "name": "Mecânico(a) industrial",
      "brazil": ["Técnico em Mecânica", "Mecânico de manutenção industrial"],
      "summary": "…",
      "recognition": { "authority": "…", "steps": ["…"], "notes": "…" },
      "links": [{ "label": "…", "url": "https://www.anerkennung-in-deutschland.de/" }]
    }
  }
}
```

### 3.3 Termo (`terms/<area>.json`)

O arquivo declara a área; profissão e área são injetadas em cada termo pelo
carregador e conferidas pelo validador.

```jsonc
{
  "area": "werkzeuge-messtechnik",
  "terms": [{
    "id": "im-buegelmessschraube",
    "level": "B1",                              // A2 | B1 | B2 | C1
    "de": {
      "word": "Bügelmessschraube",
      "article": "die",                         // der | die | das | null
      "plural": "Bügelmessschrauben",           // sem artigo; null = sem plural
      "gender": "f",                            // m | f | n | null (confere com o artigo)
      "pos": "noun"                             // noun | verb | adjective | adverb | phrase | abbreviation
    },
    "parts": [                                  // decomposição (opcional)
      { "de": "Bügel",    "tr": { "pt-BR": "arco" } },
      { "de": "mess",     "tr": { "pt-BR": "medir" } },
      { "de": "schraube", "tr": { "pt-BR": "parafuso" } }
    ],                                          // concatenadas = palavra (validado)
    "synonyms": ["Mikrometer"],
    "related": ["im-messschieber"],             // ids existentes (validado)
    "esco": null,                               // { "uri", "label" } só se existir
    "status": "revisado-ia",                    // rascunho | revisado-ia | revisado-profissional
    "examples": [
      { "de": "Miss den Wellendurchmesser mit der Bügelmessschraube.",
        "tr": { "pt-BR": "Meça o diâmetro do eixo com o micrômetro." } },
      { "de": "…", "tr": { "pt-BR": "…" } }      // exatamente 2
    ],
    "tr": {
      "pt-BR": {
        "term": "micrômetro",
        "variants": { "pt-PT": "micrómetro" },  // só quando diferente
        "technical": "Instrumento de medição de precisão…",
        "simple": "Uma \"régua\" muito precisa em forma de C…",
        "falseFriends": [{ "word": "…", "note": "…" }]
      }
    }
  }]
}
```

### 3.4 Situação de trabalho (`situations.json`)

```jsonc
{
  "situations": [{
    "id": "pf-uebergabe",
    "level": "B1",
    "tr": { "pt-BR": { "title": "Passagem de plantão", "context": "…" } },
    "lines": [{
      "speaker": "Pflegekraft A",
      "de": "Herr Weber hat heute Nacht [[pf-fieber|Fieber]] bekommen.",
      "tr": { "pt-BR": "O Sr. Weber teve febre esta noite." }
    }]
  }]
}
```

`[[id|texto]]` destaca o termo e liga ao glossário. O validador confere se o
id existe.

## 4. Modelo de dados local (IndexedDB via Dexie)

| Tabela     | Chave            | Conteúdo                                                         |
| ---------- | ---------------- | ---------------------------------------------------------------- |
| `settings` | `key`            | perfil do onboarding, tema, idioma, novos cards/dia              |
| `cards`    | `termId`         | estado FSRS: `due`, `stability`, `difficulty`, `state`, `reps`, `lapses`, `lastReview` |
| `reviews`  | `++id`           | histórico: `termId`, `rating`, `reviewedAt`, `elapsedDays`, `scheduledDays` |
| `days`     | `date` (AAAA-MM-DD) | atividade diária: `reviews`, `exercises`, `correct` (mapa de calor e sequência) |
| `cv`       | `id`             | rascunho do currículo (fica só no aparelho)                      |

Perfil do onboarding (nunca pede empresa, nacionalidade ou origem):

```ts
{ profession: "industriemechaniker", industry: "giessharz" | null,
  level: "A2" | "B1" | "B2" | "C1", goal: "ausbildung" | "trabalho" | "reconhecimento",
  locale: "pt-BR" }
```

O backup exporta todas as tabelas em JSON com `format` e `version`; a
importação valida com Zod antes de gravar.

## 5. Algoritmo FSRS

Implementação própria do FSRS-5 com os 19 parâmetros padrão. Retenção-alvo
de 90%. Estados: novo → aprendendo → revisão ↔ reaprendendo. Notas 1–4
(Errei, Difícil, Bom, Fácil). Funções puras, testadas em `tests/fsrs.test.ts`.

## 6. Busca

Texto normalizado (minúsculas, sem acentos, `ß→ss`, `ä→a`, e a forma
alternativa `ae/oe/ue`). Pontuação por correspondência exata, prefixo,
substring e distância de Damerau-Levenshtein limitada pelo tamanho da
palavra. Indexa alemão, plural, tradução, variante pt-PT e sinônimos.

## 7. Design

- Identidade "prancheta técnica": papel claro, tinta azul-petróleo e um
  laranja de sinalização como acento; IBM Plex Sans e Plex Mono (fontes
  locais, funcionam offline).
- Artigos: **der** azul, **die** vermelho, **das** verde, sempre com o texto do
  artigo e um formato diferente (borda reta, arredondada, chanfrada).
- Tokens de cor em CSS para tema claro e escuro, ambos verificados para AA.
