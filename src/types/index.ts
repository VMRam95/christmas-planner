// Database types

export type User = {
  id: string
  email: string
  name: string
  avatar_url: string | null
  created_at: string
}

export type Wish = {
  id: string
  user_id: string
  title: string
  description: string | null
  url: string | null
  priority: 1 | 2 | 3
  created_at: string
}

export type Assignment = {
  id: string
  wish_id: string
  assigned_by: string
  created_at: string
}

export type SurpriseGift = {
  id: string
  giver_id: string
  recipient_id: string
  title: string
  description: string | null
  url: string | null
  created_at: string
}

export type UserPreferences = {
  id: string
  user_id: string
  email_notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  read_at: string | null
  created_at: string
}

// Extended types with relations

export type WishWithAssignment = Wish & {
  assignment?: Assignment | null
  is_assigned: boolean
  assigned_by_me: boolean
}

export type AssignmentWithWish = Assignment & {
  wishes: Wish & {
    user_id: string
  }
}

export type SurpriseGiftWithRecipient = SurpriseGift & {
  recipient: {
    id: string
    name: string
  }
}

export type UserWithWishes = User & {
  wishes: Wish[]
}

// API Response types

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// Session type

export type Session = {
  user: User
  expires: string
}

// Priority labels

export const PRIORITY_LABELS: Record<Wish['priority'], string> = {
  1: 'Baja',
  2: 'Media',
  3: 'Alta',
}

export const PRIORITY_COLORS: Record<Wish['priority'], string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-christmas-gold/20 text-christmas-gold-dark',
  3: 'bg-christmas-red/20 text-christmas-red',
}
