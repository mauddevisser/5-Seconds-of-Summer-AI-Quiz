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

        console.log(data.question)
        console.log(data.questionNumber)
        console.log(data.score)
        console.log(data.tokens)
        console.log(data.anthonySays)

        const htmlResponse = data.question;
        addMessage(htmlResponse, 'bot', true, data.questionNumber, data.anthonySays, data.tokens);

    } catch (error) {
        console.error("Fout:", error);
        addMessage("Oeps, er ging iets mis.", 'bot error');
    } finally {
        btn.disabled = false;
        btn.innerText = "Send";
    }
}

function addMessage(text, sender, isHTML = false, questionNumber = null, anthonySays = false, tokens = null) {
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
    if (isHTML) {
        contentDiv.innerHTML = text;
        contentDiv.style.marginBottom = "3px";
    } else {
        contentDiv.innerText = text;
        contentDiv.style.marginBottom = "3px";
    }
    msgDiv.appendChild(contentDiv);


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