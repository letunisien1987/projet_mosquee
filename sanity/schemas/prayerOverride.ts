import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'prayerOverride',
  title: 'Modifications des Horaires',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      description: 'Description de la modification (ex: Fajr fixe hiver, Ramadan 2024)',
    }),
    defineField({
      name: 'type',
      title: 'Type de Modification',
      type: 'string',
      options: {
        list: [
          { title: 'Date unique', value: 'single' },
          { title: 'Période', value: 'range' },
          { title: 'Permanent', value: 'permanent' },
        ],
      },
    }),
    defineField({
      name: 'startDate',
      title: 'Date de Début',
      type: 'date',
      hidden: ({ parent }) => parent?.type === 'permanent',
    }),
    defineField({
      name: 'endDate',
      title: 'Date de Fin',
      type: 'date',
      hidden: ({ parent }) => parent?.type !== 'range',
    }),
    defineField({
      name: 'prayers',
      title: 'Horaires Modifiés',
      type: 'object',
      description: 'Laissez vide les prières non modifiées',
      fields: [
        { name: 'fajr', title: 'Fajr', type: 'string' },
        { name: 'sunrise', title: 'Lever du soleil', type: 'string' },
        { name: 'dhuhr', title: 'Dhuhr', type: 'string' },
        { name: 'asr', title: 'Asr', type: 'string' },
        { name: 'maghrib', title: 'Maghrib', type: 'string' },
        { name: 'isha', title: 'Isha', type: 'string' },
      ],
    }),
    defineField({
      name: 'specialPrayers',
      title: 'Prières Spéciales',
      type: 'object',
      description: 'Pour Ramadan: Tarawih, Imsak, etc.',
      fields: [
        { name: 'tarawih', title: 'Tarawih', type: 'string' },
        { name: 'imsak', title: 'Imsak', type: 'string' },
        { name: 'qiyam', title: 'Qiyam', type: 'string' },
      ],
      hidden: ({ parent }) => !parent?.name?.toLowerCase().includes('ramadan'),
    }),
    defineField({
      name: 'active',
      title: 'Actif',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})
