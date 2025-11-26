import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'project',
  title: 'Projets de Dons',
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
      name: 'goalAmount',
      title: 'Objectif (€)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'currentAmount',
      title: 'Montant Actuel (€)',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.required().min(0),
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
      name: 'startDate',
      title: 'Date de Début',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'Date de Fin',
      type: 'date',
      description: 'Laisser vide si pas de date limite',
    }),
    defineField({
      name: 'priority',
      title: 'Priorité',
      type: 'number',
      description: 'Pour l\'ordre d\'affichage (1 = plus haute priorité)',
      initialValue: 1,
    }),
    defineField({
      name: 'active',
      title: 'Projet Actif',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      goalAmount: 'goalAmount',
      currentAmount: 'currentAmount',
      media: 'image',
    },
    prepare(selection) {
      const { title, goalAmount, currentAmount } = selection
      const percentage = goalAmount ? Math.round((currentAmount / goalAmount) * 100) : 0
      return {
        ...selection,
        subtitle: `${currentAmount}€ / ${goalAmount}€ (${percentage}%)`,
      }
    },
  },
})
