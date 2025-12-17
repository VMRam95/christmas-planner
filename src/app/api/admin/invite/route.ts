import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email/client'

const ADMIN_EMAIL = 'victor.95.manuel@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://christmas-planner.vercel.app'

// Helper to verify admin access
async function isAdmin() {
  const session = await getSession()
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return false
  }
  return true
}

// POST - Send invitation email to a family member (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Nombre y email son requeridos' },
        { status: 400 }
      )
    }

    // Send invitation email using email-service
    const result = await sendEmail({
      to: email,
      template: 'christmas-planner/invitation',
      data: {
        to_name: name,
        to_email: email,
        app_url: APP_URL,
      },
    })

    if (!result.success) {
      console.error('Error sending invitation:', result.error)
      return NextResponse.json(
        { success: false, error: result.error || 'Error al enviar la invitación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Invitación enviada a ${email}`,
    })
  } catch (error) {
    console.error('Error in invite API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
