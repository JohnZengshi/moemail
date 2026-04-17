import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0

    const chunk = (a << 16) | (b << 8) | c

    result += alphabet[(chunk >> 18) & 63]
    result += alphabet[(chunk >> 12) & 63]
    result += i + 1 < bytes.length ? alphabet[(chunk >> 6) & 63] : '='
    result += i + 2 < bytes.length ? alphabet[chunk & 63] : '='
  }

  return result
}

async function digestPassword(password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const salt = process.env.AUTH_SECRET || ''
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hashBuffer)
}

export async function hashPassword(password: string): Promise<string> {
  const digestBytes = await digestPassword(password)
  return Array.from(digestBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  const digestBytes = await digestPassword(password)
  const hexHash = Array.from(digestBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  if (hashedPassword === hexHash) {
    return true
  }

  const legacyBase64Hash = bytesToBase64(digestBytes)
  return hashedPassword === legacyBase64Hash
}
