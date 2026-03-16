#!/usr/bin/env node
/**
 * Script d'optimisation des images pour EcoIndex
 * Compresse les WebP du dossier public (qualité 80, max 800px largeur)
 * Usage: node scripts/optimize-images.mjs
 */
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const publicDir = join(__dirname, '../public')

async function optimizeImages() {
  const files = await readdir(publicDir)
  const imageExts = ['.webp', '.png', '.jpg', '.jpeg']
  
  for (const file of files) {
    const ext = extname(file).toLowerCase()
    if (!imageExts.includes(ext)) continue
    
    const inputPath = join(publicDir, file)
    const info = await stat(inputPath)
    if (!info.isFile()) continue
    
    const base = file.replace(/\.[^/.]+$/, '')
    const outputPath = join(publicDir, `${base}.webp`)
    
    try {
      let pipeline = sharp(inputPath)
      const meta = await pipeline.metadata()
      const width = meta.width || 1200
      
      if (width > 800) {
        pipeline = pipeline.resize(800, null, { withoutEnlargement: true })
      }
      
      await pipeline
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath)
      
      const outInfo = await stat(outputPath)
      const saved = ((1 - outInfo.size / info.size) * 100).toFixed(0)
      console.log(`✓ ${file} → ${base}.webp (${(outInfo.size/1024).toFixed(0)} Ko)`)
    } catch (err) {
      console.warn(`✗ ${file}:`, err.message)
    }
  }
}

optimizeImages().catch(console.error)
