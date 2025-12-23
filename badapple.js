const chessboard = document.getElementById("board-analysis-board")
const boardSetup = document.getElementsByClassName("setup-board-component")[0]
const audioUrl = chrome.runtime.getURL("BadApple.mp3")

const framesPath = "frames/"
const frameRate = 30
const frameInterval = 1000 / frameRate
const frameCount = 6572
var buttonLabel = undefined
const blackPixel = "bq"
const whitePixel = "wk"

function waitForElement(selector, callback) {
    const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
            observer.disconnect();
            callback(element);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function clearBoard() {
    const pieces = chessboard.getElementsByClassName("piece")
    for (let i = pieces.length-1; i >= 0; i--) {
        const piece = pieces[i];
        piece.remove()
    }
}

function prepareBoard() {
    clearBoard()
    for (let i = 8; i >= 1; i--) {
        for (let j = 1; j <= 8; j++) {
            let piece = document.createElement("div")
            piece.classList.add("piece", 'bq', `square-${j}${i}`)
            chessboard.appendChild(piece);
        }
    }
}

function renderFrame(frame) {
    const pieces = chessboard.getElementsByClassName("piece")
    for (let i = pieces.length-1; i >= 0; i--) {
        const piece = pieces[i];
        piece.className = `piece ${frame[i]} ${piece.classList[2]}`
    }
}

function getFrameURL(index) {
    return chrome.runtime.getURL(`${framesPath}frame_${index}.png`)
}

function getImages() {
    const urls = new Array(frameCount)

    for (let i = 0; i < frameCount; i++) {
        urls[i] = getFrameURL(i + 1)
    }

    return urls
}

async function getImageBrigtness(imageSrc, canvas) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    await img.decode()

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);

    var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    var data = imageData.data;
    const pixelCount = data.length / 4;
    var values = new Array(pixelCount)

    for(var i = 0, len = data.length; i < len; i+=4) {
        const brightness = 0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2];

        const pixelIndex = i / 4;
        const brightnessThreshold = 100
        values[pixelIndex] = brightness < brightnessThreshold ? blackPixel : whitePixel;
    }

    return values;
}

async function calculateFrames() {
    let frames = new Array(frameCount)
    const images = getImages()
    var canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        let frame = await getImageBrigtness(image, canvas)
        frames[i] = frame
        buttonLabel.innerText = `Calculating frames (${i}/${frameCount})`
    }

    return frames
}

let playing = false
async function play() {
    if (playing) return

    playing = true
    const audio = new Audio(audioUrl)
    const frames = await calculateFrames()

    buttonLabel.innerText = "Now playing bad apple"

    prepareBoard()
    await audio.play()

    let frameIndex = 0
    let then = performance.now()
    function step(now) {
        const delta = now - then 

        if (delta > frameInterval) {
            const frame = frames[frameIndex]
            renderFrame(frame)
            ++frameIndex
            then = now - (delta % frameInterval)
        }

        if (frameIndex < frameCount) {
            requestAnimationFrame(step)
        } else {
            playing = false
            buttonLabel.innerText = "Play bad apple"
        }
    }

    requestAnimationFrame(step)
}

waitForElement(".setup-board-component", (el) => {
    var buttonComponent = document.createElement('div')
    buttonComponent.classList.add("setup-board-option-component", "sidebar-row-component", "setup-board-option-component")

    var button = document.createElement("button")
    buttonLabel = document.createElement("span")

    buttonLabel.innerText = "Play bad apple"
    buttonLabel.classList.add("setup-board-option-label")
    button.append(buttonLabel)

    buttonComponent.appendChild(button)

    button.onclick = play

    el.prepend(buttonComponent)
})

