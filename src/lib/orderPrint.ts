import { jsPDF } from 'jspdf'
import type { Order } from './firebase'
import { getOrderDepositAmount, getOrderRemainingToPay } from './orderAmounts'
import { formatOrderItemName } from './utils'

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
          <td>${escapeHtml(formatOrderItemName(i))}</td>
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
      <tr class="total-row"><td colspan="2">Total TTC</td><td style="text-align:right">${total.toFixed(2).replace('.', ',')} €</td></tr>
      ${
        getOrderDepositAmount(order) > 0
          ? `<tr><td colspan="2">Acompte versé</td><td style="text-align:right">−${getOrderDepositAmount(order).toFixed(2).replace('.', ',')} €</td></tr>`
          : ''
      }
      <tr class="total-row"><td colspan="2">Reste à régler</td><td style="text-align:right">${getOrderRemainingToPay(order).toFixed(2).replace('.', ',')} €</td></tr>
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

/**
 * Génère et télécharge un PDF pour une seule commande.
 * Fonctionne sur mobile (pas de popup bloquée).
 */
export function exportSingleOrderPDF(order: Order, orderId: string): void {
  const doc = new jsPDF({ format: 'a4' })
  const margin = 15
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2
  let y = 20

  const c = order.customer ?? { firstName: '', lastName: '', phone: '' }
  const orderRef = order.orderNumber != null ? `#${order.orderNumber}` : `#${orderId.slice(-8)}`
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : ''
  const requested =
    order.requestedDate && order.requestedTime
      ? `${order.requestedDate.split('-').reverse().join('/')} à ${order.requestedTime}`
      : order.requestedDate
        ? order.requestedDate.split('-').reverse().join('/')
        : '—'
  const mode = order.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'

  // En-tête
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Bon de commande', margin, y)
  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(140, 90, 60)
  doc.text('Maison Mayssa – Pâtisserie artisanale – Annecy', margin, y)
  doc.setTextColor(0, 0, 0)
  y += 10

  // Ligne séparatrice
  doc.setDrawColor(91, 58, 41)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Infos commande
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Commande ${orderRef}`, margin, y)
  if (createdAt) {
    doc.setFont('helvetica', 'normal')
    doc.text(createdAt, pageWidth - margin - 40, y)
  }
  y += 7

  // Client
  const client = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Client'
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(client, margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  if (c.phone) { doc.text(`Tél. ${c.phone}`, margin, y); y += 5 }
  if (c.address) {
    const lines = doc.splitTextToSize(`Adresse : ${c.address}`, maxWidth)
    doc.text(lines, margin, y)
    y += lines.length * 5
  }
  if (c.deliveryInstructions) {
    const lines = doc.splitTextToSize(`Instructions : ${c.deliveryInstructions}`, maxWidth)
    doc.text(lines, margin, y)
    y += lines.length * 5
  }
  y += 4

  // Mode + date
  doc.setFont('helvetica', 'bold')
  doc.text(`Mode : `, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(mode, margin + 18, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Date souhaitée : `, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(requested, margin + 37, y)
  y += 5
  if (order.clientNote) {
    doc.setFont('helvetica', 'bold')
    doc.text('Note client : ', margin, y)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(order.clientNote, maxWidth - 30)
    doc.text(noteLines, margin + 27, y)
    y += noteLines.length * 5
  }
  if (order.adminNote) {
    doc.setFont('helvetica', 'bold')
    doc.text('Note admin : ', margin, y)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(order.adminNote, maxWidth - 27)
    doc.text(noteLines, margin + 25, y)
    y += noteLines.length * 5
  }
  y += 6

  // Tableau des articles
  doc.setLineWidth(0.3)
  doc.setDrawColor(200, 180, 160)
  // En-têtes colonnes
  doc.setFillColor(254, 245, 236)
  doc.rect(margin, y, maxWidth, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Qté', margin + 2, y + 5)
  doc.text('Article', margin + 14, y + 5)
  doc.text('Montant', pageWidth - margin - 20, y + 5)
  y += 7

  // Lignes articles
  doc.setFont('helvetica', 'normal')
  for (const item of order.items ?? []) {
    const amount = (item.price * item.quantity).toFixed(2).replace('.', ',') + ' €'
    const nameLines = doc.splitTextToSize(formatOrderItemName(item) + (item.sizeLabel ? ` (${item.sizeLabel})` : ''), maxWidth - 40)
    doc.rect(margin, y, maxWidth, nameLines.length * 5 + 2)
    doc.text(String(item.quantity), margin + 2, y + 5)
    doc.text(nameLines, margin + 14, y + 5)
    doc.text(amount, pageWidth - margin - 2, y + 5, { align: 'right' })
    y += nameLines.length * 5 + 2
  }

  // Lignes totaux
  const deliveryFee = order.deliveryFee ?? 0
  const discount = (order.discountAmount ?? 0) + (order.referralDiscountAmount ?? 0)
  const donation = order.donationAmount ?? 0

  if (deliveryFee > 0) {
    doc.rect(margin, y, maxWidth, 6)
    doc.text('Frais de livraison', margin + 14, y + 4.5)
    doc.text(`+${deliveryFee.toFixed(2).replace('.', ',')} €`, pageWidth - margin - 2, y + 4.5, { align: 'right' })
    y += 6
  }
  if (discount > 0) {
    doc.rect(margin, y, maxWidth, 6)
    const label = order.promoCode ? `Réduction · ${order.promoCode}` : 'Réduction'
    doc.text(label, margin + 14, y + 4.5)
    doc.setTextColor(22, 101, 52)
    doc.text(`-${discount.toFixed(2).replace('.', ',')} €`, pageWidth - margin - 2, y + 4.5, { align: 'right' })
    doc.setTextColor(0, 0, 0)
    y += 6
  }
  if (donation > 0) {
    doc.rect(margin, y, maxWidth, 6)
    doc.text('Don projet', margin + 14, y + 4.5)
    doc.text(`+${donation.toFixed(2).replace('.', ',')} €`, pageWidth - margin - 2, y + 4.5, { align: 'right' })
    y += 6
  }

  // Total
  doc.setFillColor(254, 245, 236)
  doc.rect(margin, y, maxWidth, 8, 'F')
  doc.rect(margin, y, maxWidth, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Total TTC', margin + 14, y + 5.5)
  doc.text(`${(order.total ?? 0).toFixed(2).replace('.', ',')} €`, pageWidth - margin - 2, y + 5.5, { align: 'right' })
  y += 8

  const dep = getOrderDepositAmount(order)
  if (dep > 0) {
    doc.setFillColor(255, 255, 255)
    doc.rect(margin, y, maxWidth, 6)
    doc.rect(margin, y, maxWidth, 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Acompte versé', margin + 14, y + 4.5)
    doc.text(`−${dep.toFixed(2).replace('.', ',')} €`, pageWidth - margin - 2, y + 4.5, { align: 'right' })
    y += 6
  }

  doc.setFillColor(254, 245, 236)
  doc.rect(margin, y, maxWidth, 8, 'F')
  doc.rect(margin, y, maxWidth, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Reste à régler', margin + 14, y + 5.5)
  doc.text(`${getOrderRemainingToPay(order).toFixed(2).replace('.', ',')} €`, pageWidth - margin - 2, y + 5.5, { align: 'right' })
  y += 8

  y += 8

  // Pied de page
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(140, 140, 140)
  doc.text('Maison Mayssa – Pâtisserie artisanale – Annecy  ·  06 19 87 10 05', margin, y)

  doc.save(`commande-${order.orderNumber ?? orderId.slice(-8)}.pdf`)
}
