import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'prayerSettings',
  title: 'Paramètres des Horaires de Prière',
  type: 'document',
  fields: [
    defineField({
      name: 'city',
      title: 'Ville',
      type: 'string',
      description: 'Ville pour les horaires de prière',
      initialValue: 'Bienne',
    }),
    defineField({
      name: 'country',
      title: 'Pays',
      type: 'string',
      initialValue: 'Switzerland',
    }),
    defineField({
      name: 'calculationMethod',
      title: 'Méthode de Calcul',
      type: 'number',
      description: 'Méthode de calcul Aladhan (3 = MWL)',
      initialValue: 3,
    }),
    defineField({
      name: 'annualPrayerTimes',
      title: 'Horaires Annuels (JSON)',
      type: 'text',
      description: 'JSON complet des horaires de prière pour l\'année',
      rows: 10,
    }),
    defineField({
      name: 'jumuahTimes',
      title: 'Horaires de Joumou\'a',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'khutbah',
              title: 'Khutbah',
              type: 'string',
              description: 'Heure de la Khutbah (ex: 13:00)',
            },
            {
              name: 'salah',
              title: 'Salah',
              type: 'string',
              description: 'Heure de la Salah (ex: 13:30)',
            },
            {
              name: 'language',
              title: 'Langue',
              type: 'string',
              options: {
                list: ['Arabe', 'Français', 'Bilingue'],
              },
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'lastImportDate',
      title: 'Dernière Importation',
      type: 'datetime',
      description: 'Date de la dernière importation depuis l\'API',
    }),
  ],
})
