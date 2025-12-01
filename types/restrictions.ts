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
  participation_type: ParticipationType
  allowed_gender: AllowedGender
  min_age: number | null
  max_age: number | null
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
  if (restrictions.participation_type === 'INDIVIDUAL' && formData.participationType === 'FAMILY') {
    return {
      valid: false,
      error: 'Cet événement est réservé aux inscriptions individuelles',
      errorCode: 'PARTICIPATION_TYPE_MISMATCH'
    }
  }

  if (restrictions.participation_type === 'FAMILY' && formData.participationType === 'INDIVIDUAL') {
    return {
      valid: false,
      error: 'Cet événement est réservé aux familles/groupes',
      errorCode: 'PARTICIPATION_TYPE_MISMATCH'
    }
  }

  // Pour inscription individuelle
  if (formData.participationType === 'INDIVIDUAL') {
    // Vérifier le genre
    if (restrictions.allowed_gender !== 'ALL') {
      if (restrictions.allowed_gender === 'MALE' && formData.participantGender !== 'MALE') {
        return {
          valid: false,
          error: 'Cet événement est réservé aux hommes',
          errorCode: 'GENDER_RESTRICTION'
        }
      }
      if (restrictions.allowed_gender === 'FEMALE' && formData.participantGender !== 'FEMALE') {
        return {
          valid: false,
          error: 'Cet événement est réservé aux femmes',
          errorCode: 'GENDER_RESTRICTION'
        }
      }
      if (restrictions.allowed_gender === 'CHILD' && formData.participantGender !== 'CHILD') {
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

      if (restrictions.min_age !== null && age < restrictions.min_age) {
        return {
          valid: false,
          error: `Cet événement est réservé aux personnes de ${restrictions.min_age} ans et plus`,
          errorCode: 'AGE_TOO_YOUNG'
        }
      }

      if (restrictions.max_age !== null && age > restrictions.max_age) {
        return {
          valid: false,
          error: `Cet événement est réservé aux personnes de ${restrictions.max_age} ans et moins`,
          errorCode: 'AGE_TOO_OLD'
        }
      }

      if (restrictions.min_age !== null && restrictions.max_age !== null) {
        if (age < restrictions.min_age || age > restrictions.max_age) {
          return {
            valid: false,
            error: `Cet événement est réservé aux personnes de ${restrictions.min_age} à ${restrictions.max_age} ans`,
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
  if (restrictions.participation_type === 'INDIVIDUAL') {
    parts.push('inscription individuelle')
  } else if (restrictions.participation_type === 'FAMILY') {
    parts.push('familles/groupes')
  }

  // Genre
  if (restrictions.allowed_gender === 'MALE') {
    parts.push('hommes')
  } else if (restrictions.allowed_gender === 'FEMALE') {
    parts.push('femmes')
  } else if (restrictions.allowed_gender === 'CHILD') {
    parts.push('enfants')
  }

  // Âge
  if (restrictions.min_age !== null && restrictions.max_age !== null) {
    parts.push(`${restrictions.min_age}-${restrictions.max_age} ans`)
  } else if (restrictions.min_age !== null) {
    parts.push(`${restrictions.min_age}+ ans`)
  } else if (restrictions.max_age !== null) {
    parts.push(`jusqu'à ${restrictions.max_age} ans`)
  }

  if (parts.length === 0) {
    return null
  }

  return `Cet événement est réservé aux ${parts.join(', ')}`
}
