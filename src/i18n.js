// client/src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en.json'
import ru from '../locales/ru.json'
import kk from '../locales/kk.json'

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  kk: { translation: kk },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',           // язык по умолчанию
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
  .then(() => console.log('✅ i18n initialized'))
  .catch(err => console.error('❌ i18n init failed:', err))

export default i18n
