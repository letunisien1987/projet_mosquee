import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

/**
 * Configuration Prisma avec deux instances:
 *
 * 1. `prisma` - Client principal avec Prisma Accelerate pour le caching
 *    Utilisé pour toutes les opérations normales de l'application
 *
 * 2. `prismaForAuth` - Client basique sans extensions
 *    Requis par @next-auth/prisma-adapter qui n'est pas compatible
 *    avec les clients étendus ($extends)
 *
 * Les deux utilisent le pattern singleton pour éviter les connexions
 * multiples en développement (hot reload). Prisma Accelerate gère
 * le pool de connexions côté serveur.
 */

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate())
}

// Client pour NextAuth adapter (sans extensions pour compatibilité)
const prismaClientForAuthSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
  var prismaAuthGlobal: undefined | ReturnType<typeof prismaClientForAuthSingleton>
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export const prismaForAuth = globalThis.prismaAuthGlobal ?? prismaClientForAuthSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
  globalThis.prismaAuthGlobal = prismaForAuth
}
