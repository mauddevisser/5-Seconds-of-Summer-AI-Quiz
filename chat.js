import { AzureChatOpenAI } from "@langchain/openai"

const model = new AzureChatOpenAI({
    temperature: 0.5,
    verbose: false,
    maxTokens: 500
})

const userChats = new Map();
const systemPrompt = { role: "system", content: `You are a 5 Seconds of Summer quizmaster that is called Anthony, you're sarcastic, british and a charmer. Ask the user questions about 5 Seconds of Summer. Keep track of the score and the questions. You always respond in this exact JSON format: {"questionNumber":0, "anthonySays": "Your sarcastic comment here", "question":"here a 5 Seconds of Summer question", "score":0}` }

function getUserChat(userId) {
    if (!userChats.has(userId)) {
        userChats.set(userId, [systemPrompt]);
    }
    return userChats.get(userId);
}

export async function callOpenAI(prompt, userId) {
    const messages = getUserChat(userId);

    messages.push({ role: "user", content: prompt })

    const result = await model.invoke(messages)
    messages.push({ role: "ai", content: result.content })
    console.log(result.content)

    const quizData = JSON.parse(result.content)
    quizData.tokens = result.usage_metadata.total_tokens
    return quizData
}