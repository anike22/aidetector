import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { SectionWrapper } from '@/components/SectionWrapper'

const signals = [
  {
    factor: 'Originality',
    important: 'Critical',
    impact: 'High impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'Expertise',
    important: 'Critical',
    impact: 'High impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'Helpful Information',
    important: 'Critical',
    impact: 'High impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'User Intent',
    important: 'Critical',
    impact: 'High impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'Author Trust',
    important: 'Important',
    impact: 'Medium impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'Citations',
    important: 'Important',
    impact: 'Medium impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'Page Experience',
    important: 'Important',
    impact: 'Medium impact',
    icon: CheckCircle,
    iconColor: 'text-green-600',
  },
  {
    factor: 'Spam Signals',
    important: 'Avoid',
    impact: 'Negative impact',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
  {
    factor: 'Thin Content',
    important: 'Avoid',
    impact: 'Negative impact',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
  {
    factor: 'Topical Authority',
    important: 'Helpful',
    impact: 'Positive impact',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
]

export function RankingSignals() {
  return (
    <SectionWrapper id="ranking-signals" className="bg-muted">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Evaluation
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Ranking Signals</h2>
        <p className="prose-custom mt-4">
          The signals that matter for AI content are the same signals that matter for any content.
          Focus on what helps the reader, not what impresses the algorithm.
        </p>
      </div>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse rounded-xl bg-card text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th scope="col" className="px-6 py-4 font-semibold">
                Factor
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Important?
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                AI Content Impact
              </th>
            </tr>
          </thead>
          <tbody>
            {signals.map((row) => (
              <tr key={row.factor} className="border-b border-border last:border-b-0">
                <td className="px-6 py-4 font-medium">{row.factor}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      row.important === 'Critical'
                        ? 'bg-green-100 text-green-700'
                        : row.important === 'Important'
                        ? 'bg-blue-100 text-blue-700'
                        : row.important === 'Avoid'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <row.icon className={`h-3.5 w-3.5 ${row.iconColor}`} aria-hidden="true" />
                    {row.important}
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground/70">{row.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  )
}
