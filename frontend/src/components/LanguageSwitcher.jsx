import { useI18n } from '../context/I18nContext.jsx'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 p-1">
      <button
        type="button"
        onClick={() => setLanguage('ru')}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          language === 'ru' ? 'bg-red-700 text-white' : 'text-gray-300'
        }`}
        aria-label={t.language.label}
      >
        {t.language.ru}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          language === 'en' ? 'bg-red-700 text-white' : 'text-gray-300'
        }`}
        aria-label={t.language.label}
      >
        {t.language.en}
      </button>
    </div>
  )
}
