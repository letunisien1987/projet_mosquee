/**
 * Système de tarification flexible pour événements et activités
 */

export interface PricingConfig {
  adultPrice: number          // Prix par adulte
  childPrice: number          // Prix par enfant (0 = gratuit)
  childFreeUntilAge: number // Enfants gratuits jusqu'à cet âge
  groupDiscount?: {
    enabled: boolean
    fromPersons: number       // À partir de X personnes
    discountPercent: number   // Réduction en %
  }
  familyMaxPrice?: number | null    // Prix maximum famille (plafond)
  earlyBird?: {
    enabled: boolean
    untilDate: string | null  // Date limite early bird
    discountPercent: number   // Réduction early bird en %
  }
}

export interface PricingInput {
  numberOfAdults: number
  numberOfChildren: number
  childrenAges?: number[]      // Âges des enfants pour calcul gratuit
  registrationDate?: Date      // Pour early bird
}

export interface PricingResult {
  subtotal: number             // Sous-total avant réductions
  adultTotal: number           // Total adultes
  childTotal: number           // Total enfants
  freeChildren: number         // Nombre d'enfants gratuits
  paidChildren: number         // Nombre d'enfants payants
  discountAmount: number       // Montant de réduction
  discountReason?: string      // Raison de la réduction
  total: number                // Total final
  breakdown: string[]          // Détail lisible
}

/**
 * Calcule le prix total selon la configuration et les participants
 */
export function calculatePrice(
  config: PricingConfig | null,
  input: PricingInput,
  fallbackPrice?: number
): PricingResult {
  // Si pas de config, utiliser le prix de base
  if (!config) {
    const unitPrice = fallbackPrice || 0
    const totalPersons = input.numberOfAdults + input.numberOfChildren
    const total = unitPrice * totalPersons

    return {
      subtotal: total,
      adultTotal: unitPrice * input.numberOfAdults,
      childTotal: unitPrice * input.numberOfChildren,
      freeChildren: 0,
      paidChildren: input.numberOfChildren,
      discountAmount: 0,
      total,
      breakdown: [`${totalPersons} personne(s) × ${unitPrice} CHF = ${total} CHF`],
    }
  }

  const breakdown: string[] = []

  // Calcul adultes
  const adultTotal = config.adultPrice * input.numberOfAdults
  if (input.numberOfAdults > 0) {
    breakdown.push(`${input.numberOfAdults} adulte(s) × ${config.adultPrice} CHF = ${adultTotal} CHF`)
  }

  // Calcul enfants (avec prise en compte des enfants gratuits)
  let freeChildren = 0
  let paidChildren = input.numberOfChildren

  if (config.childFreeUntilAge > 0 && input.childrenAges && input.childrenAges.length > 0) {
    // Compter les enfants gratuits selon leur âge
    freeChildren = input.childrenAges.filter(age => age <= config.childFreeUntilAge).length
    paidChildren = input.numberOfChildren - freeChildren
  } else if (config.childPrice === 0) {
    // Tous les enfants sont gratuits
    freeChildren = input.numberOfChildren
    paidChildren = 0
  }

  const childTotal = config.childPrice * paidChildren
  if (input.numberOfChildren > 0) {
    if (freeChildren > 0) {
      breakdown.push(`${freeChildren} enfant(s) gratuit(s) (≤${config.childFreeUntilAge} ans)`)
    }
    if (paidChildren > 0) {
      breakdown.push(`${paidChildren} enfant(s) × ${config.childPrice} CHF = ${childTotal} CHF`)
    }
  }

  let subtotal = adultTotal + childTotal
  let discountAmount = 0
  let discountReason: string | undefined

  // Réduction groupe
  const totalPersons = input.numberOfAdults + paidChildren
  if (
    config.groupDiscount?.enabled &&
    totalPersons >= config.groupDiscount.fromPersons
  ) {
    const groupDiscount = Math.round(subtotal * config.groupDiscount.discountPercent / 100)
    discountAmount += groupDiscount
    discountReason = `Réduction groupe (${config.groupDiscount.discountPercent}% à partir de ${config.groupDiscount.fromPersons} pers.)`
    breakdown.push(`-${groupDiscount} CHF (${discountReason})`)
  }

  // Early bird
  if (
    config.earlyBird?.enabled &&
    config.earlyBird.untilDate &&
    input.registrationDate
  ) {
    const earlyBirdDate = new Date(config.earlyBird.untilDate)
    if (input.registrationDate <= earlyBirdDate) {
      const earlyBirdDiscount = Math.round((subtotal - discountAmount) * config.earlyBird.discountPercent / 100)
      discountAmount += earlyBirdDiscount
      const earlyBirdReason = `Early bird (-${config.earlyBird.discountPercent}%)`
      if (discountReason) {
        discountReason += ` + ${earlyBirdReason}`
      } else {
        discountReason = earlyBirdReason
      }
      breakdown.push(`-${earlyBirdDiscount} CHF (${earlyBirdReason})`)
    }
  }

  let total = subtotal - discountAmount

  // Plafond famille
  if (config.familyMaxPrice && total > config.familyMaxPrice) {
    const capDiscount = total - config.familyMaxPrice
    discountAmount += capDiscount
    total = config.familyMaxPrice
    const capReason = `Plafond famille (max ${config.familyMaxPrice} CHF)`
    if (discountReason) {
      discountReason += ` + ${capReason}`
    } else {
      discountReason = capReason
    }
    breakdown.push(`Plafond famille appliqué: ${config.familyMaxPrice} CHF`)
  }

  breakdown.push(`Total: ${total} CHF`)

  return {
    subtotal,
    adultTotal,
    childTotal,
    freeChildren,
    paidChildren,
    discountAmount,
    discountReason,
    total,
    breakdown,
  }
}

/**
 * Formate le prix pour affichage
 */
export function formatPrice(amount: number, currency: string = 'CHF'): string {
  return `${amount} ${currency}`
}

/**
 * Vérifie si un événement/activité est payant
 */
export function isPaidItem(
  paymentType?: string | null,
  price?: number | string | null,
  pricing?: PricingConfig | null
): boolean {
  if (paymentType === 'FREE') return false

  // Vérifier si pricing config existe avec des prix > 0
  if (pricing) {
    return pricing.adultPrice > 0 || pricing.childPrice > 0
  }

  // Sinon vérifier le prix simple
  const numPrice = price ? parseFloat(String(price)) : 0
  return numPrice > 0
}

/**
 * Calcule le prix minimum réel (pour affichage "À partir de X CHF")
 * Tient compte du fait qu'un enfant doit généralement être accompagné d'un adulte
 */
export function getMinimumPrice(
  pricing?: PricingConfig | null,
  fallbackPrice?: number | string | null,
  childCanBeAlone: boolean = false // true si enfant peut participer seul
): { price: number; isVariable: boolean } {
  // Si pas de pricing config, c'est un prix fixe
  if (!pricing) {
    const numPrice = fallbackPrice ? parseFloat(String(fallbackPrice)) : 0
    return { price: numPrice, isVariable: false }
  }

  // Si pricing config existe, c'est variable
  // Le minimum dépend de si l'enfant peut être seul
  if (childCanBeAlone && pricing.childPrice < pricing.adultPrice) {
    // Enfant peut être seul et son prix est inférieur
    return { price: pricing.childPrice, isVariable: true }
  }

  // Sinon le minimum c'est le prix adulte (1 adulte minimum)
  return { price: pricing.adultPrice, isVariable: true }
}

/**
 * Génère un résumé de tarification pour affichage
 */
export function getPricingSummary(
  pricing?: PricingConfig | null,
  fallbackPrice?: number | string | null,
  paymentType?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | null,
  subscriptionInterval?: 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null
): string {
  if (paymentType === 'FREE') return 'Gratuit'

  const intervalLabels: Record<string, string> = {
    WEEKLY: '/semaine',
    MONTHLY: '/mois',
    YEARLY: '/an',
  }
  const intervalSuffix = subscriptionInterval ? intervalLabels[subscriptionInterval] || '' : ''

  if (pricing) {
    const parts: string[] = []

    if (pricing.adultPrice > 0) {
      parts.push(`${pricing.adultPrice} CHF${intervalSuffix}/adulte`)
    }

    if (pricing.childPrice > 0) {
      parts.push(`${pricing.childPrice} CHF${intervalSuffix}/enfant`)
    } else if (pricing.childFreeUntilAge > 0) {
      parts.push(`Enfants ≤${pricing.childFreeUntilAge} ans: gratuit`)
    }

    if (pricing.familyMaxPrice) {
      parts.push(`Max famille: ${pricing.familyMaxPrice} CHF${intervalSuffix}`)
    }

    return parts.join(' • ') || 'Gratuit'
  }

  // Fallback au prix simple
  const numPrice = fallbackPrice ? parseFloat(String(fallbackPrice)) : 0
  if (numPrice > 0) {
    return `${numPrice} CHF${intervalSuffix}/personne`
  }

  return 'Gratuit'
}
