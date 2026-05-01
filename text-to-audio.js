document.addEventListener('DOMContentLoaded', () => {
    // Check if SpeechSynthesis is supported
    if (!('speechSynthesis' in window)) {
        alert("Sorry, your browser doesn't support text to speech!");
        return;
    }

    const synth = window.speechSynthesis;
    let voices = [];

    // DOM Elements
    const voiceSelect = document.getElementById('voice-select');
    const voiceCount = document.getElementById('voice-count');
    const rateInput = document.getElementById('rate-input');
    const pitchInput = document.getElementById('pitch-input');
    const rateValue = document.getElementById('rate-value');
    const pitchValue = document.getElementById('pitch-value');
    const textInput = document.getElementById('tts-input');
    const speakBtn = document.getElementById('tts-speak-btn');
    const pauseBtn = document.getElementById('tts-pause-btn');
    const stopBtn = document.getElementById('tts-stop-btn');
    const clearBtn = document.getElementById('tts-clear-btn');
    const playingIndicator = document.getElementById('tts-playing-indicator');
    const speakBtnText = speakBtn.querySelector('span');

    let isPaused = false;

    // Initialize Voices
    const populateVoiceList = () => {
        voices = synth.getVoices();
        
        if (voices.length === 0) return;

        // Sort voices: Indian English first, then US English, then others
        voices.sort((a, b) => {
            const isAIndian = a.lang.includes('en-IN') || a.name.toLowerCase().includes('india');
            const isBIndian = b.lang.includes('en-IN') || b.name.toLowerCase().includes('india');
            
            if (isAIndian && !isBIndian) return -1;
            if (!isAIndian && isBIndian) return 1;
            
            const isAEnglish = a.lang.startsWith('en');
            const isBEnglish = b.lang.startsWith('en');
            
            if (isAEnglish && !isBEnglish) return -1;
            if (!isAEnglish && isBEnglish) return 1;
            
            return a.name.localeCompare(b.name);
        });

        voiceSelect.innerHTML = '';
        
        // Group Indian voices visually
        const indGroup = document.createElement('optgroup');
        indGroup.label = "Indian English Voices (Recommended)";
        
        const otherEngGroup = document.createElement('optgroup');
        otherEngGroup.label = "Other English Voices";
        
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = "Other Languages";

        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            // Try to guess gender from voice name if available (often explicitly stated in some OS voices)
            let genderHint = "";
            const lowerName = voice.name.toLowerCase();
            if (lowerName.includes('female') || lowerName.includes('girl')) genderHint = " (Female)";
            else if (lowerName.includes('male') || lowerName.includes('boy')) genderHint = " (Male)";
            else if (lowerName.includes('zira') || lowerName.includes('heera') || lowerName.includes('ravi') || lowerName.includes('veena')) {
                 if (lowerName.includes('heera') || lowerName.includes('veena') || lowerName.includes('zira')) genderHint = " (Female)";
                 if (lowerName.includes('ravi')) genderHint = " (Male)";
            }

            option.textContent = `${voice.name} (${voice.lang})${genderHint}`;
            if (voice.default) option.textContent += ' — DEFAULT';
            option.value = index;

            const isIndian = voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('india');
            const isEnglish = voice.lang.startsWith('en');

            if (isIndian) indGroup.appendChild(option);
            else if (isEnglish) otherEngGroup.appendChild(option);
            else otherGroup.appendChild(option);
        });

        if (indGroup.children.length > 0) voiceSelect.appendChild(indGroup);
        if (otherEngGroup.children.length > 0) voiceSelect.appendChild(otherEngGroup);
        if (otherGroup.children.length > 0) voiceSelect.appendChild(otherGroup);

        voiceSelect.disabled = false;
        voiceCount.textContent = `${voices.length} Voices`;
    };

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // Input Listeners
    rateInput.addEventListener('input', () => rateValue.textContent = rateInput.value);
    pitchInput.addEventListener('input', () => pitchValue.textContent = pitchInput.value);

    const updateUIState = (speaking, paused) => {
        if (speaking && !paused) {
            playingIndicator.classList.add('active');
            speakBtnText.textContent = "Speaking...";
            speakBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause';
        } else if (speaking && paused) {
            playingIndicator.classList.remove('active');
            speakBtnText.textContent = "Paused";
            speakBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            pauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Resume';
        } else {
            playingIndicator.classList.remove('active');
            speakBtnText.textContent = "Speak Text";
            speakBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg> Pause';
        }
    };

    const speak = () => {
        // Cancel any ongoing or stuck speech to fix browser API bugs
        synth.cancel();

        // Reset UI state just in case
        isPaused = false;
        updateUIState(false, false);

        const text = textInput.value.trim();
        if (text !== '') {
            const utterThis = new SpeechSynthesisUtterance(text);
            window.__currentUtterance = utterThis; // Prevent garbage collection bug in Chrome
            
            const selectedOption = voiceSelect.options[voiceSelect.selectedIndex];
            if (selectedOption && selectedOption.value !== "") {
                utterThis.voice = voices[selectedOption.value];
            }

            utterThis.pitch = parseFloat(pitchInput.value);
            utterThis.rate = parseFloat(rateInput.value);

            utterThis.onstart = () => {
                isPaused = false;
                updateUIState(true, false);
            };

            utterThis.onend = () => {
                isPaused = false;
                updateUIState(false, false);
            };

            utterThis.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                isPaused = false;
                updateUIState(false, false);
            };

            utterThis.onpause = () => {
                isPaused = true;
                updateUIState(true, true);
            };

            utterThis.onresume = () => {
                isPaused = false;
                updateUIState(true, false);
            };

            synth.speak(utterThis);
        } else {
            alert('Please enter some text to speak!');
            textInput.focus();
        }
    };

    speakBtn.addEventListener('click', (e) => {
        e.preventDefault();
        speak();
    });

    pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (synth.speaking && !isPaused) {
            synth.pause();
        } else if (synth.speaking && isPaused) {
            synth.resume();
        }
    });

    stopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        synth.cancel();
        isPaused = false;
        updateUIState(false, false);
    });

    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        textInput.value = '';
        synth.cancel(); // Stop playing if clearing
        updateUIState(false, false);
        textInput.focus();
    });

    const downloadBtn = document.getElementById('tts-download-btn');
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const text = textInput.value.trim();
        if (!text) {
            alert('Please enter some text to download.');
            return;
        }

        if (text.length > 200) {
            alert('Note: Free MP3 downloads are currently limited to short texts (under 200 characters) due to browser restrictions with offline voices. Please shorten your text or use a screen/audio recorder to capture longer speech.');
            return;
        }

        // Use Google Translate TTS as a free workaround to get an MP3
        // We select the language based on the chosen voice if possible
        let langCode = 'en-IN';
        const selectedOption = voiceSelect.options[voiceSelect.selectedIndex];
        if (selectedOption && selectedOption.value !== "") {
            const selectedVoice = voices[selectedOption.value];
            if (selectedVoice && selectedVoice.lang) {
                // e.g. en-US, en-GB, en-IN
                langCode = selectedVoice.lang.split('-')[0]; // fallback to base lang
                if (selectedVoice.lang.includes('IN')) langCode = 'en-IN';
                if (selectedVoice.lang.includes('US')) langCode = 'en-US';
                if (selectedVoice.lang.includes('GB')) langCode = 'en-GB';
            }
        }

        const baseUrl = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=${langCode}&q=${encodeURIComponent(text)}`;
        
        // Google Translate API blocks cross-origin fetch requests (CORS).
        // corsproxy.io is returning 403 Forbidden, so we use allorigins.win instead.
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
        
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = "Downloading...";
        downloadBtn.disabled = true;

        fetch(proxyUrl)
            .then(response => {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.json();
            })
            .then(data => {
                if (!data.contents) throw new Error("No audio content returned");
                
                // data.contents is a base64 Data URI (data:audio/mpeg;base64,...)
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = data.contents;
                a.download = 'toolbox-audio.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Download failed:', error);
                alert('Failed to download audio. Please check your connection or try again later.');
            })
            .finally(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.disabled = false;
            });
    });
});
