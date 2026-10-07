// Mise en forme des données pour les graphiques : fonctions pures, sans
// affichage, pour pouvoir les vérifier seules.

const DAYS_PER_WEEK = 7
const MILLISECONDS_PER_DAY = 86_400_000
const SUBMISSION_STATUSES = ['approved', 'pending', 'rejected']
const DAY_LABEL_FORMAT = { day: 'numeric', month: 'short' }

export function formatDayLabel(isoDay) {
  return new Date(isoDay).toLocaleDateString('en-GB', { ...DAY_LABEL_FORMAT, timeZone: 'UTC' })
}

export function sumActivity(days) {
  return days.reduce(
    (totals, day) => ({
      views: totals.views + day.views,
      inquiries: totals.inquiries + day.inquiries,
    }),
    { views: 0, inquiries: 0 },
  )
}

// Début (lundi, minuit UTC) de la semaine qui contient la date donnée.
function findWeekStart(date) {
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const daysSinceMonday = (date.getUTCDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK
  return dayStart - daysSinceMonday * MILLISECONDS_PER_DAY
}

// Une barre par semaine sur les dernières semaines, même sans soumission,
// avec le nombre de soumissions par issue.
export function groupSubmissionsByWeek(submissions, weekCount, today = new Date()) {
  const currentWeekStart = findWeekStart(today)
  const weeks = Array.from({ length: weekCount }, (_, weekIndex) => {
    const weekStart =
      currentWeekStart - (weekCount - 1 - weekIndex) * DAYS_PER_WEEK * MILLISECONDS_PER_DAY
    return { weekStart, label: formatDayLabel(weekStart), approved: 0, pending: 0, rejected: 0 }
  })
  const weekByStart = new Map(weeks.map((week) => [week.weekStart, week]))

  submissions.forEach((submission) => {
    const week = weekByStart.get(findWeekStart(new Date(submission.submitted_at)))
    const isKnownStatus = SUBMISSION_STATUSES.includes(submission.submission_status)
    if (week && isKnownStatus) week[submission.submission_status] += 1
  })
  return weeks
}

// Une ligne par session, une colonne par examen : la forme attendue par un
// graphique à plusieurs courbes.
export function pivotPassRates(examResults) {
  const examNames = [...new Set(examResults.map((examResult) => examResult.exam))]
  const sessions = [...new Set(examResults.map((examResult) => examResult.session))].sort()
  const rows = sessions.map((session) => {
    const sessionResults = examResults.filter((examResult) => examResult.session === session)
    const ratesByExam = Object.fromEntries(
      sessionResults.map((examResult) => [examResult.exam, Number(examResult.pass_rate)]),
    )
    return { session, ...ratesByExam }
  })
  return { examNames, rows }
}

// Compte les éléments par valeur d'un champ, du plus fréquent au moins fréquent.
export function countByField(items, fieldName) {
  const countByValue = new Map()
  items.forEach((item) => {
    countByValue.set(item[fieldName], (countByValue.get(item[fieldName]) ?? 0) + 1)
  })
  return [...countByValue.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label))
}
