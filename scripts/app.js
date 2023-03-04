function addInitialInput(text) {
  return `<p><b>Input:</b> ${text}</p>`
}

function addFinalOutput(text) {
  return `<p><b>Output:</b> ${text}</p>`
}

// set up basic variables for app

const record = document.querySelector('.record');
const stop = document.querySelector('.stop');
const soundClips = document.querySelector('.sound-clips');
const canvas = document.querySelector('.visualizer');
const mainSection = document.querySelector('.main-controls');

const resultsDiv = document.getElementById("results");

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

// $.get("https://www.google.ca")

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");

      // const clipName = prompt('Enter a name for your sound clip?','My unnamed clip');

      const clipName = "My unnamed clip";

      const clipContainer = document.createElement('article');
      const clipLabel = document.createElement('p');
      const audio = document.createElement('audio');
      const deleteButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      if(clipName === null) {
        clipLabel.textContent = 'My unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      // soundClips.appendChild(clipContainer);

      console.log(audio);
      console.log(soundClips);

      audio.controls = true;
      const blob = new Blob(chunks, { 'type' : 'audio/wav; codecs=opus' });
      let file = new File([blob], 'recording.ogg');

      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log(audio.src);
      // document.location.href = audio.src;


      let headers = new Headers();
      headers.append('Access-Control-Allow-Origin', 'http://localhost:8080');
      headers.append('Access-Control-Allow-Credentials', 'true');

      var formData = new FormData();
      formData.append("file", blob);



      // $.get("https://www.google.ca");

      // fetch("https://www.google.ca",
      // {
      //   method: "GET",
      // })
      //   .then((response) => console.log(response));

      // fetch("http://127.0.0.1:8080", 
      // {
      //   method: "GET",
      //   // mode: "cors"
      // })
      //   .then((response) => response.json())
      //   .then((data) => console.log(data));






      fetch("http://127.0.0.1:8080/api/transcribe", {
        method: "POST",
        body: formData,
        mode: "cors"
        // headers: headers,
        // mode: 'no-cors'
      })
      .then((response) => response.json())
      .then((responseText) => {
        console.log("resp text!");
        console.log(responseText);
        var audio = new Audio('D:\\development-projects\\mais-project-x-2022\\static\\output_speech.mp3');


        resultsDiv.innerHTML += addInitialInput(responseText.data.initialText);
        resultsDiv.innerHTML +=  addFinalOutput(responseText.data.outputText);

        audio.play();
      });

      console.log("recorder stopped");

      deleteButton.onclick = function(e) {
        e.target.closest(".clip").remove();
      }

      clipLabel.onclick = function() {
        const existingName = clipLabel.textContent;
        const newClipName = null;
        // const newClipName = prompt('Enter a new name for your sound clip?');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

  function draw() {
    const WIDTH = canvas.width
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for(let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();