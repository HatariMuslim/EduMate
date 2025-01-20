document.addEventListener("DOMContentLoaded", function () {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const voiceButton = document.getElementById("voiceButton");
  const clearButton = document.getElementById("clearButton");
  const chatMessages = document.getElementById("chatMessages");
  const faqQuestions = document.querySelectorAll(".faq-question");

  let isRecording = false;
  let recognition = null;

  // Initialize speech recognition
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "id-ID";

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      messageInput.value = transcript;
      toggleRecording();
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      toggleRecording();
    };
  }

  function toggleRecording() {
    isRecording = !isRecording;
    if (isRecording) {
      recognition.start();
      voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
      voiceButton.classList.add("recording");
    } else {
      recognition.stop();
      voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceButton.classList.remove("recording");
    }
  }

  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user" : "bot"}`;
    messageDiv.innerHTML = `
      <div class="avatar">
        <i class="fas ${isUser ? "fa-user" : "fa-graduation-cap"}"></i>
      </div>
      <div class="message-content">${content}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSubmit() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    messageInput.value = "";

    try {
      // Show loading state
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "message bot";
      loadingDiv.innerHTML = `
        <div class="avatar">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div class="message-content">Sedang memproses...</div>
      `;
      chatMessages.appendChild(loadingDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Send message to backend
      const response = await fetch("/chat.html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
      });

      const data = await response.json();

      // Remove loading message
      chatMessages.removeChild(loadingDiv);

      if (data.error) {
        addMessage(
          "Maaf, terjadi kesalahan dalam memproses pesan Anda.",
          false
        );
      } else {
        addMessage(data.answer, false);
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage(
        "Maaf, terjadi kesalahan dalam komunikasi dengan server.",
        false
      );
    }
  }

  // Handle all FAQ questions
  faqQuestions.forEach((question) => {
    question.addEventListener("click", async function () {
      const message = this.querySelector("span").textContent;

      // Add user message
      addMessage(message, true);

      try {
        // Show loading state
        const loadingDiv = document.createElement("div");
        loadingDiv.className = "message bot";
        loadingDiv.innerHTML = `
          <div class="avatar">
            <i class="fas fa-graduation-cap"></i>
          </div>
          <div class="message-content">Sedang memproses...</div>
        `;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send message to backend
        const response = await fetch("/chat.html", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message }),
        });

        const data = await response.json();

        // Remove loading message
        chatMessages.removeChild(loadingDiv);

        if (data.error) {
          addMessage(
            "Maaf, terjadi kesalahan dalam memproses pesan Anda.",
            false
          );
        } else {
          addMessage(data.answer, false);
        }
      } catch (error) {
        console.error("Error:", error);
        addMessage(
          "Maaf, terjadi kesalahan dalam komunikasi dengan server.",
          false
        );
      }
    });
  });

  // Clear chat history
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      // Keep only the first welcome message
      const welcomeMessage = chatMessages.firstElementChild;
      chatMessages.innerHTML = "";
      if (welcomeMessage) {
        chatMessages.appendChild(welcomeMessage);
      }
    });
  }

  // Voice button click handler
  if (voiceButton) {
    voiceButton.addEventListener("click", function () {
      if (!recognition) {
        addMessage(
          "Maaf, browser Anda tidak mendukung fitur speech recognition.",
          false
        );
        return;
      }
      toggleRecording();
    });
  }

  // Send button click handler
  if (sendButton) {
    sendButton.addEventListener("click", handleSubmit);
  }

  // Enter key handler
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    });

    // Update send button state based on input
    messageInput.addEventListener("input", () => {
      if (sendButton) {
        sendButton.disabled = !messageInput.value.trim();
      }
    });
  }
});
