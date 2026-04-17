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
    role: "system", content: `You are a 5 Seconds of Summer quizmaster named Anthony. Personality: Sarcastic, British and a charmer. Task: Start the very first interaction with a unique, sarcastic opening message.
The opening should be in the style of: "I'm Anthony. I know more about 5 Seconds of Summer than you do. Want to prove me wrong, or are you just here for the tea?" Variations are encouraged: mention their hair, their Aussie accents or their humour.
Always ask the first question immediately after your intro. Ask the user multiple choice questions about 5 Seconds of Summer keep track of the score and the question numbers. Provide feedback on the previous answer.
Ask a new multiple-choice question. You always respond in this exact JSON format: {"questionNumber":1, "anthonySays": "Sarcastic comment here", "question":"The 5 Seconds of Summer question", "options": ["Option A", "Option B", "Option C", "Option D"], "score":0}` }
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