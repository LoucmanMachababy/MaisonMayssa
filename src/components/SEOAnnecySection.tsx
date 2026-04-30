import { motion } from 'framer-motion'

export function SEOAnnecySection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mt-16 sm:mt-24 max-w-5xl mx-auto px-6 lg:px-0"
    >
      <div className="bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-[0_10px_40px_rgba(212,175,55,0.05)] border border-mayssa-gold/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-mayssa-gold/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-mayssa-brown/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-mayssa-brown leading-tight tracking-tight">
              Pâtisserie Artisanale & Trompe-l'œil à Annecy
            </h2>
            <div className="w-12 h-[1px] bg-mayssa-gold/50" />
            <div className="space-y-4 font-light text-mayssa-brown/70 leading-relaxed text-sm sm:text-base">
              <p>
                Maison Mayssa est votre destination privilégiée pour déguster des <strong>pâtisseries haut de gamme</strong> sur le bassin annécien. Notre spécialité ? L'art subtil du <em>trompe-l'œil</em>, une illusion visuelle parfaite cachant des saveurs intenses et délicates.
              </p>
              <p>
                Chaque création est confectionnée à la main avec des ingrédients sélectionnés pour leur qualité exceptionnelle. De nos noisettes torréfiées à nos pralinés fondants, nous mettons tout notre savoir-faire au service de vos moments de gourmandise.
              </p>
              <p>
                Profitez de notre service de <strong>livraison de nuit à Annecy</strong> et ses alentours, de 18h30 à 2h du matin, pour satisfaire toutes vos envies de desserts artisanaux.
              </p>
            </div>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-square shadow-xl ring-1 ring-mayssa-gold/20">
            <img 
              src="/Trompe-loeil-header.webp" 
              alt="Artisan Pâtissier Annecy - Trompe l'œil Noisette" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6">
              <p className="text-white font-display text-lg font-medium tracking-wide">Excellence & Savoir-Faire</p>
              <p className="text-white/80 text-xs uppercase tracking-widest font-bold mt-1">Savoie (74)</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
