from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__, static_folder='.')
CORS(app)

# ============================
# EMAIL CONFIG
# ============================
# Step 1: Set your Gmail address below
# Step 2: Use a Gmail App Password (NOT your real password)
#         Go to: Google Account → Security → 2-Step Verification → App Passwords
#         Create one for "Mail" and paste it below
# Step 3: Set EMAIL_ENABLED = True
EMAIL_SENDER   = "YOUR_EMAIL_HERE@gmail.com"   
EMAIL_PASSWORD = "YOUR_GMAIL_APP_PASSWORD_HERE"     
EMAIL_ENABLED  = False                     


# ============================
# PUBLISH STATUS (in-memory)
# ============================
_publish_status = {'published': False}


# ============================
# DATABASE CONNECTION
# ============================

def get_db():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='YOUR_DATABASE_PASSWORD_HERE',
        database='srms_db',
        cursorclass=pymysql.cursors.DictCursor
    )


# ============================
# SERVER-SIDE VALIDATION HELPERS
# ============================

def validate_reg_no(value):
    v = (value or "").strip()
    if not v:
        return "Register number is required."
    if not re.match(r'^[A-Za-z0-9]+$', v):
        return "Register number must be alphanumeric only (no spaces or symbols)."
    if len(v) < 3:
        return "Register number must be at least 3 characters."
    if len(v) > 12:
        return "Register number cannot exceed 12 characters."
    if not re.match(r'^(U18CC|BCA)', v, re.IGNORECASE):
        return "Register number must start with U18CC or BCA."
    return None


def validate_name(value):
    v = (value or "").strip()
    if not v:
        return "Student name is required."
    if re.search(r'[0-9]', v):
        return "Student name must not contain numbers."
    if not re.match(r'^[A-Za-z\s]+$', v):
        return "Student name must contain letters only."
    if len(v) < 2 or len(v) > 100:
        return "Student name must be 2–100 characters."
    return None


def validate_dept(value):
    v = (value or "").strip().upper()
    if not v:
        return "Please select a course."
    if v not in ["BCA", "BBA", "BCOM"]:
        return "Course must be BCA, BBA, or BCOM only."
    return None


def validate_semester(value):
    v = str(value or "").strip()
    if not v:
        return "Semester is required."
    if not re.match(r'^\d+$', v):
        return "Semester must be a number."
    n = int(v)
    if n < 1 or n > 6:
        return "Semester must be between 1 and 6."
    return None


def validate_subject_name(value):
    v = (value or "").strip()
    if not v:
        return "Subject name is required."
    if re.search(r'[0-9]', v):
        return "Subject name must not contain numbers."
    if not re.match(r'^[A-Za-z\s\-]+$', v):
        return "Subject name must contain letters only."
    if len(v) < 2 or len(v) > 80:
        return "Subject name must be 2–80 characters."
    return None


def validate_credits(value):
    v = str(value or "").strip()
    if not v:
        return "Credits is required."
    if not re.match(r'^\d+$', v):
        return "Credits must be a whole number."
    n = int(v)
    if n < 1 or n > 5:
        return "Credits must be between 1 and 5."
    return None


def validate_marks(internal, external):
    errors = []
    try:
        i = int(internal)
        if i < 0:   errors.append("Internal marks cannot be negative.")
        if i > 40:  errors.append("Internal marks cannot exceed 40.")
    except (ValueError, TypeError):
        errors.append("Internal marks must be a valid number.")
    try:
        e = int(external)
        if e < 0:   errors.append("External marks cannot be negative.")
        if e > 60:  errors.append("External marks cannot exceed 60.")
    except (ValueError, TypeError):
        errors.append("External marks must be a valid number.")
    return errors


# ============================
# RUN MIGRATION ON STARTUP
# ============================

def run_migration():
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("""
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS email VARCHAR(150) DEFAULT NULL
        """)
        try:
            cursor.execute("""
                ALTER TABLE results
                ADD COLUMN id INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST
            """)
        except:
            pass
        db.commit()
        cursor.close()
        db.close()
        print("✅ Migration done!")
    except Exception as e:
        print("Migration note:", str(e))


# ============================
# SERVE HTML PAGES
# ============================

@app.route('/')
def home():
    return send_from_directory('.', 'login.html')

@app.route('/dashboard')
def dashboard():
    return send_from_directory('.', 'dashboard.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)


# ============================
# LOGIN API
# ============================

@app.route('/login', methods=['POST'])
def login():
    try:
        data     = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        role     = data.get('role', '').strip()

        if not username or not password or not role:
            return jsonify({'success': False, 'message': 'Please fill in all fields'})

        db     = get_db()
        cursor = db.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE username=%s AND password=%s AND role=%s",
            (username, password, role)
        )
        user = cursor.fetchone()
        cursor.close()
        db.close()

        if user:
            reg_no = username if role == 'student' else None
            return jsonify({'success': True, 'role': role, 'username': username, 'reg_no': reg_no})
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# LOGOUT API
# ============================

@app.route('/logout', methods=['POST'])
def logout():
    return jsonify({'success': True})


# ============================
# STUDENT APIs
# ============================

@app.route('/api/students', methods=['GET'])
def get_students():
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM students")
        students = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/students', methods=['POST'])
def add_student():
    try:
        data   = request.get_json()
        reg_no = data.get('regNo', '').strip()
        name   = data.get('name', '').strip()
        dept   = data.get('dept', '').strip()
        email  = data.get('email', '').strip()

        err = validate_reg_no(reg_no)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_name(name)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_dept(dept)
        if err: return jsonify({'success': False, 'message': err})

        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return jsonify({'success': False, 'message': 'Enter a valid email address.'})

        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM students WHERE reg_no=%s", (reg_no,))
        if cursor.fetchone():
            cursor.close(); db.close()
            return jsonify({'success': False, 'message': 'Student with this register number already exists!'})

        cursor.execute(
            "INSERT INTO students (reg_no, name, dept, email) VALUES (%s, %s, %s, %s)",
            (reg_no, name, dept.upper(), email or None)
        )
        db.commit()
        cursor.close(); db.close()
        return jsonify({'success': True, 'message': 'Student added successfully!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# RESULT APIs
# ============================

@app.route('/api/results', methods=['GET'])
def get_results():
    try:
        reg_no = request.args.get('reg_no', None)
        db     = get_db()
        cursor = db.cursor()
        if reg_no:
            cursor.execute("SELECT * FROM results WHERE reg_no=%s", (reg_no,))
        else:
            cursor.execute("SELECT * FROM results")
        results = cursor.fetchall()
        cursor.close(); db.close()
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/results', methods=['POST'])
def add_result():
    try:
        data     = request.get_json()
        reg_no   = data.get('regNo', '').strip()
        semester = str(data.get('semester', '')).strip()
        subject  = data.get('subject', '').strip()
        typ      = (data.get('type', 'Theory') or 'Theory').strip()
        internal = data.get('internal', 0)
        external = data.get('external', 0)
        credits  = data.get('credits', 0)

        err = validate_reg_no(reg_no)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_semester(semester)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_subject_name(subject)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_credits(credits)
        if err: return jsonify({'success': False, 'message': err})

        marks_errors = validate_marks(internal, external)
        if marks_errors:
            return jsonify({'success': False, 'message': ' | '.join(marks_errors)})

        internal = int(internal)
        external = int(external)
        credits  = int(credits)
        total    = internal + external
        grade    = calculate_grade(total)

        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM students WHERE reg_no=%s", (reg_no,))
        if not cursor.fetchone():
            cursor.close(); db.close()
            return jsonify({'success': False, 'message': 'Student not found! Add student first.'})

        cursor.execute(
            """INSERT INTO results
               (reg_no, semester, subject, type, internal, external, total, grade, credits)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (reg_no, semester, subject, typ, internal, external, total, grade, credits)
        )
        db.commit()
        cursor.close(); db.close()
        return jsonify({'success': True, 'message': 'Result added successfully!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# BULK IMPORT API
# ============================

@app.route('/api/results/bulk', methods=['POST'])
def add_result_bulk():
    try:
        data     = request.get_json()
        reg_no   = data.get('regNo', '').strip()
        semester = str(data.get('semester', '')).strip()
        subject  = data.get('subject', '').strip()
        typ      = (data.get('type', 'Theory') or 'Theory').strip()
        internal = data.get('internal', 0)
        external = data.get('external', 0)
        credits  = data.get('credits', 0)

        err = validate_reg_no(reg_no)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_semester(semester)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_subject_name(subject)
        if err: return jsonify({'success': False, 'message': err})

        err = validate_credits(credits)
        if err: return jsonify({'success': False, 'message': err})

        marks_errors = validate_marks(internal, external)
        if marks_errors:
            return jsonify({'success': False, 'message': ' | '.join(marks_errors)})

        internal = int(internal)
        external = int(external)
        credits  = int(credits)
        total    = internal + external
        grade    = calculate_grade(total)

        db     = get_db()
        cursor = db.cursor()

        cursor.execute("SELECT reg_no FROM students WHERE reg_no=%s", (reg_no,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO students (reg_no, name, dept) VALUES (%s, %s, %s)",
                (reg_no, reg_no, 'BCA')
            )

        cursor.execute(
            """INSERT INTO results
               (reg_no, semester, subject, type, internal, external, total, grade, credits)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (reg_no, semester, subject, typ, internal, external, total, grade, credits)
        )
        db.commit()
        cursor.close(); db.close()
        return jsonify({'success': True, 'message': 'Result added successfully!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# EDIT RESULT API
# ============================

@app.route('/api/results/<int:result_id>', methods=['PUT'])
def update_result(result_id):
    try:
        data     = request.get_json()
        internal = data.get('internal', 0)
        external = data.get('external', 0)
        credits  = data.get('credits', 0)

        err = validate_credits(credits)
        if err: return jsonify({'success': False, 'message': err})

        marks_errors = validate_marks(internal, external)
        if marks_errors:
            return jsonify({'success': False, 'message': ' | '.join(marks_errors)})

        internal = int(internal)
        external = int(external)
        credits  = int(credits)
        total    = internal + external
        grade    = calculate_grade(total)

        db     = get_db()
        cursor = db.cursor()
        cursor.execute(
            "UPDATE results SET internal=%s, external=%s, total=%s, grade=%s, credits=%s WHERE id=%s",
            (internal, external, total, grade, credits, result_id)
        )
        db.commit()
        affected = cursor.rowcount
        cursor.close(); db.close()

        if affected == 0:
            return jsonify({'success': False, 'message': 'Result not found!'})
        return jsonify({'success': True, 'message': 'Result updated successfully!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# DELETE RESULT API
# ============================

@app.route('/api/results/<int:result_id>', methods=['DELETE'])
def delete_result(result_id):
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM results WHERE id=%s", (result_id,))
        db.commit()
        affected = cursor.rowcount
        cursor.close(); db.close()
        if affected == 0:
            return jsonify({'success': False, 'message': 'Result not found!'})
        return jsonify({'success': True, 'message': 'Result deleted successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# STATS API
# ============================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM students")
        total_students = cursor.fetchone()['count']
        cursor.execute("SELECT COUNT(*) as count FROM results")
        total_results = cursor.fetchone()['count']
        cursor.execute("SELECT DISTINCT reg_no FROM results")
        all_reg = cursor.fetchall()
        passed = failed = 0
        for row in all_reg:
            cursor.execute("SELECT total FROM results WHERE reg_no=%s", (row['reg_no'],))
            subs = cursor.fetchall()
            if all(s['total'] >= 40 for s in subs): passed += 1
            else: failed += 1
        cursor.close(); db.close()
        return jsonify({'success': True, 'totalStudents': total_students,
                        'totalResults': total_results, 'totalPassed': passed, 'totalFailed': failed})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# PUBLISH STATUS API
# ============================

@app.route('/api/publish_status', methods=['GET'])
def get_publish_status():
    return jsonify({'success': True, 'published': _publish_status['published']})

@app.route('/api/publish_status', methods=['POST'])
def set_publish_status():
    try:
        data = request.get_json()
        _publish_status['published'] = bool(data.get('published', False))
        return jsonify({'success': True, 'published': _publish_status['published']})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# EMAIL NOTIFICATION API
# ============================

@app.route('/api/notify_students', methods=['POST'])
def notify_students():
    if not EMAIL_ENABLED:
        return jsonify({
            'success': False,
            'message': 'Email not configured. Open app.py, fill EMAIL_SENDER, EMAIL_PASSWORD, then set EMAIL_ENABLED = True.'
        })
    try:
        db     = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT reg_no, name, email FROM students WHERE email IS NOT NULL AND email != ''")
        students = cursor.fetchall()
        cursor.close(); db.close()

        if not students:
            return jsonify({'success': False, 'message': 'No student emails found. Add emails when registering students.'})

        sent = 0
        errors = []

        for student in students:
            try:
                msg            = MIMEMultipart('alternative')
                msg['Subject'] = "Your Results Are Now Available — SRMS Portal"
                msg['From']    = EMAIL_SENDER
                msg['To']      = student['email']

                html_body = f"""
                <html>
                <body style="font-family:Arial,sans-serif;color:#1a1a2e;background:#f4f6fb;padding:20px;">
                  <div style="max-width:520px;margin:auto;background:#fff;padding:32px 28px;
                              border-radius:14px;border:1px solid #e0e4f0;">

                    <h2 style="color:#0a0f2c;margin-top:0;">SRMS Academic Portal</h2>

                    <p style="font-size:15px;">Dear <strong>{student['name']}</strong>,</p>

                    <p style="font-size:15px;line-height:1.6;">
                      Your results have been <strong style="color:#0a7c54;">published</strong>.
                      Please log in to the SRMS portal to view your marks, CGPA, and SGPA.
                    </p>

                    <div style="background:#f0f7f4;border-left:4px solid #0a7c54;
                                padding:12px 16px;border-radius:6px;margin:20px 0;">
                      <p style="margin:0;font-size:14px;color:#0a7c54;">
                        Register Number: <strong>{student['reg_no']}</strong>
                      </p>
                    </div>

                    <hr style="border:none;border-top:1px solid #f0f3fa;margin:24px 0;">
                    <p style="font-size:12px;color:#aaa;margin:0;">
                      This is an automated message from SRMS Academic Portal.
                      Please do not reply to this email.
                    </p>
                  </div>
                </body>
                </html>"""

                msg.attach(MIMEText(html_body, 'html'))

                server = smtplib.SMTP('smtp.gmail.com', 587)
                server.starttls()
                server.login(EMAIL_SENDER, EMAIL_PASSWORD)
                server.send_message(msg)
                server.quit()
                sent += 1

            except Exception as e:
                errors.append(str(student['reg_no']) + ": " + str(e))

        return jsonify({
            'success': True,
            'message': f'Sent to {sent} student(s).' + (f' {len(errors)} failed.' if errors else ''),
            'errors': errors
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# CHART DATA API (NEW)
# Returns pre-aggregated data for admin analytics
# ============================

@app.route('/api/chart_data', methods=['GET'])
def get_chart_data():
    try:
        db     = get_db()
        cursor = db.cursor()

        # Grade distribution
        cursor.execute("SELECT grade, COUNT(*) as cnt FROM results GROUP BY grade")
        grade_rows = cursor.fetchall()
        grade_dist = {r['grade']: r['cnt'] for r in grade_rows}

        # Semester average
        cursor.execute("SELECT semester, AVG(total) as avg_total FROM results GROUP BY semester ORDER BY semester")
        sem_rows = cursor.fetchall()
        sem_avg  = [{'semester': r['semester'], 'avg': round(float(r['avg_total'] or 0), 1)} for r in sem_rows]

        # Students per course
        cursor.execute("SELECT dept, COUNT(*) as cnt FROM students GROUP BY dept")
        dept_rows  = cursor.fetchall()
        dept_dist  = {r['dept']: r['cnt'] for r in dept_rows}

        # Pass / Fail count
        cursor.execute("SELECT DISTINCT reg_no FROM results")
        all_regs = cursor.fetchall()
        passed = failed = 0
        for row in all_regs:
            cursor.execute("SELECT total FROM results WHERE reg_no=%s", (row['reg_no'],))
            subs = cursor.fetchall()
            if all(s['total'] >= 40 for s in subs):
                passed += 1
            else:
                failed += 1

        cursor.close(); db.close()

        return jsonify({
            'success'   : True,
            'grade_dist': grade_dist,
            'sem_avg'   : sem_avg,
            'dept_dist' : dept_dist,
            'pass_fail' : {'passed': passed, 'failed': failed}
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# ============================
# GRADE HELPER
# ============================

def calculate_grade(m):
    if m >= 90: return 'O'
    if m >= 80: return 'A+'
    if m >= 70: return 'A'
    if m >= 60: return 'B+'
    if m >= 50: return 'B'
    if m >= 40: return 'C'
    return 'F'


# ============================
# RUN APP
# ============================

if __name__ == '__main__':
    run_migration()
    app.run(debug=True, port=5000)
