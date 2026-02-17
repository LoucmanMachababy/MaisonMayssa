import type { Order } from './firebase'

function formatDateYyyyMmDd(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-')
  if (!d || !m || !y) return yyyyMmDd
  return `${d}/${m}/${y}`
}

/**
 * Ouvre une fenêtre d'impression avec le bon de commande pour un client donné.
 * L'utilisateur peut imprimer ou enregistrer en PDF.
 */
export function printOrderSlip(order: Order, orderId: string): void {
  const c = order.customer ?? { firstName: '', lastName: '', phone: '' }
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : ''
  const requested =
    order.requestedDate && order.requestedTime
      ? `${formatDateYyyyMmDd(order.requestedDate)} à ${order.requestedTime}`
      : order.requestedDate
        ? formatDateYyyyMmDd(order.requestedDate)
        : '—'
  const mode = order.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'
  const items = order.items ?? []
  const deliveryFee = order.deliveryFee ?? 0
  const discount = order.discountAmount ?? 0
  const referralDiscount = order.referralDiscountAmount ?? 0
  const totalDiscount = discount + referralDiscount
  const donation = order.donationAmount ?? 0
  const total = order.total ?? 0

  const rows = items
    .map(
      (i) =>
        `<tr>
          <td>${i.quantity}</td>
          <td>${escapeHtml(i.name)}</td>
          <td style="text-align:right">${(i.price * i.quantity).toFixed(2).replace('.', ',')} €</td>
        </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Bon de commande ${escapeHtml(c.firstName + ' ' + c.lastName)} - Maison Mayssa</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 12px; color: #333; max-width: 600px; margin: 0 auto; padding: 16px; }
    h1 { font-size: 18px; margin: 0 0 8px 0; color: #5b3a29; }
    .sub { font-size: 11px; color: #666; margin-bottom: 20px; }
    section { margin-bottom: 16px; }
    .label { font-weight: 700; color: #5b3a29; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #fef5ec; font-size: 11px; }
    .total-row { font-weight: 700; background: #fef5ec; }
    .footer { margin-top: 24px; font-size: 10px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Bon de commande</h1>
  <p class="sub">Maison Mayssa – Trompe l'œil Annecy</p>

  <section>
    <p><span class="label">N° commande :</span> ${order.orderNumber != null ? `#${order.orderNumber}` : escapeHtml(orderId)}</p>
    <p><span class="label">Date de commande :</span> ${escapeHtml(createdAt)}</p>
  </section>

  <section>
    <p class="label">Client</p>
    <p>${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</p>
    <p>Tél. ${escapeHtml(c.phone)}</p>
    ${c.address ? `<p>Adresse : ${escapeHtml(c.address)}</p>` : ''}
    ${c.deliveryInstructions ? `<p>Instructions livraison : ${escapeHtml(c.deliveryInstructions)}</p>` : ''}
  </section>

  <section>
    <p><span class="label">Mode :</span> ${mode}</p>
    <p><span class="label">Date / heure souhaitée :</span> ${requested}</p>
    ${order.clientNote ? `<p><span class="label">Note client :</span> ${escapeHtml(order.clientNote)}</p>` : ''}
  </section>

  <table>
    <thead>
      <tr><th>Qté</th><th>Article</th><th style="text-align:right">Montant</th></tr>
    </thead>
    <tbody>
      ${rows}
      ${deliveryFee > 0 ? `<tr><td colspan="2">Frais de livraison</td><td style="text-align:right">+${deliveryFee.toFixed(2).replace('.', ',')} €</td></tr>` : ''}
      ${totalDiscount > 0 ? `<tr><td colspan="2">Réduction</td><td style="text-align:right">-${totalDiscount.toFixed(2).replace('.', ',')} €</td></tr>` : ''}
      ${donation > 0 ? `<tr><td colspan="2">Don projet</td><td style="text-align:right">+${donation.toFixed(2).replace('.', ',')} €</td></tr>` : ''}
      <tr class="total-row"><td colspan="2">Total</td><td style="text-align:right">${total.toFixed(2).replace('.', ',')} €</td></tr>
    </tbody>
  </table>

  ${order.adminNote ? `<p style="font-size:10px;color:#666;"><span class="label">Note admin :</span> ${escapeHtml(order.adminNote)}</p>` : ''}

  <div class="footer">
    Maison Mayssa – Pâtisserie artisanale – Annecy<br />
    Contact : 06 19 87 10 05 – WhatsApp
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`

  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) {
    alert('Autorisez les pop-ups pour imprimer le bon de commande.')
    return
  }
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: string): string {
  const el = document.createElement('div')
  el.textContent = s
  return el.innerHTML
}
