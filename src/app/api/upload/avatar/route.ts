import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

import type { NextRequest } from 'next/server'

const BUCKET_NAME = 'christmas-avatars'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Create a separate client for storage (doesn't need schema config)
function createStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey)
}

// POST - Upload avatar image
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!(file instanceof File) || !file.size) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El archivo es muy grande. Máximo 2MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[file.type]
    const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const validImage = file.type === 'image/png' ? buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : file.type === 'image/jpeg' ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
      : file.type === 'image/gif' ? ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString())
      : buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
    if (!validImage) return NextResponse.json({ success: false, error: 'El archivo no corresponde al formato de imagen indicado' }, { status: 400 })
    const supabase = createStorageClient()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Error al subir imagen' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      data: { url: publicUrl },
    })
  } catch (error) {
    console.error('Error in avatar upload:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Delete avatar image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL es requerida' },
        { status: 400 }
      )
    }

    if (url !== session.user.avatar_url) return NextResponse.json({ success: false, error: 'No puedes eliminar una foto ajena' }, { status: 403 })
    const prefix = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/' + BUCKET_NAME + '/'
    if (!url.startsWith(prefix)) return NextResponse.json({ success: false, error: 'URL inválida' }, { status: 400 })
    const fileName = url.slice(prefix.length)
    if (!fileName || fileName.includes('..') || fileName.includes('?')) return NextResponse.json({ success: false, error: 'URL inválida' }, { status: 400 })

    const supabase = createStorageClient()

    const { count, error: referencesError } = await supabase.schema('christmas_planner').from('users').select('id', { count: 'exact', head: true }).eq('avatar_url', url).neq('id', session.user.id)
    if (referencesError) return NextResponse.json({ success: false, error: 'No se pudo comprobar el uso de la foto' }, { status: 500 })
    // A legacy/shared image must survive while another family profile references it.
    if (count) return NextResponse.json({ success: true, data: { retained: true } })
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (error) {
      console.error('Error deleting avatar:', error)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar imagen' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Error in avatar delete:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
