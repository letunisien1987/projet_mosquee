import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'teamMember',
  title: 'Équipe',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom Complet',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Rôle',
      type: 'string',
      options: {
        list: [
          { title: 'Imam', value: 'imam' },
          { title: 'Président', value: 'president' },
          { title: 'Vice-Président', value: 'vice_president' },
          { title: 'Trésorier', value: 'treasurer' },
          { title: 'Secrétaire', value: 'secretary' },
          { title: 'Professeur', value: 'teacher' },
          { title: 'Membre du Bureau', value: 'board_member' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Biographie',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'phone',
      title: 'Téléphone',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'Affichage',
      type: 'number',
      description: 'Pour définir l\'ordre d\'affichage (plus petit = affiché en premier)',
    }),
    defineField({
      name: 'active',
      title: 'Actif',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'photo',
    },
  },
})
