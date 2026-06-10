import bcrypt from 'bcryptjs'
import { db } from '../db/database'
import type { Employee, User, UserRole } from '../db/types'

const BCRYPT_ROUNDS = 12

export type EmployeeCreateInput = {
  username: string
  password: string
  displayName: string
  role: UserRole
}

export type EmployeeUpdateInput = {
  username: string
  displayName: string
  role: UserRole
  password?: string
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

function toEmployee(user: User): Employee {
  return {
    id: user.id!,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

async function countAdmins(): Promise<number> {
  return db.users.where('role').equals('admin').count()
}

async function isUsernameTaken(username: string, excludeId?: number): Promise<boolean> {
  const normalized = normalizeUsername(username)
  const existing = await db.users.where('username').equals(normalized).first()
  return Boolean(existing && existing.id !== excludeId)
}

export async function listEmployees(): Promise<Employee[]> {
  const users = await db.users.orderBy('createdAt').toArray()
  return users.map(toEmployee)
}

export async function createEmployee(input: EmployeeCreateInput): Promise<Employee> {
  const username = normalizeUsername(input.username)

  if (!input.displayName.trim()) {
    throw new Error('Display name is required')
  }

  if (!username) {
    throw new Error('Username is required')
  }

  if (input.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  if (await isUsernameTaken(username)) {
    throw new Error('Username already exists')
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

  const created = await db.users.get(id)
  if (!created) {
    throw new Error('Failed to create employee')
  }

  return toEmployee(created)
}

export async function updateEmployee(
  id: number,
  input: EmployeeUpdateInput,
): Promise<Employee> {
  const existing = await db.users.get(id)

  if (!existing) {
    throw new Error('Employee not found')
  }

  const username = normalizeUsername(input.username)

  if (!input.displayName.trim()) {
    throw new Error('Display name is required')
  }

  if (!username) {
    throw new Error('Username is required')
  }

  if (await isUsernameTaken(username, id)) {
    throw new Error('Username already exists')
  }

  if (existing.role === 'admin' && input.role !== 'admin') {
    const adminCount = await countAdmins()
    if (adminCount <= 1) {
      throw new Error('At least one admin account is required')
    }
  }

  const updates: Partial<User> = {
    username,
    displayName: input.displayName.trim(),
    role: input.role,
    updatedAt: new Date(),
  }

  if (input.password?.trim()) {
    if (input.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
    updates.passwordHash = await hashPassword(input.password)
    await db.sessions.where('userId').equals(id).delete()
  }

  await db.users.update(id, updates)

  const updated = await db.users.get(id)
  if (!updated) {
    throw new Error('Failed to update employee')
  }

  return toEmployee(updated)
}

export async function deleteEmployee(id: number, currentUserId: number): Promise<void> {
  if (id === currentUserId) {
    throw new Error('You cannot delete your own account')
  }

  const existing = await db.users.get(id)

  if (!existing) {
    throw new Error('Employee not found')
  }

  if (existing.role === 'admin') {
    const adminCount = await countAdmins()
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin account')
    }
  }

  await db.sessions.where('userId').equals(id).delete()
  await db.users.delete(id)
}
