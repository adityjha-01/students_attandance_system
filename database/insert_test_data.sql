-- Insert test student account
INSERT INTO students (student_id, name, email, password_hash, semester, phone)
VALUES (student_id_seq.NEXTVAL, 'Test Student', 'student@example.com', '$2a$10$lO2U6N7RLMcLAbt90BguM.cNUhc195UYCSGlJR95ApfVqdy3qaiP2', 1, '9999999999');

-- Insert test professor account
INSERT INTO professors (prof_id, name, email, password_hash, department, phone)
VALUES (professor_id_seq.NEXTVAL, 'Test Professor', 'professor@example.com', '$2a$10$eJNynwOZsi6ucimylmQyGeW8Tym9pHGrOTUwn5FNOcgmoLDN7vAUu', 'CS', '8888888888');

COMMIT;

SELECT 'Test accounts created successfully!' FROM dual;
