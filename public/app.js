const btn = document.querySelector("#sendBtn");
const inputField = document.querySelector('#promptInput');
const chatContainer = document.querySelector("#chat-container");

btn.addEventListener("click", async () => {
    const userPrompt = inputField.value;
    if (!userPrompt) return;

    addMessage(userPrompt, 'user');
    inputField.value = "";
    await sendChat(userPrompt);
});

inputField.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btn.click();
});

let userId = localStorage.getItem("userid");
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("userid", userId);
}

async function startQuiz() {
    btn.disabled = true;

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

        if (data.score !== null) {
            document.querySelector("#current-score").innerText = data.score;
        }

    } catch (error) {
        console.error("Fout bij starten quiz:", error);
        addMessage("Anthony is even niet beschikbaar...", 'bot error');
    } finally {
        btn.disabled = false;
    }
}

window.onload = startQuiz;

const data = await fetch("./api/gethistory", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
})
const history = await data.json()

async function sendChat(prompt) {
    btn.disabled = true;
    btn.innerText = "...";

    try {
        const result = await fetch("./api/chat", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt, userId })
        });

        const data = await result.json();
        if (data.score !== null) {
            document.querySelector("#current-score").innerText = data.score;
        }

        const htmlResponse = data.question;
        addMessage(htmlResponse, 'bot', true, data.questionNumber, data.anthonySays, data.tokens, data.options);

    } catch (error) {
        console.error("Fout:", error);
        addMessage("Oeps, er ging iets mis.", 'bot error');
    } finally {
        btn.disabled = false;
        btn.innerText = "Send";
    }
}

function addMessage(text, sender, isHTML = false, questionNumber = null, anthonySays = false, tokens = null, options = []) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);

    if (questionNumber !== null) {
        const questionNumberLabel = document.createElement("strong");
        questionNumberLabel.innerText = `Question ${questionNumber}`;
        questionNumberLabel.style.display = "block";
        questionNumberLabel.style.marginBottom = "5px";
        msgDiv.appendChild(questionNumberLabel);
    }

    if (anthonySays) {
        const anthonySaysLabel = document.createElement("div");
        anthonySaysLabel.innerText = `${anthonySays}`;
        anthonySaysLabel.style.display = "block";
        anthonySaysLabel.style.marginBottom = "3px";
        msgDiv.appendChild(anthonySaysLabel);
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
    msgDiv.appendChild(contentDiv);

    if (options && options.length > 0) {
        const btnContainer = document.createElement("div");
        btnContainer.style.marginTop = "10px";
        btnContainer.style.display = "flex";
        btnContainer.style.flexWrap = "wrap";
        btnContainer.style.gap = "5px";
        options.forEach(option => {
            const optBtn = document.createElement("button");
            optBtn.innerText = option;
            optBtn.classList.add("quiz-option-btn");

            optBtn.onclick = () => {
                btnContainer.remove();
                addMessage(option, 'user');
                sendChat(option);
            };
            btnContainer.appendChild(optBtn);
        });
        msgDiv.appendChild(btnContainer);
    }

    if (tokens !== null) {
        const tokenLabel = document.createElement("small");
        tokenLabel.innerText = ` (${tokens} Tokens)`;
        tokenLabel.style.display = "block";
        tokenLabel.style.opacity = "0.6";
        msgDiv.appendChild(tokenLabel);
    }

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}