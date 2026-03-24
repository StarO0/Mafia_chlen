import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import { useI18n } from '../context/I18nContext.jsx'
import { getGame, getGameResult } from '../services/api.js'

export default function GameResultPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
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
    ? `${result.exportText}\n\n${t.result.keyEvents}:\n${[...logs]
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
      setError(t.result.copyFailed)
    }
  }

  if (error) {
    return (
      <PageShell title={t.result.title}>
        <p className="text-sm text-red-300">{error}</p>
        <PrimaryButton className="mt-3" onClick={() => navigate('/')}>
          {t.common.backToMenu}
        </PrimaryButton>
      </PageShell>
    )
  }

  if (!result) {
    return (
      <PageShell title={t.result.title}>
        <p className="text-sm text-gray-300">{t.result.loading}</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`${t.menu.game} #${gameId} ${t.result.gameFinished}`}
      subtitle={`${t.result.victory}: ${t.result.winners[result.winnerSide] ?? t.result.winners.DRAW}`}
    >
      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <p className="text-lg font-semibold text-red-400">{result.summary}</p>
        <p className="mt-2 text-sm text-gray-300">
          {t.result.totalDays}: {result.totalDays}
        </p>
      </section>

      <section className="rounded-xl border border-red-900/40 bg-black/40 p-4">
        <h3 className="text-lg font-semibold text-red-400">{t.result.exportTitle}</h3>
        <textarea
          className="mt-3 min-h-44 w-full rounded-xl border border-red-900/50 bg-zinc-950 p-3 text-sm text-gray-200"
          value={exportText}
          readOnly
        />
        <PrimaryButton className="mt-3" onClick={copyExport}>
          {copied ? t.result.copied : t.result.copy}
        </PrimaryButton>
      </section>

      <PrimaryButton className="bg-zinc-800 hover:bg-zinc-700" onClick={() => navigate('/')}>
        {t.common.backToMenu}
      </PrimaryButton>
    </PageShell>
  )
}
