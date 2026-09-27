import 'dotenv/config' // .env ファイルの内容を process.env に読み込む
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json()) // JSON形式のリクエストを受け取れるようにする

// 動作確認用：サーバーが起動しているかを返す
app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
