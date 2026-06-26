import { useMemo, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useProductAddFlow } from '../hooks/useProductAddFlow'
import { useProducts } from '../hooks/useProducts'
import { ProductAddModals } from '../components/product/ProductAddModals'
import { ProductAllergensBlock } from '../components/product/ProductAllergensBlock'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { MenuSidebarSearch } from '../components/menu/MenuSidebarSearch'
import { LIFESTYLE, CATALOG_MOSAIC_PANELS, CATEGORY_HEADER_IMAGES } from '../lib/decorativeAssets'

const CATEGORIES = [
  { id: 'tout', label: 'Tout' },
  { id: 'patisseries', label: 'Nos trompe-l\'œil' },
  { id: 'jus', label: 'Nos jus frais' },
  { id: 'sale', label: 'Le salé' },
  { id: 'canette-cake', label: 'Canette Cake' },
  { id: 'fruits', label: 'Fruits frais' },
  { id: 'candy-fruit', label: 'Candy Fruit Chez Mima' },
  { id: 'chocolaterie', label: 'Chocolaterie' },
  { id: 'boxes', label: 'Boxes' },
]

const CATEGORY_MAPPING: Record<string, string[]> = {
  'patisseries': ['Nos trompe-l\'œil'],
  'jus': ['Nos jus frais'],
  'sale': ['Le salé'],
  'canette-cake': ['Canette Cake'],
  'fruits': ['Fruits frais'],
  'candy-fruit': ['Candy Fruit'],
  'chocolaterie': ['Chocolaterie'],
  'boxes': ['Boxes'],
}

const MOSAIC_PANELS = CATALOG_MOSAIC_PANELS

const CATEGORY_HEADER_LABELS: Record<string, string> = {
  tout: 'Toutes nos créations',
  patisseries: 'Nos trompe-l\'œil',
  jus: 'Nos jus frais',
  sale: 'Le salé',
  'canette-cake': 'Canette Cake',
  fruits: 'Fruits frais',
  'candy-fruit': 'Candy Fruit Chez Mima',
  chocolaterie: 'Chocolaterie',
  boxes: 'Boxes',
}

function MosaicPanel({ src, hover, index }: { src: string; hover?: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex-1 overflow-hidden origin-bottom group border-r border-white/[0.06] last:border-r-0"
    >
      <motion.div
        animate={{ y: [0, -10, 0, 6, 0] }}
        transition={{
          duration: 12 + index * 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: index * 0.4,
        }}
        className="relative w-full h-[115%] -mt-[7%]"
      >
        <motion.img
          src={src}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-700 ${hover ? 'group-hover:opacity-0' : ''}`}
          style={{ objectPosition: 'center 30%' }}
          animate={{ scale: [1.08, 1.16, 1.08] }}
          transition={{
            duration: 14 + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.5,
          }}
        />
        {hover && (
          <img
            src={hover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-105 group-hover:scale-100"
            style={{ objectPosition: 'center 30%' }}
          />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-mayssa-gold/0 group-hover:bg-mayssa-gold/10 transition-colors duration-700 pointer-events-none z-[1]" />
      <motion.div
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 1.2, ease: 'easeInOut' }}
        className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-mayssa-gold/40 to-transparent pointer-events-none"
      />
    </motion.div>
  )
}

export default function PremiumMenu() {
  const addFlow = useProductAddFlow()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentCategory = searchParams.get('categorie') || 'tout'
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const headerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: headerRef,
    offset: ['start start', 'end start'],
  })
  const mosaicY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 0.92, 0.75])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 40, damping: 18 })
  const springY = useSpring(mouseY, { stiffness: 40, damping: 18 })
  const tiltX = useTransform(springY, [-15, 15], [2, -2])
  const tiltY = useTransform(springX, [-25, 25], [-2.5, 2.5])

  const handleHeaderMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = headerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x * 28)
    mouseY.set(y * 16)
  }

  const handleHeaderMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleCategoryChange = (categoryId: string) => {
    const next = new URLSearchParams(searchParams)
    if (categoryId === 'tout') {
      next.delete('categorie')
    } else {
      next.set('categorie', categoryId)
    }
    setSearchParams(next)
  }

  const handleSearchChange = (value: string) => {
    const next = new URLSearchParams(searchParams)
    const trimmed = value.trim()
    if (trimmed) next.set('q', trimmed)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const { catalogProducts } = useProducts()

  const filteredProducts = useMemo(() => {
    let products = catalogProducts

    if (currentCategory !== 'tout') {
      const mappedCategories = CATEGORY_MAPPING[currentCategory]
      if (mappedCategories) {
        products = products.filter(p => mappedCategories.includes(p.category))
      }
    }

    if (searchQuery) {
      const q = searchQuery
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
      products = products.filter((p) => {
        const name = p.name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
        const category = p.category.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
        const description = (p.description ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
        return name.includes(q) || category.includes(q) || description.includes(q)
      })
    }

    return products
  }, [catalogProducts, currentCategory, searchQuery])

  const displayProducts = useMemo(() => {
    const candyIds = ['candy-fruit-box', 'candy-fruit-canette', 'candy-fruit-sauce']
    if (currentCategory === 'candy-fruit') {
      return [...filteredProducts].sort(
        (a, b) => candyIds.indexOf(a.id) - candyIds.indexOf(b.id),
      )
    }
    if (currentCategory === 'tout') {
      const candy = filteredProducts.filter((p) => candyIds.includes(p.id))
      const rest = filteredProducts.filter((p) => !candyIds.includes(p.id))
      return [...candy, ...rest]
    }
    return filteredProducts
  }, [filteredProducts, currentCategory])

  return (
    <div className="min-h-screen bg-mayssa-soft pb-32 pt-[88px] lg:pt-[104px]">
      <Helmet>
        <title>La carte — Maison Mayssa | Pâtisseries trompe-l&apos;œil à Annecy</title>
        <meta
          name="description"
          content="Découvrez la carte Maison Mayssa : trompe-l'œil, canette cakes, cups de fruits, chocolaterie, salé et boxes. Précommande en ligne, livraison & retrait à Annecy, Seynod, Annecy-le-Vieux et tout le bassin annécien."
        />
        <link rel="canonical" href="https://maison-mayssa.fr/carte" />
      </Helmet>
      <ProductAddModals flow={addFlow} />
      {/* Header Section */}
      <motion.div
        ref={headerRef}
        style={{ opacity: headerOpacity, perspective: 1200 }}
        onMouseMove={handleHeaderMouseMove}
        onMouseLeave={handleHeaderMouseLeave}
        className="relative w-full overflow-hidden mb-12 mt-4 min-h-[320px] md:min-h-[380px]"
      >
        {/* Background — mosaïque multi-catégories ou visuel par catégorie */}
        {currentCategory === 'tout' ? (
          <motion.div
            style={{ y: mosaicY, x: springX, rotateX: tiltX, rotateY: tiltY }}
            className="absolute inset-0 flex scale-105"
          >
            {MOSAIC_PANELS.map((panel, i) => (
              <MosaicPanel key={panel.src} src={panel.src} hover={panel.hover} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.img
            src={CATEGORY_HEADER_IMAGES[currentCategory] ?? LIFESTYLE.catalogSpread}
            alt={CATEGORY_HEADER_LABELS[currentCategory] ?? 'La carte Maison Mayssa'}
            style={{ y: mosaicY }}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
        )}

        {/* Warm ambient glow */}
        <motion.div
          animate={{ opacity: [0.12, 0.28, 0.12], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/3 left-1/4 w-1/3 h-2/3 bg-mayssa-gold/30 blur-[80px] rounded-full pointer-events-none z-[2]"
        />
        <motion.div
          animate={{ opacity: [0.08, 0.2, 0.08], scale: [1, 1.12, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-1/4 right-1/5 w-1/4 h-1/2 bg-mayssa-caramel/25 blur-[60px] rounded-full pointer-events-none z-[2]"
        />

        {/* Overlay — breathing opacity */}
        <motion.div
          animate={{ opacity: [0.72, 0.8, 0.72] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-mayssa-espresso/75 z-[3]"
        />
        <motion.div
          animate={{ opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-mayssa-espresso via-transparent to-mayssa-espresso/50 z-[3]"
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 z-[4] pointer-events-none opacity-[0.035] mix-blend-overlay animate-[grain-shift_8s_ease-in-out_infinite]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* Light sweep — initial + recurring */}
        <motion.div
          initial={{ x: '-120%', opacity: 0 }}
          animate={{ x: '220%', opacity: [0, 0.35, 0] }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 z-[5] pointer-events-none bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
        />
        <motion.div
          animate={{ x: ['-120%', '220%'], opacity: [0, 0.2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 9, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0 z-[5] pointer-events-none bg-gradient-to-r from-transparent via-mayssa-gold-light/20 to-transparent skew-x-12"
        />

        {/* Content */}
        <div className="relative z-10 py-28 md:py-36 px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-6 block"
          >
            <motion.span
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="inline-block"
            >
              Maison Mayssa
            </motion.span>
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{
              opacity: 1,
              y: 0,
              textShadow: [
                '0 0 0px rgba(197,160,89,0)',
                '0 0 50px rgba(197,160,89,0.18)',
                '0 0 0px rgba(197,160,89,0)',
              ],
            }}
            transition={{
              opacity: { duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] },
              textShadow: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
            }}
            className="font-display text-5xl md:text-7xl lg:text-8xl text-white mb-6 tracking-tight"
          >
            La Carte
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-20 h-px mx-auto mb-8 relative overflow-hidden origin-center"
          >
            <div className="absolute inset-0 bg-mayssa-gold/60" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-mayssa-gold-light to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="text-white/70 max-w-xl mx-auto font-light text-base md:text-lg leading-relaxed"
          >
            Découvrez nos créations artisanales.<br className="hidden sm:block" />
            Précommandez en ligne et retirez sur le créneau de votre choix.
          </motion.p>
        </div>
      </motion.div>

      {/* Filters & Grid Container */}
      <div className="max-w-[1600px] mx-auto px-6">
        {searchQuery && (
          <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-mayssa-brown/10 mb-8">
            <p className="text-sm text-mayssa-brown/70">
              Résultats pour « <span className="text-mayssa-brown font-medium">{searchQuery}</span> »
              {' '}· {displayProducts.length} produit{displayProducts.length > 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                searchParams.delete('q')
                setSearchParams(searchParams)
              }}
              className="text-[10px] tracking-widest uppercase text-mayssa-gold hover:text-mayssa-brown cursor-pointer"
            >
              Effacer la recherche
            </button>
          </div>
        )}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="sticky top-[120px] space-y-4">
            <MenuSidebarSearch
              value={searchParams.get('q') ?? ''}
              onChange={handleSearchChange}
            />
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-4 lg:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`text-left px-4 py-3 text-xs tracking-[0.2em] uppercase transition-all whitespace-nowrap ${
                    currentCategory === cat.id 
                      ? 'bg-mayssa-brown text-white' 
                      : 'text-mayssa-brown/60 hover:bg-mayssa-soft hover:text-mayssa-brown'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16"
          >
            <AnimatePresence mode="popLayout">
              {displayProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="group flex flex-col h-full"
                >
                  <Link to={`/produit/${product.id}`} className="block relative aspect-[4/5] mb-6 overflow-hidden bg-mayssa-marble">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${product.images && product.images.length > 1 ? 'group-hover:opacity-0' : ''}`}
                      loading="lazy"
                    />
                    {product.images && product.images.length > 1 && (
                      <img 
                        src={product.images[1]} 
                        alt={`${product.name} vue 2`} 
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100"
                        loading="lazy"
                      />
                    )}
                    {product.badges && product.badges.includes('nouveau') && product.available && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-mayssa-gold text-white px-3 py-1 text-[10px] tracking-[0.2em] uppercase">
                          Nouveau
                        </span>
                      </div>
                    )}
                  </Link>
                  
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="font-display text-2xl text-mayssa-brown">{product.name}</h3>
                    <span className="text-lg text-mayssa-brown/80 whitespace-nowrap">{product.price.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  
                  <p className="text-mayssa-brown/50 text-sm font-light leading-relaxed mb-3 flex-grow line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mb-6">
                    <ProductAllergensBlock productId={product.id} category={product.category} compact />
                  </div>
                  
                  {product.available ? (
                    <button 
                      type="button"
                      onClick={() => addFlow.tryAddProduct(product, 1)}
                      className="w-full py-4 border border-mayssa-brown text-mayssa-brown text-[10px] tracking-[0.2em] uppercase hover:bg-mayssa-brown hover:text-white transition-colors duration-500"
                    >
                      Précommander
                    </button>
                  ) : (
                    <button disabled className="w-full py-4 bg-mayssa-brown/5 text-mayssa-brown/40 text-[10px] tracking-[0.2em] uppercase cursor-not-allowed">
                      Bientôt disponible
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {displayProducts.length === 0 && (
            <div className="text-center py-32">
              <p className="text-mayssa-brown/50 text-lg">
                {searchQuery
                  ? `Aucun produit trouvé pour « ${searchQuery} ».`
                  : 'Aucun produit ne correspond à cette catégorie pour le moment.'}
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      <TrompeLoeilMarquee variant="dark" />
    </div>
  )
}
