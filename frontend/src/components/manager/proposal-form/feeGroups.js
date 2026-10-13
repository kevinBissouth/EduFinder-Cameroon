// Frais saisis par groupe : un montant, ses modalités de paiement, et toutes
// les classes qui le paient pour une année scolaire. Le serveur, lui, reçoit
// toujours une ligne par classe : ce fichier fait l'aller-retour entre les deux.
import { createUniqueId } from '../../../utils/uniqueId.js'

export function createFeeGroup(schoolYear, values = {}) {
  return {
    groupId: createUniqueId(),
    school_year: schoolYear,
    amount: '',
    payment_methods: [],
    levelIds: [],
    ...values,
  }
}

// L'ordre des modalités ne compte pas : « 1 tranche, 2 tranches » et
// « 2 tranches, 1 tranche » sont le même plan.
function describePaymentPlan(paymentMethods) {
  return [...(paymentMethods ?? [])].sort().join('|')
}

function describeFeeTerms(fee) {
  return `${fee.school_year}|${Number(fee.amount)}|${describePaymentPlan(fee.payment_methods)}`
}

// Les frais publiés, regroupés : les classes d'une même année qui paient le
// même montant avec les mêmes modalités forment un groupe.
export function groupFees(fees) {
  const groupsByTerms = new Map()
  fees.forEach((fee) => {
    const terms = describeFeeTerms(fee)
    const feeGroup =
      groupsByTerms.get(terms) ??
      createFeeGroup(fee.school_year, {
        amount: String(Number(fee.amount)),
        payment_methods: fee.payment_methods ?? [],
      })
    groupsByTerms.set(terms, { ...feeGroup, levelIds: [...feeGroup.levelIds, String(fee.id_level)] })
  })
  return [...groupsByTerms.values()]
}

export function isBlankFeeGroup(feeGroup) {
  return !feeGroup.amount && feeGroup.levelIds.length === 0
}

export function listFeeGroupsOfYear(feeGroups, schoolYear) {
  return feeGroups.filter((feeGroup) => feeGroup.school_year === schoolYear)
}

// Les classes déjà prises par un autre montant de la même année : une classe
// n'a qu'un montant par an, elle n'est donc plus proposée ailleurs.
export function listTakenLevelIds(feeGroups, feeGroup) {
  return listFeeGroupsOfYear(feeGroups, feeGroup.school_year)
    .filter((otherGroup) => otherGroup.groupId !== feeGroup.groupId)
    .flatMap((otherGroup) => otherGroup.levelIds)
}

export function findPreviousSchoolYear(schoolYear) {
  const startYear = Number(schoolYear.split('-')[0])
  return `${startYear - 1}-${startYear}`
}

// Reprise d'une année sur l'autre : mêmes montants, mêmes modalités, pour les
// classes que l'établissement peut encore proposer.
export function copyFeeGroups(sourceGroups, schoolYear, allowedLevelIds) {
  return sourceGroups
    .filter((sourceGroup) => !isBlankFeeGroup(sourceGroup))
    .map((sourceGroup) =>
      createFeeGroup(schoolYear, {
        amount: sourceGroup.amount,
        payment_methods: sourceGroup.payment_methods,
        levelIds: sourceGroup.levelIds.filter((levelId) => allowedLevelIds.has(levelId)),
      }),
    )
    .filter((copiedGroup) => copiedGroup.levelIds.length > 0)
}

// Un groupe complet donne une ligne par classe ; un groupe sans montant ou
// sans classe n'est pas envoyé.
export function expandFeeGroups(feeGroups) {
  return feeGroups
    .filter((feeGroup) => feeGroup.amount && feeGroup.levelIds.length > 0)
    .flatMap((feeGroup) =>
      feeGroup.levelIds.map((levelId) => ({
        id_level: Number(levelId),
        amount: feeGroup.amount,
        school_year: feeGroup.school_year,
        payment_methods: feeGroup.payment_methods,
      })),
    )
}

function describeFeeLine(fee) {
  return `${fee.id_level}|${describeFeeTerms(fee)}`
}

// Ce qui diffère de la fiche publiée : une ligne identique (même classe, même
// année, même montant, mêmes modalités) n'a rien à faire valider.
export function listChangedFees(feeLines, publishedFees) {
  const publishedLines = new Set(publishedFees.map(describeFeeLine))
  return feeLines.filter((feeLine) => !publishedLines.has(describeFeeLine(feeLine)))
}
