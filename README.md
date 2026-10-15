# Ponte Técnica

Vocabulário técnico da profissão, do alemão para o português do Brasil, para
quem trabalha ou faz Ausbildung na Alemanha.

- **Glossário por profissão e área**: artigo, plural, decomposição de
  palavras compostas, explicação técnica e simples, exemplos reais de
  trabalho, falsos amigos e a variante de Portugal quando ela existe.
- **Revisão espaçada (FSRS-5)** com notas Errei/Difícil/Bom/Fácil e atalhos
  de teclado (espaço, 1 a 4).
- **Idioma em foco**: alterne na aba Praticar (ou nos Ajustes) entre
  aprender os termos **em alemão** ou **em português**. A revisão e os
  exercícios passam a pedir a resposta no idioma escolhido.
- **Praticar em 3 estilos**, e o app escolhe os termos (erros recentes →
  termos mais fracos → novos do seu nível):
  - foco em alemão: **Entender** (múltipla escolha, ouvir, pares),
    **Lembrar** (escrever, completar a frase) e **Gramática** (der/die/das, plural);
  - foco em português: **Entender**, **Lembrar** (escrever e completar frases
    em português) e **Explicar** (ligar o termo à explicação).
  - "Personalizar" (escondido) mantém a escolha manual de termos e tipos.
  - Errar um termo nos exercícios antecipa a revisão dele para no máximo o dia seguinte.
- **Situações de trabalho**: diálogos curtos com os termos destacados.
- **Carreira**: equivalência Brasil ↔ Alemanha, regulamentação, passos do
  reconhecimento (Anerkennung) e gerador de currículo bilíngue.
- **100% no navegador**: sem login, sem backend, sem chamadas a APIs.
  Instalável (PWA) e funciona offline. Backup manual em JSON.

## Conteúdo inicial

| Profissão                                                     | Termos | Áreas | Situações |
| ------------------------------------------------------------- | -----: | ----: | --------: |
| Industriemechaniker (inclui fundição de resina e alta tensão) |    166 |     4 |         3 |
| Pflegefachkraft                                               |     51 |     4 |         3 |
| Fachinformatiker                                              |     46 |     3 |         2 |
| Ingenieur                                                     |     45 |     3 |         2 |
| Koch / Köchin                                                 |     50 |     4 |         2 |
| Fachkraft für Lagerlogistik                                   |     50 |     4 |         2 |

> **Sobre a revisão do conteúdo.** Todo o conteúdo inicial foi escrito com
> ajuda de IA. Termos marcados como `revisado-ia` foram conferidos com cuidado
> (artigo, plural, decomposição e tradução), mas **nenhum termo foi revisado
> por um profissional da área ainda**. Os termos em que havia dúvida
> (por exemplo, a variante de Portugal) estão como `rascunho`. As referências
> ESCO por termo estão vazias (`null`) de propósito: não foram inventadas.
> Os termos podem ter um campo `sources` com as fontes consultadas (normas,
> literatura técnica), que aparece na ficha do termo. A lista completa da
> Mecânica Industrial para revisão está em
> [`docs/termos-industriemechaniker.md`](docs/termos-industriemechaniker.md)
> (gerada com `npm run export-terms -- industriemechaniker`).
> As informações de carreira e reconhecimento são gerais e apontam para os
> portais oficiais; confira sempre as regras atuais.

## Como rodar

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev        # servidor de desenvolvimento em http://localhost:5173
npm run build      # valida o conteúdo, checa os tipos e gera dist/
npm run preview    # serve o build (necessário para testar o PWA offline)
```

| Script                 | O que faz                                                          |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run validate`     | valida todo o `/content` com Zod e mostra estatísticas e cobertura |
| `npm test`             | testes Vitest (FSRS, busca, conteúdo, exercícios, backup, i18n)    |
| `npm run lint`         | ESLint (TypeScript estrito, React Hooks, jsx-a11y)                 |
| `npm run format:check` | Prettier                                                           |
| `npm run typecheck`    | `tsc --noEmit`                                                     |

O build falha se o conteúdo for inválido. No `npm run dev`, os erros de
conteúdo aparecem no terminal assim que você salva um JSON.

Para hospedar, sirva a pasta `dist/` como site estático com _fallback_ de SPA
(qualquer rota desconhecida → `index.html`). Depois da primeira visita o
service worker cuida do modo offline.

## Estrutura

```
content/                     conteúdo versionado (JSON)
  locales/pt-BR.json         idioma de explicação + todos os textos da interface
  professions/<id>/
    profession.json          nome, áreas, ramos, carreira e reconhecimento
    terms/<área>.json        termos de uma área
    situations.json          diálogos de trabalho
src/
  content/                   esquemas Zod, validador, carregador, i18n
  lib/                       FSRS, busca, exercícios, datas, backup, currículo, voz
  db/                        IndexedDB (Dexie): perfil, cartões, histórico, dias, currículo
  features/                  telas (onboarding, painel, glossário, revisão…)
  components/                componentes compartilhados
tests/                       Vitest
scripts/validate-content.ts  validação pela linha de comando
docs/ARQUITETURA.md          modelo de dados e decisões
```

O modelo de dados completo está em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
e os esquemas executáveis em [`src/content/schema.ts`](src/content/schema.ts).

## Como adicionar uma profissão

Nenhuma linha de código precisa mudar.

1. Crie a pasta `content/professions/<id>/` (id em kebab-case, por exemplo
   `elektroniker`).
2. Crie `profession.json` copiando o de uma profissão parecida. Campos
   principais: `id` (igual ao nome da pasta), `de` (nome alemão), `isco08`,
   `regulated`, `order` (posição na lista), `areas` (3 ou 4), `industries` e o
   bloco `tr["pt-BR"]` com nome, equivalência, regulamentação, passos do
   reconhecimento, links oficiais e título para o currículo.
3. Para cada área, crie `terms/<id-da-área>.json`:

   ```json
   {
     "area": "werkzeuge",
     "terms": [
       {
         "id": "el-abisolierzange",
         "level": "A2",
         "de": {
           "word": "Abisolierzange",
           "article": "die",
           "plural": "Abisolierzangen",
           "gender": "f",
           "pos": "noun"
         },
         "parts": [
           { "de": "Abisolier", "tr": { "pt-BR": "desencapar" } },
           { "de": "zange", "tr": { "pt-BR": "alicate" } }
         ],
         "synonyms": [],
         "related": [],
         "esco": null,
         "status": "rascunho",
         "examples": [
           { "de": "…", "tr": { "pt-BR": "…" } },
           { "de": "…", "tr": { "pt-BR": "…" } }
         ],
         "tr": {
           "pt-BR": {
             "term": "alicate desencapador",
             "technical": "…",
             "simple": "…"
           }
         }
       }
     ]
   }
   ```

4. Opcional: `situations.json` com diálogos. Destaque termos com
   `[[id-do-termo|texto]]`.
5. Rode `npm run validate`. O validador confere, entre outras coisas:
   - artigo ↔ gênero (`der`→`m`, `die`→`f`, `das`→`n`) e plural sem artigo;
   - que as partes da decomposição, juntas, formam exatamente a palavra
     (use uma parte `s` ou `n` para o elemento de ligação: `Arbeit` + `s` + `schutz`);
   - ids únicos, termos relacionados e termos destacados que existem;
   - exatamente 2 exemplos, idioma padrão presente, variantes declaradas;
   - no mínimo 40 termos por profissão e nenhuma área vazia.

**Regras de conteúdo:** nunca invente termos, artigos ou plurais. Na dúvida,
use `"status": "rascunho"`. Escreva em português do Brasil e preencha
`variants["pt-PT"]` só quando Portugal usa outra palavra. `revisado-profissional`
é reservado para termos conferidos por alguém que trabalha na área.

## Fotos dos objetos

Termos que são objetos (ferramentas, peças, equipamentos) podem ter uma imagem,
mostrada só na ficha do termo (não na lista do glossário). **Só são aceitas
imagens sem direitos reservados: CC0 ou domínio público.** O validador recusa
qualquer outra licença e confere se o arquivo existe.

```jsonc
"image": {
  "file": "media/industriemechaniker/im-messschieber.jpg",   // em /content/media
  "alt": { "pt-BR": "Foto: paquímetro" },
  "author": "Nome do autor",
  "license": "CC0",                                          // ou "Public Domain"
  "source": "https://commons.wikimedia.org/wiki/File:..."
}
```

Para buscar fotos no Wikimedia Commons (requer acesso de rede a
`commons.wikimedia.org` e `upload.wikimedia.org`):

```bash
npm run images:fetch                  # baixa até 3 candidatas por termo pendente
npm run images:fetch -- im-feile      # ou só alguns termos
# confira as imagens em scripts/images/staging/<id>/ e escolha a certa:
npm run images:apply -- im-feile 2    # copia para content/media e grava "image"
```

A lista de termos que devem ter foto, com a busca usada, fica em
`scripts/images/candidates.json`. Sempre olhe a candidata antes de aplicar:
a busca pode trazer um objeto parecido, mas errado. No app, as fotos são
guardadas no aparelho na primeira vez que aparecem (funcionam offline depois).

### Ilustrações próprias (SVG)

Os 62 objetos do Industriemechaniker usam ilustrações técnicas desenhadas para o
projeto (CC0), com as partes legendadas em alemão. Cada desenho é uma função
Python em `scripts/illustrations/tools*.py` (ajudantes em `lib.py`):

```bash
python3 scripts/illustrations/build.py            # gera content/media/<profissão>/<id>.svg
python3 scripts/illustrations/build.py im-feile   # ou só alguns
python3 scripts/illustrations/apply.py            # grava "image" nos termos sem imagem
npx prettier --write content
```

O texto alternativo é montado a partir das legendas do desenho.

## Como adicionar um idioma de explicação

O app descobre os idiomas sozinho a partir de `content/locales/`. Exemplo para
turco (`tr`):

1. Copie `content/locales/pt-BR.json` para `content/locales/tr.json`, troque
   `code`, `name`, `speechLang` (`tr-TR`), `dir` (`rtl` para árabe) e
   `variants` (ou `[]`), e traduza todos os textos de `ui`. Chaves de plural
   seguem `Intl.PluralRules` (`.zero` opcional, `.one`, `.other`; o árabe usa
   também `.two`, `.few`, `.many`).
2. Acrescente o código do idioma em cada mapa `tr` do conteúdo: nos termos
   (`tr`, `examples[].tr`, `parts[].tr`), nas profissões (`areas[].tr`,
   `industries[].tr`, `tr`) e nas situações. Atenção: o nome do campo é `tr`
   e o código do turco também é `tr`, então fica `"tr": { "pt-BR": …, "tr": … }`.
3. Rode `npm run validate`: ele mostra a cobertura por idioma (por exemplo
   `tr: 35% dos termos`). Enquanto um termo ou texto da interface não tiver
   tradução, o app mostra a versão em pt-BR no lugar (e o validador só avisa,
   não bloqueia o build).
4. Quando houver mais de um idioma, o onboarding e os ajustes passam a
   perguntar o idioma das explicações automaticamente.

Observações honestas sobre idiomas futuros:

- O app carrega só o subconjunto latino da fonte IBM Plex. Para ucraniano
  (cirílico) ou árabe, o navegador usa a fonte do sistema até que alguém
  importe o subconjunto correspondente em `src/main.tsx`
  (por exemplo `@fontsource/ibm-plex-sans/cyrillic-400.css` ou o pacote
  `@fontsource/ibm-plex-sans-arabic`). Isso é a única mudança de código
  recomendada, e é opcional.
- No currículo, os campos chamados `pt` guardam o texto no idioma do usuário,
  qualquer que seja ele.

## Decisões técnicas

- **FSRS-5 próprio** (`src/lib/fsrs.ts`), com os 19 parâmetros padrão e
  retenção-alvo de 90%: função pura, fácil de testar e sem dependência.
- **Busca própria** (`src/lib/search.ts`): normaliza acentos, `ß→ss`,
  `ä/ae`, e usa distância de Damerau-Levenshtein com tolerância proporcional
  ao tamanho da palavra. Também acha partes de compostos (`schieber` →
  `Messschieber`).
- **Conteúdo em pedaços**: cada arquivo de termos vira um _chunk_ carregado
  sob demanda; só a profissão do usuário é baixada no início.
- **Acessibilidade**: artigos com cor, texto e formato próprios (der
  quadrado, die pílula, das chanfrado), contraste AA verificado nos dois temas,
  navegação completa por teclado, foco visível, `prefers-reduced-motion`.

## Qualidade (último resultado)

- Vitest: 86 testes passando.
- ESLint e Prettier sem erros ou avisos.
- Lighthouse (celular, build local com `npm run preview`): primeira visita
  em 98 de desempenho e 100 em acessibilidade, boas práticas e SEO; páginas
  internas entre 99 e 100 em todas as categorias.

## Privacidade

O onboarding nunca pede nome, empresa, nacionalidade ou origem. Perfil,
progresso e currículo ficam no IndexedDB do navegador. O único jeito de os
dados saírem do aparelho é o usuário exportar o backup.
