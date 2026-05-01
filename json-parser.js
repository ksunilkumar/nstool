document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('tb-json-input');
    const outputArea = document.getElementById('tb-json-output');
    const errorArea = document.getElementById('tb-json-error');
    const parseBtn = document.getElementById('tb-json-parse-btn');
    const clearBtn = document.getElementById('tb-json-clear-btn');
    const copyInputBtn = document.getElementById('tb-json-copy-input-btn');
    const copyOutputBtn = document.getElementById('tb-json-copy-output-btn');
    const downloadBtn = document.getElementById('tb-json-download-btn');
    const loadingArea = document.getElementById('tb-json-loading');

    let formattedJsonString = "";

    // Syntax highlighting function
    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'tb-json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'tb-json-key';
                } else {
                    cls = 'tb-json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'tb-json-boolean';
            } else if (/null/.test(match)) {
                cls = 'tb-json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    function processJSON() {
        const rawJson = inputArea.value.trim();
        if (!rawJson) {
            showError("Please enter some JSON to parse.");
            return;
        }

        hideError();
        loadingArea.classList.remove('hidden');
        outputArea.innerHTML = "";
        formattedJsonString = "";

        // Using setTimeout to allow UI to show loading state for large JSON
        setTimeout(() => {
            try {
                let parsed;
                try {
                    // Try strict native JSON first for speed
                    parsed = JSON.parse(rawJson);
                } catch (strictErr) {
                    try {
                        // Fallback to JSON5 for loose JSON (single quotes, unquoted keys, trailing commas, comments)
                        if (typeof JSON5 !== 'undefined') {
                            parsed = JSON5.parse(rawJson);
                        } else {
                            throw new Error("JSON5 not loaded");
                        }
                    } catch (looseErr) {
                        // Ultimate fallback: Javascript Function constructor (evaluates raw JS objects)
                        try {
                            // Wrapping in parentheses evaluates block as an expression
                            parsed = new Function("return (" + rawJson + ")")();
                            if (parsed === null || typeof parsed !== 'object') {
                                throw new Error("Parsed result is not an object or array.");
                            }
                        } catch (finalErr) {
                            // If all fails, throw a descriptive error
                            throw new Error(strictErr.message + " | Relaxed parsing also failed.");
                        }
                    }
                }

                formattedJsonString = JSON.stringify(parsed, null, 4);
                outputArea.innerHTML = syntaxHighlight(formattedJsonString);
                
                // Update input area with formatted JSON (Auto-format)
                inputArea.value = formattedJsonString;
            } catch (e) {
                showError("Invalid JSON: " + e.message);
                outputArea.innerHTML = "";
            } finally {
                loadingArea.classList.add('hidden');
            }
        }, 10);
    }

    function showError(msg) {
        errorArea.textContent = msg;
        errorArea.classList.remove('hidden');
    }

    function hideError() {
        errorArea.textContent = "";
        errorArea.classList.add('hidden');
    }

    parseBtn.addEventListener('click', processJSON);

    // Auto-parse and format immediately when the user pastes data
    inputArea.addEventListener('paste', () => {
        // setTimeout ensures the pasted text is fully injected into the textarea before parsing
        setTimeout(() => {
            if (inputArea.value.trim()) {
                processJSON();
            }
        }, 50);
    });

    clearBtn.addEventListener('click', () => {
        inputArea.value = "";
        outputArea.innerHTML = "";
        formattedJsonString = "";
        hideError();
    });

    copyInputBtn.addEventListener('click', () => {
        if (!inputArea.value) return;
        navigator.clipboard.writeText(inputArea.value).then(() => {
            const originalText = copyInputBtn.textContent;
            copyInputBtn.textContent = "Copied!";
            setTimeout(() => copyInputBtn.textContent = originalText, 2000);
        });
    });

    copyOutputBtn.addEventListener('click', () => {
        if (!formattedJsonString) return;
        navigator.clipboard.writeText(formattedJsonString).then(() => {
            const originalText = copyOutputBtn.textContent;
            copyOutputBtn.textContent = "Copied!";
            setTimeout(() => copyOutputBtn.textContent = originalText, 2000);
        });
    });

    downloadBtn.addEventListener('click', () => {
        if (!formattedJsonString) {
            showError("No formatted JSON to download. Parse valid JSON first.");
            return;
        }
        const blob = new Blob([formattedJsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "formatted.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
