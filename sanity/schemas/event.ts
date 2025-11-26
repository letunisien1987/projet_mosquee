import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'event',
  title: 'Événements',
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
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      options: {
        list: [
          { title: 'Religieux', value: 'religieux' },
          { title: 'Communauté', value: 'communaute' },
          { title: 'Éducation', value: 'education' },
          { title: 'Charité', value: 'charite' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startTime',
      title: 'Heure de Début',
      type: 'string',
      description: 'Format: 14h00',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endTime',
      title: 'Heure de Fin',
      type: 'string',
      description: 'Format: 18h00',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Lieu',
      type: 'string',
      description: 'Si différent de la mosquée',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'attendees',
      title: 'Nombre de Participants (Texte)',
      type: 'string',
      description: 'Ex: 100-150 personnes, 30-40 étudiants, Ouvert à tous',
    }),
    defineField({
      name: 'registrationRequired',
      title: 'Inscription Requise',
      type: 'boolean',
      initialValue: false,
      description: 'Activer le système d\'inscription pour cet événement',
    }),
    defineField({
      name: 'maxCapacity',
      title: 'Capacité Maximale',
      type: 'number',
      description: 'Nombre maximum de places disponibles (laissez vide si illimité)',
      hidden: ({ parent }) => !parent?.registrationRequired,
    }),
    defineField({
      name: 'requiresApproval',
      title: 'Approbation Manuelle',
      type: 'boolean',
      initialValue: false,
      description: 'Les inscriptions doivent être approuvées par un admin',
      hidden: ({ parent }) => !parent?.registrationRequired,
    }),
    defineField({
      name: 'registrationDeadline',
      title: 'Date Limite d\'Inscription',
      type: 'datetime',
      description: 'Optionnel - Date limite pour s\'inscrire',
      hidden: ({ parent }) => !parent?.registrationRequired,
    }),
    defineField({
      name: 'featured',
      title: 'Événement Mis en Avant',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'published',
      title: 'Publié',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      category: 'category',
      media: 'image',
    },
    prepare(selection) {
      const { title, date, category } = selection
      return {
        ...selection,
        subtitle: `${category || ''} - ${date ? new Date(date).toLocaleDateString('fr-FR') : 'Date non définie'}`,
      }
    },
  },
})
