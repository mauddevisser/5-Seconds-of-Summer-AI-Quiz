import { AzureChatOpenAI } from "@langchain/openai"
import { writeFile } from "fs/promises";
import Replicate from "replicate";
const replicate = new Replicate();

export async function createSpeech(text) {
    const input = {
        text: text
    };
    const output = await replicate.run("inworld/tts-1.5-mini", { input });

    console.log(output.url());

    await writeFile("output.mp3", output);

    return output.url()
}

const model = new AzureChatOpenAI({
    temperature: 0.5,
    verbose: false,
    maxTokens: 500
})

const userChats = new Map();
const systemPrompt = {
    role: "system", content: `You are a 5 Seconds of Summer quizmaster named Anthony. Personality: Sarcastic, British and a charmer. Task: When the user starts, give a unique, sarcastic opening message and ask Question 1.
    For every following message:
    1. Evaluate if the user's previous answer was correct.
    2. Update the score (add 1 for correct, 0 for incorrect).
    3. Increment the question number.
    4. Provide sarcastic feedback.
    5. Ask the next multiple-choice question. You always respond in this exact JSON format: {"questionNumber":1, "anthonySays": "Sarcastic comment here", "question":"The 5 Seconds of Summer question", "options": ["Option A", "Option B", "Option C", "Option D"], "score":0}` }

function getUserChat(userId) {
    if (!userChats.has(userId)) {
        userChats.set(userId, [systemPrompt]);
    }
    return userChats.get(userId);
}

export async function callOpenAI(prompt, userId) {
    const messages = getUserChat(userId);

    const userMessage = prompt === "start_quiz"
        ? "Start the quiz with your introduction and the first question."
        : prompt;

    messages.push({ role: "user", content: userMessage })

    const result = await model.invoke(messages)
    messages.push({ role: "ai", content: result.content })

    try {
        const quizData = JSON.parse(result.content)
        quizData.tokens = result.usage_metadata.total_tokens
        return quizData
    } catch (error) {
        console.error("JSON parse error:", error);
        return {
            anthonySays: "Excuse me, my brain short-circuited. Try again!",
            question: "Can you repeat that?",
            score: 0,
        };
    }
}