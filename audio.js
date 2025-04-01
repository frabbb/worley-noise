// Audio analysis variables
let sound;
let fft;
let amplitude;
let isAudioLoaded = false;

// Audio analysis results - can be used by main sketch
let bassEnergy = 0;
let midEnergy = 0;
let highEnergy = 0;
let avgEnergy = 0; // Weighted average frequency energy
let level = 0;

// Previous normalized values for easing
let prevNormalizedBass = 0.5;
let prevNormalizedMid = 0.5;
let prevNormalizedHigh = 0.5;
let prevNormalizedAvg = 0.5;
let prevNormalizedLevel = 0.5;

// Easing factor for normalized values (0-1)
// Lower = smoother/slower transitions, Higher = faster response
let normalizedEasingFactor = 0.1;

// Min/Max values for audio parameters
let bassMin = 1,
  bassMax = 0;
let midMin = 1,
  midMax = 0;
let highMin = 1,
  highMax = 0;
let avgMin = 1,
  avgMax = 0;
let levelMin = 1,
  levelMax = 0;

// Audio responsive variables
let audioReactive = true;

// Audio responsiveness settings
let smoothingFactor = 0.8; // Higher value = smoother transitions
let bassRange = [20, 140];
let midRange = [140, 2600];
let highRange = [2600, 14000];
// Full range for average calculation
let fullRange = [20, 14000];

// Frequency weights for weighted average
// Higher weights give more importance to those frequencies
let bassWeight = 0.3; // Less weight for bass
let midWeight = 1.5; // More weight for mid
let highWeight = 2.0; // Most weight for high

// Audio control elements
let audioControls;
let playPauseButton;
let progressBar;
let progressIndicator;
let progressContainer;
let timeDisplay;
let isDraggingProgress = false;
let scanButton;
let isScanning = false;
let scanProgress = 0;
let scanInterval = 0.5; // How many seconds to jump when scanning
let saveButton;
let loadFileInput;
let loadButton;

// Constants for local storage
const AUDIO_PARAMS_STORAGE_KEY = "audio_parameters";
const CURRENT_AUDIO_FILE_KEY = "current_audio_file";

function preloadAudio() {
  // Load sound file from assets folder
  // Make sure to place your audio file in the assets folder
  soundFormats("mp3", "ogg");
  sound = loadSound("assets/audio.mp3", audioLoaded, audioError);
}

function audioLoaded() {
  console.log("Audio loaded successfully");
  isAudioLoaded = true;

  // Create audio analysis tools
  fft = new p5.FFT(smoothingFactor, 1024);
  amplitude = new p5.Amplitude(smoothingFactor);

  // Connect sound to the analyzer
  sound.connect();

  // Try to load saved parameters
  loadSavedParameters();

  // Loop the sound
  sound.loop();
}

function audioError(err) {
  console.error("Error loading audio:", err);
}

function setupAudio() {
  createAudioControls();

  // Create audio toggle button
  createAudioToggleButton();

  // Create audio visualization panel
  createAudioVisualizationPanel();
}

function createAudioControls() {
  // Create a container for audio controls
  audioControls = createDiv();
  audioControls.addClass("audio-controls-container");

  // Position at bottom of the window instead of top
  audioControls.style("position", "fixed");
  audioControls.style("bottom", "20px");
  audioControls.style("left", "50%");
  audioControls.style("transform", "translateX(-50%)");

  // Play/Pause button
  playPauseButton = createButton("");
  playPauseButton.addClass("play-pause-button");
  playPauseButton.addClass("paused"); // Initial state
  playPauseButton.mousePressed(toggleAudio);
  playPauseButton.parent(audioControls);

  // Scan button
  scanButton = createButton("Scan");
  scanButton.addClass("scan-button");
  scanButton.mousePressed(startScan);
  scanButton.parent(audioControls);

  // Progress bar container
  progressContainer = createDiv();
  progressContainer.addClass("progress-container");
  progressContainer.parent(audioControls);

  // Progress background
  progressBar = createDiv();
  progressBar.addClass("progress-bar");
  progressBar.parent(progressContainer);

  // Progress indicator
  progressIndicator = createDiv();
  progressIndicator.addClass("progress-indicator");
  progressIndicator.parent(progressBar);

  // Time display
  timeDisplay = createDiv("0:00 / 0:00");
  timeDisplay.addClass("time-display");
  timeDisplay.parent(audioControls);

  // Add event listeners for progress bar interaction
  progressBar.mousePressed(startSeekAudio);
  progressBar.mouseReleased(endSeek);

  // Add p5.js mouseDragged callback for continuous dragging
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", endSeek);

  // Add styles for audio controls
  const style = document.createElement("style");
  style.textContent = `
    .audio-controls-container {
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 12px;
      display: flex;
      align-items: center;
      width: 500px;
      gap: 12px;
      z-index: 1000;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    
    .play-pause-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background-color: #222;
      position: relative;
      cursor: pointer;
      flex-shrink: 0;
    }
    
    .play-pause-button::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      border-style: solid;
    }
    
    .play-pause-button.playing::before {
      width: 12px;
      height: 12px;
      border: none;
      background: white;
      border-radius: 2px;
    }
    
    .play-pause-button.paused::before {
      border-width: 8px 0 8px 16px;
      border-color: transparent transparent transparent white;
      margin-left: 2px;
    }
    
    .scan-button, .action-button {
      font-size: 12px;
      padding: 5px 10px;
      background-color: #222;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .scan-button:hover, .action-button:hover {
      background-color: #333;
    }
    
    .scan-button.scanning {
      background-color: #555;
    }
    
    .file-input {
      width: 0.1px;
      height: 0.1px;
      opacity: 0;
      overflow: hidden;
      position: absolute;
      z-index: -1;
    }
    
    .progress-container {
      flex-grow: 1;
      cursor: pointer;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #444;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }
    
    .progress-indicator {
      width: 0%;
      height: 100%;
      background-color: white;
      border-radius: 4px;
      position: absolute;
    }
    
    .time-display {
      color: white;
      font-family: monospace;
      font-size: 12px;
      min-width: 80px;
      text-align: right;
    }
    
    .audio-parameter {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    
    .param-label {
      display: inline-block;
      width: 40px;
    }
    
    .parameter-value {
      position: absolute;
      font-family: monospace;
      font-size: 8px;
      color: white;
      background: rgba(0,0,0,0.7);
      padding: 2px 4px;
      border-radius: 2px;
      white-space: nowrap;
    }
    
    .min-value {
      bottom: -15px;
    }
    
    .max-value {
      top: -15px;
    }
    
    .audio-viz-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 15px;
      color: white;
      font-family: sans-serif;
      z-index: 1000;
      width: 280px;
    }
    
    .audio-viz-panel h3 {
      margin-top: 0;
      margin-bottom: 15px;
      text-align: center;
      font-size: 16px;
    }
    
    .bars-container {
      display: flex;
      justify-content: space-between;
      height: 150px;
    }
    
    .bar-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 5px;
    }
    
    .bar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      width: 100%;
    }
    
    .bar-label {
      font-size: 12px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .bar-outer {
      width: 30px;
      height: 100px;
      background: rgba(50, 50, 50, 0.5);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
      margin-bottom: 10px;
    }
    
    .bar-inner {
      position: absolute;
      bottom: 0;
      width: 100%;
      background: #2196F3; /* Solid blue color instead of gradient */
      height: 0%;
      transition: height 0.1s ease-out;
    }
    
    .bar-value {
      font-size: 10px;
      font-family: monospace;
      text-align: center; /* Center the text */
      width: 100%; /* Ensure it takes full width of column */
    }
    
    .min-max-container {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .min-max-value {
      font-size: 9px;
      font-family: monospace;
      text-align: center;
      width: 100%;
      color: rgba(255, 255, 255, 0.7);
      display: block;
      margin-left: auto;
      margin-right: auto;
      box-sizing: border-box;
      white-space: nowrap;
      overflow: hidden;
    }
    
    .max-value {
      margin-bottom: 2px;
    }
    
    .min-value {
      margin-top: 2px;
      margin-bottom: 5px;
    }
    
    .panel-hint {
      font-size: 10px;
      opacity: 0.7;
      text-align: center;
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);
}

function createAudioToggleButton() {
  let button = createButton("Toggle Audio Reactive");
  button.position(20, 60);
  button.mousePressed(() => {
    audioReactive = !audioReactive;
    button.html(audioReactive ? "Audio Reactive: ON" : "Audio Reactive: OFF");

    // Toggle visibility of the visualization panel
    const panel = document.getElementById("audio-viz-panel");
    if (panel) {
      panel.style.display = audioReactive ? "block" : "none";
    }
  });
  button.addClass("audio-control");
  button.html(audioReactive ? "Audio Reactive: ON" : "Audio Reactive: OFF");
}

function createAudioVisualizationPanel() {
  // Create HTML panel to display audio parameters
  const panel = document.createElement("div");
  panel.id = "audio-viz-panel";
  panel.className = "audio-viz-panel";

  // Add content for visualization with vertical bars
  panel.innerHTML = `
    <h3>Audio Parameters</h3>
    <div class="bars-container">
      <div class="bar-column">
        <div class="bar-wrapper">
          <div class="bar-label">Bass</div>
          <div class="min-max-container">
            <div class="min-max-value max-value" id="bass-max-value">0.00</div>
          </div>
          <div class="bar-outer">
            <div id="bass-bar" class="bar-inner"></div>
          </div>
          <div class="min-max-container">
            <div class="min-max-value min-value" id="bass-min-value">0.00</div>
          </div>
          <div id="bass-value" class="bar-value">0.00</div>
        </div>
      </div>
      <div class="bar-column">
        <div class="bar-wrapper">
          <div class="bar-label">Mid</div>
          <div class="min-max-container">
            <div class="min-max-value max-value" id="mid-max-value">0.00</div>
          </div>
          <div class="bar-outer">
            <div id="mid-bar" class="bar-inner"></div>
          </div>
          <div class="min-max-container">
            <div class="min-max-value min-value" id="mid-min-value">0.00</div>
          </div>
          <div id="mid-value" class="bar-value">0.00</div>
        </div>
      </div>
      <div class="bar-column">
        <div class="bar-wrapper">
          <div class="bar-label">High</div>
          <div class="min-max-container">
            <div class="min-max-value max-value" id="high-max-value">0.00</div>
          </div>
          <div class="bar-outer">
            <div id="high-bar" class="bar-inner"></div>
          </div>
          <div class="min-max-container">
            <div class="min-max-value min-value" id="high-min-value">0.00</div>
          </div>
          <div id="high-value" class="bar-value">0.00</div>
        </div>
      </div>
      <div class="bar-column">
        <div class="bar-wrapper">
          <div class="bar-label">Avg</div>
          <div class="min-max-container">
            <div class="min-max-value max-value" id="avg-max-value">0.00</div>
          </div>
          <div class="bar-outer">
            <div id="avg-bar" class="bar-inner"></div>
          </div>
          <div class="min-max-container">
            <div class="min-max-value min-value" id="avg-min-value">0.00</div>
          </div>
          <div id="avg-value" class="bar-value">0.00</div>
        </div>
      </div>
      <div class="bar-column">
        <div class="bar-wrapper">
          <div class="bar-label">Level</div>
          <div class="min-max-container">
            <div class="min-max-value max-value" id="level-max-value">0.00</div>
          </div>
          <div class="bar-outer">
            <div id="level-bar" class="bar-inner"></div>
          </div>
          <div class="min-max-container">
            <div class="min-max-value min-value" id="level-min-value">0.00</div>
          </div>
          <div id="level-value" class="bar-value">0.00</div>
        </div>
      </div>
    </div>
    <div class="controls-info">
      <div class="panel-hint">Values: raw (normalized)</div>
      <div class="easing-info">Easing: <span id="easing-value">${normalizedEasingFactor.toFixed(
        2
      )}</span> [+/- to adjust]</div>
    </div>
  `;

  document.body.appendChild(panel);

  // Add styles for easing controls
  const style = document.createElement("style");
  style.textContent = `
    .controls-info {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-size: 10px;
      opacity: 0.7;
    }
    
    .easing-info {
      text-align: right;
    }
  `;
  document.head.appendChild(style);
}

function updateAudioVisualization(audioParams) {
  if (!audioParams) return;

  // Use the pre-calculated normalized values directly
  const normalizedBass = audioParams.normalizedBass;
  const normalizedMid = audioParams.normalizedMid;
  const normalizedHigh = audioParams.normalizedHigh;
  const normalizedAvg = audioParams.normalizedAvg;
  const normalizedLevel = audioParams.normalizedLevel;

  // Update bars with normalized values (0-100%)
  document.getElementById("bass-bar").style.height = `${normalizedBass * 100}%`;
  document.getElementById("mid-bar").style.height = `${normalizedMid * 100}%`;
  document.getElementById("high-bar").style.height = `${normalizedHigh * 100}%`;
  document.getElementById("avg-bar").style.height = `${normalizedAvg * 100}%`;
  document.getElementById("level-bar").style.height = `${
    normalizedLevel * 100
  }%`;

  // Update min and max values
  document.getElementById("bass-min-value").textContent =
    audioParams.bassMin.toFixed(3);
  document.getElementById("bass-max-value").textContent =
    audioParams.bassMax.toFixed(3);
  document.getElementById("mid-min-value").textContent =
    audioParams.midMin.toFixed(3);
  document.getElementById("mid-max-value").textContent =
    audioParams.midMax.toFixed(3);
  document.getElementById("high-min-value").textContent =
    audioParams.highMin.toFixed(3);
  document.getElementById("high-max-value").textContent =
    audioParams.highMax.toFixed(3);
  document.getElementById("avg-min-value").textContent =
    audioParams.avgMin.toFixed(3);
  document.getElementById("avg-max-value").textContent =
    audioParams.avgMax.toFixed(3);
  document.getElementById("level-min-value").textContent =
    audioParams.levelMin.toFixed(3);
  document.getElementById("level-max-value").textContent =
    audioParams.levelMax.toFixed(3);

  // Show both raw and normalized values in the text
  document.getElementById(
    "bass-value"
  ).textContent = `${audioParams.bass.toFixed(2)} (${normalizedBass.toFixed(
    2
  )})`;
  document.getElementById("mid-value").textContent = `${audioParams.mid.toFixed(
    2
  )} (${normalizedMid.toFixed(2)})`;
  document.getElementById(
    "high-value"
  ).textContent = `${audioParams.high.toFixed(2)} (${normalizedHigh.toFixed(
    2
  )})`;
  document.getElementById("avg-value").textContent = `${audioParams.avg.toFixed(
    2
  )} (${normalizedAvg.toFixed(2)})`;
  document.getElementById(
    "level-value"
  ).textContent = `${audioParams.level.toFixed(2)} (${normalizedLevel.toFixed(
    2
  )})`;
}

// Save parameters to localStorage
function saveToLocalStorage(parameters) {
  try {
    localStorage.setItem(AUDIO_PARAMS_STORAGE_KEY, JSON.stringify(parameters));
    localStorage.setItem(CURRENT_AUDIO_FILE_KEY, "audio.mp3"); // Remember current audio file
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

// Load parameters from localStorage
function loadSavedParameters() {
  try {
    const savedAudioFile = localStorage.getItem(CURRENT_AUDIO_FILE_KEY);
    if (savedAudioFile && savedAudioFile === "audio.mp3") {
      // Only load if it's for the current audio file
      const savedParams = localStorage.getItem(AUDIO_PARAMS_STORAGE_KEY);
      if (savedParams) {
        const parameters = JSON.parse(savedParams);
        loadParameters(parameters);
        console.log("Loaded saved parameters from localStorage");
      }
    }
  } catch (e) {
    console.warn("Could not load from localStorage:", e);
  }
}

// Apply loaded parameters
function loadParameters(parameters) {
  // Apply min/max values
  bassMin = parameters.bassMin || bassMin;
  bassMax = parameters.bassMax || bassMax;
  midMin = parameters.midMin || midMin;
  midMax = parameters.midMax || midMax;
  highMin = parameters.highMin || highMin;
  highMax = parameters.highMax || highMax;
  avgMin = parameters.avgMin || avgMin;
  avgMax = parameters.avgMax || avgMax;
  levelMin = parameters.levelMin || levelMin;
  levelMax = parameters.levelMax || levelMax;
}

function startScan() {
  if (!isAudioLoaded || isScanning) return;

  isScanning = true;
  scanButton.addClass("scanning");
  scanButton.html("Scanning...");

  // Remember playback state
  const wasPlaying = sound.isPlaying();
  if (wasPlaying) sound.pause();

  // Reset min-max values
  bassMin = 1;
  bassMax = 0;
  midMin = 1;
  midMax = 0;
  highMin = 1;
  highMax = 0;
  avgMin = 1;
  avgMax = 0;
  levelMin = 1;
  levelMax = 0;

  // Start from the beginning
  sound.jump(0);
  sound.play();

  // Function to scan through the audio
  function scanStep() {
    if (!isScanning) return;

    // Get current time and duration
    const currentTime = sound.currentTime();
    const duration = sound.duration();

    // Update scan progress display
    scanProgress = (currentTime / duration) * 100;
    progressIndicator.style("width", `${scanProgress}%`);
    timeDisplay.html(
      `Scanning: ${formatTime(currentTime)} / ${formatTime(duration)}`
    );

    // Run audio analysis
    updateAudioAnalysisMinMax();

    // Jump forward by scanInterval seconds
    if (currentTime + scanInterval < duration) {
      sound.jump(currentTime + scanInterval);
      setTimeout(scanStep, 10); // Small delay for analysis to update
    } else {
      // Finished scanning
      finishScan(wasPlaying);
    }
  }

  // Start scanning
  scanStep();
}

function finishScan(resumePlayback) {
  isScanning = false;
  scanButton.removeClass("scanning");
  scanButton.html("Scan");

  // Stop playback
  sound.stop();

  // Reset to beginning
  sound.jump(0);

  // Automatically save the parameters to localStorage
  const parameters = {
    bassMin,
    bassMax,
    midMin,
    midMax,
    highMin,
    highMax,
    avgMin,
    avgMax,
    levelMin,
    levelMax,
    audioFile: "audio.mp3", // Store the filename for reference
    timestamp: new Date().toISOString(),
  };
  saveToLocalStorage(parameters);
  console.log("Audio parameters saved automatically");

  // Resume playback if it was playing before
  if (resumePlayback) {
    sound.play();
  }

  // Update controls
  updateAudioControls();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function updateAudioControls() {
  if (!isAudioLoaded) return;

  // Update play/pause button state
  if (sound.isPlaying()) {
    playPauseButton.removeClass("paused");
    playPauseButton.addClass("playing");
  } else {
    playPauseButton.removeClass("playing");
    playPauseButton.addClass("paused");
  }

  // Don't update progress if user is dragging or scanning
  if (!isDraggingProgress && !isScanning) {
    // Update progress bar
    const currentTime = sound.currentTime();
    const duration = sound.duration();
    const progress = (currentTime / duration) * 100;
    progressIndicator.style("width", `${progress}%`);

    // Update time display
    timeDisplay.html(`${formatTime(currentTime)} / ${formatTime(duration)}`);
  }
}

function updateAudioAnalysisMinMax() {
  if (!isAudioLoaded || !sound.isPlaying()) return;

  // Update FFT analysis
  fft.analyze();

  // Get energy in different frequency ranges
  let newBassEnergy = fft.getEnergy(bassRange[0], bassRange[1]) / 255;
  let newMidEnergy = fft.getEnergy(midRange[0], midRange[1]) / 255;
  let newHighEnergy = fft.getEnergy(highRange[0], highRange[1]) / 255;

  // Calculate weighted average
  let totalWeight = bassWeight + midWeight + highWeight;
  let newAvgEnergy =
    (newBassEnergy * bassWeight +
      newMidEnergy * midWeight +
      newHighEnergy * highWeight) /
    totalWeight;

  // Get overall amplitude level
  let newLevel = amplitude.getLevel();

  // Update min/max values
  if (newBassEnergy > 0) bassMin = min(bassMin, newBassEnergy);
  bassMax = max(bassMax, newBassEnergy);

  if (newMidEnergy > 0) midMin = min(midMin, newMidEnergy);
  midMax = max(midMax, newMidEnergy);

  if (newHighEnergy > 0) highMin = min(highMin, newHighEnergy);
  highMax = max(highMax, newHighEnergy);

  if (newAvgEnergy > 0) avgMin = min(avgMin, newAvgEnergy);
  avgMax = max(avgMax, newAvgEnergy);

  if (newLevel > 0) levelMin = min(levelMin, newLevel);
  levelMax = max(levelMax, newLevel);
}

function startSeekAudio() {
  if (!isAudioLoaded || isScanning) return;
  isDraggingProgress = true;
  updateSeekPosition(mouseX);
}

function handleDrag(event) {
  if (isDraggingProgress) {
    updateSeekPosition(event.clientX);
  }
}

function updateSeekPosition(xPosition) {
  if (!isAudioLoaded || !isDraggingProgress) return;

  const progressBarRect = progressBar.elt.getBoundingClientRect();
  const clickPosition = xPosition - progressBarRect.left;
  const percentage = constrain(clickPosition / progressBarRect.width, 0, 1);

  // Update visual immediately for responsive feeling
  progressIndicator.style("width", `${percentage * 100}%`);

  // Update time display to show target time without waiting for audio update
  const targetTime = percentage * sound.duration();
  timeDisplay.html(
    `${formatTime(targetTime)} / ${formatTime(sound.duration())}`
  );
}

function endSeek() {
  if (isDraggingProgress) {
    // Only seek audio at the end of dragging for better performance
    const progressBarRect = progressBar.elt.getBoundingClientRect();
    const percentage = constrain(
      (mouseX - progressBarRect.left) / progressBarRect.width,
      0,
      1
    );

    // Seek in the audio
    const newTime = percentage * sound.duration();
    sound.jump(newTime);

    isDraggingProgress = false;
  }
}

function toggleAudio() {
  if (!isAudioLoaded || isScanning) return;

  if (sound.isPlaying()) {
    sound.pause();
  } else {
    sound.play();
  }

  // Update control states
  updateAudioControls();
}

function updateAudioAnalysis() {
  if (!isAudioLoaded || !sound.isPlaying()) return;

  // Update FFT analysis
  fft.analyze();

  // Get energy in different frequency ranges
  let newBassEnergy = fft.getEnergy(bassRange[0], bassRange[1]) / 255;
  let newMidEnergy = fft.getEnergy(midRange[0], midRange[1]) / 255;
  let newHighEnergy = fft.getEnergy(highRange[0], highRange[1]) / 255;

  // Calculate weighted average (giving more importance to mid and high frequencies)
  let totalWeight = bassWeight + midWeight + highWeight;
  let newAvgEnergy =
    (newBassEnergy * bassWeight +
      newMidEnergy * midWeight +
      newHighEnergy * highWeight) /
    totalWeight;

  // Smooth transitions by blending old and new values
  bassEnergy = lerp(bassEnergy, newBassEnergy, 1 - smoothingFactor);
  midEnergy = lerp(midEnergy, newMidEnergy, 1 - smoothingFactor);
  highEnergy = lerp(highEnergy, newHighEnergy, 1 - smoothingFactor);
  avgEnergy = lerp(avgEnergy, newAvgEnergy, 1 - smoothingFactor);

  // Get overall amplitude level
  level = amplitude.getLevel();

  // Update min/max values during normal playback too
  if (newBassEnergy > 0) bassMin = min(bassMin, newBassEnergy);
  bassMax = max(bassMax, newBassEnergy);

  if (newMidEnergy > 0) midMin = min(midMin, newMidEnergy);
  midMax = max(midMax, newMidEnergy);

  if (newHighEnergy > 0) highMin = min(highMin, newHighEnergy);
  highMax = max(highMax, newHighEnergy);

  if (newAvgEnergy > 0) avgMin = min(avgMin, newAvgEnergy);
  avgMax = max(avgMax, newAvgEnergy);

  if (level > 0) levelMin = min(levelMin, level);
  levelMax = max(levelMax, level);

  // Update audio controls UI
  updateAudioControls();
}

// Map audio to shader parameters
function getAudioParameters() {
  // Normalize values for shader input
  function normalizeValue(value, min, max) {
    // Protect against division by zero if min and max are the same
    if (min === max) return 0.5;
    // Clamp value to min-max range and normalize it to 0-1
    const clampedValue = Math.max(min, Math.min(max, value));
    return (clampedValue - min) / (max - min);
  }

  // Calculate the raw normalized values
  const rawNormalizedBass = normalizeValue(bassEnergy, bassMin, bassMax);
  const rawNormalizedMid = normalizeValue(midEnergy, midMin, midMax);
  const rawNormalizedHigh = normalizeValue(highEnergy, highMin, highMax);
  const rawNormalizedAvg = normalizeValue(avgEnergy, avgMin, avgMax);
  const rawNormalizedLevel = normalizeValue(level, levelMin, levelMax);

  // Apply easing by interpolating between previous and current values
  const easedNormalizedBass = lerp(
    prevNormalizedBass,
    rawNormalizedBass,
    normalizedEasingFactor
  );
  const easedNormalizedMid = lerp(
    prevNormalizedMid,
    rawNormalizedMid,
    normalizedEasingFactor
  );
  const easedNormalizedHigh = lerp(
    prevNormalizedHigh,
    rawNormalizedHigh,
    normalizedEasingFactor
  );
  const easedNormalizedAvg = lerp(
    prevNormalizedAvg,
    rawNormalizedAvg,
    normalizedEasingFactor
  );
  const easedNormalizedLevel = lerp(
    prevNormalizedLevel,
    rawNormalizedLevel,
    0.05
  );

  // Store current eased values as previous for next frame
  prevNormalizedBass = easedNormalizedBass;
  prevNormalizedMid = easedNormalizedMid;
  prevNormalizedHigh = easedNormalizedHigh;
  prevNormalizedAvg = easedNormalizedAvg;
  prevNormalizedLevel = easedNormalizedLevel;

  return {
    // Raw values
    bass: bassEnergy,
    mid: midEnergy,
    high: highEnergy,
    avg: avgEnergy,
    level: level,

    // Min/max values for visualization
    bassMin,
    bassMax,
    midMin,
    midMax,
    highMin,
    highMax,
    avgMin,
    avgMax,
    levelMin,
    levelMax,

    // Normalized values (0-1 range) with easing applied
    normalizedBass: easedNormalizedBass,
    normalizedMid: easedNormalizedMid,
    normalizedHigh: easedNormalizedHigh,
    normalizedAvg: easedNormalizedAvg,
    normalizedLevel: easedNormalizedLevel,

    // Raw normalized values (without easing) for reference
    rawNormalizedBass,
    rawNormalizedMid,
    rawNormalizedHigh,
    rawNormalizedAvg,
    rawNormalizedLevel,
  };
}

// Skip forward by specified number of seconds
function skipForward(seconds = 1) {
  if (!isAudioLoaded || isScanning) return;

  const currentTime = sound.currentTime();
  const duration = sound.duration();

  // Calculate new position, ensuring we don't go past the end
  const newTime = Math.min(currentTime + seconds, duration - 0.1);

  // Jump to new position
  sound.jump(newTime);

  // Update controls
  updateAudioControls();
}

// Skip backward by specified number of seconds
function skipBackward(seconds = 1) {
  if (!isAudioLoaded || isScanning) return;

  const currentTime = sound.currentTime();

  // Calculate new position, ensuring we don't go before the start
  const newTime = Math.max(currentTime - seconds, 0);

  // Jump to new position
  sound.jump(newTime);

  // Update controls
  updateAudioControls();
}

// Handle syncing audio with animation state
function syncAudioWithAnimation(paused) {
  if (!isAudioLoaded) return;

  const audioPlaying = sound.isPlaying();

  // If animation is paused, pause audio too
  if (paused && audioPlaying) {
    sound.pause();
  }
  // If animation is unpaused, make sure audio is playing
  else if (!paused && !audioPlaying) {
    sound.play();
  }

  // Update controls
  updateAudioControls();
}

// Check if audio is reactive
function isAudioReactive() {
  return audioReactive;
}

// Toggle audio reactive state
function toggleAudioReactive() {
  audioReactive = !audioReactive;

  // Toggle visibility of the visualization panel
  const panel = document.getElementById("audio-viz-panel");
  if (panel) {
    panel.style.display = audioReactive ? "block" : "none";
  }

  return audioReactive;
}

// Set the easing factor for normalized values
function setNormalizedEasing(value) {
  // Ensure value is within valid range
  normalizedEasingFactor = Math.max(0.01, Math.min(1.0, value));

  // Update the UI if it exists
  const easingDisplay = document.getElementById("easing-value");
  if (easingDisplay) {
    easingDisplay.textContent = normalizedEasingFactor.toFixed(2);

    // Visual feedback - briefly highlight the value
    easingDisplay.style.transition = "color 0.5s";
    easingDisplay.style.color = "white";
    easingDisplay.style.fontWeight = "bold";

    setTimeout(() => {
      easingDisplay.style.color = "";
      easingDisplay.style.fontWeight = "";
    }, 800);
  }

  console.log(`Normalized easing factor set to: ${normalizedEasingFactor}`);
  return normalizedEasingFactor;
}

// Get the current easing factor
function getNormalizedEasing() {
  return normalizedEasingFactor;
}

// Export functions and variables as ES modules instead of using window globals
export {
  preloadAudio,
  setupAudio,
  updateAudioAnalysis,
  getAudioParameters,
  toggleAudio,
  isAudioLoaded,
  sound,
  updateAudioVisualization,
  isAudioReactive,
  toggleAudioReactive,
  syncAudioWithAnimation,
  skipForward,
  skipBackward,
  setNormalizedEasing,
  getNormalizedEasing,
};
