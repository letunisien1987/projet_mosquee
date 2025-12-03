'use client'

import { Filter } from 'lucide-react'

export interface CategoryStyle {
  bg: string
  bgSelected: string
  text: string
  textSelected: string
}

export interface CategoryFilterProps<T extends string> {
  categories: T[]
  selectedCategory: T
  onCategoryChange: (category: T) => void
  styles: Record<T, CategoryStyle>
  resultCount: number
  resultLabel?: string // "événement" ou "activité"
}

export function CategoryFilter<T extends string>({
  categories,
  selectedCategory,
  onCategoryChange,
  styles,
  resultCount,
  resultLabel = 'résultat',
}: CategoryFilterProps<T>) {
  const getButtonStyle = (category: T, isSelected: boolean) => {
    const style = styles[category]
    return isSelected
      ? `${style.bgSelected} ${style.textSelected} shadow-md`
      : `${style.bg} ${style.text} hover:opacity-80`
  }

  return (
    <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Filtrer par catégorie</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${getButtonStyle(category, selectedCategory === category)}`}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {resultCount} {resultLabel}{resultCount > 1 ? 's' : ''} trouvé{resultCount > 1 ? 's' : ''}
        </p>
      </div>
    </section>
  )
}

// Styles prédéfinis pour les événements
export const eventCategoryStyles: Record<string, CategoryStyle> = {
  'Tous': {
    bg: 'bg-gray-200/70 dark:bg-gray-700/70',
    bgSelected: 'bg-gray-600 dark:bg-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
    textSelected: 'text-white',
  },
  'Religieux': {
    bg: 'bg-red-100/70 dark:bg-red-900/30',
    bgSelected: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    textSelected: 'text-white',
  },
  'Éducation': {
    bg: 'bg-blue-100/70 dark:bg-blue-900/30',
    bgSelected: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    textSelected: 'text-white',
  },
  'Communauté': {
    bg: 'bg-green-100/70 dark:bg-green-900/30',
    bgSelected: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    textSelected: 'text-white',
  },
  'Charité': {
    bg: 'bg-yellow-100/70 dark:bg-yellow-900/30',
    bgSelected: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
    textSelected: 'text-white',
  },
}

// Styles prédéfinis pour les activités
export const activityCategoryStyles: Record<string, CategoryStyle> = {
  'Tous': {
    bg: 'bg-gray-200/70 dark:bg-gray-700/70',
    bgSelected: 'bg-gray-600 dark:bg-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
    textSelected: 'text-white',
  },
  'Coran': {
    bg: 'bg-emerald-100/70 dark:bg-emerald-900/30',
    bgSelected: 'bg-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-300',
    textSelected: 'text-white',
  },
  'Arabe': {
    bg: 'bg-blue-100/70 dark:bg-blue-900/30',
    bgSelected: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    textSelected: 'text-white',
  },
  'École': {
    bg: 'bg-amber-100/70 dark:bg-amber-900/30',
    bgSelected: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    textSelected: 'text-white',
  },
  'Autres': {
    bg: 'bg-purple-100/70 dark:bg-purple-900/30',
    bgSelected: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    textSelected: 'text-white',
  },
}
