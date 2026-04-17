import express from "express"
import { callOpenAI } from "./chat.js"

const app = express()
app.use(express.json())

app.use(express.static("public"))

app.post("/api/chat", async (req, res) => {
    const { prompt, userId } = req.body
    console.log(`user asked for ${prompt}`)
    const result = await callOpenAI(prompt, userId)
    res.json(result)
})

app.listen(3000, () => console.log("Server started on localhost:3000"))