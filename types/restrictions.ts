/**
 * Types pour le système de restrictions d'inscription
 */

// Types de participation
export type ParticipationType = 'INDIVIDUAL' | 'FAMILY' | 'MIXED'

// Genres autorisés
export type AllowedGender = 'MALE' | 'FEMALE' | 'CHILD' | 'ALL'

// Restrictions d'un événement/activité
export interface EventRestrictions {
  enabled: boolean
  participationType: ParticipationType
  allowedGender: AllowedGender
  minAge: number | null
  maxAge: number | null
}

// Participant individuel
export interface RegistrationParticipant {
  firstName: string
  lastName: string
  age?: number
  birthDate?: string
}

// Inscription famille (avec liste des participants)
export interface FamilyParticipants {
  adults: RegistrationParticipant[]
  children: RegistrationParticipant[]
}

// Données du formulaire d'inscription
export interface EventRegistrationFormData {
  // Type d'inscription
  participationType: 'INDIVIDUAL' | 'FAMILY'

  // Contact principal
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  contactPhone: string

  // Pour INDIVIDUAL
  participantAge?: number
  participantGender?: 'MALE' | 'FEMALE' | 'CHILD'
  participantBirthDate?: string

  // Pour FAMILY
  numberOfAdults?: number
  numberOfChildren?: number
  participants?: FamilyParticipants

  // Autres
  notes?: string
}

// Résultat de validation
export interface ValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
}

// Helper pour calculer l'âge à partir d'une date de naissance
export function calculateAge(birthDate: string | Date): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

// Validation des restrictions
export function validateRestrictions(
  restrictions: EventRestrictions,
  formData: EventRegistrationFormData
): ValidationResult {
  if (!restrictions.enabled) {
    return { valid: true }
  }

  // Vérifier le type de participation
  if (restrictions.participationType === 'INDIVIDUAL' && formData.participationType === 'FAMILY') {
    return {
      valid: false,
      error: 'Cet événement est réservé aux inscriptions individuelles',
      errorCode: 'PARTICIPATION_TYPE_MISMATCH'
    }
  }

  if (restrictions.participationType === 'FAMILY' && formData.participationType === 'INDIVIDUAL') {
    return {
      valid: false,
      error: 'Cet événement est réservé aux familles/groupes',
      errorCode: 'PARTICIPATION_TYPE_MISMATCH'
    }
  }

  // Pour inscription individuelle
  if (formData.participationType === 'INDIVIDUAL') {
    // Vérifier le genre
    if (restrictions.allowedGender !== 'ALL') {
      if (restrictions.allowedGender === 'MALE' && formData.participantGender !== 'MALE') {
        return {
          valid: false,
          error: 'Cet événement est réservé aux hommes',
          errorCode: 'GENDER_RESTRICTION'
        }
      }
      if (restrictions.allowedGender === 'FEMALE' && formData.participantGender !== 'FEMALE') {
        return {
          valid: false,
          error: 'Cet événement est réservé aux femmes',
          errorCode: 'GENDER_RESTRICTION'
        }
      }
      if (restrictions.allowedGender === 'CHILD' && formData.participantGender !== 'CHILD') {
        return {
          valid: false,
          error: 'Cet événement est réservé aux enfants',
          errorCode: 'GENDER_RESTRICTION'
        }
      }
    }

    // Vérifier l'âge
    if (formData.participantBirthDate) {
      const age = calculateAge(formData.participantBirthDate)

      if (restrictions.minAge !== null && age < restrictions.minAge) {
        return {
          valid: false,
          error: `Cet événement est réservé aux personnes de ${restrictions.minAge} ans et plus`,
          errorCode: 'AGE_TOO_YOUNG'
        }
      }

      if (restrictions.maxAge !== null && age > restrictions.maxAge) {
        return {
          valid: false,
          error: `Cet événement est réservé aux personnes de ${restrictions.maxAge} ans et moins`,
          errorCode: 'AGE_TOO_OLD'
        }
      }

      if (restrictions.minAge !== null && restrictions.maxAge !== null) {
        if (age < restrictions.minAge || age > restrictions.maxAge) {
          return {
            valid: false,
            error: `Cet événement est réservé aux personnes de ${restrictions.minAge} à ${restrictions.maxAge} ans`,
            errorCode: 'AGE_OUT_OF_RANGE'
          }
        }
      }
    }
  }

  return { valid: true }
}

// Obtenir le message d'information sur les restrictions
export function getRestrictionsMessage(restrictions: EventRestrictions): string | null {
  if (!restrictions.enabled) {
    return null
  }

  const parts: string[] = []

  // Type de participation
  if (restrictions.participationType === 'INDIVIDUAL') {
    parts.push('inscription individuelle')
  } else if (restrictions.participationType === 'FAMILY') {
    parts.push('familles/groupes')
  }

  // Genre
  if (restrictions.allowedGender === 'MALE') {
    parts.push('hommes')
  } else if (restrictions.allowedGender === 'FEMALE') {
    parts.push('femmes')
  } else if (restrictions.allowedGender === 'CHILD') {
    parts.push('enfants')
  }

  // Âge
  if (restrictions.minAge !== null && restrictions.maxAge !== null) {
    parts.push(`${restrictions.minAge}-${restrictions.maxAge} ans`)
  } else if (restrictions.minAge !== null) {
    parts.push(`${restrictions.minAge}+ ans`)
  } else if (restrictions.maxAge !== null) {
    parts.push(`jusqu'à ${restrictions.maxAge} ans`)
  }

  if (parts.length === 0) {
    return null
  }

  return `Cet événement est réservé aux ${parts.join(', ')}`
}

// Interface pour les modes de participation visibles
export interface VisibleParticipationModes {
  showIndividual: boolean
  showChildren: boolean
  showFamily: boolean
  defaultMode: 'INDIVIDUAL' | 'CHILDREN' | 'FAMILY'
  // Infos supplémentaires pour le formulaire
  isChildrenOnly: boolean
  isAdultsOnly: boolean
  requiresAge: boolean
  requiresGender: boolean
}

/**
 * Détermine quels boutons de participation afficher selon les restrictions
 *
 * Logique:
 * - Genre CHILD → Seul "Mes enfants" visible
 * - Genre MALE/FEMALE → "Moi-même" + "Famille/Groupe" (adultes uniquement)
 * - Type FAMILY → Seul "Famille/Groupe" visible
 * - Type INDIVIDUAL → "Moi-même" + "Mes enfants" (pas de groupe)
 * - Sans restriction ou MIXED → Les 3 boutons
 */
export function getVisibleParticipationModes(restrictions?: EventRestrictions): VisibleParticipationModes {
  // Valeurs par défaut si pas de restrictions
  if (!restrictions?.enabled) {
    return {
      showIndividual: true,
      showChildren: true,
      showFamily: true,
      defaultMode: 'INDIVIDUAL',
      isChildrenOnly: false,
      isAdultsOnly: false,
      requiresAge: false,
      requiresGender: false
    }
  }

  // Déterminer si c'est pour enfants uniquement
  const isChildrenOnly = restrictions.allowedGender === 'CHILD'

  // Déterminer si c'est pour adultes uniquement (hommes ou femmes)
  const isAdultsOnly = restrictions.allowedGender === 'MALE' || restrictions.allowedGender === 'FEMALE'

  // Type de participation forcé
  const forcedType = restrictions.participationType

  // Calculer la visibilité des boutons
  // "Moi-même": visible si pas enfants-only ET pas mode famille forcé
  const showIndividual = !isChildrenOnly && forcedType !== 'FAMILY'

  // "Mes enfants": visible si pas adultes-only ET pas mode famille forcé
  const showChildren = !isAdultsOnly && forcedType !== 'FAMILY'

  // "Famille/Groupe": visible si pas mode individuel forcé
  const showFamily = forcedType !== 'INDIVIDUAL'

  // Déterminer le mode par défaut intelligent
  let defaultMode: 'INDIVIDUAL' | 'CHILDREN' | 'FAMILY' = 'INDIVIDUAL'

  if (isChildrenOnly) {
    // Si enfants uniquement, défaut = CHILDREN
    defaultMode = 'CHILDREN'
  } else if (forcedType === 'FAMILY') {
    // Si famille forcée, défaut = FAMILY
    defaultMode = 'FAMILY'
  } else if (!showIndividual && showChildren) {
    // Si INDIVIDUAL masqué mais CHILDREN visible
    defaultMode = 'CHILDREN'
  } else if (!showIndividual && !showChildren && showFamily) {
    // Si seul FAMILY visible
    defaultMode = 'FAMILY'
  }

  // Déterminer si l'âge/genre sont requis
  const requiresAge = restrictions.minAge !== null || restrictions.maxAge !== null
  const requiresGender = restrictions.allowedGender !== 'ALL'

  return {
    showIndividual,
    showChildren,
    showFamily,
    defaultMode,
    isChildrenOnly,
    isAdultsOnly,
    requiresAge,
    requiresGender
  }
}
