import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'activity',
  title: 'Activités',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      options: {
        list: [
          { title: 'Cours de Coran', value: 'coran' },
          { title: 'Cours d\'Arabe', value: 'arabe' },
          { title: 'École du Dimanche', value: 'ecole' },
          { title: 'Tajweed', value: 'tajweed' },
          { title: 'Hifz', value: 'hifz' },
          { title: 'Halaqat', value: 'halaqat' },
          { title: 'Autre', value: 'autre' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'Contenu Détaillé',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'level',
      title: 'Niveau',
      type: 'string',
      options: {
        list: [
          'Débutant',
          'Intermédiaire',
          'Avancé',
          'Tous niveaux',
        ],
      },
    }),
    defineField({
      name: 'ageGroup',
      title: 'Groupe d\'Âge',
      type: 'string',
      description: 'ex: 6-10 ans, Adultes, etc.',
    }),
    defineField({
      name: 'schedule',
      title: 'Horaire',
      type: 'string',
      description: 'ex: Samedi 10h00 - 12h00',
    }),
    defineField({
      name: 'instructor',
      title: 'Enseignant',
      type: 'reference',
      to: [{ type: 'teamMember' }],
    }),
    defineField({
      name: 'maxParticipants',
      title: 'Maximum de Participants',
      type: 'number',
      description: 'Capacité maximale (laissez vide si illimité)',
    }),
    defineField({
      name: 'requiresApproval',
      title: 'Approbation Manuelle',
      type: 'boolean',
      initialValue: false,
      description: 'Les inscriptions doivent être approuvées manuellement',
    }),
    defineField({
      name: 'price',
      title: 'Tarif',
      type: 'number',
      description: 'Tarif mensuel en CHF',
    }),
    defineField({
      name: 'active',
      title: 'Cours Actif',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'enrollmentOpen',
      title: 'Inscriptions Ouvertes',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      schedule: 'schedule',
    },
    prepare(selection) {
      const { title, category, schedule } = selection
      return {
        title,
        subtitle: `${category || ''} - ${schedule || ''}`,
      }
    },
  },
})
