import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'details',
      title: 'Détails',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Ajoutez les points clés du service.',
    }),
    defineField({
      name: 'icon',
      title: 'Icône',
      type: 'string',
      description: 'Nom de l\'icône de Lucide React (ex: Heart, Users).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Actif',
      type: 'boolean',
      description: 'Désactivez pour masquer ce service du site public.',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      active: 'active',
    },
    prepare({ title, active }) {
      return {
        title: title,
        subtitle: active ? 'Actif' : 'Inactif',
      }
    },
  },
})
