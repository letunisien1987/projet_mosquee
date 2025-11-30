import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { apiVersion, dataset, projectId, token } from '@/sanity/env'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export const client = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn: false,
  // token, // Temporarily disable token to test if public read access works
})

export const writeClient = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn: false,
  token,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Helper functions pour récupérer les données Sanity

export async function getEvents(published = true) {
  return client.fetch(
    `*[_type == "event" ${published ? '&& published == true' : ''}] | order(startDate desc)`
  )
}

export async function getActivities(active = true) {
  return client.fetch(
    `*[_type == "activity" ${active ? '&& active == true' : ''}] | order(category asc)`
  )
}

export async function getArticles(published = true) {
  return client.fetch(
    `*[_type == "article" ${published ? '&& published == true' : ''}] | order(publishedAt desc)`
  )
}

export async function getTeamMembers(active = true) {
  return client.fetch(
    `*[_type == "teamMember" ${active ? '&& active == true' : ''}] | order(order asc)`
  )
}

export async function getProjects(active = true) {
  return client.fetch(
    `*[_type == "project" ${active ? '&& active == true' : ''}] | order(priority asc)`
  )
}

export async function getMosqueSettings() {
  const settings = await client.fetch(`*[_type == "mosqueSettings"][0]`)
  return settings
}

export async function getPrayerSettings() {
  const settings = await client.fetch(`*[_type == "prayerSettings"][0]`)
  return settings
}

export async function getPrayerOverrides(date?: string) {
  if (date) {
    return client.fetch(
      `*[_type == "prayerOverride" && active == true && (
        type == "permanent" ||
        (type == "single" && startDate == $date) ||
        (type == "range" && startDate <= $date && endDate >= $date)
      )]`,
      { date }
    )
  }
  return client.fetch(`*[_type == "prayerOverride" && active == true]`)
}

export async function getJumuaMessages() {
  const today = new Date().toISOString().split('T')[0]
  return client.fetch(
    `*[_type == "jumuaMessage" && isActive == true && (
      !defined(validFrom) || validFrom <= $today
    ) && (
      !defined(validUntil) || validUntil >= $today
    )] | order(order asc) {
      _id,
      title,
      message,
      image {
        asset-> {
          _id,
          url
        },
        alt
      },
      times,
      order
    }`,
    { today }
  )
}
