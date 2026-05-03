// ==============================
// 🔐 CONTROLE DE SESSÃO GLOBAL
// ==============================

import { supabase } from './supabase-config.js'

// ==============================
// 👤 PEGAR USUÁRIO LOGADO
// ==============================
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ==============================
// 🚪 REDIRECIONAR SE NÃO LOGADO
// ==============================
export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    window.location.href = '/login.html'
    return null
  }

  return user
}

// ==============================
// 👑 VERIFICAR SE É ADMIN
// ==============================
export async function isAdmin() {
  const user = await getUser()
  if (!user) return false

  const { data } = await supabase
    .from('users')
    .select('perfil')
    .eq('id', user.id)
    .single()

  return data?.perfil === 'admin'
}

// ==============================
// 🚀 REDIRECIONAMENTO INTELIGENTE
// ==============================
export async function redirectByRole() {
  const admin = await isAdmin()

  if (admin) {
    window.location.href = '/admin.html'
  } else {
    window.location.href = '/game.html'
  }
}

// ==============================
// 📊 PEGAR PERFIL COMPLETO
// ==============================
export async function getProfile() {
  const user = await getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

// ==============================
// 🚪 LOGOUT
// ==============================
export async function logout() {
  await supabase.auth.signOut()
  window.location.href = '/login.html'
}

// ==============================
// 📸 ATUALIZAR FOTO PERFIL
// ==============================
export async function updateProfilePhoto(file) {
  const formData = new FormData()
  formData.append('foto', file)

  const res = await fetch('/api/admin/upload-photo', {
    method: 'POST',
    body: formData
  })

  const data = await res.json()

  const user = await getUser()

  await supabase
    .from('users')
    .update({ foto_url: data.url })
    .eq('id', user.id)

  return data.url
}

// ==============================
// 💬 CRIAR COMENTÁRIO
// ==============================
export async function criarComentario(texto) {
  const user = await getUser()

  await supabase
    .from('cmte_comentarios')
    .insert({
      piloto_id: user.id,
      texto: texto
    })
}

// ==============================
// 📥 LISTAR COMENTÁRIOS
// ==============================
export async function listarComentarios() {
  const user = await getUser()

  const { data } = await supabase
    .from('cmte_comentarios')
    .select('*')
    .eq('piloto_id', user.id)
    .order('created_at', { ascending: false })

  return data
}

// ==============================
// ✈️ BUSCAR HORAS REAIS
// ==============================
export async function getHorasReais() {
  const user = await getUser()

  const { data } = await supabase
    .from('flight_hours_logs')
    .select('*')
    .eq('piloto_id', user.id)
    .order('created_at', { ascending: false })

  return data
}
