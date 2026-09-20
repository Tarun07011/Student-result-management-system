const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const role     = document.getElementById('role').value.trim().toLowerCase();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!role || !username || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Send to Flask backend
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role, username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Save role to localStorage
            localStorage.setItem('userRole', data.role);

            // If student, save their reg_no
            if (data.role === 'student' && data.reg_no) {
                localStorage.setItem('studentRegNo', data.reg_no);
            }

            // Redirect to dashboard
            window.location.href = '/dashboard';

        } else {
            alert(data.message || 'Invalid credentials!');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Cannot connect to server. Make sure Flask is running!');
    });
});