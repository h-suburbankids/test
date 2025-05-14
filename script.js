const apiKEY = "AIzaSyCPKC1F6MNR7YvhDZGEhmUFPcaBSFRw-PU"; // api key should be safe
const chatbox = document.getElementById('chatbox');
let booleaner = false;
let chatHistory = [];
let isCachingEnabled = true;

function toggleCaching() {
  isCachingEnabled = document.getElementById("cacheToggle").checked;
}

function openFileExplorer() {
  document.getElementById('fileInput').click();
}

async function sendMessage() {
  function renderMathInElementSafe(el) {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }

  booleaner = true;
  const input = document.getElementById("userInput");
  const message = input.value;
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  // Don't send empty messages
  if (!message && !file) {
    return;
  }

  // Add user message to chat
  const userDiv = document.createElement("div");
  userDiv.className = "user";
  userDiv.innerHTML = `<strong>You:</strong> ${message}`;
  chatbox.appendChild(userDiv);

  // Clear input field
  input.value = "";

  let imagePart = null;
  if (file) {
    const base64String = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    const imgElement = document.createElement("img");
    imgElement.src = URL.createObjectURL(file);
    imgElement.style.maxWidth = "200px";
    userDiv.appendChild(imgElement);

    imagePart = {
      inlineData: {
        mimeType: file.type,
        data: base64String
      }
    };
  }

  // Create API request parts
  const parts = [{ text: message }];
  if (imagePart) parts.push(imagePart);
  const userContent = { role: "user", parts };

  // Add to chat history if caching is enabled
  if (isCachingEnabled) {
    chatHistory.push(userContent);
  }

  try {
    // Send request to API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=" + apiKEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: chatHistory
        })
      }
    );

    const data = await response.json();
    const rawBotMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    // Add to chat history if caching is enabled
    if (isCachingEnabled) {
      chatHistory.push({ role: "model", parts: [{ text: rawBotMessage }] });
    }

    // Parse and display bot message
    const botHtml = marked.parse(rawBotMessage);
    const botDiv = document.createElement("div");
    botDiv.className = "bot";
    botDiv.innerHTML = `<strong>Mr. GPT:</strong> ${botHtml}`;
    chatbox.appendChild(botDiv);

    // Render math expressions
    renderMathInElementSafe(botDiv);

  } catch (error) {
    console.error("Error:", error);
    const errorDiv = document.createElement("div");
    errorDiv.className = "bot";
    errorDiv.innerHTML = "<strong>Mr. GPT:</strong> Sorry, there was an error processing your request.";
    chatbox.appendChild(errorDiv);
  }

  // Scroll to bottom
  chatbox.scrollTop = chatbox.scrollHeight;
  fileInput.value = "";
}