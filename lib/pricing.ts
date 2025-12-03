/**
 * Système de tarification flexible pour événements et activités
 */

export interface PricingConfig {
  adult_price: number          // Prix par adulte
  child_price: number          // Prix par enfant (0 = gratuit)
  child_free_until_age: number // Enfants gratuits jusqu'à cet âge
  group_discount?: {
    enabled: boolean
    from_persons: number       // À partir de X personnes
    discount_percent: number   // Réduction en %
  }
  family_max_price?: number | null    // Prix maximum famille (plafond)
  early_bird?: {
    enabled: boolean
    until_date: string | null  // Date limite early bird
    discount_percent: number   // Réduction early bird en %
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
  const adultTotal = config.adult_price * input.numberOfAdults
  if (input.numberOfAdults > 0) {
    breakdown.push(`${input.numberOfAdults} adulte(s) × ${config.adult_price} CHF = ${adultTotal} CHF`)
  }

  // Calcul enfants (avec prise en compte des enfants gratuits)
  let freeChildren = 0
  let paidChildren = input.numberOfChildren

  if (config.child_free_until_age > 0 && input.childrenAges && input.childrenAges.length > 0) {
    // Compter les enfants gratuits selon leur âge
    freeChildren = input.childrenAges.filter(age => age <= config.child_free_until_age).length
    paidChildren = input.numberOfChildren - freeChildren
  } else if (config.child_price === 0) {
    // Tous les enfants sont gratuits
    freeChildren = input.numberOfChildren
    paidChildren = 0
  }

  const childTotal = config.child_price * paidChildren
  if (input.numberOfChildren > 0) {
    if (freeChildren > 0) {
      breakdown.push(`${freeChildren} enfant(s) gratuit(s) (≤${config.child_free_until_age} ans)`)
    }
    if (paidChildren > 0) {
      breakdown.push(`${paidChildren} enfant(s) × ${config.child_price} CHF = ${childTotal} CHF`)
    }
  }

  let subtotal = adultTotal + childTotal
  let discountAmount = 0
  let discountReason: string | undefined

  // Réduction groupe
  const totalPersons = input.numberOfAdults + paidChildren
  if (
    config.group_discount?.enabled &&
    totalPersons >= config.group_discount.from_persons
  ) {
    const groupDiscount = Math.round(subtotal * config.group_discount.discount_percent / 100)
    discountAmount += groupDiscount
    discountReason = `Réduction groupe (${config.group_discount.discount_percent}% à partir de ${config.group_discount.from_persons} pers.)`
    breakdown.push(`-${groupDiscount} CHF (${discountReason})`)
  }

  // Early bird
  if (
    config.early_bird?.enabled &&
    config.early_bird.until_date &&
    input.registrationDate
  ) {
    const earlyBirdDate = new Date(config.early_bird.until_date)
    if (input.registrationDate <= earlyBirdDate) {
      const earlyBirdDiscount = Math.round((subtotal - discountAmount) * config.early_bird.discount_percent / 100)
      discountAmount += earlyBirdDiscount
      const earlyBirdReason = `Early bird (-${config.early_bird.discount_percent}%)`
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
  if (config.family_max_price && total > config.family_max_price) {
    const capDiscount = total - config.family_max_price
    discountAmount += capDiscount
    total = config.family_max_price
    const capReason = `Plafond famille (max ${config.family_max_price} CHF)`
    if (discountReason) {
      discountReason += ` + ${capReason}`
    } else {
      discountReason = capReason
    }
    breakdown.push(`Plafond famille appliqué: ${config.family_max_price} CHF`)
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
  paymentType?: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION' | null,
  price?: number | string | null,
  pricing?: PricingConfig | null
): boolean {
  if (paymentType === 'FREE') return false

  // Vérifier si pricing config existe avec des prix > 0
  if (pricing) {
    return pricing.adult_price > 0 || pricing.child_price > 0
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
  if (childCanBeAlone && pricing.child_price < pricing.adult_price) {
    // Enfant peut être seul et son prix est inférieur
    return { price: pricing.child_price, isVariable: true }
  }

  // Sinon le minimum c'est le prix adulte (1 adulte minimum)
  return { price: pricing.adult_price, isVariable: true }
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

    if (pricing.adult_price > 0) {
      parts.push(`${pricing.adult_price} CHF${intervalSuffix}/adulte`)
    }

    if (pricing.child_price > 0) {
      parts.push(`${pricing.child_price} CHF${intervalSuffix}/enfant`)
    } else if (pricing.child_free_until_age > 0) {
      parts.push(`Enfants ≤${pricing.child_free_until_age} ans: gratuit`)
    }

    if (pricing.family_max_price) {
      parts.push(`Max famille: ${pricing.family_max_price} CHF${intervalSuffix}`)
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
