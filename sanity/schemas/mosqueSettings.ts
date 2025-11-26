import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'mosqueSettings',
  title: 'Paramètres de la Mosquée',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom de la Mosquée',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'address',
      title: 'Adresse Complète',
      type: 'object',
      fields: [
        { name: 'street', title: 'Rue', type: 'string' },
        { name: 'city', title: 'Ville', type: 'string' },
        { name: 'postalCode', title: 'Code Postal', type: 'string' },
        { name: 'country', title: 'Pays', type: 'string' },
      ],
    }),
    defineField({
      name: 'contact',
      title: 'Coordonnées',
      type: 'object',
      fields: [
        { name: 'email', title: 'Email', type: 'string' },
        { name: 'phone', title: 'Téléphone', type: 'string' },
        { name: 'phone2', title: 'Téléphone 2', type: 'string' },
      ],
    }),
    defineField({
      name: 'bankDetails',
      title: 'Coordonnées Bancaires',
      type: 'object',
      fields: [
        { name: 'iban', title: 'IBAN', type: 'string' },
        { name: 'bic', title: 'BIC', type: 'string' },
        { name: 'accountHolder', title: 'Titulaire du Compte', type: 'string' },
      ],
    }),
    defineField({
      name: 'twint',
      title: 'Twint',
      type: 'string',
      description: 'Numéro de téléphone Twint ou QR code URL',
    }),
    defineField({
      name: 'socialMedia',
      title: 'Réseaux Sociaux',
      type: 'object',
      fields: [
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'youtube', title: 'YouTube', type: 'url' },
        { name: 'twitter', title: 'Twitter', type: 'url' },
      ],
    }),
    defineField({
      name: 'openingHours',
      title: 'Heures d\'Ouverture',
      type: 'text',
      rows: 5,
      description: 'Heures d\'ouverture de la mosquée',
    }),
    defineField({
      name: 'capacity',
      title: 'Capacité',
      type: 'number',
      description: 'Capacité maximale de la mosquée',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
})
