import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  validateCustomer,
  computeDeliveryFee,
  generateTimeSlots,
  ANNECY_GARE,
  FREE_DELIVERY_THRESHOLD,
  DELIVERY_FEE,
} from './delivery'
import type { CustomerInfo } from '../types'

describe('calculateDistance', () => {
  it('retourne null si coord1 ou coord2 manquant', () => {
    expect(calculateDistance(null, ANNECY_GARE)).toBe(null)
    expect(calculateDistance(null, ANNECY_GARE)).toBe(null)
    expect(calculateDistance(ANNECY_GARE, null as any)).toBe(null)
  })

  it('retourne 0 pour les mêmes coordonnées', () => {
    expect(calculateDistance(ANNECY_GARE, ANNECY_GARE)).toBe(0)
  })

  it('retourne une distance positive pour deux points différents', () => {
    const other = { lat: 45.91, lng: 6.13 }
    const d = calculateDistance(other, ANNECY_GARE)
    expect(d).not.toBe(null)
    expect(typeof d).toBe('number')
    expect((d as number) > 0).toBe(true)
  })
})

describe('validateCustomer', () => {
  const base: CustomerInfo = {
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0612345678',
    address: '1 rue Test 74000 Annecy',
    addressCoordinates: { lat: 45.9, lng: 6.12 },
    wantsDelivery: true,
    date: '2025-02-15',
    time: '20:00',
  }

  it('retourne des erreurs pour champs vides', () => {
    const err = validateCustomer({ ...base, firstName: '', lastName: '' })
    expect(err.firstName).toBe('Le prénom est requis')
    expect(err.lastName).toBe('Le nom est requis')
  })

  it('valide le téléphone français', () => {
    expect(validateCustomer({ ...base, phone: '0612345678' }).phone).toBeUndefined()
    expect(validateCustomer({ ...base, phone: '+33612345678' }).phone).toBeUndefined()
    expect(validateCustomer({ ...base, phone: '123' }).phone).toBeDefined()
  })

  it('exige l\'adresse si livraison', () => {
    const withDelivery = { ...base, wantsDelivery: true, address: '' }
    expect(validateCustomer(withDelivery).address).toBe("L'adresse est requise pour la livraison")
  })

  it('exige date et heure', () => {
    expect(validateCustomer({ ...base, date: '' }).date).toBe('La date est requise')
    expect(validateCustomer({ ...base, time: '' }).time).toBe("L'heure est requise")
  })
})

describe('computeDeliveryFee', () => {
  const inZone = { ...ANNECY_GARE }

  it('retourne 0 si pas de livraison', () => {
    expect(computeDeliveryFee({ wantsDelivery: false } as CustomerInfo, 10)).toBe(0)
  })

  it('retourne null si pas de coordonnées', () => {
    expect(computeDeliveryFee({ wantsDelivery: true, addressCoordinates: null } as CustomerInfo, 10)).toBe(null)
  })

  it('retourne 0 si total >= seuil livraison offerte', () => {
    expect(computeDeliveryFee({ wantsDelivery: true, addressCoordinates: inZone } as CustomerInfo, FREE_DELIVERY_THRESHOLD)).toBe(0)
    expect(computeDeliveryFee({ wantsDelivery: true, addressCoordinates: inZone } as CustomerInfo, FREE_DELIVERY_THRESHOLD + 10)).toBe(0)
  })

  it('retourne les frais si total < seuil', () => {
    expect(computeDeliveryFee({ wantsDelivery: true, addressCoordinates: inZone } as CustomerInfo, 20)).toBe(DELIVERY_FEE)
  })

  it('retourne null si hors zone (distance > rayon)', () => {
    const farAway = { lat: 46.0, lng: 6.5 }
    expect(computeDeliveryFee({ wantsDelivery: true, addressCoordinates: farAway } as CustomerInfo, 20)).toBe(null)
  })
})

describe('generateTimeSlots', () => {
  it('inclut 18:30 pour retrait', () => {
    const slots = generateTimeSlots(false)
    expect(slots).toContain('18:30')
  })

  it('ne contient pas 18:30 pour livraison', () => {
    const slots = generateTimeSlots(true)
    expect(slots).not.toContain('18:30')
  })

  it('contient des créneaux jusqu\'à 2h', () => {
    const slots = generateTimeSlots(true)
    expect(slots).toContain('00:00')
    expect(slots).toContain('02:00')
  })
})
