// Contrôle des fichiers de textes : je le lance avant chaque build de mise en
// ligne, parce qu'une clé manquante ne casse rien à la compilation et
// s'affiche telle quelle à l'écran.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_DIRECTORY = fileURLToPath(new URL('../src', import.meta.url))
const LOCALES_DIRECTORY = join(SOURCE_DIRECTORY, 'i18n', 'locales')
const REFERENCE_LANGUAGE = 'en'
const DEFAULT_NAMESPACE = 'common'
// Formes plurielles qu'exige chaque langue (règles CLDR). Le français en a
// une de plus que l'anglais, pour les très grands nombres.
const PLURAL_FORMS = { en: ['one', 'other'], fr: ['one', 'many', 'other'] }
const ALL_PLURAL_SUFFIXES = /_(one|many|other)$/

function flattenKeys(node, prefix = '') {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : flattenKeys(value, `${prefix}${key}.`),
  )
}

function readNamespaces(language) {
  const directory = join(LOCALES_DIRECTORY, language)
  return Object.fromEntries(
    readdirSync(directory).map((fileName) => [
      fileName.replace('.json', ''),
      flattenKeys(JSON.parse(readFileSync(join(directory, fileName), 'utf8'))),
    ]),
  )
}

// « found_one » et « found_other » désignent le même texte « found ».
function toBaseKeys(keys) {
  return new Set(keys.map((key) => key.replace(ALL_PLURAL_SUFFIXES, '')))
}

function findMissingPluralForms(language, keys) {
  const pluralBases = new Set(
    keys.filter((key) => ALL_PLURAL_SUFFIXES.test(key)).map((key) => key.replace(ALL_PLURAL_SUFFIXES, '')),
  )
  return [...pluralBases].flatMap((baseKey) =>
    PLURAL_FORMS[language]
      .filter((form) => !keys.includes(`${baseKey}_${form}`))
      .map((form) => `${baseKey}_${form}`),
  )
}

function compareLanguages(textsByLanguage) {
  const problems = []
  const reference = textsByLanguage[REFERENCE_LANGUAGE]
  Object.entries(textsByLanguage).forEach(([language, namespaces]) => {
    Object.entries(reference).forEach(([namespace, referenceKeys]) => {
      const keys = namespaces[namespace] ?? []
      const baseKeys = toBaseKeys(keys)
      const referenceBaseKeys = toBaseKeys(referenceKeys)
      const location = `${language}/${namespace}.json`
      ;[...referenceBaseKeys]
        .filter((key) => !baseKeys.has(key))
        .forEach((key) => problems.push(`${location}: missing "${key}"`))
      ;[...baseKeys]
        .filter((key) => !referenceBaseKeys.has(key))
        .forEach((key) => problems.push(`${location}: "${key}" does not exist in ${REFERENCE_LANGUAGE}`))
      findMissingPluralForms(language, keys).forEach((key) =>
        problems.push(`${location}: missing plural form "${key}"`),
      )
    })
  })
  return problems
}

function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    return /\.(js|jsx)$/.test(entry.name) ? [path] : []
  })
}

// Seules les clés écrites en toutes lettres sont vérifiables : une clé
// construite à l'exécution (`steps.${id}.title`) échappe à ce contrôle.
const LITERAL_KEY_PATTERNS = [/\bt\(\s*'([^'`$]+)'/g, /i18nKey="([^"]+)"/g, /labelKey:\s*'([^']+)'/g]
const DECLARED_NAMESPACE_PATTERN = /useTranslation\(\s*\[?\s*'([^']+)'/

function findUnknownKeys(referenceNamespaces) {
  return listSourceFiles(SOURCE_DIRECTORY).flatMap((path) => {
    const source = readFileSync(path, 'utf8')
    const fileNamespace = source.match(DECLARED_NAMESPACE_PATTERN)?.[1] ?? DEFAULT_NAMESPACE
    return LITERAL_KEY_PATTERNS.flatMap((pattern) => [...source.matchAll(pattern)])
      .map((match) => match[1])
      .map((usedKey) => (usedKey.includes(':') ? usedKey.split(':') : [fileNamespace, usedKey]))
      .filter(([namespace, key]) => !toBaseKeys(referenceNamespaces[namespace] ?? []).has(key))
      .map(([namespace, key]) => `${relative(SOURCE_DIRECTORY, path)}: unknown key "${namespace}:${key}"`)
  })
}

const textsByLanguage = Object.fromEntries(
  readdirSync(LOCALES_DIRECTORY).map((language) => [language, readNamespaces(language)]),
)
const problems = [
  ...compareLanguages(textsByLanguage),
  ...findUnknownKeys(textsByLanguage[REFERENCE_LANGUAGE]),
]

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
const keyCount = Object.values(textsByLanguage[REFERENCE_LANGUAGE]).flat().length
console.log(`Translations are consistent: ${keyCount} keys in ${Object.keys(textsByLanguage).length} languages.`)
