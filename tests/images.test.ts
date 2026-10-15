import { describe, expect, it } from 'vitest';
import candidates from '../scripts/images/candidates.json';
import { freeLicense } from '../scripts/images/commons';
import { validateContent } from '../src/content/validate';
import { fixtureWithTerm, loadTerms } from './helpers';

describe('licenças das fotos', () => {
  it('aceita só CC0 e domínio público', () => {
    expect(freeLicense({ License: { value: 'cc0' }, LicenseShortName: { value: 'CC0' } })).toBe(
      'CC0',
    );
    expect(
      freeLicense({ License: { value: 'pd' }, LicenseShortName: { value: 'Public domain' } }),
    ).toBe('Public Domain');
    expect(freeLicense({ LicenseShortName: { value: 'Public domain' } })).toBe('Public Domain');
    expect(
      freeLicense({
        License: { value: 'cc-by-sa-4.0' },
        LicenseShortName: { value: 'CC BY-SA 4.0' },
      }),
    ).toBeNull();
    expect(
      freeLicense({ License: { value: 'cc-by-4.0' }, LicenseShortName: { value: 'CC BY 4.0' } }),
    ).toBeNull();
    expect(freeLicense({})).toBeNull();
  });

  it('a lista de candidatos só cita termos que existem', () => {
    const ids = new Set(loadTerms().map((t) => t.id));
    expect(Object.keys(candidates).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe('fotos no conteúdo', () => {
  const image = {
    file: 'media/test/ok.jpg',
    alt: { 'pt-BR': 'Foto: lima' },
    author: 'Fulano',
    license: 'CC0',
    source: 'https://commons.wikimedia.org/wiki/File:X.jpg',
  };

  it('aceita foto com licença livre e arquivo existente', () => {
    expect(validateContent(fixtureWithTerm({ image }), ['media/test/ok.jpg']).errors).toEqual([]);
  });

  it('recusa arquivo inexistente', () => {
    expect(validateContent(fixtureWithTerm({ image }), []).errors.join()).toMatch(/não existe/);
  });

  it('recusa licença que não seja CC0 ou domínio público', () => {
    const r = validateContent(fixtureWithTerm({ image: { ...image, license: 'CC BY-SA 4.0' } }), [
      'media/test/ok.jpg',
    ]);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('exige texto alternativo no idioma padrão', () => {
    const r = validateContent(fixtureWithTerm({ image: { ...image, alt: {} } }), [
      'media/test/ok.jpg',
    ]);
    expect(r.errors.join()).toMatch(/falta o idioma pt-BR/);
  });
});
