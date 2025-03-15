document.getElementById("voice-search-btn").addEventListener("click", () => {
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    
    recognition.onstart = function() {
        document.getElementById("news-topic").placeholder = "Listening...";
    };

    recognition.onspeechend = function() {
        document.getElementById("news-topic").placeholder = "Processing...";
        recognition.stop();
    };

    recognition.onresult = function(event) {
        let transcript = event.results[0][0].transcript;
        document.getElementById("news-topic").value = transcript;
        fetchNews(); // Automatically search after speech input
    };

    recognition.start();
});