const chessboard = document.getElementById("board-analysis-board")
const playButton = document.querySelector('button[aria-label="Play / Pause"]')
const pixels = ["bq", "bk", "br", "bn", "bb", "wp", "wb", "wn", "wr", "wk", "wq"]
const audioUrl = chrome.runtime.getURL("BadApple.mp3")
const framesPath = "frames/"
const frameRate = 30
const frameInterval = 1000 / frameRate
const frameCount = 6572

function clearBoard() {
    const pieces = chessboard.getElementsByClassName("piece")
    for (let i = pieces.length-1; i >= 0; i--) {
        const piece = pieces[i];
        piece.remove()
    }
}

function populateBoard() {
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
    let index = 0
    let urls = []
    while (index++ < frameCount) {
        urls.push(getFrameURL(index))
    }
    return urls
}

async function getImageBrigtness(imageSrc) {
    const img = document.createElement("img");
    img.src = imageSrc;
    img.style.display = "none";
    img.crossOrigin = "anonymous";

    document.body.appendChild(img);
    var values = []

    await new Promise(resolve => {
        img.onload = resolve;
    });

    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);

    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var r,g,b;

    for(var i = 0, len = data.length; i < len; i+=4) {
        r = data[i];
        g = data[i+1];
        b = data[i+2];

        let brigness = 0.2126*r + 0.7152*g + 0.0722*b
        values.push(pixels[Math.floor(brigness/25)])
    }
    return values;
}

async function play() {
    playButton.removeEventListener("click", play)
    const audio = new Audio(audioUrl)
    const frames = getImages()

    let frameIndex = 0
    populateBoard()
    await audio.play()
    let interval = setInterval(async () => {
        frame = await getImageBrigtness(frames[frameIndex])
        renderFrame(frame)
        ++frameIndex
        if (frameIndex >= frameCount) {
            clearInterval(interval)
        }
    }, frameInterval)
}

playButton.addEventListener("click", play)