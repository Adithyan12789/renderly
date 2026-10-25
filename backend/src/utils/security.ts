import crypto from 'node:crypto'

const SECRET = process.env.SESSION_SECRET || 'renderly-secure-session-key-dev-2026'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, combined: string): boolean {
  try {
    const [salt, key] = combined.split(':')
    if (!salt || !key) return false
    const keyBuffer = Buffer.from(key, 'hex')
    const derivedKey = crypto.scryptSync(password, salt, 64)
    return crypto.timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

export function createToken(userId: string, expiresInDays = 30): string {
  const payload = JSON.stringify({
    uid: userId,
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  })
  const base64Payload = Buffer.from(payload).toString('base64url')
  const signature = crypto.createHmac('sha256', SECRET).update(base64Payload).digest('base64url')
  return `${base64Payload}.${signature}`
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [base64Payload, signature] = token.split('.')
    if (!base64Payload || !signature) return null

    const expectedSignature = crypto.createHmac('sha256', SECRET).update(base64Payload).digest('base64url')
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf-8'))
    if (typeof payload.exp === 'number' && payload.exp < Date.now()) {
      return null
    }

    if (typeof payload.uid === 'string') {
      return { userId: payload.uid }
    }
    return null
  } catch {
    return null
  }
}
