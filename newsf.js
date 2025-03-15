document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});

let newsData = {}; // Store news details globally
let newsPage = 1;
let videoPage = "";
let currentTopic = "";
let isFetching = false;
let showingVideos = false;

// **Fetch News Articles using GNews API**
async function fetchNews(loadMore = false) {
    let topic = document.getElementById('news-topic').value.trim();
    if (!topic) {
        alert("Please enter a news topic.");
        return;
    }

    if (!loadMore) {
        newsPage = 1;
        currentTopic = topic;
        document.getElementById('news-container').innerHTML = '';
        document.getElementById('video-container').style.display = "none";
    }

    let apiUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=5&page=${newsPage}&apikey=f31aa4467d00caf224e8daf13754f6dc`;

    try {
        let response = await fetch(apiUrl);
        let data = await response.json();

        if (!data.articles || data.articles.length === 0) {
            alert("No more news found!");
            return;
        }

        let newsContainer = document.getElementById('news-container');

        for (let index = 0; index < data.articles.length; index++) {
            let article = data.articles[index];

            // **AI Summary Fetching**
            let summary = await getAISummary(article.description || article.content || "No description available.");

            newsData[index] = {
                title: article.title,
                content: article.content,
                image: article.image,
                source: article.source.name,
                url: article.url
            };

            let newsCard = document.createElement('div');
            newsCard.classList.add('news-article');
            newsCard.innerHTML = `
                <h3>${article.title}</h3>
                <p>${summary}</p>
                <img src="${article.image || 'placeholder.jpg'}" alt="News Image">
                <p><strong>Source:</strong> ${article.source.name}</p>
                <button onclick="openDetails(${index})">Read More</button>
                <button onclick="readSummary('${summary}')">🔊 Listen</button>
                <button onclick="shareSummary('${summary}')">📤 Share</button>
            `;
            newsContainer.appendChild(newsCard);
        }

        newsPage++;
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

// **AI-Powered Summarization**
async function getAISummary(text) {
    if (!text) return "No description available.";

    let metaAiUrl = "https://api.meta.ai/v1/models/llama2-7b/chat";
    let apiKey = "LA-812157947b4a474da2934da9dd30330d1c70cd7833e04100ae6708f3fe9f0fee"; // Replace with your actual API Key

    let requestData = {
        prompt: `Summarize this news article: ${text}`,
        max_tokens: 100
    };

    try {
        let response = await fetch(metaAiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        let data = await response.json();
        return data.choices[0].text.trim();
    } catch (error) {
        console.error("Error fetching AI summary:", error);
        return text; // Return original text if API fails
    }
}

// **Speech Synthesis**
function readSummary(summary) {
    let speech = new SpeechSynthesisUtterance(summary);
    speech.lang = "en-US";
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
}

// **Social Media Sharing**
function shareSummary(summary) {
    let text = encodeURIComponent(summary);
    let url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank");
}

// **Open News Details Page**
function openDetails(index) {
    let article = newsData[index];
    let detailsUrl = `news_details.html?title=${encodeURIComponent(article.title)}&content=${encodeURIComponent(article.content)}&image=${encodeURIComponent(article.image)}&source=${encodeURIComponent(article.source)}&url=${encodeURIComponent(article.url)}`;
    window.open(detailsUrl, "_blank");
}

// **Fetch Video News**
async function fetchVideoNews(loadMore = false) {
    if (!currentTopic) return;

    if (!loadMore) {
        videoPage = "";
        document.getElementById('video-container').innerHTML = '';
        document.getElementById('news-container').style.display = "none";
        document.getElementById('video-container').style.display = "flex";
    }

    let videoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(currentTopic)}+news&type=video&maxResults=5&pageToken=${videoPage}&key=AIzaSyD5pdTrhUdSQGCjrLoErNTUWZK4MNvqK7g`;

    try {
        let response = await fetch(videoUrl);
        let data = await response.json();

        let videoContainer = document.getElementById('video-container');

        data.items.forEach(video => {
            let videoItem = document.createElement('div');
            videoItem.classList.add('video-item');
            videoItem.innerHTML = `
                <h3>${video.snippet.title}</h3>
                <iframe src="https://www.youtube.com/embed/${video.id.videoId}" allowfullscreen></iframe>
            `;
            videoContainer.appendChild(videoItem);
        });

        videoPage = data.nextPageToken || ""; 
    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}

// **Toggle Between Text & Video News**
document.getElementById('video-news-button').addEventListener('click', () => {
    showingVideos = !showingVideos;
    if (showingVideos) {
        fetchVideoNews();
        document.getElementById('video-news-button').textContent = "Show Text News";
    } else {
        document.getElementById('news-container').style.display = "flex";
        document.getElementById('video-container').style.display = "none";
        document.getElementById('video-news-button').textContent = "Show Video News";
    }
});

// **Infinite Scrolling**
window.addEventListener('scroll', () => {
    let scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    let scrolled = window.scrollY;

    if (scrolled >= scrollableHeight - 50 && !isFetching) {
        isFetching = true;
        document.getElementById('loading-message').style.display = "block";

        if (showingVideos) {
            fetchVideoNews(true).then(() => {
                isFetching = false;
                document.getElementById('loading-message').style.display = "none";
            });
        } else {
            fetchNews(true).then(() => {
                isFetching = false;
                document.getElementById('loading-message').style.display = "none";
            });
        }
    }
});



function askChatbot() {
            let chatModal = document.getElementById("chatModal");
            let chatFrame = document.getElementById("chatFrame");

            chatModal.style.display = "block";

            // Fix for Android Full Screen Height Issue
            chatModal.style.height = window.innerHeight + "px";
            chatFrame.style.height = window.innerHeight + "px";
        }

        function closeChat() {
            document.getElementById("chatModal").style.display = "none";
        }

        // Resize Fix when Screen Changes
        window.addEventListener("resize", () => {
            let chatModal = document.getElementById("chatModal");
            let chatFrame = document.getElementById("chatFrame");
            
            if (chatModal.style.display === "block") {
                chatModal.style.height = window.innerHeight + "px";
                chatFrame.style.height = window.innerHeight + "px";
            }
        });
        
        let isChatOpen = false; // फ्लोटिंग विंडो की स्टेट ट्रैक करने के लिए

function askChatbot() {
    let chatModal = document.getElementById("chatModal");
    let chatFrame = document.getElementById("chatFrame");

    if (isChatOpen) {
        return; // अगर पहले से ओपन है तो दुबारा ओपन नहीं होगा
    }

    chatModal.style.display = "block";
    chatModal.style.width = "100vw";  // पूरी स्क्रीन की चौड़ाई
    chatModal.style.height = "100vh"; // पूरी स्क्रीन की ऊँचाई
    chatModal.style.position = "fixed";
    chatModal.style.top = "0";
    chatModal.style.left = "0";
    chatModal.style.backgroundColor = "rgba(0, 0, 0, 0.7)"; // बैकग्राउंड डार्क करने के लिए

    chatFrame.style.width = "100vw";
    chatFrame.style.height = "100vh";
    chatFrame.style.overflow = "hidden"; // स्क्रॉल रोकने के लिए

    isChatOpen = true; // स्टेट अपडेट करें
}

function askChatbot() {
            let chatModal = document.getElementById("chatModal");
            let chatFrame = document.getElementById("chatFrame");

            chatModal.style.display = "block";

            // Fix for Android Full Screen Height Issue
            chatModal.style.height = window.innerHeight + "px";
            chatFrame.style.height = window.innerHeight + "px";
        }

        function closeChat() {
            document.getElementById("chatModal").style.display = "none";
        }

        // Resize Fix when Screen Changes
        window.addEventListener("resize", () => {
            let chatModal = document.getElementById("chatModal");
            let chatFrame = document.getElementById("chatFrame");
            
            if (chatModal.style.display === "block") {
                chatModal.style.height = window.innerHeight + "px";
                chatFrame.style.height = window.innerHeight + "px";
            }
        });
        
    