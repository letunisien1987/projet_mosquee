/**
 * Service Cloudinary pour la gestion des images
 */

import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary'

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Types pour les uploads
export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

// Dossiers pour organiser les images
export const CLOUDINARY_FOLDERS = {
  events: 'mosquee/events',
  activities: 'mosquee/activities',
  projects: 'mosquee/projects',
  team: 'mosquee/team',
  articles: 'mosquee/articles',
  gallery: 'mosquee/gallery',
  general: 'mosquee/general',
} as const

export type CloudinaryFolder = keyof typeof CLOUDINARY_FOLDERS

/**
 * Upload d'une image depuis un buffer
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder: CloudinaryFolder = 'general',
  options: Partial<UploadApiOptions> = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      folder: CLOUDINARY_FOLDERS[folder],
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ],
      ...options,
    }

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'))
          return
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
      }
    ).end(buffer)
  })
}

/**
 * Upload d'une image depuis une URL
 */
export async function uploadImageFromUrl(
  url: string,
  folder: CloudinaryFolder = 'general',
  options: Partial<UploadApiOptions> = {}
): Promise<UploadResult> {
  const uploadOptions: UploadApiOptions = {
    folder: CLOUDINARY_FOLDERS[folder],
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' }
    ],
    ...options,
  }

  const result = await cloudinary.uploader.upload(url, uploadOptions)

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  }
}

/**
 * Upload d'une image depuis un File (FormData)
 */
export async function uploadImageFromFile(
  file: File,
  folder: CloudinaryFolder = 'general',
  options: Partial<UploadApiOptions> = {}
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  return uploadImageBuffer(buffer, folder, options)
}

/**
 * Obtenir une URL d'image optimisée avec transformations
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options: {
    width?: number
    height?: number
    crop?: 'fill' | 'fit' | 'scale' | 'thumb'
    quality?: 'auto' | number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
  } = {}
): string {
  // Si c'est déjà une URL Cloudinary, on peut la transformer
  if (publicIdOrUrl.includes('cloudinary.com')) {
    // Extraire le public_id de l'URL
    const match = publicIdOrUrl.match(/\/v\d+\/(.+?)(?:\.[a-zA-Z]+)?$/)
    const publicId = match?.[1] || publicIdOrUrl

    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          quality: options.quality || 'auto',
          fetch_format: options.format || 'auto',
        }
      ],
    })
  }

  // Si c'est un public_id direct
  return cloudinary.url(publicIdOrUrl, {
    secure: true,
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: options.quality || 'auto',
        fetch_format: options.format || 'auto',
      }
    ],
  })
}

/**
 * Supprimer une image
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch {
    console.error('Erreur lors de la suppression de l\'image:', publicId)
    return false
  }
}

/**
 * Générer un placeholder blur pour une image
 */
export function getBlurPlaceholder(publicIdOrUrl: string): string {
  if (publicIdOrUrl.includes('cloudinary.com')) {
    const match = publicIdOrUrl.match(/\/v\d+\/(.+?)(?:\.[a-zA-Z]+)?$/)
    const publicId = match?.[1] || publicIdOrUrl

    return cloudinary.url(publicId, {
      secure: true,
      transformation: [
        { effect: 'blur:1000', quality: 1, width: 10 }
      ],
    })
  }

  return cloudinary.url(publicIdOrUrl, {
    secure: true,
    transformation: [
      { effect: 'blur:1000', quality: 1, width: 10 }
    ],
  })
}

export default cloudinary
