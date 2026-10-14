import type { CvEntry, CvRow } from '@/db/types';

/** Títulos do currículo em alemão (o idioma de destino é sempre o alemão). */
export const CV_DE = {
  title: 'Lebenslauf',
  contact: 'Kontakt',
  profile: 'Kurzprofil',
  experience: 'Berufserfahrung',
  education: 'Ausbildung',
  skills: 'Fachkenntnisse',
  languages: 'Sprachkenntnisse',
  today: 'heute',
} as const;

export type CvHeadings = { [K in keyof typeof CV_DE]: string };

export interface CvSkill {
  de: string;
  pt: string;
}

/** Currículo vazio; `native` é o rótulo "língua materna" e `german`/`mother` os nomes dos idiomas no idioma do usuário. */
export function emptyCv(labels: { german: string; mother: string; native: string }): CvRow {
  return {
    id: 'main',
    name: '',
    email: '',
    phone: '',
    city: '',
    profile: { de: '', pt: '' },
    experience: [],
    education: [],
    skills: [],
    languages: [
      { name: { de: 'Deutsch', pt: labels.german }, level: { de: 'B1', pt: 'B1' } },
      {
        name: { de: 'Portugiesisch', pt: labels.mother },
        level: { de: 'Muttersprache', pt: labels.native },
      },
    ],
    updatedAt: 0,
  };
}

function period(e: CvEntry, today: string): string {
  if (!e.from && !e.to) return '';
  return `${e.from || '…'} – ${e.to || today}`;
}

function section(title: string, lines: string[]): string[] {
  const body = lines.filter((l) => l.trim());
  return body.length ? ['', title.toUpperCase(), '-'.repeat(title.length), ...body] : [];
}

/** Gera o currículo em texto puro num idioma ("de" ou "pt"). */
export function renderCv(
  cv: CvRow,
  lang: 'de' | 'pt',
  headings: CvHeadings,
  jobTitle: string,
  skills: CvSkill[],
): string {
  const entries = (list: CvEntry[]) =>
    list.flatMap((e) => {
      const head = [period(e, headings.today), e.title[lang]].filter(Boolean).join('  ');
      return [
        head,
        e.place ? `  ${e.place}` : '',
        e.details[lang] ? `  ${e.details[lang].replace(/\n/g, '\n  ')}` : '',
      ].filter(Boolean);
    });
  const contact = [cv.city, cv.email, cv.phone].filter(Boolean).join(' · ');
  return [
    cv.name || '—',
    jobTitle,
    contact,
    ...section(headings.profile, [cv.profile[lang]]),
    ...section(headings.experience, entries(cv.experience)),
    ...section(headings.education, entries(cv.education)),
    ...section(headings.skills, skills.length ? [skills.map((s) => s[lang]).join(' · ')] : []),
    ...section(
      headings.languages,
      cv.languages.map((l) => `${l.name[lang]}: ${l.level[lang]}`),
    ),
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim();
}
