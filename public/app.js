const button = document.querySelector("#sendButton");
const inputField = document.querySelector('#promptInput');
const chatContainer = document.querySelector("#chat-container");

let isMuted = false;
const muteButton = document.querySelector("#muteButton");

muteButton.addEventListener("click", () => {
    isMuted = !isMuted;

    if (isMuted) {
        muteButton.innerText = "Sound Off";
        muteButton.classList.replace("sound-on", "sound-off");
        window.speechSynthesis.cancel();
    } else {
        muteButton.innerText = "Sound On";
        muteButton.classList.replace("sound-off", "sound-on");
    }
});

function speak(text) {
    if (isMuted) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');

    if (britishVoice) {
        utterance.voice = britishVoice;
    }

    utterance.lang = 'en-GB';
    utterance.pitch = 0.8;
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
}

window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.lang = 'en-US';
recognition.interimResults = false;

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    inputField.value = transcript;
    button.click();
};

recognition.onerror = (event) => {
    console.error("Speechrecognition wrong:", event.error);
};

const micButton = document.querySelector("#micButton");

micButton.addEventListener("click", () => {
    recognition.start();
    micButton.innerText = "Listening...";
});

recognition.onend = () => {
    micButton.innerText = "🎤";
};

button.addEventListener("click", async () => {
    const userPrompt = inputField.value;
    if (!userPrompt) return;

    addMessage(userPrompt, 'user');
    inputField.value = "";
    await sendChat(userPrompt);
});

inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") button.click();
});

let userId = localStorage.getItem("userid");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userid", userId);
}

async function startQuiz() {
    button.disabled = true;

    try {
        const response = await fetch("./api/chat", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: "start_quiz", userId })
        });

        const data = await response.json();

        addMessage(
            data.question,
            'bot',
            true,
            data.questionNumber,
            data.anthonySays,
            data.tokens,
            data.options
        );

        if (data.anthonySays && data.question) {
            const fullText = `${data.anthonySays}. Question: ${data.question}`;
            speak(fullText);
        }

        if (data.score !== null) {
            document.querySelector("#current-score").innerText = data.score;
        }

    } catch (error) {
        console.error("Error while starting quiz:", error);
        addMessage("Anthony is not working right now", 'bot error');
    } finally {
        button.disabled = false;
    }
}

document.querySelector("#startQuizButton").addEventListener("click", () => {
    document.querySelector("#start-screen").style.display = "none";
    startQuiz();
});

const data = await fetch("./api/gethistory", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
})
const history = await data.json()

async function sendChat(prompt) {
    button.disabled = true;
    button.innerText = "...";

    try {
        const result = await fetch("./api/chat", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, userId })
        });

        const data = await result.json();

        if (data.anthonySays && data.question) {
            const fullText = `${data.anthonySays}. Next question: ${data.question}`;
            speak(fullText);
        }

        if (data.score !== null) {
            document.querySelector("#current-score").innerText = data.score;
        }

        const htmlResponse = data.question;
        addMessage(htmlResponse, 'bot', true, data.questionNumber, data.anthonySays, data.tokens, data.options);

    } catch (error) {
        console.error("Fout:", error);
        addMessage("Oops, something went wrong.", 'bot error');
    } finally {
        button.disabled = false;
        button.innerText = "Send";
    }
}

function addMessage(text, sender, isHTML = false, questionNumber = null, anthonySays = false, tokens = null, options = []) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);

    if (questionNumber !== null) {
        const questionNumberLabel = document.createElement("strong");
        questionNumberLabel.innerText = `Question ${questionNumber}`;
        questionNumberLabel.style.display = "block";
        questionNumberLabel.style.marginBottom = "5px";
        messageDiv.appendChild(questionNumberLabel);
    }

    if (anthonySays) {
        const anthonySaysLabel = document.createElement("div");
        anthonySaysLabel.innerText = `${anthonySays}`;
        anthonySaysLabel.style.display = "block";
        anthonySaysLabel.style.marginBottom = "3px";
        messageDiv.appendChild(anthonySaysLabel);
    }

    const contentDiv = document.createElement("div");
    contentDiv.innerText = text;
    if (sender === 'bot') {
        contentDiv.style.marginTop = "10px";
        contentDiv.style.padding = "8px";
        contentDiv.style.backgroundColor = "#ffffff1a";
        contentDiv.style.borderRadius = "15px";
    } else {
    }
    messageDiv.appendChild(contentDiv);

    if (options && options.length > 0) {
        const buttonContainer = document.createElement("div");
        buttonContainer.style.marginTop = "10px";
        buttonContainer.style.display = "flex";
        buttonContainer.style.flexWrap = "wrap";
        buttonContainer.style.gap = "5px";
        options.forEach(option => {
            const optionButton = document.createElement("button");
            optionButton.innerText = option;
            optionButton.classList.add("quiz-option-button");

            optionButton.onclick = () => {
                buttonContainer.remove();
                addMessage(option, 'user');
                sendChat(option);
            };
            buttonContainer.appendChild(optionButton);
        });
        messageDiv.appendChild(buttonContainer);
    }

    if (tokens !== null) {
        const tokenLabel = document.createElement("small");
        tokenLabel.innerText = ` (${tokens} Tokens)`;
        tokenLabel.style.display = "block";
        tokenLabel.style.opacity = "0.6";
        messageDiv.appendChild(tokenLabel);
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}