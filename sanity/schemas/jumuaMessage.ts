import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'jumuaMessage',
  title: 'Messages de Joumou\'a',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      description: 'Titre du message (ex: "Joumou\'a Moubarak")',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      description: 'Message à afficher pour le Joumou\'a',
      rows: 5,
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Image optionnelle pour le slide',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          title: 'Texte alternatif',
          type: 'string',
        },
      ],
    }),
    defineField({
      name: 'times',
      title: 'Horaires de Joumou\'a',
      type: 'array',
      description: 'Les horaires des prêches (importés depuis Mawaqit)',
      of: [{ type: 'string' }],
      readOnly: true,
    }),
    defineField({
      name: 'isActive',
      title: 'Actif',
      type: 'boolean',
      description: 'Afficher ce message dans le carousel',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Ordre',
      type: 'number',
      description: 'Ordre d\'affichage dans le carousel',
      initialValue: 0,
    }),
    defineField({
      name: 'validFrom',
      title: 'Valide à partir de',
      type: 'date',
      description: 'Date de début d\'affichage',
    }),
    defineField({
      name: 'validUntil',
      title: 'Valide jusqu\'à',
      type: 'date',
      description: 'Date de fin d\'affichage',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      message: 'message',
      media: 'image',
      isActive: 'isActive',
    },
    prepare({ title, message, media, isActive }) {
      return {
        title: title || 'Sans titre',
        subtitle: isActive ? `✅ ${message?.substring(0, 50)}...` : `❌ ${message?.substring(0, 50)}...`,
        media,
      }
    },
  },
})
