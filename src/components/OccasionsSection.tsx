import { motion } from 'framer-motion'
import { MessageCircle, Cake, Moon, Heart, Building2 } from 'lucide-react'
import { PHONE_E164 } from '../constants'
import { hapticFeedback } from '../lib/haptics'

const OCCASIONS = [
  {
    id: 'anniversaire',
    title: 'Anniversaire',
    icon: Cake,
    description: 'Gâteaux d\'anniversaire, trompes l\'œil personnalisables, box de gourmandises pour souffler les bougies en beauté.',
    message: 'Bonjour, je souhaite commander pour un anniversaire. Pouvez-vous me conseiller sur vos créations (trompes l\'œil, box, parts) ?',
  },
  {
    id: 'ramadan',
    title: 'Ramadan',
    icon: Moon,
    description: 'Assortiments et douceurs pour le ftour et les soirées : mini-gourmandises, box partagées, pâtisseries à savourer après le jeûne.',
    message: 'Bonjour, je souhaite commander pour le Ramadan (ftour / soirée). Quelles box ou assortiments me conseillez-vous ?',
  },
  {
    id: 'mariage',
    title: 'Mariage & événements',
    icon: Heart,
    description: 'Créations pour buffets, sweet tables et événements : trompes l\'œil, layer cups, tiramisus et mini gourmandises en quantité.',
    message: 'Bonjour, je prépare un mariage / un événement et je souhaite commander des pâtisseries (trompes l\'œil, layer cups, etc.). Pouvez-vous me recontacter pour en discuter ?',
  },
  {
    id: 'entreprise',
    title: 'Entreprise',
    icon: Building2,
    description: 'Pause café, séminaire, livraison au bureau : box, cookies, brownies et douceurs pour régaler les équipes.',
    message: 'Bonjour, je souhaite commander pour mon entreprise (pause café, séminaire, livraison bureau). Quelles options proposez-vous ?',
  },
]

export function OccasionsSection() {
  return (
    <motion.section
      id="occasions"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      className="mt-12 sm:mt-16 section-shell bg-white/80 border border-mayssa-brown/5"
    >
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-brown/60 mb-2">
        Commander pour un événement
      </p>
      <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-6">
        Occasions
      </h2>
      <p className="text-sm text-mayssa-brown/70 mb-8 max-w-xl">
        Anniversaire, Ramadan, mariage, entreprise… Dites-nous l&apos;occasion, on vous propose des idées et un devis sur mesure par WhatsApp.
      </p>

      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
        {OCCASIONS.map((occ, i) => {
          const Icon = occ.icon
          return (
            <motion.div
              key={occ.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-mayssa-soft/50 border border-mayssa-brown/10 p-4 sm:p-5 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mayssa-caramel/20 text-mayssa-caramel">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-mayssa-brown text-base sm:text-lg">
                    {occ.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-mayssa-brown/70 mt-1 leading-relaxed">
                    {occ.description}
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent(occ.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => hapticFeedback('medium')}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#20bd5a] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <MessageCircle size={18} />
                Commander pour un {occ.title.toLowerCase()}
              </a>
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
