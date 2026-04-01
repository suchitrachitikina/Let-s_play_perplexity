document.addEventListener("DOMContentLoaded", () => {
    const navItems = document.querySelectorAll(".nav-item");
    const pills = document.querySelectorAll(".pill");
    const searchInput = document.querySelector(".search-input");
    const searchContainer = document.querySelector(".search-container");
    const actionBtn = document.querySelector(".action-btn");
    const mainArea = document.querySelector("main");
    const suggestionsSection = document.querySelector(".suggestions-section");
    const logo = document.querySelector(".logo");
    
    // File Upload Elements
    const fileInput = document.getElementById("file-input");
    const uploadTrigger = document.getElementById("upload-trigger");
    const fileStatus = document.getElementById("file-status");
    const filenameDisplay = document.getElementById("filename-display");
    const removeFileBtn = document.getElementById("remove-file");

    console.log("DOM Loaded. Upload trigger:", uploadTrigger);

    // Sidebar navigation
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            // If user clicks "New thread", reset UI
            if (item.innerText.includes("New thread")) {
                location.reload();
            }
        });
    });

    // Pill selection
    pills.forEach(pill => {
        pill.addEventListener("click", () => {
            pills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
        });
    });

    // File Upload Logic
    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener("click", (e) => {
            console.log("Plus button clicked");
            fileInput.click();
        });

        fileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            console.log("File selected:", file.name);

            const formData = new FormData();
            formData.append("file", file);

            try {
                uploadTrigger.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                const response = await fetch("http://localhost:5000/api/upload", {
                    method: "POST",
                    body: formData
                });

                const data = await response.json();
                if (data.status === "success") {
                    fileStatus.style.display = "flex";
                    filenameDisplay.textContent = data.filename;
                    uploadTrigger.style.color = "#4caf50";
                } else {
                    alert(data.error || "Upload failed");
                }
            } catch (error) {
                console.error("Upload error:", error);
                alert("Failed to upload PDF. Make sure your backend (app.py) is running on port 5000.");
            } finally {
                uploadTrigger.innerHTML = '<i class="fa-solid fa-plus"></i>';
            }
        });
    }

    removeFileBtn.addEventListener("click", () => {
        fileStatus.style.display = "none";
        fileInput.value = "";
        uploadTrigger.style.color = "";
    });

    // Search function
    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;

        if (logo) logo.style.display = "none";
        mainArea.style.paddingTop = "80px";

        const existingResponse = document.querySelector(".response-container");
        if (existingResponse) existingResponse.remove();
        if (suggestionsSection) suggestionsSection.style.display = "none";

        const responseDiv = document.createElement("div");
        responseDiv.className = "response-container";
        responseDiv.innerHTML = '<div class="thinking">Perplexity is searching...</div>';
        mainArea.appendChild(responseDiv);

        try {
            const response = await fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: query })
            });

            const data = await response.json();
            
            if (data.status === "success") {
                responseDiv.innerHTML = `
                    <div class="response-header">AI Answer</div>
                    <div class="response-text">${data.response}</div>
                `;
            } else {
                responseDiv.innerHTML = `<div class="error">Error: ${data.error || "Failed to get response"}</div>`;
            }
        } catch (error) {
            console.error("Search error:", error);
            responseDiv.innerHTML = `<div class="error">Failed to connect to backend. Make sure app.py is running on port 5000 and the PDF is uploaded correctly.</div>`;
        }
    }

    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSearch();
    });

    actionBtn.addEventListener("click", handleSearch);

    searchInput.addEventListener("focus", () => {
        searchContainer.style.borderColor = "#444";
    });
    searchInput.addEventListener("blur", () => {
        searchContainer.style.borderColor = "var(--border-color)";
    });
});
