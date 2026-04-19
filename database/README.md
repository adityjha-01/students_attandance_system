# Database Schema

This directory contains all SQL scripts for setting up the Oracle Database schema for the Student Attendance System.

## Overview

The database schema includes:
- User authentication tables
- Student and professor information
- Course management
- Enrollment tracking
- Attendance records
- Stored procedures and packages for business logic

## File Structure

```
database/
├── 01_users.sql              # User authentication tables
├── 02_tables.sql             # Main application tables and sequences
├── init_data.sql             # Sample/initial data (optional)
└── 04_packages/              # PL/SQL packages
    ├── 01_auth_package.sql
    ├── 02_course_package.sql
    ├── 03_enrollment_package.sql
    └── 04_attendance_package.sql
```

## Setup Instructions

### Prerequisites
- Oracle Database 21c or higher installed
- SQL*Plus or SQL Developer for running scripts
- Database user with CREATE privileges

### Running the Scripts

**Option 1: Using SQL*Plus**

```bash
# Connect to your Oracle database
sqlplus username/password@localhost:1521/XEPDB1

# Run scripts in the following order:
@01_users.sql
@02_tables.sql

# Run package scripts
@04_packages/01_auth_package.sql
@04_packages/02_course_package.sql
@04_packages/03_enrollment_package.sql
@04_packages/04_attendance_package.sql

# (Optional) Load sample data
@init_data.sql
```

**Option 2: Using SQL Developer**
1. Open SQL Developer
2. Connect to your database
3. Open each script file
4. Execute in the order listed above

### Script Execution Order

⚠️ **Important:** Execute scripts in this exact order to avoid dependency issues.

1. **01_users.sql** - Creates users and authentication tables
2. **02_tables.sql** - Creates all main tables and sequences
3. **04_packages/*.sql** - Creates stored procedures and packages
4. **init_data.sql** - (Optional) Loads sample data

### Verification

After running all scripts, verify the setup:

```sql
-- Check all tables are created
SELECT table_name FROM user_tables ORDER BY table_name;

-- Expected tables:
-- USERS, STUDENTS, PROFESSORS, COURSES, ENROLLMENTS, ATTENDANCE

-- Check all sequences are created
SELECT sequence_name FROM user_sequences ORDER BY sequence_name;

-- Expected sequences:
-- USER_SEQ, STUDENT_SEQ, PROFESSOR_SEQ, COURSE_SEQ, 
-- ENROLLMENT_SEQ, ATTENDANCE_SEQ

-- Check all packages are created
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type IN ('PACKAGE', 'PACKAGE BODY')
ORDER BY object_name;

-- All packages should show status 'VALID'
```

## Table Descriptions

### Core Tables

- **USERS** - Stores all user accounts (both students and professors)
- **STUDENTS** - Student-specific information linked to users
- **PROFESSORS** - Professor-specific information linked to users
- **COURSES** - Course information and assignments
- **ENROLLMENTS** - Links students to courses they're enrolled in
- **ATTENDANCE** - Records attendance for each student in each class

### Relationships

- Users → Students (1:1)
- Users → Professors (1:1)
- Professors → Courses (1:Many)
- Students ↔ Courses (Many:Many through Enrollments)
- Enrollments → Attendance (1:Many)

## Stored Packages

### 1. auth_package
Handles user authentication and session management:
- User registration
- Password validation
- Login authentication

### 2. course_package
Manages course operations:
- Create new courses
- Update course information
- Delete courses
- List courses by professor

### 3. enrollment_package
Handles student enrollments:
- Enroll students in courses
- Drop courses
- Check enrollment status
- Get enrollment lists

### 4. attendance_package
Manages attendance records:
- Mark attendance
- Calculate attendance percentages
- Generate attendance reports
- Get attendance history

## Sample Data

The `init_data.sql` file contains sample data for testing:
- Sample user accounts
- Test students and professors
- Sample courses
- Sample enrollments
- Sample attendance records

**Note:** Sample data is optional and should only be used in development environments.

## Backup and Maintenance

### Creating a Backup
```sql
-- Export schema
expdp username/password@localhost:1521/XEPDB1 \
  schemas=your_schema \
  directory=backup_dir \
  dumpfile=attendance_backup.dmp \
  logfile=attendance_backup.log
```

### Dropping All Objects (Reset Database)
```sql
-- WARNING: This will delete all data!
BEGIN
  FOR cur IN (SELECT table_name FROM user_tables) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || cur.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
  
  FOR cur IN (SELECT sequence_name FROM user_sequences) LOOP
    EXECUTE IMMEDIATE 'DROP SEQUENCE ' || cur.sequence_name;
  END LOOP;
  
  FOR cur IN (SELECT object_name FROM user_objects WHERE object_type = 'PACKAGE') LOOP
    EXECUTE IMMEDIATE 'DROP PACKAGE ' || cur.object_name;
  END LOOP;
END;
/
```

## Troubleshooting

### Issue: "Table or view does not exist"
- **Cause:** Scripts executed out of order
- **Solution:** Drop all objects and re-run in correct order

### Issue: "Package body has errors"
- **Cause:** Syntax errors or missing dependencies
- **Solution:** Check compilation errors with:
  ```sql
  SHOW ERRORS PACKAGE BODY package_name;
  ```

### Issue: "Sequence does not exist"
- **Cause:** 02_tables.sql not executed
- **Solution:** Run 02_tables.sql before package scripts

## Additional Resources

- [Oracle SQL Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/)
- [PL/SQL Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/21/lnpls/)
- [Database Schema Diagram](../docs/DATABASE_SCHEMA.md)
- [ER Diagram](../docs/ER_Diagram.md)
