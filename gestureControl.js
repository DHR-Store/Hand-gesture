// ** Create Floating Video Element **
const videoElement = document.createElement('video');
videoElement.id = 'video-feed';
videoElement.autoplay = true;
videoElement.playsInline = true;
videoElement.style.position = 'fixed';
videoElement.style.top = '10px';
videoElement.style.right = '10px';
videoElement.style.width = '10px';
videoElement.style.height = '5px';
videoElement.style.background = 'black';
videoElement.style.borderRadius = '10px';
videoElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
videoElement.style.zIndex = '10000';
document.body.appendChild(videoElement);

// ** Create Canvas for Gesture Recognition **
const canvasElement = document.createElement('canvas');
canvasElement.id = 'gesture-canvas';
document.body.appendChild(canvasElement);
const canvasCtx = canvasElement.getContext('2d');

// ** Setup Camera **
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "user", 
                width: 1280, 
                height: 720 
            }
        });
        videoElement.srcObject = stream;
        videoElement.play();
    } catch (error) {
        console.error("Error accessing webcam: ", error);
    }
}

// ** Load MediaPipe Hands Model **
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
});

hands.onResults((results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        return;
    }

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    // ** Flip Canvas for Front Camera **
    canvasCtx.save();
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    for (const landmarks of results.multiHandLandmarks) {
        processGestures(landmarks);
    }
});

// ** Start Hand Detection Loop **
function detectHands() {
    hands.send({ image: videoElement }).then(() => {
        setTimeout(detectHands, 30); // Reduce CPU load
    });
}

let lastScrollTime = 0;
let lastClickTime = 0;

// ** Process Hand Gestures **
function processGestures(landmarks) {
    const indexTip = landmarks[8];  // Index Finger Tip
    const thumbTip = landmarks[4];  // Thumb Tip

    // ** Adjust for Mirrored Camera **
    let x = (1 - indexTip.x) * window.innerWidth;
    let y = indexTip.y * window.innerHeight + window.scrollY; // Full Page Tracking

    movePointer(x, y);

    const thumbIndexDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    const currentTime = new Date().getTime();

    // ** Smooth Scroll Up/Down **
    if (thumbIndexDist < 0.025 && currentTime - lastScrollTime > 250) {
        let movementY = indexTip.y - thumbTip.y;
        if (movementY > 0.02) {
            console.log("Scrolling Down");
            smoothScroll(100);
        } else if (movementY < -0.02) {
            console.log("Scrolling Up");
            smoothScroll(-100);
        }
        lastScrollTime = currentTime;
    }

    // ** Click Gesture **
    if (thumbIndexDist < 0.02 && currentTime - lastClickTime > 500) {
        console.log("Click Detected");
        simulateMouseClick(x, y);
        lastClickTime = currentTime;
    }
}

// ** Create Pointer for Gesture Tracking **
function movePointer(x, y) {
    let pointer = document.getElementById('gesture-pointer');
    if (!pointer) {
        pointer = document.createElement('div');
        pointer.id = 'gesture-pointer';
        document.body.appendChild(pointer);
        pointer.style.position = 'absolute';
        pointer.style.width = '15px';
        pointer.style.height = '15px';
        pointer.style.backgroundColor = 'red';
        pointer.style.borderRadius = '50%';
        pointer.style.pointerEvents = 'none';
        pointer.style.transition = 'top 0.1s linear, left 0.1s linear';
        pointer.style.zIndex = '9999';
    }
    pointer.style.left = `${x}px`;
    pointer.style.top = `${y}px`;
}

// ** Smooth Scroll Function **
function smoothScroll(amount) {
    window.scrollBy({
        top: amount,
        behavior: 'smooth'
    });
}

// ** Simulate Mouse Click **
function simulateMouseClick(x, y) {
    let element = document.elementFromPoint(x, y);
    if (element) {
        let clickEffect = document.createElement('div');
        clickEffect.style.position = 'absolute';
        clickEffect.style.width = '20px';
        clickEffect.style.height = '20px';
        clickEffect.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        clickEffect.style.borderRadius = '50%';
        clickEffect.style.left = `${x - 10}px`;
        clickEffect.style.top = `${y - 10}px`;
        clickEffect.style.pointerEvents = 'none';
        clickEffect.style.transition = 'transform 0.2s ease-out, opacity 0.3s ease-out';
        document.body.appendChild(clickEffect);

        setTimeout(() => {
            clickEffect.style.transform = 'scale(2)';
            clickEffect.style.opacity = '0';
        }, 10);
        
        setTimeout(() => document.body.removeChild(clickEffect), 300);

        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        console.log(`Clicked on: ${element.tagName}`);
    }
}

// ** Start Camera & Gesture Detection **
setupCamera().then(() => {
    detectHands();
});