import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { Cart } from './components/Cart'
import { Footer } from './components/Footer'
import { ToastContainer, type Toast } from './components/Toast'
import { PromoBanner } from './components/PromoBanner'
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton'
import { Testimonials } from './components/Testimonials'
import { ConfidentialiteSection, MentionsLegalesSection } from './components/LegalPages'

const SizeSelectorModal = lazy(() => import('./components/SizeSelectorModal').then(m => ({ default: m.SizeSelectorModal })))
const TiramisuCustomizationModal = lazy(() => import('./components/TiramisuCustomizationModal').then(m => ({ default: m.TiramisuCustomizationModal })))
const BoxCustomizationModal = lazy(() => import('./components/BoxCustomizationModal').then(m => ({ default: m.BoxCustomizationModal })))
import { PRODUCTS, PHONE_E164 } from './constants'
import type {
  Product,
  ProductSize,
  CartItem,
  Channel,
  ProductCategory,
  CustomerInfo,
} from './types'
import { Sparkles, Search, X, ChevronRight } from 'lucide-react'

function App() {
  // Load cart from localStorage on mount
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('maison-mayssa-cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('maison-mayssa-cart', JSON.stringify(cart))
  }, [cart])

  const [note, setNote] = useState('')
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'Tous'>('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [customer, setCustomer] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    wantsDelivery: false,
    date: '',
    time: '',
  })
  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null)
  const [selectedProductForTiramisu, setSelectedProductForTiramisu] = useState<Product | null>(null)
  const [selectedProductForBox, setSelectedProductForBox] = useState<Product | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: Toast['type'] = 'success', duration?: number) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const lastActivity = useRef(Date.now())
  const reminderShown = useRef(false)
  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now() }
    window.addEventListener('mousemove', bump)
    window.addEventListener('keydown', bump)
    window.addEventListener('scroll', bump)
    window.addEventListener('click', bump)
    const id = setInterval(() => {
      if (reminderShown.current || cart.length === 0) return
      if (Date.now() - lastActivity.current < 2 * 60 * 1000) return
      reminderShown.current = true
      showToast('Tu as encore des articles dans ton panier. Scrollez vers « Voir la commande » pour finaliser.', 'info', 6000)
    }, 60 * 1000)
    return () => {
      window.removeEventListener('mousemove', bump)
      window.removeEventListener('keydown', bump)
      window.removeEventListener('scroll', bump)
      window.removeEventListener('click', bump)
      clearInterval(id)
    }
  }, [cart.length])

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  )

  const categories = useMemo(() => {
    const cats = Array.from(new Set(PRODUCTS.map((p) => p.category)))
    return ['Tous', ...cats] as const
  }, [])

  const filteredProducts = useMemo(() => {
    let filtered = PRODUCTS

    // Filter by category
    if (activeCategory !== 'Tous') {
      filtered = filtered.filter((p) => p.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((p) => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activeCategory, searchQuery])

  const handleAddToCart = (product: Product) => {
    // If product is a Tiramisu, open customization modal
    if (product.category === 'Tiramisus') {
      setSelectedProductForTiramisu(product)
      return
    }

    // If product is a Mini Gourmandise (box), open box customization modal
    if (product.category === 'Mini Gourmandises' || product.id === 'mini-box-mixte') {
      setSelectedProductForBox(product)
      return
    }

    // If product has sizes (like Layer Cups), open size selector modal
    if (product.sizes && product.sizes.length > 0) {
      setSelectedProductForSize(product)
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        const updated = current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        showToast(`${product.name} ajouté au panier (quantité: ${existing.quantity + 1})`, 'success')
        return updated
      }
      showToast(`${product.name} ajouté au panier`, 'success')
      return [...current, { product, quantity: 1 }]
    })
  }

  const handleSizeSelect = (product: Product, size: ProductSize) => {
    // Create a cart item with the specific size
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}`,
      name: `${product.name} (${size.label})`,
      price: size.price,
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === cartProduct.id)
      if (existing) {
        const updated = current.map((item) =>
          item.product.id === cartProduct.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        showToast(`${cartProduct.name} ajouté au panier (quantité: ${existing.quantity + 1})`, 'success')
        return updated
      }
      showToast(`${cartProduct.name} ajouté au panier`, 'success')
      return [...current, { product: cartProduct, quantity: 1 }]
    })

    setSelectedProductForSize(null)
  }

  const handleTiramisuCustomization = (
    product: Product,
    size: ProductSize,
    base: string,
    allToppings: string[]
  ) => {
    // Les 2 premiers sont inclus, les suivants sont payants
    const extraToppings = Math.max(0, allToppings.length - 2)
    const extraPrice = extraToppings * 0.5
    const totalPrice = size.price + extraPrice

    // Create a detailed name with all customizations
    const toppingsText = allToppings.join(', ')
    const extraText = extraToppings > 0 ? ` (${extraToppings} supp. +${extraPrice.toFixed(2).replace('.', ',')}€)` : ''
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}-${Date.now()}`,
      name: `${size.label}`,
      description: `Base: ${base} • Toppings: ${toppingsText}${extraText}`,
      price: totalPrice,
    }

    setCart((current) => {
      showToast(`${cartProduct.name} ajouté au panier`, 'success')
      return [...current, { product: cartProduct, quantity: 1 }]
    })

    setSelectedProductForTiramisu(null)
  }

  const handleBoxCustomization = (
    product: Product,
    size: ProductSize,
    coulis: string[]
  ) => {
    // Determine if it's petite or grande
    const isMixte = product.id === 'mini-box-mixte'
    const isPetite = product.sizes && product.sizes[0]?.ml === size.ml
    const coulisInclus = isMixte ? 4 : (isPetite ? 2 : 4)
    const extraCoulis = Math.max(0, coulis.length - coulisInclus)
    const extraPrice = extraCoulis * 0.5
    const totalPrice = size.price + extraPrice

    // Create a detailed name with all customizations
    const coulisText = coulis.join(', ')
    const extraText = extraCoulis > 0 ? ` (+${extraCoulis} supp.)` : ''
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}-${Date.now()}`,
      name: `${product.name} - ${size.label}`,
      description: `Coulis: ${coulisText}${extraText}`,
      price: totalPrice,
    }

    setCart((current) => {
      showToast(`${cartProduct.name} ajouté au panier`, 'success')
      return [...current, { product: cartProduct, quantity: 1 }]
    })

    setSelectedProductForBox(null)
  }

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.product.id !== id))
      return
    }
    setCart((current) =>
      current.map((item) =>
        item.product.id === id ? { ...item, quantity: Math.min(quantity, 99) } : item,
      ),
    )
  }

  const buildOrderMessage = () => {
    if (cart.length === 0) return ''

    const deliveryFee = customer.wantsDelivery && total < 30 ? 5 : 0
    const finalTotal = total + deliveryFee
    const modeTexte = customer.wantsDelivery ? 'Livraison' : 'Retrait sur place'

    const lines: string[] = []
    lines.push(
      'Bonjour Maison Mayssa',
      '',
      "Je souhaiterais passer une commande, voici les détails :",
      '',
      '*INFORMATIONS CLIENT*',
      `- Nom : ${customer.lastName || '[à compléter]'}`,
      `- Prénom : ${customer.firstName || '[à compléter]'}`,
      `- Téléphone : ${customer.phone || '[à compléter]'}`,
      `- Mode : ${modeTexte}`,
    )

    if (customer.wantsDelivery && customer.address.trim()) {
      lines.push(`- Adresse : ${customer.address.trim()}`)
    }

    if (customer.date && customer.time) {
      const dateObj = new Date(customer.date)
      const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      lines.push(`- Date souhaitée : ${dateFormatted}`)
      lines.push(`- Heure souhaitée : ${customer.time}`)
    }

    lines.push('', '*COMMANDE*')

    for (const item of cart) {
      const itemTotal = item.product.price * item.quantity
      const unitPrice = item.product.price.toFixed(2).replace('.', ',')
      const totalPrice = itemTotal.toFixed(2).replace('.', ',')
      if (item.quantity > 1) {
        lines.push(`• ${item.quantity}x ${item.product.name} – ${unitPrice}€ × ${item.quantity} = ${totalPrice}€`)
      } else {
        lines.push(`• ${item.product.name} – ${unitPrice}€`)
      }
    }

    lines.push('', `Sous-total : ${total.toFixed(2)} €`)

    if (customer.wantsDelivery) {
      if (deliveryFee > 0) {
        lines.push(
          `Livraison Annecy & alentours : +5 € (commande inférieure à 30 €)`,
          `Total avec livraison : ${finalTotal.toFixed(2)} €`,
        )
      } else {
        lines.push(
          'Livraison OFFERTE dès 30 € d’achat (commande ≥ 30 €).',
          `Total avec livraison : ${finalTotal.toFixed(2)} €`,
        )
      }
    } else {
      lines.push(`Total à régler : ${total.toFixed(2)} €`)
    }

    lines.push('')

    if (note.trim() && note.trim() !== 'Pour le … (date, créneau, adresse)') {
      lines.push('*INFOS COMPLÉMENTAIRES :*', note.trim(), '')
      lines.push('')
    }

    lines.push(
      'Merci beaucoup, à très vite !',
      '– Message envoyé depuis le site de précommande Maison Mayssa',
    )

    return lines.join('\n')
  }

  const handleSend = () => {
    const message = buildOrderMessage()
    if (!message) return

    const encoded = encodeURIComponent(message)

    if (channel === 'whatsapp') {
      window.open(`https://wa.me/${PHONE_E164}?text=${encoded}`, '_blank')
      showToast('Commande envoyée sur WhatsApp !', 'success')
    } else {
      navigator.clipboard?.writeText(message).then(() => {
        const url = channel === 'instagram'
          ? 'https://www.instagram.com/maison.mayssa74/'
          : 'https://www.snapchat.com/add/mayssasucree74'
        window.open(url, '_blank')
        showToast('Commande copiée ! Collez-la dans la discussion.', 'success')
      }).catch(() => {
        showToast('Erreur lors de la copie de la commande', 'error')
      })
    }
  }

  return (
    <div className="min-h-screen bg-mayssa-soft selection:bg-mayssa-caramel/30 font-sans overflow-x-hidden">
      <Navbar />

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mayssa-rose/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-mayssa-caramel/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 md:py-24 sm:px-6 lg:px-8 overflow-x-hidden">
        <PromoBanner />
        <Header />

        <main className="mt-8 sm:mt-12 grid gap-8 sm:gap-12 lg:grid-cols-[1fr_minmax(340px,400px)] lg:items-start">
          {/* Menu Section */}
          <motion.section 
            id="la-carte" 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-10 min-w-0"
          >
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-mayssa-caramel">
                  <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Carte Maison</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-mayssa-brown text-glow">
                  Nos Douceurs
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-10 py-2.5 rounded-xl bg-white/60 border border-mayssa-brown/10 text-sm text-mayssa-brown placeholder-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40 hover:text-mayssa-brown transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat as any)}
                      className={`whitespace-nowrap rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer flex-shrink-0 ${activeCategory === cat
                        ? 'bg-mayssa-brown text-white shadow-lg shadow-mayssa-brown/20 -translate-y-1'
                        : 'bg-white/60 text-mayssa-brown hover:bg-white hover:scale-105 hover:shadow-md active:scale-95'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Hint that it scrolls horizontally (desktop only, outside the last pill) */}
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-mayssa-cream to-transparent hidden sm:block" />
                <div className="pointer-events-none hidden sm:flex items-center absolute top-1/2 -translate-y-1/2 right-0 translate-x-full">
                  <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm border border-mayssa-brown/10">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-mayssa-brown/60">
                      Glisser
                    </span>
                    <ChevronRight className="w-3 h-3 text-mayssa-brown/60" />
                  </div>
                </div>
              </div>
              <p className="mt-1 text-[10px] sm:hidden text-mayssa-brown/45">
                Faites glisser horizontalement pour voir toutes les catégories →
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <p className="text-mayssa-brown/60 text-sm sm:text-base">
                  Aucun produit trouvé{searchQuery && ` pour "${searchQuery}"`}.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-mayssa-caramel hover:text-mayssa-brown text-sm font-semibold underline"
                  >
                    Réinitialiser la recherche
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAddToCart}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.section>

          {/* Cart Section */}
          <section id="commande" className="relative min-w-0">
            <Cart
              items={cart}
              total={total}
              note={note}
              channel={channel}
              customer={customer}
              onUpdateQuantity={handleUpdateQuantity}
              onNoteChange={setNote}
              onChannelChange={setChannel}
              onCustomerChange={setCustomer}
              onSend={handleSend}
            />
          </section>
        </main>

        {/* Notre histoire */}
        <motion.section
          id="notre-histoire"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 sm:mt-16 md:mt-24 section-shell bg-white/80 border border-mayssa-brown/5 premium-shadow"
        >
          <div className="grid gap-6 sm:gap-8 md:grid-cols-[1.4fr_minmax(0,1fr)] items-start">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-brown/60">
                Notre histoire
              </p>
              <h2 className="text-2xl sm:text-3xl font-display text-mayssa-brown">
                Une cuisine de cœur, née à la maison
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Maison Mayssa est née d&apos;une grande passion pour la cuisine, les desserts
                généreux et les tables chaleureuses que l&apos;on partage en famille ou entre amis.
                Derrière chaque création se cache une personne discrète mais profondément
                passionnée, qui préfère rester en retrait et laisser ses douceurs parler pour elle.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Au fil des années, les proches, voisins et amis ont commencé à commander de plus en
                plus de brownies, cookies et autres gourmandises. C&apos;est ainsi qu&apos;est née
                l&apos;envie de proposer un vrai service de précommande, tout en gardant l&apos;esprit
                maison : des recettes faites avec soin, des ingrédients choisis, et une attention
                particulière portée aux détails.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Pendant le mois de Ramadan, Maison Mayssa prépare également des assortiments
                spécialement pensés pour accompagner les tables du ftour et de la soirée :
                mini-gourmandises, box partagées, douceurs réconfortantes à savourer après une
                journée de jeûne. Toujours dans le même esprit&nbsp;: fait maison, généreux, et
                pensé pour faire plaisir.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl bg-mayssa-soft/70 p-4 sm:p-5 border border-mayssa-brown/10">
              <h3 className="font-display text-base sm:text-lg text-mayssa-brown">
                Les valeurs de Maison Mayssa
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-mayssa-brown/80">
                <li>• Des recettes maison, testées et approuvées au fil du temps</li>
                <li>• Une carte courte mais travaillée, pour garantir la qualité</li>
                <li>• Des portions généreuses, comme à la maison</li>
                <li>• Un service de précommande simple, par WhatsApp ou réseaux</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Zone géographique & infos pratiques */}
        <motion.section
          id="livraison"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="mt-12 sm:mt-16 section-shell bg-mayssa-soft/80 border border-mayssa-brown/5"
        >
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-brown/60">
                Zone géographique
              </p>
              <h2 className="text-xl sm:text-2xl font-display text-mayssa-brown">
                Où livre Maison Mayssa&nbsp;?
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Les commandes sont préparées à Annecy. La livraison est proposée sur Annecy et
                proches alentours, avec un forfait de 5&nbsp;€ pour les commandes inférieures à
                30&nbsp;€. À partir de 30&nbsp;€ d&apos;achat, la livraison est offerte sur la zone
                habituelle.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Pour les secteurs un peu plus éloignés autour d&apos;Annecy (autres communes du
                bassin annécien), la livraison peut être étudiée au cas par cas directement par
                message, en fonction du jour et du montant de la commande.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl bg-white/80 p-4 sm:p-5 border border-mayssa-brown/10">
              <h3 className="font-display text-base sm:text-lg text-mayssa-brown">Infos pratiques</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-mayssa-brown/80">
                <li>• Service de 18h30 à 2h du matin</li>
                <li>• Livraison Annecy & alentours</li>
                <li>• Livraison offerte dès 30&nbsp;€ d&apos;achat</li>
                <li>• Précommande uniquement, pas de paiement en ligne</li>
                <li>• Règlement à la livraison ou au retrait</li>
              </ul>
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-mayssa-brown/60">
                Pour toute question sur la zone de livraison ou un besoin particulier (grosse
                commande, événement, Ramadan, etc.), le plus simple est d&apos;envoyer un message
                directement via WhatsApp, Instagram ou Snapchat.
              </p>
            </div>
          </div>
        </motion.section>

        <Testimonials />
        <ConfidentialiteSection />
        <MentionsLegalesSection />
        <Footer />
      </div>

      <WhatsAppFloatingButton />

      {/* Modals (lazy-loaded) */}
      <Suspense fallback={null}>
        <SizeSelectorModal
          product={selectedProductForSize}
          onClose={() => setSelectedProductForSize(null)}
          onSelect={handleSizeSelect}
        />
        <TiramisuCustomizationModal
          product={selectedProductForTiramisu}
          onClose={() => setSelectedProductForTiramisu(null)}
          onSelect={handleTiramisuCustomization}
        />
        <BoxCustomizationModal
          product={selectedProductForBox}
          onClose={() => setSelectedProductForBox(null)}
          onSelect={handleBoxCustomization}
        />
      </Suspense>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
