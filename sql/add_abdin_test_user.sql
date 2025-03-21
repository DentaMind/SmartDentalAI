-- SQL script to add Dr. Abdin's test account and associated data
-- for proper testing of the email and intake form functionality.

-- Create doctor user account
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "specialization", "licenseNumber", "createdAt", "updatedAt")
VALUES ('drabdin', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'aabdin@bu.edu', 'Ahmad', 'Abdin', 'doctor', '', false, 'General Dentistry', 'DDS12345', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Create test patient with the email address for intake form testing
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")
VALUES ('testpatient', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'aabdin@bu.edu', 'Test', 'Patient', 'patient', '', false, NOW(), NOW())
ON CONFLICT (username) DO NOTHING
RETURNING id AS user_id;

-- Create patient record
INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")
SELECT id, '1990-01-01', 'male', '617-555-1234', '123 Main St, Boston, MA 02115', 'Delta Dental', 'DD12345678', 
       '{"systemicConditions":[],"medications":[],"allergies":[],"smoking":false}', NOW(), NOW()
FROM users 
WHERE username = 'testpatient' 
AND NOT EXISTS (SELECT 1 FROM patients p JOIN users u ON p."userId" = u.id WHERE u.username = 'testpatient');

-- Output message to confirm completion
DO $$
BEGIN
  RAISE NOTICE 'Test user data for Dr. Abdin added successfully.';
END $$;