#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const version = process.argv[2]

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: node scripts/extract-changelog-notes.mjs <x.y.z>')
  process.exit(1)
}

const changelogPath = resolve(process.cwd(), 'CHANGELOG.md')
const content = readFileSync(changelogPath, 'utf8')
const escapedVersion = version.replaceAll('.', String.raw`\.`)
const sectionPattern = new RegExp(
  `^## \\[${escapedVersion}\\][^\\n]*\\n+([\\s\\S]*?)(?=^## \\[|$)`,
  'm',
)
const match = content.match(sectionPattern)

if (!match) {
  console.error(`No changelog section found for version ${version} in CHANGELOG.md`)
  process.exit(1)
}

const notes = match[1].trim()

if (!notes) {
  console.error(`Changelog section for version ${version} is empty`)
  process.exit(1)
}

process.stdout.write(`${notes}\n`)
