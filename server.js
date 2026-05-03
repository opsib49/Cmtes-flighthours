import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static('public'))

// ============================
// 🔐 CONFIG SUPABASE
// ============================
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const headers = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json'
}

// ============================
// 📸 UPLOAD DE IMAGEM
// ============================
const storage = multer.memoryStorage()
const upload = multer({ storage })

// ============================
// ❤️ HEALTH CHECK
// ============================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// ============================
// 👤 DADOS DO USUÁRIO LOGADO
// ============================
app.get('/api/me', async (req, res) => {
  // ⚠️ aqui simplificado (depois podemos validar JWT)
  res.json({
    user: {
      perfil: 'cmte' // ou 'admin'
    }
  })
})

// ============================
// ✈️ REGISTRAR HORAS DE VOO
// ============================
app.post('/api/admin/flight-hours', async (req, res) => {
  try {
    const {
      user_id,
      horimetro_inicial,
      horimetro_final,
      foto_url
    } = req.body

    const horas = horimetro_final - horimetro_inicial

    // salvar no banco
    await fetch(`${SUPABASE_URL}/rest/v1/flight_hours`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id,
        horimetro_inicial,
        horimetro_final,
        horas,
        foto_url
      })
    })

    // somar horas no usuário
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        horas_reais: horas
      })
    })

    res.json({ ok: true, horas })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================
// 📸 UPLOAD FOTO DO REGISTRO
// ============================
app.post('/api/admin/upload-photo', upload.single('foto'), async (req, res) => {
  try {
    const file = req.file

    // aqui você pode integrar com:
    // 👉 Supabase Storage
    // 👉 AWS S3
    // 👉 Cloudinary

    // SIMULA URL (depois vamos conectar real)
    const fakeUrl = `https://fake-storage.com/${Date.now()}.jpg`

    res.json({ url: fakeUrl })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================
// 🧠 OCR FUTURO (HORÍMETRO)
// ============================
app.post('/api/admin/extract-hours', upload.single('foto'), async (req, res) => {
  try {
    // 🔥 aqui depois você pode usar:
    // Google Vision API
    // Azure OCR
    // AWS Textract

    // exemplo fake:
    res.json({
      horimetro_inicial: 2025.5,
      horimetro_final: 2029.5
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ============================
// 🚀 START SERVER
// ============================
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
})
