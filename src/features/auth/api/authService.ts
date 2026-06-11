import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/database'
import type { AuthUser, User, UserRole } from '@/lib/db/types'
import {
  getPersistentItem,
  removePersistentItem,
  setPersistentItem,
} from '@/shared/utils/persistentStorage'

const BCRYPT_ROUNDS = 12
const SESSION_HOURS = 8
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

const SESSION_TOKEN_KEY = 'tofu_auth_token'

interface LoginAttemptState {
  count: number
  lockedUntil: number | null
}

const loginAttempts = new Map<string, LoginAttemptState>()

function getAttemptState(username: string): LoginAttemptState {
  const existing = loginAttempts.get(username)
  if (existing) {
    if (existing.lockedUntil && Date.now() >= existing.lockedUntil) {
      const reset: LoginAttemptState = { count: 0, lockedUntil: null }
      loginAttempts.set(username, reset)
      return reset
    }
    return existing
  }

  const initial: LoginAttemptState = { count: 0, lockedUntil: null }
  loginAttempts.set(username, initial)
  return initial
}

function recordFailedAttempt(username: string): void {
  const state = getAttemptState(username)
  const nextCount = state.count + 1

  if (nextCount >= MAX_LOGIN_ATTEMPTS) {
    loginAttempts.set(username, {
      count: nextCount,
      lockedUntil: Date.now() + LOCKOUT_MINUTES * 60 * 1000,
    })
    return
  }

  loginAttempts.set(username, { count: nextCount, lockedUntil: null })
}

function clearFailedAttempts(username: string): void {
  loginAttempts.delete(username)
}

function getLockoutMessage(username: string): string | null {
  const state = getAttemptState(username)
  if (!state.lockedUntil || Date.now() >= state.lockedUntil) {
    return null
  }

  const minutesLeft = Math.ceil((state.lockedUntil - Date.now()) / 60000)
  return `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id!,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}

function createSessionToken(): string {
  return crypto.randomUUID()
}

function getSessionExpiry(): Date {
  return new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)
}

export async function hasUsers(): Promise<boolean> {
  const count = await db.users.count()
  return count > 0
}

export async function createUser(input: {
  username: string
  password: string
  displayName: string
  role: UserRole
}): Promise<AuthUser> {
  const username = normalizeUsername(input.username)
  const existing = await db.users.where('username').equals(username).first()

  if (existing) {
    throw new Error('Username already exists')
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  const now = new Date()
  const passwordHash = await hashPassword(input.password)

  const id = (await db.users.add({
    username,
    passwordHash,
    displayName: input.displayName.trim(),
    role: input.role,
    createdAt: now,
    updatedAt: now,
  })) as number

  return {
    id,
    username,
    displayName: input.displayName.trim(),
    role: input.role,
  }
}

export async function login(
  username: string,
  password: string,
): Promise<AuthUser> {
  const normalized = normalizeUsername(username)
  const lockoutMessage = getLockoutMessage(normalized)

  if (lockoutMessage) {
    throw new Error(lockoutMessage)
  }

  const user = await db.users.where('username').equals(normalized).first()

  if (!user) {
    recordFailedAttempt(normalized)
    throw new Error('Invalid username or password')
  }

  const valid = await verifyPassword(password, user.passwordHash)

  if (!valid) {
    recordFailedAttempt(normalized)
    throw new Error('Invalid username or password')
  }

  clearFailedAttempts(normalized)

  const token = createSessionToken()
  const expiresAt = getSessionExpiry()

  await db.sessions.add({
    token,
    userId: user.id!,
    expiresAt,
    createdAt: new Date(),
  })

  await setPersistentItem(SESSION_TOKEN_KEY, token)

  return toAuthUser(user)
}

export async function logout(): Promise<void> {
  const token = await getPersistentItem(SESSION_TOKEN_KEY)

  if (token) {
    await db.sessions.where('token').equals(token).delete()
  }

  await removePersistentItem(SESSION_TOKEN_KEY)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getPersistentItem(SESSION_TOKEN_KEY)
  if (!token) {
    return null
  }

  const session = await db.sessions.where('token').equals(token).first()
  if (!session || session.expiresAt.getTime() <= Date.now()) {
    if (session) {
      await db.sessions.delete(session.id!)
    }
    await removePersistentItem(SESSION_TOKEN_KEY)
    return null
  }

  const user = await db.users.get(session.userId)
  if (!user) {
    await db.sessions.where('token').equals(token).delete()
    await removePersistentItem(SESSION_TOKEN_KEY)
    return null
  }

  return toAuthUser(user)
}

export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date()
  await db.sessions.where('expiresAt').below(now).delete()
}
