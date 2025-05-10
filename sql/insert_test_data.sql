-- Create user for James Wilson (dentist)
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "specialization", "licenseNumber", "createdAt", "updatedAt")
VALUES ('dentist', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'dentamind27@gmail.com', 'James', 'Wilson', 'dentist', '', false, 'General Dentistry', 'DDS12345', NOW(), NOW());

-- Create user for Sarah Abdin (dentist)
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "specialization", "licenseNumber", "createdAt", "updatedAt")
VALUES ('drabdin', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'dentamind27@gmail.com', 'Sarah', 'Abdin', 'dentist', '', false, 'Orthodontics', 'DDS67890', NOW(), NOW());

-- Create user for Maria Rodriguez (hygienist)
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "specialization", "licenseNumber", "createdAt", "updatedAt")
VALUES ('hygienist1', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'dentamind27@gmail.com', 'Maria', 'Rodriguez', 'hygienist', '', false, 'Periodontics', 'RDH12345', NOW(), NOW());

-- Create user for Admin User (admin)
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "specialization", "licenseNumber", "createdAt", "updatedAt")
VALUES ('admin', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'dentamind27@gmail.com', 'Admin', 'User', 'admin', '', false, NULL, NULL, NOW(), NOW());

-- Create user for John Smith
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")
VALUES ('patient1', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'john.smith@example.com', 'John', 'Smith', 'patient', '', false, NOW(), NOW())
RETURNING id AS user_id_1;

-- Create user for Emily Johnson
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")
VALUES ('patient2', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'emily.johnson@example.com', 'Emily', 'Johnson', 'patient', '', false, NOW(), NOW())
RETURNING id AS user_id_2;

-- Create user for Robert Garcia
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")
VALUES ('patient3', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'robert.garcia@example.com', 'Robert', 'Garcia', 'patient', '', false, NOW(), NOW())
RETURNING id AS user_id_3;

-- Create user for Sophia Martinez
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")
VALUES ('patient4', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'sophia.martinez@example.com', 'Sophia', 'Martinez', 'patient', '', false, NOW(), NOW())
RETURNING id AS user_id_4;

-- Create user for David Lee
INSERT INTO users (username, "passwordHash", email, "firstName", "lastName", role, "mfaSecret", "mfaEnabled", "createdAt", "updatedAt")
VALUES ('patient5', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'david.lee@example.com', 'David', 'Lee', 'patient', '', false, NOW(), NOW())
RETURNING id AS user_id_5;

-- Create patient record for John Smith
INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")
VALUES ((SELECT user_id_1 FROM users WHERE username = 'patient1' LIMIT 1), '1980-05-15', 'male', '555-123-4567', '123 Main St, Anytown, CA 90210', 'Delta Dental', 'DD123456789', '{"systemicConditions":["Hypertension","Type 2 Diabetes"],"medications":["Lisinopril","Metformin"],"allergies":["Penicillin"],"smoking":true}', NOW(), NOW());

-- Create patient record for Emily Johnson
INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")
VALUES ((SELECT user_id_2 FROM users WHERE username = 'patient2' LIMIT 1), '1992-11-23', 'female', '555-987-6543', '456 Oak Ave, Somewhere, NY 10001', 'Cigna', 'CG987654321', '{"systemicConditions":["Asthma"],"medications":["Albuterol"],"allergies":["Latex","Aspirin"],"smoking":false}', NOW(), NOW());

-- Create patient record for Robert Garcia
INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")
VALUES ((SELECT user_id_3 FROM users WHERE username = 'patient3' LIMIT 1), '1975-03-28', 'male', '555-555-5555', '789 Elm St, Elsewhere, TX 75001', 'Aetna', 'AE567891234', '{"systemicConditions":["Osteoporosis"],"medications":["Alendronate"],"allergies":[],"smoking":false}', NOW(), NOW());

-- Create patient record for Sophia Martinez
INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")
VALUES ((SELECT user_id_4 FROM users WHERE username = 'patient4' LIMIT 1), '1988-09-12', 'female', '555-789-0123', '321 Pine St, Nowhere, FL 33101', 'MetLife', 'ML654321987', '{"systemicConditions":["Pregnancy"],"medications":["Prenatal Vitamins"],"allergies":["Codeine"],"smoking":false}', NOW(), NOW());

-- Create patient record for David Lee
INSERT INTO patients ("userId", "dateOfBirth", gender, "phoneNumber", address, "insuranceProvider", "insuranceId", "medicalHistory", "createdAt", "updatedAt")
VALUES ((SELECT user_id_5 FROM users WHERE username = 'patient5' LIMIT 1), '1965-07-30', 'male', '555-456-7890', '654 Cedar St, Somewhere Else, WA 98101', 'United Healthcare', 'UH789123456', '{"systemicConditions":["Coronary Artery Disease","Hyperlipidemia"],"medications":["Atorvastatin","Clopidogrel","Aspirin"],"allergies":["Sulfa Drugs"],"smoking":true}', NOW(), NOW());

