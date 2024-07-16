function changeSpeed(videoId, speed) {
    const video = document.getElementById(videoId);
    video.playbackRate = speed;
}

function updateCurrentTime(videoId) {
    const video = document.getElementById(videoId);
    const currentTime = video.currentTime;
    const duration = video.duration;
    const percentage = (currentTime / duration) * 100;
    const currentTimeDisplay = document.querySelectorAll(`.current-time${videoId}`);
    const timeBar = document.getElementById(`time-bar${videoId}`);
    currentTimeDisplay.textContent = formatTime(currentTime);
    timeBar.style.width = percentage + '%';
    
}



// Add event listeners to update the time display bars
const video1 = document.getElementById('video1');
video1.addEventListener('timeupdate', () => {
    updateCurrentTime('video1');
    

});

const video2 = document.getElementById('video2');
video2.addEventListener('timeupdate', () => {
    updateCurrentTime('video2');
    video2.parentElement.querySelector('.time-bar').style.width = percentage + '%';
});


const videos = document.querySelectorAll('video');
const currentTimeDisplays = document.querySelectorAll('.current-time');

// Update the time display bars for each video
videos.forEach((video, index) => {
    video.addEventListener('timeupdate', () => {
        const currentTime = video.currentTime;
        const duration = video.duration;
        const percentage = (currentTime / duration) * 100;
        currentTimeDisplays[index].textContent = formatTime(currentTime);
        video.parentElement.querySelector('.time-bar').style.width = percentage + '%';
        
    });
});

// Format time in MM:SS
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}




// Function to toggle the visibility of the dropdown menu
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
}

// Close the dropdown menus if the user clicks outside of them
window.onclick = function(event) {
    if (!event.target.matches('.navbar')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            const dropdown = dropdowns[i];
            if (dropdown.style.display === "none") {
                dropdown.style.display = "none";
            }
        }
    }
}

const navLinks = document.querySelectorAll('#nav a');
const contentSections = document.querySelectorAll('.content');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove the 'active' class from all links
        navLinks.forEach(navLink => {
            navLink.classList.remove('active');
        });

        // Add the 'active' class to the clicked link
        link.classList.add('active');

        // Show the corresponding content section and hide others
        const targetSectionId = link.getAttribute('href').substring(1);
        contentSections.forEach(section => {
            section.style.display = section.id === targetSectionId ? 'block' : 'none';
        });
    });
});