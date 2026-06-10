import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const adminDir = path.join(__dirname, '../src/components/admin')

const REPLACEMENTS = [
  ['bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/5 space-y-4', 'admin-panel admin-panel-pad space-y-4'],
  ['bg-white rounded-2xl p-5 shadow-sm border border-mayssa-brown/5 space-y-4', 'admin-panel admin-panel-pad space-y-4'],
  ['bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5 space-y-3', 'admin-panel admin-panel-pad space-y-3'],
  ['bg-white rounded-2xl p-4 shadow-sm border border-mayssa-brown/5', 'admin-panel admin-panel-pad'],
  ['bg-white rounded-2xl p-12 shadow-sm border border-mayssa-brown/5 text-center', 'admin-panel admin-panel-pad admin-empty text-center'],
  ['bg-white rounded-xl px-4 py-2 shadow-sm border border-mayssa-brown/5', 'admin-mini-stat'],
  ['bg-white rounded-xl p-4 shadow-sm border border-mayssa-brown/5', 'admin-panel admin-panel-pad'],
  ['bg-white rounded-2xl shadow-sm border border-mayssa-brown/5 p-3', 'admin-panel admin-panel-pad'],
  ['bg-white rounded-2xl shadow-sm overflow-hidden', 'admin-panel overflow-hidden'],
  ['bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between', 'admin-panel admin-panel-pad flex items-center justify-between'],
  ['flex items-center gap-2 bg-white rounded-2xl p-2 shadow-sm border border-mayssa-brown/5', 'admin-toolbar-bar'],
  ['bg-white rounded-2xl border border-mayssa-brown/10 shadow-sm overflow-hidden', 'admin-panel overflow-hidden'],
  ['bg-white rounded-2xl border border-mayssa-brown/8 p-4 space-y-2', 'admin-panel admin-panel-pad space-y-2'],
  ['bg-white rounded-2xl border border-mayssa-brown/8 p-4', 'admin-panel admin-panel-pad'],
  ['fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm', 'admin-modal-overlay'],
  ['fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm', 'admin-modal-overlay'],
  ['fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4', 'admin-modal-overlay'],
  ['fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8', 'admin-modal-overlay admin-modal-overlay--scroll'],
  ['fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]', 'admin-modal-overlay'],
  ['w-full max-w-lg rounded-2xl shadow-xl p-5 space-y-4 max-h-[90vh] flex flex-col', 'admin-modal admin-modal-pad space-y-4 max-h-[90vh] flex flex-col w-full max-w-lg'],
  ['w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-4', 'admin-modal admin-modal-pad space-y-4 w-full max-w-sm'],
  ['w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col', 'admin-modal overflow-hidden max-h-[90vh] flex flex-col w-full max-w-lg'],
  ['p-3 rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/10', 'admin-order-row'],
  ['flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/10', 'admin-order-row flex flex-wrap items-center justify-between gap-2'],
  ['px-2.5 py-1 rounded-lg bg-white border border-mayssa-brown/10 text-xs font-bold text-mayssa-brown', 'admin-chip'],
  ['mb-4 p-3 rounded-xl bg-mayssa-gold/5 border border-mayssa-gold/20', 'admin-highlight-box'],
  ['rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5', 'admin-panel admin-panel-pad'],
  ['rounded-2xl bg-white p-4 shadow-sm border border-amber-200', 'admin-panel admin-panel-pad border-amber-200'],
  ['rounded-2xl bg-white border border-mayssa-brown/10 shadow-sm p-4 text-center', 'admin-panel admin-panel-pad text-center'],
  ['rounded-2xl bg-white border border-mayssa-brown/10 shadow-sm p-4', 'admin-panel admin-panel-pad'],
  ['bg-white rounded-2xl p-4 shadow-sm space-y-3 border-2 border-mayssa-caramel/30', 'admin-panel admin-panel-pad space-y-3 border-2 border-mayssa-caramel/30'],
  ['bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4', 'admin-modal admin-modal-pad space-y-4 max-w-md w-full'],
  ['w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden', 'admin-modal overflow-hidden w-full max-w-lg'],
  ['w-full max-w-sm rounded-2xl bg-white shadow-xl p-5 space-y-4', 'admin-modal admin-modal-pad space-y-4 w-full max-w-sm'],
  ['rounded-2xl bg-white p-6 shadow-sm border border-mayssa-brown/5 space-y-5', 'admin-panel admin-panel-pad space-y-5'],
]

function walk(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'ui') files.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.tsx')) files.push(full)
  }
  return files
}

let total = 0
for (const file of walk(adminDir)) {
  if (file.endsWith('AdminUi.tsx') || file.endsWith('AdminShell.tsx')) continue
  let content = fs.readFileSync(file, 'utf8')
  let changed = false
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to)
      changed = true
      total++
    }
  }
  // Order cards with dynamic border-l
  const orderCardRe = /bg-white rounded-2xl p-4 shadow-md border border-mayssa-brown\/5 border-l-4/g
  if (orderCardRe.test(content)) {
    content = content.replace(orderCardRe, 'admin-order-card border-l-4')
    changed = true
    total++
  }
  if (changed) fs.writeFileSync(file, content)
}

console.log(`Admin v2 migrate: ${total} pattern replacements`)
