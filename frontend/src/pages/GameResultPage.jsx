import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { getGame, getGameResult } from '../services/api.js'

function winnerLabel(winnerSide) {
  switch (winnerSide) {
    case 'CIVILIANS':
      return 'Мирные'
    case 'MAFIA':
      return 'Мафия'
    case 'MANIAC':
      return 'Маньяк'
    default:
      return 'Ничья'
  }
}

export default function GameResultPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([getGameResult(gameId), getGame(gameId)])
      .then(([resultData, gameData]) => {
        setResult(resultData)
        setLogs(gameData.logs ?? [])
      })
      .catch((err) => setError(err.message))
  }, [gameId])

  const exportText = result
    ? `${result.exportText}\n\nКлючевые события:\n${[...logs]
        .slice(-8)
        .map((log) => `- ${log.message}`)
        .join('\n')}`
    : ''

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Не удалось скопировать текст')
    }
  }

  if (error) {
    return (
      <PageShell title="Результат игры">
        <p className="text-sm text-red-300">{error}</p>
        <PrimaryButton className="mt-3" onClick={() => navigate('/')}>
          В главное меню
        </PrimaryButton>
      </PageShell>
    )
  }

  if (!result) {
    return (
      <PageShell title="Результат игры">
        <p className="text-sm text-gray-300">Загрузка результата...</p>
      </PageShell>
    )
  }

  return (
    <PageShell title={`Игра #${gameId} завершена`} subtitle={`Победа: ${winnerLabel(result.winnerSide)}`}>
      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <p className="text-lg font-semibold text-red-400">{result.summary}</p>
        <p className="mt-2 text-sm text-gray-300">Всего дней: {result.totalDays}</p>
      </section>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-red-400">Экспорт результатов</h3>
        <textarea
          className="mt-3 min-h-44 w-full rounded-xl border border-red-900/50 bg-zinc-950 p-3 text-sm text-gray-200"
          value={exportText}
          readOnly
        />
        <PrimaryButton className="mt-3" onClick={copyExport}>
          {copied ? 'Скопировано' : 'Скопировать для мессенджера'}
        </PrimaryButton>
      </section>

      <PrimaryButton className="bg-zinc-800 hover:bg-zinc-700" onClick={() => navigate('/')}>
        В главное меню
      </PrimaryButton>
    </PageShell>
  )
}
