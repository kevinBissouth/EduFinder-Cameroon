// Titre du chef d'établissement. Il se choisit dans la liste du type d'école
// (un lycée a un proviseur, une université un recteur) ; la fiche en garde la
// clé, et chaque visiteur lit le libellé de sa langue.
import { pickSchoolText } from './schoolText.js'

// Le titre à afficher, sous la même forme que les autres textes de l'école :
// { text, writtenIn }. Une clé de la liste donne son libellé dans la langue du
// site, sans mention de langue. Un titre absent de la liste est un texte libre
// d'une ancienne fiche : il suit la règle des autres textes (version traduite
// si elle existe, texte d'origine avec sa langue sinon).
export function findHeadTitle(school, headTitleLabels = {}, siteLanguageCode) {
  const labels = headTitleLabels[school.director_title]
  if (!labels) return pickSchoolText(school, 'director_title', siteLanguageCode)
  return { text: labels[siteLanguageCode] ?? school.director_title, writtenIn: null }
}

// Le titre à garder quand le type de l'établissement change. Un titre vide ou
// venu de l'ancien type suit le nouveau (son premier titre) ; un titre libre
// déjà publié ne bouge pas, ce n'est pas au changement de type de l'effacer.
export function pickHeadTitleForType(currentTitle, previousTitles = [], nextTitles = []) {
  if (nextTitles.includes(currentTitle)) return currentTitle
  const followsTheType = !currentTitle || previousTitles.includes(currentTitle)
  return followsTheType ? (nextTitles[0] ?? '') : currentTitle
}
