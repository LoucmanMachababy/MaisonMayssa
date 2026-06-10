import { Suspense } from 'react'
import { Helmet } from 'react-helmet-async'
import { lazyWithRetry } from '../lib/lazyWithRetry'
import { PremiumPageIntro } from '../components/layout/PremiumEditorial'

const LegalPagesSections = lazyWithRetry(() =>
  import('../components/LegalPages').then((m) => ({ default: m.default })),
)

export default function PremiumLegalPage() {
  return (
    <>
      <Helmet>
        <title>Mentions légales — Maison Mayssa</title>
        <meta
          name="description"
          content="Mentions légales, politique de confidentialité et informations légales Maison Mayssa, pâtisserie artisanale à Annecy."
        />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-[104px] pb-24">
        <PremiumPageIntro
          eyebrow="Informations"
          title="Mentions légales"
          subtitle="Politique de confidentialité, conditions et questions fréquentes."
        />
        <Suspense fallback={<div className="text-center text-mayssa-brown/60 py-12">Chargement…</div>}>
          <LegalPagesSections />
        </Suspense>
      </div>
    </>
  )
}
