import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import hi from './hi';

const savedLang = (() => {
  try { return localStorage.getItem('bccs-lang') || 'en'; }
  catch { return 'en'; }
})();

i18n.use(initReactI18next).init({
  resources: { en, hi },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem('bccs-lang', lng); } catch {}
});

export default i18n;
