import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const TESTIMONIALS = [
  {
    text: 'Trop bons les brownies ! On en reprend à chaque fois.',
    author: 'Léa',
  },
  {
    text: 'Service au top et livraison rapide. Les layer cups sont une tuerie.',
    author: 'Thomas',
  },
  {
    text: 'Enfin des vrais goûts, faits maison. Merci Maison Mayssa !',
    author: 'Sarah',
  },
]

export function Testimonials() {
  return (
    <motion.section
      id="temoignages"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-12 sm:mt-16 md:mt-24"
    >
      <div className="section-shell bg-white/80 border border-mayssa-brown/5">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
            Ils en parlent
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-mayssa-brown mt-2">
            Témoignages
          </h2>
        </div>
        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative rounded-2xl bg-mayssa-soft/60 p-5 sm:p-6 border border-mayssa-brown/5"
            >
              <Quote className="absolute top-3 right-3 w-8 h-8 text-mayssa-caramel/30" />
              <p className="text-sm sm:text-base text-mayssa-brown/80 italic leading-relaxed pr-8">
                « {t.text} »
              </p>
              <footer className="mt-4 text-xs sm:text-sm font-semibold text-mayssa-caramel">
                — {t.author}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
