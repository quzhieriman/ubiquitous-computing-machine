// REPLACE THIS CONFIG WITH YOUR FIREBASE PROJECT SETTINGS
const firebaseConfig = {
  apiKey: "AIzaSyBnY7u_4Ldy_MMdWB-1hG8G9tnEYu1eZkk",
  authDomain: "reqwr-d8d4e.firebaseapp.com",
  projectId: "reqwr-d8d4e",
  storageBucket: "reqwr-d8d4e.firebasestorage.app",
  messagingSenderId: "466453494262",
  appId: "1:466453494262:web:5b76d3e5e7a867fc90afd7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentSchoolCode = null;

// Navigation
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

// 1. LOGIN SYSTEM
function login() {
    const code = document.getElementById('login-code').value;
    const pass = document.getElementById('login-pass').value;

    db.ref('schools/' + code).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.password === pass) {
            currentSchoolCode = code;
            document.getElementById('current-school-display').innerText = data.name;
            document.getElementById('logout-btn').classList.remove('hidden');
            startAttendanceSync();
            showSection('attendance-view');
        } else {
            alert("Invalid School Credentials");
        }
    });
}

// 2. REAL-TIME SYNC (The Heart of the App)
function startAttendanceSync() {
    // This listener waits for changes in the database and updates your screen instantly
    db.ref('schools/' + currentSchoolCode + '/students').on('value', (snapshot) => {
        const students = snapshot.val() || [];
        const container = document.getElementById('student-list');
        container.innerHTML = '';

        students.forEach((student, index) => {
            const div = document.createElement('div');
            div.className = 'student-row';
            div.innerHTML = `
                <span>${index + 1}. <strong>${student.name}</strong></span>
                <input type="checkbox" ${student.present ? 'checked' : ''} 
                    onchange="updatePresence(${index}, this.checked)">
            `;
            container.appendChild(div);
        });
    });
}

function updatePresence(index, isPresent) {
    // Saves to Cloud - All other devices will update immediately
    db.ref(`schools/${currentSchoolCode}/students/${index}`).update({
        present: isPresent
    });
}

// 3. ADMIN: THE ABSENTEE LIST
function fetchAbsentees() {
    const report = document.getElementById('absentee-report');
    report.innerHTML = 'Scanning all schools...';

    db.ref('schools').once('value', (snapshot) => {
        report.innerHTML = '';
        const allSchools = snapshot.val();
        
        for (let code in allSchools) {
            const school = allSchools[code];
            const absentees = school.students ? school.students.filter(s => !s.present) : [];
            
            if (absentees.length > 0) {
                const schoolDiv = document.createElement('div');
                schoolDiv.innerHTML = `<strong>${school.name} (${code}):</strong>`;
                absentees.forEach(a => {
                    schoolDiv.innerHTML += `<div class="absent-item">❌ ${a.name}</div>`;
                });
                report.appendChild(schoolDiv);
            }
        }
    });
}

// 4. ADMIN: ADDING DATA
function adminCreateSchool() {
    const name = document.getElementById('adm-name').value;
    const code = document.getElementById('adm-code').value;
    const pass = document.getElementById('adm-pass').value;
    
    db.ref('schools/' + code).set({
        name: name,
        password: pass,
        students: []
    }).then(() => alert("School Registered on Cloud!"));
}

function adminAddStudent() {
    if(!currentSchoolCode) return alert("Select a school first!");
    const name = document.getElementById('adm-student').value;
    
    db.ref('schools/' + currentSchoolCode + '/students').once('value', (snapshot) => {
        const currentList = snapshot.val() || [];
        currentList.push({ name: name, present: false });
        db.ref('schools/' + currentSchoolCode + '/students').set(currentList);
        alert("Student added to global list!");
    });
}

function logout() {
    location.reload(); // Simplest way to clear session
}