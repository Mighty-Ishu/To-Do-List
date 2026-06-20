// ==========================================================================
// 1. DOM ELEMENT SELECTORS
// ==========================================================================

// --- Main Input & List Containers ---
const input = document.getElementById("taskInput");
const button = document.getElementById("submitBtn");
const list = document.getElementById("taskList");
const binList = document.getElementById("binList");
const completedList = document.getElementById("completedList");
const categorySelect = document.getElementById("categorySelect");

// --- Onboarding & Welcome Screens ---
const onboardingGateway = document.getElementById("onboardingGateway");
const appContainer = document.getElementById("appContainer");
const onboardingNameInput = document.getElementById("onboardingNameInput");
const onboardingLocationBtn = document.getElementById("onboardingLocationBtn");
const onboardingGeoStatus = document.getElementById("onboardingGeoStatus");
const onboardingSubmitBtn = document.getElementById("onboardingSubmitBtn");

// --- Sidebar & Top Navigation Controls ---
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const searchToggleBtn = document.getElementById("searchToggleBtn");
const contentSearchContainer = document.getElementById("contentSearchContainer");
const workspaceSearch = document.getElementById("workspaceSearch");
const themeToggleBtn = document.getElementById("themeToggleBtn");

// --- Deadline Popover Engine ---
const horizonSelect = document.getElementById("horizonSelect");
const deadlineToggleBtn = document.getElementById("deadlineToggleBtn");
const deadlineDropdownContent = document.getElementById("deadlineDropdownContent");

// --- Settings & User Profile Controls ---
const navProfile = document.getElementById("navProfile");
const profileView = document.getElementById("profileView");
const usernameSettingsField = document.getElementById("usernameSettingsField");
const saveNameBtn = document.getElementById("saveNameBtn");
const reRequestLocationBtn = document.getElementById("re-requestLocationBtn");
const workspaceLogoutBtn = document.getElementById("workspaceLogoutBtn");

// --- Modals ---
const customLogoutModal = document.getElementById("customLogoutModal");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");

// --- Sidebar Routing Buttons ---
const navAddTask = document.getElementById("navAddTask");
const navCompleted = document.getElementById("navCompleted");
const navBin = document.getElementById("navBin");
const catNavButtons = document.querySelectorAll(".catNav");

// --- Main Canvas View Panels ---
const addTaskView = document.getElementById("addTaskView");
const completedView = document.getElementById("completedView");
const binView = document.getElementById("binView");

// --- Dynamic Live Metrics Dashboard ---
const badgePersonal = document.getElementById("badgePersonal");
const badgeCollege = document.getElementById("badgeCollege");
const badgeWork = document.getElementById("badgeWork");
const categoryProgressWrapper = document.getElementById("categoryProgressWrapper");
const progressCategoryName = document.getElementById("progressCategoryName");
const progressCount = document.getElementById("progressCount");
const progressBarFill = document.getElementById("progressBarFill");


// ==========================================================================
// 2. MODEL STORAGE & STATE MANAGEMENT
// ==========================================================================

// Pull existing databases from browser's hard drive, or start fresh arrays
let activeTasks = JSON.parse(localStorage.getItem("activeTasks")) || [];  
let deletedTasks = JSON.parse(localStorage.getItem("deletedTasks")) || []; 
let currentTheme = localStorage.getItem("appTheme") || "light";

// Application viewing states
let currentView = "All";     
let searchQuery = "";        

// Temporary internal states tracking selected dropdown target properties
let selectedUserDate = "";
let selectedUserTime = "";

// Initialize Theme on boot
if (currentTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggleBtn.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
}

/**
 * Universal save function. Call this anytime an array is modified.
 */
function saveToLocalStorage() {
    localStorage.setItem("activeTasks", JSON.stringify(activeTasks));
    localStorage.setItem("deletedTasks", JSON.stringify(deletedTasks));
}


// ==========================================================================
// 3. APP NAVIGATION ROUTING & DYNAMIC PREFERENCES CONTROLLERS
// ==========================================================================

// Global click listener to dismiss floating menus if you click outside of them
window.addEventListener("click", function(e) {
    document.querySelectorAll(".taskMenuDropdown").forEach(menu => menu.style.display = "none");
    if (!e.target.closest(".deadlineDropdownContainer")) {
        deadlineDropdownContent.classList.add("hidden");
        deadlineToggleBtn.classList.remove("activeState");
    }
});

// Sidebar hamburger toggle
menuBtn.addEventListener("click", function() {
    sidebar.classList.toggle("collapsed");
});

// Dark/Light mode toggle engine
themeToggleBtn.addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
    const isDarkActive = document.body.classList.contains("dark-mode");
    if (isDarkActive) {
        this.innerHTML = `<i class="fa-solid fa-sun"></i> <span>Light Mode</span>`;
        localStorage.setItem("appTheme", "dark");
    } else {
        this.innerHTML = `<i class="fa-solid fa-moon"></i> <span>Dark Mode</span>`;
        localStorage.setItem("appTheme", "light");
    }
});

// Global Search toggler logic
searchToggleBtn.addEventListener("click", function() {
    contentSearchContainer.classList.toggle("hiddenSearch");
    this.classList.toggle("activeSearchMode");
    const inputContainer = document.getElementById("inputContainer");

    if (!contentSearchContainer.classList.contains("hiddenSearch")) {
        // Search is active: Hide input box, focus search box
        inputContainer.style.display = "none"; 
        workspaceSearch.focus();               
    } else {
        // Search is closed: Clear query, restore layout, and re-render
        if (currentView === "All") inputContainer.style.display = "flex";
        workspaceSearch.value = "";            
        searchQuery = "";
        masterRender();                        
    }
});

// Live Search filtering
workspaceSearch.addEventListener("input", function(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    masterRender(); 
});

/**
 * Syncs the layout inside the deadline popover dynamically depending on the selected Horizon
 */
function renderDeadlineDropdownFields() {
    const scope = horizonSelect.value;
    if (scope === "Daily") {
        deadlineDropdownContent.innerHTML = `
            <label>Set Target Time</label>
            <input type="time" id="dueTimeInput">
        `;
    } else {
        deadlineDropdownContent.innerHTML = `
            <label>Set Target Date</label>
            <input type="date" id="dueDateInput">
            <label style="margin-top:5px;">Set Target Time (Optional)</label>
            <input type="time" id="dueTimeInput">
        `;
    }
    attachDropdownInputListeners();
}

/**
 * Binds change trackers to the dynamically generated inputs inside the popover
 */
function attachDropdownInputListeners() {
    const timeIn = document.getElementById("dueTimeInput");
    const dateIn = document.getElementById("dueDateInput");
    
    if (timeIn) {
        timeIn.value = selectedUserTime;
        timeIn.addEventListener("input", (e) => { 
            selectedUserTime = e.target.value; 
            updateDeadlineTriggerBtnLabel(); 
        });
    }
    if (dateIn) {
        dateIn.value = selectedUserDate;
        dateIn.addEventListener("input", (e) => { 
            selectedUserDate = e.target.value; 
            updateDeadlineTriggerBtnLabel(); 
        });
    }
}

/**
 * Transforms the visual label of the Deadline button so user knows what is selected
 */
function updateDeadlineTriggerBtnLabel() {
    const scope = horizonSelect.value;
    if (scope === "Daily" && selectedUserTime) {
        deadlineToggleBtn.innerHTML = `<i class="fa-solid fa-clock"></i> ${selectedUserTime}`;
        deadlineToggleBtn.classList.add("activeState");
    } else if (scope !== "Daily" && selectedUserDate) {
        const d = new Date(selectedUserDate);
        const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        let labelStr = `<i class="fa-solid fa-calendar-day"></i> ${formatted}`;
        if (selectedUserTime) labelStr += ` (${selectedUserTime})`;
        
        deadlineToggleBtn.innerHTML = labelStr;
        deadlineToggleBtn.classList.add("activeState");
    } else {
        // Reset to default empty state
        deadlineToggleBtn.innerHTML = `<i class="fa-regular fa-calendar-check"></i> Set Deadline`;
        deadlineToggleBtn.classList.remove("activeState");
    }
}

// Reset the dropdown cleanly if the user switches the main Horizon scope
horizonSelect.addEventListener("change", function() {
    selectedUserDate = "";
    selectedUserTime = "";
    updateDeadlineTriggerBtnLabel();
    renderDeadlineDropdownFields();
});

// Toggle the visibility of the popover
deadlineToggleBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    deadlineDropdownContent.classList.toggle("hidden");
    this.classList.toggle("activeState", !deadlineDropdownContent.classList.contains("hidden") || this.classList.contains("activeState"));
});

/**
 * Core View Routing logic. Hides/shows correct panels based on sidebar clicks.
 */
function handleTabChange(clickedBtn, viewSetting) {
    // 1. Reset all visual active states
    [navAddTask, navCompleted, navBin, navProfile, ...catNavButtons].forEach(btn => btn.classList.remove("activeNav"));
    [addTaskView, completedView, binView, profileView].forEach(panel => panel.classList.add("hidden"));
    
    // 2. Apply new states
    currentView = viewSetting;
    clickedBtn.classList.add("activeNav");
    const inputContainer = document.getElementById("inputContainer");

    // 3. Route to specific canvas
    if (viewSetting === "Bin") {
        binView.classList.remove("hidden");
        inputContainer.style.display = "none";
    } else if (viewSetting === "Completed") {
        completedView.classList.remove("hidden");
        inputContainer.style.display = "none";
    } else if (viewSetting === "Profile") {
        profileView.classList.remove("hidden");
        inputContainer.style.display = "none"; 
        usernameSettingsField.value = localStorage.getItem("todoUsername") || "";
    } else {
        // Main Task Canvas Routing
        addTaskView.classList.remove("hidden"); 
        if (viewSetting === "All" && contentSearchContainer.classList.contains("hiddenSearch")) {
            inputContainer.style.display = "flex";
        } else {
            inputContainer.style.display = "none"; 
        }
    }
    masterRender();
}

// Bind routing events to the sidebar buttons
navAddTask.addEventListener("click", () => handleTabChange(navAddTask, "All"));
navCompleted.addEventListener("click", () => handleTabChange(navCompleted, "Completed"));
navBin.addEventListener("click", () => handleTabChange(navBin, "Bin"));
navProfile.addEventListener("click", () => handleTabChange(navProfile, "Profile"));

catNavButtons.forEach(btn => {
    btn.addEventListener("click", function() {
        handleTabChange(this, this.getAttribute("data-category"));
    });
});


// ==========================================================================
// 4. MAIN TASK CREATION ENGINE
// ==========================================================================

button.addEventListener("click", function() {
    const taskText = input.value.trim();
    if (taskText === "") return;

    const now = new Date();
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true };
    const timeString = now.toLocaleDateString('en-US', options); 
    const chosenHorizon = horizonSelect.value;

    // --- PAST VALIDATION GUARD CHANNELS ---
    // Prevent the user from scheduling tasks in the past
    let targetTimestamp = null;
    if (chosenHorizon === "Daily" && selectedUserTime) {
        const tParts = selectedUserTime.split(":");
        const testDate = new Date();
        testDate.setHours(parseInt(tParts[0]), parseInt(tParts[1]), 0, 0);
        targetTimestamp = testDate.getTime();
    } else if (chosenHorizon !== "Daily" && selectedUserDate) {
        const dParts = selectedUserDate.split("-");
        const tParts = selectedUserTime ? selectedUserTime.split(":") : ["23", "59"];
        const testDate = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]), parseInt(tParts[0]), parseInt(tParts[1]), 0, 0);
        targetTimestamp = testDate.getTime();
    }

    if (targetTimestamp && targetTimestamp < now.getTime()) {
        alert("You cannot schedule a task target deadline in the past!");
        return;
    }

    // --- HARD BOUNDARY CALCULATION ---
    // Calculate absolute deadline boundaries for the card countdown logic
    let absoluteBoundaryDate = new Date();
    if (chosenHorizon === "Daily") {
        absoluteBoundaryDate.setHours(23, 59, 59, 999);
    } else if (chosenHorizon === "Weekly") {
        const dayOfWeek = absoluteBoundaryDate.getDay();
        const distanceToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        absoluteBoundaryDate.setDate(absoluteBoundaryDate.getDate() + distanceToSunday);
        absoluteBoundaryDate.setHours(23, 59, 59, 999);
    } else if (chosenHorizon === "Monthly") {
        absoluteBoundaryDate = new Date(absoluteBoundaryDate.getFullYear(), absoluteBoundaryDate.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Assemble the clean data object
    const newTask = {
        id: Date.now(), 
        text: taskText,
        time: timeString,
        category: categorySelect.value, 
        horizon: chosenHorizon,
        userTargetDate: chosenHorizon !== "Daily" ? selectedUserDate : "", 
        userTargetTime: selectedUserTime, 
        absoluteDeadline: absoluteBoundaryDate.getTime(),
        completed: false
    };

    activeTasks.push(newTask);
    saveToLocalStorage(); 
    masterRender();

    // Reset input fields cleanly
    input.value = ""; 
    selectedUserDate = "";
    selectedUserTime = "";
    updateDeadlineTriggerBtnLabel();
    renderDeadlineDropdownFields();
    resizeInput(input); 
});

// Allow 'Enter' key to trigger submission naturally
input.addEventListener("keydown", function(event) {
    if (event.key === "Enter") { 
        event.preventDefault(); 
        button.click(); 
    }
});


// ==========================================================================
// 5. RENDERING PIPELINE 
// ==========================================================================

// Regex helper to safely highlight search terms without breaking HTML
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query) {
    if (!query) return text;
    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark style="background-color: yellow; color: black; border-radius: 4px; padding: 0 2px;">$1</mark>');
}

// Global UI refresh trigger
function masterRender() {
    if (currentView === "Bin") renderBinView();
    else if (currentView === "Completed") renderCompletedView();
    else renderActiveTasksView();
    
    updateDynamicMetrics();
}

/**
 * Calculates live progress data and updates the category progress bars and sidebar counts
 */
function updateDynamicMetrics() {
    // 1. Update Sidebar Badges (Counts pending/uncompleted tasks)
    badgePersonal.textContent = activeTasks.filter(t => t.category === "Personal" && !t.completed).length;
    badgeCollege.textContent = activeTasks.filter(t => t.category === "College" && !t.completed).length;
    badgeWork.textContent = activeTasks.filter(t => t.category === "Work" && !t.completed).length;

    // 2. Update Header Progress Bar if in a specific category view
    if (["Personal", "College", "Work"].includes(currentView)) {
        categoryProgressWrapper.classList.remove("hidden");
        
        // Grab all tasks for the current active category
        const catTasks = activeTasks.filter(t => t.category === currentView);
        const total = catTasks.length;
        const completed = catTasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        progressCategoryName.textContent = `${currentView} Progress`;
        progressCount.textContent = `${percentage}% (${completed}/${total} completed)`;
        progressBarFill.style.width = `${percentage}%`;

        // Match the fill color to the beautiful category tags
        if (currentView === "Personal") progressBarFill.style.backgroundColor = "#ff9800";
        if (currentView === "College") progressBarFill.style.backgroundColor = "#2196f3";
        if (currentView === "Work") progressBarFill.style.backgroundColor = "#9c27b0";
    } else {
        // Hide progress bar if user is on 'All', 'Completed', or 'Bin' views
        categoryProgressWrapper.classList.add("hidden");
    }
}

/**
 * Renders the main active task board (handles All & Category specific filtering)
 */
function renderActiveTasksView() {
    list.innerHTML = "";
    
    // Safety check against legacy DB data to prevent `.toLowerCase()` crash
    const displayList = activeTasks.filter(task => {
        const matchesCategory = (currentView === "All" || task.category === currentView);
        const safeText = task.text || ""; 
        const matchesSearch = safeText.toLowerCase().includes(searchQuery);
        return matchesCategory && matchesSearch;
    });

    // Empty state messages
    if (displayList.length === 0) {
        let em = searchQuery.length > 0 ? `There is no task as "${workspaceSearch.value}"` : "Your clipboard is clean. Time to brainstorm your next big task!";
        list.innerHTML = `<div style="color: rgba(255,255,255,0.7); font-size: 20px; font-weight: bold; margin-top: 60px; text-align: center; font-style: italic;">${em}</div>`;
        return;
    }

    displayList.forEach(task => {
        const li = document.createElement("li");
        
        // --- HTML5 DRAG & DROP ACTIVATION ---
        li.setAttribute("draggable", "true");
        li.dataset.id = task.id; // Tags the HTML element with the backend Database ID

        li.addEventListener("dragstart", () => {
            li.classList.add("dragging");
        });

        li.addEventListener("dragend", () => {
            li.classList.remove("dragging");
            
            // Sync the backend array permanently ONLY if viewing the main list
            // (Reordering while filtering by category causes data corruption!)
            if (currentView === "All" && searchQuery === "") {
                const newOrderIds = [...list.querySelectorAll("li")].map(el => parseInt(el.dataset.id));
                
                activeTasks.sort((a, b) => {
                    const indexA = newOrderIds.indexOf(a.id);
                    const indexB = newOrderIds.indexOf(b.id);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
                
                saveToLocalStorage();
            }
        });

        if (task.completed) li.classList.add("completed");
        
        const safeText = task.text || "";
        const safeHorizon = task.horizon || "Daily";
        const safeCategory = task.category || "Personal";
        const highlightedText = highlightText(safeText, searchQuery);

        // --- MATH: Live Timing Countdown Calculation ---
        let countdownHTML = "";
        const now = new Date();
        let targetTimestamp = null;

        if (safeHorizon === "Daily" && task.userTargetTime) {
            const tParts = task.userTargetTime.split(":");
            const tDate = new Date();
            tDate.setHours(parseInt(tParts[0]), parseInt(tParts[1]), 0, 0);
            targetTimestamp = tDate.getTime();
        } else if (task.userTargetDate) {
            const dParts = task.userTargetDate.split("-");
            const tParts = (task.userTargetTime || "23:59").split(":");
            const tDate = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]), parseInt(tParts[0]), parseInt(tParts[1]), 0, 0);
            targetTimestamp = tDate.getTime();
        }

        if (targetTimestamp) {
            const timeDiff = targetTimestamp - now.getTime();
            if (timeDiff < 0) {
                // Task is missed and NOT completed: Turn the whole card RED!
                if (!task.completed) {
                    li.classList.add("overdue-card");
                }
                
                if (task.absoluteDeadline && now.getTime() > task.absoluteDeadline) {
                    countdownHTML = `<span class="deadlineTracker deadlineOverdue"><i class="fa-solid fa-circle-xmark"></i> Expired</span>`;
                } else {
                    countdownHTML = `<span class="deadlineTracker deadlineOverdue"><i class="fa-solid fa-triangle-exclamation"></i> Missed Target</span>`;
                }
            } else {
                const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
                if (hoursLeft < 24) {
                    countdownHTML = `<span class="deadlineTracker" style="background:#e65100; color:white;"><i class="fa-solid fa-bolt"></i> ${hoursLeft}h left</span>`;
                } else {
                    const daysLeft = Math.floor(hoursLeft / 24);
                    countdownHTML = `<span class="deadlineTracker"><i class="fa-solid fa-clock"></i> ${daysLeft}d left</span>`;
                }
            }
        } else {
            countdownHTML = `<span class="deadlineTracker"><i class="fa-solid fa-hourglass"></i> End of ${safeHorizon}</span>`;
        }

        // Generate the structural HTML
        li.innerHTML = `
        <button class="menuTriggerBtn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
        <div class="taskMenuDropdown" style="display: none;">
            <button class="menuOptionRow editOpt"><i class="fa-solid fa-pencil"></i> Edit</button>
            <button class="menuOptionRow completeOpt">
                <i class="${task.completed ? 'fa-solid fa-trash' : 'fa-solid fa-check'}"></i> 
                ${task.completed ? 'Delete' : 'Complete'}
            </button>
        </div>
        
        <div class="cardMainBody">
            <div class="cardTopRow">
                <span class="taskText">${highlightedText}</span>
                <span class="cardCategoryFlag cat-${safeCategory.toLowerCase()}">${safeCategory}</span>
            </div>
            <div class="cardTimerRow">
                ${countdownHTML}
            </div>
        </div>
        <div class="cardFooterShelf">
            <span class="cardHorizonLabel">${safeHorizon} Scope</span>
            <span class="taskTime">${task.time || ''}</span>
        </div>
        `;

        const menuTrigger = li.querySelector(".menuTriggerBtn");
        const dropdownMenu = li.querySelector(".taskMenuDropdown");
        const editBtn = li.querySelector(".editOpt");
        const completeBtn = li.querySelector(".completeOpt");

        // Action Menu Toggler
        menuTrigger.addEventListener("click", function(event) {
            event.stopPropagation(); 
            // Close all other open menus before opening this one
            document.querySelectorAll(".taskMenuDropdown").forEach(menu => {
                if (menu !== dropdownMenu) menu.style.display = "none";
            });
            if (dropdownMenu.style.display === "none" || dropdownMenu.style.display === "") {
                dropdownMenu.style.display = "flex";
            } else {
                dropdownMenu.style.display = "none";
            }
        });

        // Inline Text Editing Logic (Uses contenteditable attribute)
        editBtn.addEventListener("click", function(event) {
            event.stopPropagation();
            dropdownMenu.style.display = "none"; 
            
            const textSpan = li.querySelector(".taskText");
            textSpan.contentEditable = "true"; 
            textSpan.focus(); 
            
            // Move text cursor cleanly to the end of the line
            const range = document.createRange(); 
            const sel = window.getSelection();
            range.selectNodeContents(textSpan); 
            range.collapse(false); 
            sel.removeAllRanges(); 
            sel.addRange(range);
            
            // Allow user to hit 'Enter' to save edits
            textSpan.addEventListener("keydown", (e) => { 
                if (e.key === "Enter") { e.preventDefault(); textSpan.blur(); } 
            });
            
            // Commit changes to database on blur (losing focus)
            textSpan.addEventListener("blur", function() {
                textSpan.contentEditable = "false"; 
                const finalizedText = textSpan.innerText.trim();
                if (finalizedText !== "") { 
                    task.text = finalizedText; 
                    saveToLocalStorage(); 
                } else { 
                    textSpan.innerText = safeText; // Revert if blank
                }
                masterRender(); 
            }, { once: true }); 
        });

        // Toggle Complete or Delete
        completeBtn.addEventListener("click", function(event) {
            event.stopPropagation(); 
            dropdownMenu.style.display = "none";
            
            if (!task.completed) { 
                task.completed = true; 
            } else { 
                // If it was already completed and clicked again, send it to the Bin
                activeTasks = activeTasks.filter(item => item.id !== task.id); 
                deletedTasks.push(task); 
            }
            saveToLocalStorage(); 
            masterRender();
        });

        list.appendChild(li);
    });
}

function renderCompletedView() {
    completedList.innerHTML = "";
    
    const displayList = activeTasks.filter(task => {
        const safeText = task.text || "";
        return task.completed === true && safeText.toLowerCase().includes(searchQuery);
    });

    if (displayList.length === 0) {
        completedList.innerHTML = `<div style="color: rgba(255,255,255,0.7); font-size: 20px; font-weight: bold; margin-top: 60px; text-align: center; font-style: italic;">No completed tasks yet!</div>`;
        return;
    }

    displayList.forEach(task => {
        const li = document.createElement("li");
        li.classList.add("completed");
        
        const safeText = task.text || "";
        const safeHorizon = task.horizon || "Daily";
        const safeCategory = task.category || "Personal";
        const highlightedText = highlightText(safeText, searchQuery);

        li.innerHTML = `
        <button class="menuTriggerBtn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
        <div class="taskMenuDropdown" style="display: none;">
            <button class="menuOptionRow editOpt"><i class="fa-solid fa-pencil"></i> Edit</button>
            <button class="menuOptionRow deleteOpt"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
        <div class="cardMainBody">
            <div class="cardTopRow">
                <span class="taskText">${highlightedText}</span>
                <span class="cardCategoryFlag cat-${safeCategory.toLowerCase()}">${safeCategory}</span>
            </div>
            <div class="cardTimerRow">
                <span class="deadlineTracker"><i class="fa-solid fa-circle-check"></i> Completed</span>
            </div>
        </div>
        <div class="cardFooterShelf">
            <span class="cardHorizonLabel">${safeHorizon} Scope</span>
            <span class="taskTime">${task.time || ''}</span>
        </div>
        `;
        
        const menuTrigger = li.querySelector(".menuTriggerBtn");
        const dropdownMenu = li.querySelector(".taskMenuDropdown");
        const deleteBtn = li.querySelector(".deleteOpt");

        menuTrigger.addEventListener("click", function(event) {
            event.stopPropagation();
            document.querySelectorAll(".taskMenuDropdown").forEach(menu => { if (menu !== dropdownMenu) menu.style.display = "none"; });
            dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "flex" : "none";
        });

        // Trashing a completed item permanently removes it from active list and pushes to Bin
        deleteBtn.addEventListener("click", function(event) {
            event.stopPropagation(); dropdownMenu.style.display = "none";
            activeTasks = activeTasks.filter(item => item.id !== task.id); 
            deletedTasks.push(task);
            saveToLocalStorage(); 
            masterRender(); 
        });

        completedList.appendChild(li);
    });
}

function renderBinView() {
    binList.innerHTML = "";
    
    const displayList = deletedTasks.filter(task => {
        const safeText = task.text || "";
        return safeText.toLowerCase().includes(searchQuery);
    });

    if (displayList.length === 0) {
        binList.innerHTML = `<div style="color: rgba(255,255,255,0.7); font-size: 20px; font-weight: bold; margin-top: 40px; text-align: center; font-style: italic;">The recycling bin is completely empty.</div>`;
        return;
    }

    displayList.forEach(task => {
        const li = document.createElement("li");
        
        const safeText = task.text || "";
        const safeHorizon = task.horizon || "Daily";
        const safeCategory = task.category || "Personal";
        const highlightedText = highlightText(safeText, searchQuery);

        li.innerHTML = `
        <button class="menuTriggerBtn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
        <div class="taskMenuDropdown" style="display: none;">
            <button class="menuOptionRow restoreOpt" style="color: #4CAF50;"><i class="fa-solid fa-rotate-left"></i> Restore</button>
            <button class="menuOptionRow deleteOpt"><i class="fa-solid fa-trash-can"></i> Delete Forever</button>
        </div>
        <div class="cardMainBody">
            <div class="cardTopRow">
                <span class="taskText">${highlightedText}</span>
                <span class="cardCategoryFlag cat-${safeCategory.toLowerCase()}">${safeCategory}</span>
            </div>
            <div class="cardTimerRow">
                <span class="deadlineTracker deadlineOverdue"><i class="fa-solid fa-trash"></i> Trash Item</span>
            </div>
        </div>
        <div class="cardFooterShelf">
            <span class="cardHorizonLabel">${safeHorizon} Scope</span>
            <span class="taskTime">${task.time || ''}</span>
        </div>
        `;

        const menuTrigger = li.querySelector(".menuTriggerBtn");
        const dropdownMenu = li.querySelector(".taskMenuDropdown");
        const restoreBtn = li.querySelector(".restoreOpt");
        const permanentDeleteBtn = li.querySelector(".deleteOpt");

        menuTrigger.addEventListener("click", function(event) {
            event.stopPropagation();
            document.querySelectorAll(".taskMenuDropdown").forEach(menu => { if (menu !== dropdownMenu) menu.style.display = "none"; });
            dropdownMenu.style.display = dropdownMenu.style.display === "none" ? "flex" : "none";
        });

        // Pull out of Bin DB, Push back to Active DB
        restoreBtn.addEventListener("click", function(event) {
            event.stopPropagation(); dropdownMenu.style.display = "none";
            deletedTasks = deletedTasks.filter(item => item.id !== task.id); 
            activeTasks.push(task);
            saveToLocalStorage(); 
            masterRender();
        });

        // Completely annihilate from local storage
        permanentDeleteBtn.addEventListener("click", function(event) {
            event.stopPropagation(); dropdownMenu.style.display = "none";
            deletedTasks = deletedTasks.filter(item => item.id !== task.id);
            saveToLocalStorage(); 
            masterRender();
        });

        binList.appendChild(li);
    });
}


// ==========================================================================
// 6. DYNAMIC TEXTAREA INITIAL SIZING
// ==========================================================================

/**
 * Uses a hidden ghost span element to mathematically calculate the exact pixel 
 * width of the typed text, and adjusts the textarea box boundaries dynamically to match.
 */
function resizeInput(element) {
    if (element.value.trim().length === 0) { 
        element.style.width = "180px"; 
        element.style.height = "40px"; 
        return; 
    }
    
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden"; 
    tempSpan.style.position = "absolute"; 
    tempSpan.style.whiteSpace = "pre";
    tempSpan.style.font = window.getComputedStyle(element).font; 
    tempSpan.textContent = element.value;
    
    document.body.appendChild(tempSpan);
    const newWidth = tempSpan.getBoundingClientRect().width + 40; 
    
    if (newWidth > 180 && newWidth < 400) element.style.width = newWidth + "px";
    else if (newWidth >= 400) element.style.width = "400px"; 
    
    document.body.removeChild(tempSpan);
    
    element.style.height = "40px"; 
    if (element.scrollHeight > 40) {
        element.style.height = element.scrollHeight + "px"; 
    }
}


// ==========================================================================
// 7. ACCOUNT INITIALIZATION & OPEN-METEO WEATHER API
// ==========================================================================

/**
 * Boots the application, checking for a saved user session. 
 * Triggers onboarding if none exists.
 */
function initAppLifecycle() {
    const savedName = localStorage.getItem("todoUsername");
    if (!savedName || savedName.trim() === "") {
        onboardingGateway.classList.remove("hidden");
        appContainer.classList.add("hidden");
    } else {
        onboardingGateway.classList.add("hidden");
        appContainer.classList.remove("hidden");
        
        updateGreeting(savedName.trim());
        startLiveClock();
        fetchLocalWeather();
        renderDeadlineDropdownFields(); 
        handleTabChange(navAddTask, "All"); 
    }
}

// Settings and Logout event binding
workspaceLogoutBtn.addEventListener("click", function() { customLogoutModal.classList.remove("hiddenModal"); });
modalCancelBtn.addEventListener("click", function() { customLogoutModal.classList.add("hiddenModal"); });
modalConfirmBtn.addEventListener("click", function() {
    customLogoutModal.classList.add("hiddenModal");
    localStorage.clear(); 
    activeTasks = []; 
    deletedTasks = []; 
    currentView = "All"; 
    searchQuery = "";
    onboardingNameInput.value = ""; 
    initAppLifecycle(); // Force reboot into Onboarding
});

// Location Permission Request flow
onboardingLocationBtn.addEventListener("click", function() {
    onboardingGeoStatus.textContent = "Requesting permission...";
    navigator.geolocation.getCurrentPosition(
        () => { 
            onboardingGeoStatus.textContent = "Location Granted! ✓"; 
            onboardingGeoStatus.style.color = "#009688"; 
        },
        () => { 
            let fallbackCity = prompt("Browser location blocked! No worries, just type your City Name manually for weather:", "Delhi");
            if (fallbackCity && fallbackCity.trim() !== "") {
                localStorage.setItem("todoUserCity", fallbackCity.trim());
                onboardingGeoStatus.textContent = `Using ${fallbackCity.trim()} ✓`;
                onboardingGeoStatus.style.color = "#009688";
            } else { 
                onboardingGeoStatus.textContent = "Using default location."; 
            }
        }
    );
});

onboardingSubmitBtn.addEventListener("click", function() {
    const typedName = onboardingNameInput.value.trim();
    if (typedName === "") { alert("Please enter your name to unlock your workspace!"); return; }
    localStorage.setItem("todoUsername", typedName);
    initAppLifecycle();
});

function updateGreeting(name) {
    const currentHour = new Date().getHours();
    let timeGreeting = "Hello";
    if (currentHour >= 5 && currentHour < 12) timeGreeting = "Good morning";
    else if (currentHour >= 12 && currentHour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    document.getElementById("greetingLine").textContent = `${timeGreeting}, ${name}!`;
}

saveNameBtn.addEventListener("click", function() {
    const updatedName = usernameSettingsField.value.trim();
    if (updatedName !== "") { 
        localStorage.setItem("todoUsername", updatedName); 
        updateGreeting(updatedName); 
        alert("Username updated successfully!"); 
    }
});

reRequestLocationBtn.addEventListener("click", function() {
    localStorage.removeItem("todoUserCity"); 
    fetchLocalWeather();
});

/**
 * Main heartbeat loop for the dashboard clock and silent background UI updates
 */
function startLiveClock() {
    setInterval(() => {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        document.getElementById("liveClock").textContent = now.toLocaleTimeString('en-US', timeOptions);
        
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        document.getElementById("liveDate").textContent = now.toLocaleDateString('en-US', dateOptions);
        
        // --- SILENT BACKGROUND AUTO-REFRESH ENGINE ---
        // Every time the clock hits exactly 00 seconds (once a minute), trigger a silent UI refresh
        if (now.getSeconds() === 0) {
            
            // UI SAFEGUARD: Make sure we don't accidentally refresh the screen 
            // while user is actively editing text or navigating a menu!
            const isEditing = document.querySelector('[contenteditable="true"]');
            const isMenuOpen = Array.from(document.querySelectorAll('.taskMenuDropdown')).some(menu => menu.style.display === 'flex');
            
            if (!isEditing && !isMenuOpen) {
                masterRender();
            }
        }
    }, 1000); 
}

/**
 * Handles fetching weather based on either saved City strings or raw Geolocation data
 */
function fetchLocalWeather() {
    const weatherIcon = document.getElementById("weatherIcon");
    const weatherText = document.getElementById("weatherText");
    const savedCity = localStorage.getItem("todoUserCity");
    
    // Path 1: User manually provided a City Name
    if (savedCity) {
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(savedCity)}&count=1&language=en&format=json`)
            .then(res => res.json())
            .then(async geoData => {
                if (geoData.results && geoData.results.length > 0) {
                    await getWeatherDetails(geoData.results[0].latitude, geoData.results[0].longitude, geoData.results[0].name);
                } else { weatherText.textContent = savedCity; }
            }).catch(() => { weatherText.textContent = savedCity; });
        return;
    }

    if (!navigator.geolocation) { weatherText.textContent = "Weather unavailable"; return; }

    // Path 2: Browser provided raw coordinates, reverse-geocode them first
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            const lat = position.coords.latitude; const lon = position.coords.longitude;
            try {
                const geoResponse = await fetch(`https://api.bigdatacloud.com/v1/geolocation/reverse-geocode?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                const geoData = await geoResponse.json();
                const city = geoData.city || geoData.principalSubdivision || geoData.locality || "My Location";
                await getWeatherDetails(lat, lon, city);
            } catch (error) { 
                await getWeatherDetails(lat, lon, "My Location"); 
            }
        },
        () => { 
            weatherText.textContent = "Delhi"; 
            weatherIcon.innerHTML = `<i class="fa-solid fa-sun" style="color: #ffca28;"></i>`; 
        }
    );
}

/**
 * Final execution function querying the Open-Meteo API using prepared Lat/Lon coords
 */
async function getWeatherDetails(lat, lon, cityName) {
    const weatherIcon = document.getElementById("weatherIcon");
    const weatherText = document.getElementById("weatherText");
    try {
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherResponse.json();
        const temp = Math.round(weatherData.current_weather.temperature);
        const code = weatherData.current_weather.weathercode;

        // Interpret Weather Conditions Mapping
        let iconHTML = `<i class="fa-solid fa-cloud"></i>`; 
        if (code === 0) iconHTML = `<i class="fa-solid fa-sun" style="color: #ffca28;"></i>`; 
        else if (code >= 1 && code <= 3) iconHTML = `<i class="fa-solid fa-cloud-sun"></i>`;  
        else if (code >= 51 && code <= 67) iconHTML = `<i class="fa-solid fa-cloud-showers-heavy"></i>`; 
        else if (code >= 71 && code <= 77) iconHTML = `<i class="fa-solid fa-snowflake"></i>`; 
        else if (code >= 95) iconHTML = `<i class="fa-solid fa-cloud-bolt"></i>`; 

        weatherIcon.innerHTML = iconHTML;
        weatherText.textContent = `${temp}°C · ${cityName}`;
    } catch (e) { 
        weatherText.textContent = cityName; 
    }
}


// ==========================================================================
// 8. DRAG AND DROP LISTENER ENGINE
// ==========================================================================

// Global Kanban Board listener allowing items to be actively dragged over it
list.addEventListener("dragover", function(e) {
    e.preventDefault(); // Required browser override to allow elements to drop inside this container
    
    const draggingItem = document.querySelector(".dragging");
    if (!draggingItem) return;

    // Grab every card currently rendered EXCEPT the one we are actively holding
    const siblings = [...list.querySelectorAll("li:not(.dragging)")];

    // Math Engine: Find the specific card directly below our current mouse pointer Y-coordinates
    let nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        const boxCenterY = box.top + box.height / 2;
        return e.clientY <= boxCenterY;
    });

    // Dynamically part the list and insert the floating card right before the target card
    list.insertBefore(draggingItem, nextSibling);
});


// Boot the System
initAppLifecycle();