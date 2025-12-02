import { supabase } from './client'
import { createServerClient } from './server'

import type { User, Wish, Assignment, SurpriseGift, WishWithAssignment } from '@/types'

// ============== USER QUERIES ==============

/**
 * Get all family members
 */
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (error) throw error
  return data as User[]
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as User
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error) return null
  return data as User
}

// ============== WISH QUERIES ==============

/**
 * Get wishes for a user
 */
export async function getWishesByUserId(userId: string): Promise<Wish[]> {
  const { data, error } = await supabase
    .from('wishes')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Wish[]
}

/**
 * Get wishes with assignment info (for viewing others' lists)
 */
export async function getWishesWithAssignments(
  userId: string,
  currentUserId: string
): Promise<WishWithAssignment[]> {
  const { data: wishes, error: wishError } = await supabase
    .from('wishes')
    .select('*')
    .eq('user_id', userId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (wishError) throw wishError

  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('*')
    .in(
      'wish_id',
      (wishes as Wish[]).map((w) => w.id)
    )

  if (assignError) throw assignError

  return (wishes as Wish[]).map((wish) => {
    const assignment = (assignments as Assignment[]).find((a) => a.wish_id === wish.id)
    return {
      ...wish,
      assignment,
      is_assigned: !!assignment,
      assigned_by_me: assignment?.assigned_by === currentUserId,
    }
  })
}

/**
 * Create a new wish
 */
export async function createWish(
  wish: Omit<Wish, 'id' | 'created_at'>
): Promise<Wish> {
  const { data, error } = await supabase
    .from('wishes')
    .insert(wish)
    .select()
    .single()

  if (error) throw error
  return data as Wish
}

/**
 * Update a wish
 */
export async function updateWish(
  id: string,
  updates: Partial<Omit<Wish, 'id' | 'user_id' | 'created_at'>>
): Promise<Wish> {
  const { data, error } = await supabase
    .from('wishes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Wish
}

/**
 * Delete a wish
 */
export async function deleteWish(id: string): Promise<void> {
  const { error } = await supabase.from('wishes').delete().eq('id', id)
  if (error) throw error
}

// ============== ASSIGNMENT QUERIES ==============

/**
 * Assign a wish to current user
 */
export async function assignWish(wishId: string, userId: string): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .insert({ wish_id: wishId, assigned_by: userId })
    .select()
    .single()

  if (error) throw error
  return data as Assignment
}

/**
 * Unassign a wish
 */
export async function unassignWish(wishId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('wish_id', wishId)
    .eq('assigned_by', userId)

  if (error) throw error
}

/**
 * Get all assignments by a user
 */
export async function getAssignmentsByUser(userId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('assigned_by', userId)

  if (error) throw error
  return data as Assignment[]
}

// ============== SURPRISE GIFT QUERIES ==============

/**
 * Get surprise gifts given by a user
 */
export async function getSurpriseGiftsByGiver(giverId: string): Promise<SurpriseGift[]> {
  const { data, error } = await supabase
    .from('surprise_gifts')
    .select('*')
    .eq('giver_id', giverId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as SurpriseGift[]
}

/**
 * Get surprise gifts for a recipient (only visible to others, not the recipient)
 */
export async function getSurpriseGiftsForRecipient(
  recipientId: string,
  excludeUserId: string
): Promise<SurpriseGift[]> {
  const { data, error } = await supabase
    .from('surprise_gifts')
    .select('*')
    .eq('recipient_id', recipientId)
    .neq('giver_id', excludeUserId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as SurpriseGift[]
}

/**
 * Create a surprise gift
 */
export async function createSurpriseGift(
  gift: Omit<SurpriseGift, 'id' | 'created_at'>
): Promise<SurpriseGift> {
  const { data, error } = await supabase
    .from('surprise_gifts')
    .insert(gift)
    .select()
    .single()

  if (error) throw error
  return data as SurpriseGift
}

/**
 * Delete a surprise gift
 */
export async function deleteSurpriseGift(id: string, giverId: string): Promise<void> {
  const { error } = await supabase
    .from('surprise_gifts')
    .delete()
    .eq('id', id)
    .eq('giver_id', giverId)

  if (error) throw error
}
