import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'chess-ai' })
})

// Serve built client (after npm run build in client/)
const clientDist = path.join(__dirname, '../client/dist')
app.use(express.static(clientDist))

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) res.status(404).send('Not found')
  })
})

app.listen(PORT, () => {
  console.log(`Chess Ai server running at http://localhost:${PORT}`)
  console.log(`API: http://localhost:${PORT}/api/health`)
})
