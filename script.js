const apiKEY = "AIzaSyCPKC1F6MNR7YvhDZGEhmUFPcaBSFRw-PU"; // Api key should be safe <33
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

  // Don't send empty messages!
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

  // Add to chat history if caching is enabled (enabled by default)
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

    // Render math expressions (LaTeX (Lay-Tek))
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

const screenshotButton = document.getElementById('screenshotButton');
const pdfViewerContainer = document.getElementById('pdf-viewer-container');
let isSelecting = false;
let startX, startY, endX, endY;
let selectionOverlay;
let activeCanvasContainer = null; // To track which page is being selected

function createSelectionOverlay() {
    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'selectionOverlay';
    pdfViewerContainer.appendChild(selectionOverlay);
}

function startSelection(e) {
      isSelecting = true;
      const targetCanvasContainer = e.target.closest('.canvas-container');
      if (targetCanvasContainer) {
          activeCanvasContainer = targetCanvasContainer;
          const containerRect = activeCanvasContainer.getBoundingClientRect();
          const pdfViewerRect = pdfViewerContainer.getBoundingClientRect();

          // Calculate start coordinates relative to the page container AND the PDF viewer's scroll
          startX = e.clientX - containerRect.left;
          startY = e.clientY - containerRect.top;

          // Position the selection overlay relative to the PDF viewer container
          if (!selectionOverlay) {
              createSelectionOverlay();
              pdfViewerContainer.style.position = 'relative'; // Ensure the container is positioned
          }

          selectionOverlay.style.position = 'absolute'; // Make sure overlay is positioned absolutely within the container
          selectionOverlay.style.left = `${containerRect.left - pdfViewerRect.left + startX}px`;
          selectionOverlay.style.top = `${containerRect.top - pdfViewerRect.top + startY}px`;
          selectionOverlay.style.width = '0px';
          selectionOverlay.style.height = '0px';
          selectionOverlay.style.display = 'block';
      }
}

function updateSelection(e) {
  if (!isSelecting || !activeCanvasContainer) return;

  const containerRect = activeCanvasContainer.getBoundingClientRect();
  const pdfViewerRect = pdfViewerContainer.getBoundingClientRect();

  const currentX = e.clientX - containerRect.left;
  const currentY = e.clientY - containerRect.top;

  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);

  // Update the overlay's position based on the initial offset from the PDF viewer
  selectionOverlay.style.left = `${containerRect.left - pdfViewerRect.left + left}px`;
  selectionOverlay.style.top = `${containerRect.top - pdfViewerRect.top + top}px`;
  selectionOverlay.style.width = `${width}px`;
  selectionOverlay.style.height = `${height}px`;
}

function finishSelection() {
    if (!isSelecting) return;
    isSelecting = false;

    if (selectionOverlay && parseInt(selectionOverlay.style.width) > 0 && parseInt(selectionOverlay.style.height) > 0 && activeCanvasContainer) {
        captureSelectedPDFArea();
    }

    if (selectionOverlay) {
        selectionOverlay.style.display = 'none';
    }
    activeCanvasContainer = null; // Reset active container
}

async function captureSelectedPDFArea() {
    
    if (!activeCanvasContainer) return;

    const rect = selectionOverlay.getBoundingClientRect();
    const containerRect = activeCanvasContainer.getBoundingClientRect();

    const scaleX = window.devicePixelRatio;
    const scaleY = window.devicePixelRatio;

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(rect.width * scaleX);
    canvas.height = Math.floor(rect.height * scaleY);
    const ctx = canvas.getContext('2d');

    ctx.scale(scaleX, scaleY);

    const baseCanvas = activeCanvasContainer.querySelector('.base-layer');
    const annotationCanvas = activeCanvasContainer.querySelector('.annotation-layer');

    if (baseCanvas) {
        // 1. Draw the base PDF content
        ctx.drawImage(
            baseCanvas,
            (rect.left - containerRect.left + pdfViewerContainer.scrollLeft) * (baseCanvas.width / containerRect.width),
            (rect.top - containerRect.top + pdfViewerContainer.scrollTop) * (baseCanvas.height / containerRect.height),
            rect.width * (baseCanvas.width / containerRect.width),
            rect.height * (baseCanvas.height / containerRect.height),
            0,
            0,
            rect.width,
            rect.height
        );

        // 2. If there's an annotation layer, draw its content on top
        if (annotationCanvas) {
            ctx.drawImage(
                annotationCanvas,
                (rect.left - containerRect.left + pdfViewerContainer.scrollLeft) * (annotationCanvas.width / containerRect.width),
                (rect.top - containerRect.top + pdfViewerContainer.scrollTop) * (annotationCanvas.height / containerRect.height),
                rect.width * (annotationCanvas.width / containerRect.width),
                rect.height * (annotationCanvas.height / containerRect.height),
                0,
                0,
                rect.width,
                rect.height
            );
        }

        const base64Image = canvas.toDataURL('image/png').split(',')[1];
        await sendScreenshotToAI(base64Image);
    } else {
        console.error("Base PDF canvas not found in the selected container.");
    }
}

async function sendScreenshotToAI(base64Image) {
    const imagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: base64Image
        }
    };

    const parts = [{ text: "Analyze this part of the PDF." }, imagePart];
    const userContent = { role: "user", parts };

    if (isCachingEnabled) {
        chatHistory.push(userContent);
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent?key=${apiKEY}`,
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

        if (isCachingEnabled) {
            chatHistory.push({ role: "model", parts: [{ text: rawBotMessage }] });
        }

        const botHtml = marked.parse(rawBotMessage);
        const botDiv = document.createElement("div");
        botDiv.className = "bot";
        botDiv.innerHTML = `<strong>Mr. GPT:</strong> ${botHtml}`;
        document.getElementById('chatbox').appendChild(botDiv); // Make sure you have a chatbox
        renderMathInElementSafe(botDiv); // Ensure this function is available or remove if not needed

    } catch (error) {
        console.error("Error:", error);
        const errorDiv = document.createElement("div");
        errorDiv.className = "bot";
        //Throwing error when not supposed to ??!?
        //errorDiv.innerHTML = "<strong>Mr. GPT:</strong> Sorry, there was an error processing the PDF screenshot.";
        //document.getElementById('chatbox').appendChild(errorDiv); // Ensure you have a chatbox
    } finally {
        document.getElementById('chatbox').scrollTop = document.getElementById('chatbox').scrollHeight; // Ensure you have a chatbox
    }
}

screenshotButton.addEventListener('click', () => {
    // Start selection when the button is clicked
    pdfViewerContainer.addEventListener('mousedown', startSelection);
    pdfViewerContainer.addEventListener('mousemove', updateSelection);
    pdfViewerContainer.addEventListener('mouseup', finishSelection);
    pdfViewerContainer.addEventListener('mouseleave', finishSelection);
});