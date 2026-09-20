Student Result Management System (SRMS)

A full-stack web application that allows administrators to manage student profiles, courses, and academic grades, while providing a secure dashboard for students to view their results.

Features
- Admin Dashboard: Full CRUD operations to add, update, or remove students, subjects, and exam scores.
- Student Portal: Secure login screen for students to quickly view their individual report cards.
- Dynamic Frontend: Built with interactive JavaScript for seamless form submissions and data viewing.
- Relational Database: Organized SQL structure tracking student profiles linked directly to their grades.

 Tech Stack
- Backend: Python (Flask Framework)
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Database: SQL (SQLite / MySQL)

Project Structure
- `app.py` - Contains the Python Flask backend routes and the SQL database connection logic.
- `login.html` / `login.css` / `login.js` - The structural layout, visual styling, and verification scripts for the secure login page.
- `dashboard.html` / `dashboard.css` / `dashboard.js` - The frontend layout, styling, and interactive data functions for the student dashboard.
- `images/` - Folder containing the visual icons and background assets used across the user interface.

How to Setup and Run Locally

1. Clone the repository:
   ```bash
   git clone https://github.com
   ```

2. Navigate into the folder:
   ```bash
   cd Student-result-management-system-SRMS-
   ```

3. Install Flask:
   ```bash
   pip install flask
   ```

4. Run the application:
   ```bash
   python app.py
   ```
5. Open your browser and go to `http://127.0.0`
   
6.Project will work on local host when you run it.
