import { describe, expect, it } from 'vitest';
import { editDistance, fold, searchKey, typoBudget } from '../src/lib/normalize';
import { buildIndex, search } from '../src/lib/search';

describe('normalização', () => {
  it('remove acentos do português e do alemão', () => {
    expect(fold('Higienização')).toBe('higienizacao');
    expect(fold('Bügelmessschraube')).toBe('bugelmessschraube');
    expect(fold('Verschleiß')).toBe('verschleiss');
  });

  it('une as grafias ä/ae, ö/oe, ü/ue', () => {
    expect(searchKey('Schlüssel')).toBe(searchKey('Schluessel'));
    expect(searchKey('Schlüssel')).toBe(searchKey('Schlussel'));
    expect(searchKey('Größe')).toBe(searchKey('Groesse'));
  });

  it('calcula a distância de edição com transposição', () => {
    expect(editDistance('lager', 'lager')).toBe(0);
    expect(editDistance('lager', 'laeger')).toBe(1);
    expect(editDistance('welle', 'wlele')).toBe(1);
    expect(editDistance('abc', 'xyz', 1)).toBe(2);
  });

  it('tolera mais erros em palavras longas', () => {
    expect(typoBudget(3)).toBe(0);
    expect(typoBudget(5)).toBe(1);
    expect(typoBudget(12)).toBe(3);
  });
});

describe('busca', () => {
  const items = [
    { id: 'messschieber', de: 'Messschieber', pt: 'paquímetro', syn: 'Schieblehre' },
    { id: 'schluessel', de: 'Gabelschlüssel', pt: 'chave de boca', syn: '' },
    { id: 'lager', de: 'Lager', pt: 'rolamento', syn: 'Wälzlager' },
    { id: 'pfanne', de: 'Bettpfanne', pt: 'comadre', syn: 'Steckbecken' },
    { id: 'hygiene', de: 'Händedesinfektion', pt: 'higienização das mãos', syn: '' },
  ];
  const index = buildIndex(
    items.map((i) => ({
      item: i,
      fields: [
        { text: i.de, weight: 1 },
        { text: i.pt, weight: 1 },
        { text: i.syn, weight: 0.9 },
      ],
    })),
  );
  const first = (q: string) => search(index, q)[0]?.item.id;

  it('encontra pelo alemão e pelo português', () => {
    expect(first('Messschieber')).toBe('messschieber');
    expect(first('paquímetro')).toBe('messschieber');
  });

  it('ignora acentos e trema', () => {
    expect(first('paquimetro')).toBe('messschieber');
    expect(first('gabelschluessel')).toBe('schluessel');
    expect(first('gabelschlussel')).toBe('schluessel');
    expect(first('higienizacao')).toBe('hygiene');
  });

  it('tolera erros de digitação', () => {
    expect(first('paquimtro')).toBe('messschieber');
    expect(first('rolamneto')).toBe('lager');
    expect(first('Messchieber')).toBe('messschieber');
  });

  it('encontra partes de palavras compostas', () => {
    expect(first('schieber')).toBe('messschieber');
    expect(first('desinfektion')).toBe('hygiene');
  });

  it('aceita várias palavras e prefixos', () => {
    expect(first('chave boca')).toBe('schluessel');
    expect(first('paq')).toBe('messschieber');
  });

  it('busca por sinônimo', () => {
    expect(first('Steckbecken')).toBe('pfanne');
  });

  it('ordena a correspondência exata antes da aproximada', () => {
    const hits = search(index, 'lager');
    expect(hits[0]?.item.id).toBe('lager');
  });

  it('não devolve nada para busca vazia ou sem relação', () => {
    expect(search(index, '   ')).toEqual([]);
    expect(search(index, 'xyzxyz')).toEqual([]);
  });
});
