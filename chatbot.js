let mediaRecorder;
const audioChunks = [];
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IndlYXJlZWR0QGdtYWlsLmNvbSIsInV1aWQiOiJlMTZiOGQ1Ny1jZDZmLTRkMTgtYmI1Mi00MWU1M2Y1ZjEzNDAifQ.qoFhT-sOQ96BU5tLXq2LExLDk5-Ab11VBy0fdCfFbgA'; // Replace with your actual API key
const chatApiUrl = 'https://api.mesolitica.com/chat/completions';

// Toggle chat frame visibility
document.getElementById('toggle-frame').addEventListener('click', () => {
    const chatContent = document.getElementById('chat-content');
    chatContent.classList.toggle('hidden');
    const buttonText = chatContent.classList.contains('hidden') ? 'Open Chat' : 'Close Chat';
    document.getElementById('toggle-frame').textContent = buttonText;
});

let recordingText = document.getElementById('recording-status');

// Start recording audio
document.getElementById('start-recording').addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.start();
    document.getElementById('start-recording').disabled = true;
    document.getElementById('stop-recording').disabled = false;
    
    // Show recording status
    recordingText.style.display = 'block'; 

    console.log("Starting recording...");

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        console.log("Recording stopped.");
        recordingText.style.display = 'none';
        const audioBlob = new Blob(audioChunks);
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', 'base');  // Adjust based on your transcription model

        try {
            const response = await fetch('https://api.mesolitica.com/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error transcribing audio: ' + response.statusText);
            
            const transcriptionResult = await response.json();
            const transcription = transcriptionResult.text || transcriptionResult; // Adjust based on actual response structure
            console.log("Transcription result:", transcription);

            appendMessage('You: ' + transcription);
            await sendMessageToBot(transcription);  // Send transcription to chatbot API

        } catch (error) {
            console.error("Transcription error:", error);
            appendMessage('Error: ' + error.message);
        }

        // Clear the audio chunks for the next recording
        audioChunks.length = 0; 
        document.getElementById('start-recording').disabled = false;
        document.getElementById('stop-recording').disabled = true;
    };
});

// Stop recording audio
document.getElementById('stop-recording').addEventListener('click', () => {
    mediaRecorder.stop();
});

// Clear the chat
document.getElementById('clear-chat').addEventListener('click', () => {
    const outputDiv = document.getElementById('chat-output');
    outputDiv.innerHTML = '';  // Clear previous chat messages
});

// Send message from user input to bot
document.getElementById('send-message').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    appendMessage('You: ' + userInput);
    await sendMessageToBot(userInput);
    document.getElementById('user-input').value = '';  // Clear input field after sending
});

// Send message to bot
async function sendMessageToBot(message) {
    const chatData = {
        model: "mallam-small",  // Your chatbot model
        messages: [{ role: "user", content: message }]
    };

    try {
        const response = await fetch(chatApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatData)
        });

        if (!response.ok) throw new Error('Error fetching chat response: ' + response.statusText);
        
        const chatResponse = await response.json();
        const botMessage = chatResponse.choices[0].message.content; // Adjust based on response structure
        appendMessage('Bot: ' + botMessage);

    } catch (error) {
        console.error("Chatbot error:", error);
        appendMessage('Error: ' + error.message);
    }
}

// Append a message to the chat window
function appendMessage(message) {
    const outputDiv = document.getElementById('chat-output');
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    outputDiv.appendChild(messageElement);
    outputDiv.scrollTop = outputDiv.scrollHeight;  // Auto scroll to the latest message
}
