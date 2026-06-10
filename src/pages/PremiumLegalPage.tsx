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
        <title>CGV &amp; mentions légales — Maison Mayssa</title>
        <meta
          name="description"
          content="Conditions générales de vente, mentions légales et politique de confidentialité de Maison Mayssa (GHAZI ROUMAYSSA), pâtisserie artisanale à Annecy."
        />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-[104px] pb-24">
        <PremiumPageIntro
          eyebrow="Informations"
          title="Informations légales"
          subtitle="CGV, mentions légales, confidentialité, accessibilité et questions fréquentes."
        />
        <Suspense fallback={<div className="text-center text-mayssa-brown/60 py-12">Chargement…</div>}>
          <LegalPagesSections />
        </Suspense>
      </div>
    </>
  )
}
