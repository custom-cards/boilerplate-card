import * as en from './languages/en.json';
import * as nb from './languages/nb.json';

const languages: Record<string, Record<string, unknown>> = {
  en: en,
  nb: nb,
};

function resolveTranslation(path: string, dictionary: Record<string, unknown>): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }

    return undefined;
  }, dictionary);

  return typeof value === 'string' ? value : undefined;
}

export function localize(string: string, search = '', replace = ''): string {
  const lang = (localStorage.getItem('selectedLanguage') || 'en').replace(/['"]+/g, '').replace('-', '_');

  let translated = resolveTranslation(string, languages[lang] || languages.en);

  if (translated === undefined) translated = resolveTranslation(string, languages.en);
  if (translated === undefined) translated = string;

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
