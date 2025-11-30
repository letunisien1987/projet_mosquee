import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate())
}

// Prisma client for NextAuth adapter (without extensions)
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
