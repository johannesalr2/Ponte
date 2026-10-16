# Ideia: vocabulário em camadas + teste de nivelamento

> Status: **proposta aprovada para implementar** (ainda não implementada).
> Registrada em outubro de 2026, a partir da conversa sobre ESCO, O\*NET e geração com IA.

## Resumo em uma frase

Quando a pessoa se cadastra numa profissão cujo **ramo** ainda não tem vocabulário pronto, o app
gera esse ramo com IA em segundo plano e, enquanto isso, aplica um **teste de nivelamento** com o
vocabulário base da profissão, que já existe. O teste preenche a espera e mostra o nível real
da pessoa.

## O problema que resolve

- Gerar o vocabulário de uma profissão na hora leva **de 2 a 6 minutos**. Isso é longo demais
  para uma tela de carregamento parada.
- Profissões parecidas, principalmente as braçais e técnicas, **compartilham boa parte do
  vocabulário**. Não faz sentido gerar tudo de novo para cada pessoa.
- O nível de alemão que a pessoa declara no cadastro costuma ser impreciso. Hoje o app não
  tem como conferir.

## 1. Três camadas de vocabulário

| Camada                       | O que é                           | Exemplo (Industriemechaniker)                                                                   | Quando é gerada                                                 |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **1. Comum ao trabalho**     | Palavras de qualquer emprego      | _die Schicht, der Feierabend, der Arbeitsschutz, der Vorgesetzte, die Krankmeldung_             | Antes, uma vez só                                               |
| **2. Base da profissão**     | O núcleo da profissão             | _der Messschieber, die Welle, das Lager, die Wartung, die Toleranz_                             | Antes, em lote, para as ~300 profissões prioritárias            |
| **3. Ramo / especialização** | O vocabulário do setor específico | Resina: _das Gießharz, die Topfzeit, entformen_. Alta tensão: _freischalten, die Teilentladung_ | **Na hora**, quando alguém escolhe um ramo que ainda não existe |

- O conteúdo atual já tem essa divisão: cada profissão tem **áreas** (base) e **ramos**
  (`industries` em `profession.json`).
- Para profissões da ESCO sem ramos definidos, a IA propõe a lista de ramos junto com a base
  (custo baixo).
- Um termo pertence a várias profissões e ramos, mas a **ficha é escrita uma vez só** (ver
  "Evitar gerar duas vezes").

## 2. Fluxo do usuário

```
Cadastro: escolhe profissão + ramo + nível declarado
   │
   ├──► (segundo plano) gera o vocabulário do ramo, se ainda não existir
   │
   ▼
~10 s — "Preparando seu vocabulário…"   (só monta o teste)
   │
   ▼
Teste de nivelamento — 3 a 5 min, só com as camadas 1 e 2
   │
   ▼
Resultado: "seu ponto de partida" + plano do dia 1
   │
   ▼
Ramo pronto → entra no glossário e na prática
(se ainda não estiver: "seu vocabulário de <ramo> chega em instantes" + aviso quando ficar pronto)
```

**Por que o tempo fecha:**

- Um ramo tem uns 20 a 40 termos, e muitos já existem no cadastro central.
- Gerar só o que falta leva **~1,5 a 2,5 minutos**, e o teste dura **3 a 5 minutos**.
- Na maioria dos casos, o ramo fica pronto antes de o teste acabar.

## 3. O teste de nivelamento

**Formato**

- **Adaptativo, com 15 a 20 perguntas.** Começa no nível declarado. Acertou, sobe
  (A2 → B1 → B2 → C1); errou, desce. Cada termo já tem nível no conteúdo.
- **Exercícios variados**, todos já existentes no app:
  - reconhecer (alemão → português);
  - lembrar (português → alemão);
  - artigo _der/die/das_;
  - 1 ou 2 de completar frase.
- **Usa só as camadas 1 e 2.** O teste nunca depende do ramo que está sendo gerado.
- **Pode ser pulado.** O botão "fazer depois" fica sempre visível.
- **Respeita o idioma em foco** (alemão ou português) escolhido pela pessoa.

**O que o resultado faz**

1. **Nível real por área.** Exemplo: "B2 em ferramentas, A2 em segurança". O app passa a
   usar isso no lugar do nível declarado.
2. **Termos que a pessoa já sabe** saem da fila de novos, ou entram na revisão com
   intervalo longo. Ninguém precisa estudar _der Hammer_ se já sabe.
3. **Termos errados** viram os primeiros estudos do dia 1.
4. **Dado de produto:** os termos que quase todo mundo erra mostram onde está a dificuldade
   real de cada profissão.

**Como apresentar**

- O resultado é uma **estimativa**, não um certificado. Na tela, "seu ponto de partida"
  em vez de "seu nível é B1".
- Mostrar o que vem a seguir: "hoje: 10 termos novos de segurança + revisão de 5".

## 4. Geração do ramo em segundo plano

Etapas, iguais à geração de profissão, só que menores:

1. **Listar** os termos do ramo (IA, só nomes + sentido curto).
2. **Normalizar e comparar** com o cadastro central de termos:
   - mesma chave → só liga;
   - parecido → modelo pequeno decide se é o mesmo sentido;
   - novo → vai para a fila.
3. **Escrever as fichas** só dos termos novos, várias chamadas em paralelo, **começando pelos
   termos mais básicos**.
4. **Validar** com o validador de conteúdo existente (artigo × gênero, decomposição, plural,
   tipo × classe gramatical). A IA só revê o que falhar.
5. **Publicar** com o status **"gerado por IA"** (equivalente ao `rascunho` atual) até haver
   revisão humana.

**Casos especiais**

- **Duas pessoas no mesmo ramo novo ao mesmo tempo:** a segunda espera a geração em
  andamento, sem gerar de novo.
- **Falha ou limite de uso da API:** o app segue com a base e com os dados da ESCO, avisa
  e tenta de novo depois. **Nunca prender a pessoa numa tela de espera.**
- **Ramo que ninguém escolheu:** não é gerado. A geração acompanha a demanda.

## 5. Evitar gerar duas vezes (resumo)

- **Chave canônica** do termo: `palavra + artigo + classe gramatical + sentido`. O sentido
  separa _das Lager_ (rolamento) de _das Lager_ (armazém).
- **Ficha base compartilhada** (tradução, explicações, gramática) + **exemplos por profissão**
  (curtos, gerados só quando a profissão usa o termo).
- **Comparação em 3 níveis:** chave igual → liga; parecido → modelo pequeno decide; novo →
  gera.
- **Registro de cada chamada** (chave + versão do prompt + modelo → resultado): se o processo
  cair, recomeça de onde parou.
- **Lote (Batch) + cache do prompt + vários termos por chamada** na geração antecipada; na
  hora, chamadas normais em paralelo.

## 6. Custos e tempos de referência

Estimativas a confirmar no piloto de 20 profissões:

| Item                                                    | Estimativa                                         |
| ------------------------------------------------------- | -------------------------------------------------- |
| 300 profissões prioritárias (camadas 1 + 2), antecipado | **~US$ 105 a 380** (recomendado ~US$ 280)          |
| Um ramo gerado na hora (~20 a 40 termos)                | centavos; ~2× o custo por termo da geração em lote |
| Tempo para gerar um ramo na hora                        | **~1,5 a 2,5 min**                                 |
| Duração do teste                                        | **3 a 5 min** (15 a 20 perguntas)                  |

## 7. Em fases

**Fase 1 — já dá para fazer, sem servidor**

- Teste de nivelamento no cadastro, com o conteúdo atual (6 profissões, 408 termos com nível
  A2–C1).
- Calibrar o nível, marcar palavras conhecidas na revisão (FSRS) e ordenar os primeiros
  estudos.
- Sem geração de ramo, porque todo o conteúdo atual já está pronto.

**Fase 2 — com servidor**

- Cadastro central de termos e geração das 300 profissões prioritárias em lote.
- Geração de ramo na hora, em paralelo ao teste.
- Selo "gerado por IA" e fila de revisão humana.

**Fase 3 — refinamentos**

- Usar os erros do teste de todos os usuários para priorizar a revisão humana e ajustar
  o nível dos termos.
- Refazer o teste depois de algumas semanas para mostrar o progresso.

## 8. Perguntas em aberto

- O teste fica **obrigatório** (com opção de pular) ou só aparece se o ramo não estiver
  pronto?
- Quantas perguntas no máximo antes de virar cansativo? A proposta é 15 a 20.
- O que fazer quando a pessoa escolhe **um ramo que não existe** na lista: texto livre gerado
  pela IA ou só ramos pré-definidos?
- Notificar por e-mail, push ou só dentro do app quando o ramo ficar pronto?
