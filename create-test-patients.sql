-- Create test users for perio and restorative chart testing
INSERT INTO users (username, password, role, language, first_name, last_name, email, phone_number, date_of_birth, insurance_provider, insurance_number)
VALUES 
('patient1', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'patient', 'en', 'John', 'Smith', 'jsmith@example.com', '555-123-4567', '1985-04-15', 'Delta Dental', 'DD123456789'),
('patient2', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'patient', 'en', 'Mary', 'Johnson', 'mjohnson@example.com', '555-234-5678', '1975-07-22', 'Cigna', 'CI987654321'),
('patient3', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'patient', 'en', 'Robert', 'Williams', 'rwilliams@example.com', '555-345-6789', '1990-11-08', 'Aetna', 'AE456789123'),
('patient4', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'patient', 'en', 'Sarah', 'Davis', 'sdavis@example.com', '555-456-7890', '1968-02-29', 'MetLife', 'ML789123456'),
('patient5', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'patient', 'en', 'Michael', 'Brown', 'mbrown@example.com', '555-567-8901', '1982-09-14', 'Guardian', 'GU321654987'),
('dentist', '$2b$10$LqXB9wMxHUVLYG0nGQfRjuKLQX4iKZ0BHLiID22v70iyZXrsiCVvC', 'doctor', 'en', 'Dr. James', 'Wilson', 'jwilson@dentamind.com', '555-987-6543', '1975-05-20', NULL, NULL);

-- Add test patients
INSERT INTO patients (user_id, medical_history, allergies, blood_type, emergency_contact)
VALUES 
-- Patient 1: Severe periodontal disease
((SELECT id FROM users WHERE username = 'patient1'), 
 '{"systemicConditions": ["Diabetes Type 2"], "medications": ["Metformin", "Lisinopril"], "allergies": ["Penicillin"], "smoking": true}',
 '["Penicillin", "Sulfa"]',
 'A+',
 '{"name": "Jane Smith", "phone": "555-765-4321", "relationship": "Spouse"}'
),

-- Patient 2: Mild periodontal disease with receding gums
((SELECT id FROM users WHERE username = 'patient2'), 
 '{"systemicConditions": ["Hypertension"], "medications": ["Amlodipine"], "allergies": ["Latex"], "smoking": false}',
 '["Latex", "Ibuprofen"]',
 'O-',
 '{"name": "Tom Johnson", "phone": "555-876-5432", "relationship": "Husband"}'
),

-- Patient 3: Multiple restorative needs (multiple caries)
((SELECT id FROM users WHERE username = 'patient3'), 
 '{"systemicConditions": [], "medications": [], "allergies": [], "smoking": false}',
 '[]',
 'B+',
 '{"name": "Patricia Williams", "phone": "555-987-6543", "relationship": "Mother"}'
),

-- Patient 4: Mixed periodontal and restorative needs (senior patient)
((SELECT id FROM users WHERE username = 'patient4'), 
 '{"systemicConditions": ["Arthritis", "Osteoporosis"], "medications": ["Calcium supplements", "Vitamin D", "Fosamax"], "allergies": ["Codeine"], "smoking": false}',
 '["Codeine", "Erythromycin"]',
 'AB-',
 '{"name": "James Davis", "phone": "555-098-7654", "relationship": "Son"}'
),

-- Patient 5: Healthy, minimal needs
((SELECT id FROM users WHERE username = 'patient5'), 
 '{"systemicConditions": [], "medications": ["Multivitamin"], "allergies": [], "smoking": false}',
 '[]',
 'A-',
 '{"name": "Elizabeth Brown", "phone": "555-210-9876", "relationship": "Wife"}'
);

-- Create periodontal charts for test patients
INSERT INTO periodontal_charts (patient_id, date, chart_data, notes, provider_id, bleeding_points, mobility, furcation)
VALUES
-- Patient 1: Severe periodontal disease
(
  (SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.username = 'patient1'),
  '2025-03-20',
  '{"probingDepths": {"1": {"facial": [5, 6, 5], "lingual": [4, 7, 5]}, "2": {"facial": [5, 7, 5], "lingual": [5, 6, 5]}, "3": {"facial": [6, 7, 5], "lingual": [5, 6, 5]}, "4": {"facial": [5, 6, 4], "lingual": [4, 5, 5]}, "5": {"facial": [4, 5, 4], "lingual": [4, 5, 3]}, "6": {"facial": [5, 7, 6], "lingual": [6, 7, 6]}, "7": {"facial": [6, 7, 6], "lingual": [5, 6, 5]}, "8": {"facial": [5, 6, 5], "lingual": [4, 5, 4]}, "9": {"facial": [5, 6, 5], "lingual": [4, 5, 4]}, "10": {"facial": [6, 7, 6], "lingual": [5, 6, 5]}, "11": {"facial": [5, 7, 6], "lingual": [6, 7, 6]}, "12": {"facial": [4, 5, 4], "lingual": [4, 5, 3]}, "13": {"facial": [5, 6, 4], "lingual": [4, 5, 5]}, "14": {"facial": [6, 7, 5], "lingual": [5, 6, 5]}, "15": {"facial": [5, 7, 5], "lingual": [5, 6, 5]}, "16": {"facial": [5, 6, 5], "lingual": [4, 7, 5]}, "17": {"facial": [5, 6, 5], "lingual": [4, 6, 5]}, "18": {"facial": [5, 6, 5], "lingual": [4, 5, 5]}, "19": {"facial": [6, 7, 6], "lingual": [5, 6, 5]}, "20": {"facial": [5, 7, 5], "lingual": [4, 6, 4]}, "21": {"facial": [4, 6, 4], "lingual": [4, 5, 3]}, "22": {"facial": [5, 6, 4], "lingual": [4, 5, 4]}, "23": {"facial": [6, 7, 6], "lingual": [5, 6, 5]}, "24": {"facial": [6, 7, 6], "lingual": [5, 6, 5]}, "25": {"facial": [5, 6, 4], "lingual": [4, 5, 4]}, "26": {"facial": [4, 6, 4], "lingual": [4, 5, 3]}, "27": {"facial": [5, 7, 5], "lingual": [4, 6, 4]}, "28": {"facial": [6, 7, 6], "lingual": [5, 6, 5]}, "29": {"facial": [5, 6, 5], "lingual": [4, 5, 5]}, "30": {"facial": [5, 6, 5], "lingual": [4, 6, 5]}, "31": {"facial": [5, 6, 5], "lingual": [4, 6, 5]}, "32": {"facial": [5, 6, 5], "lingual": [4, 6, 5]}}}',
  'Patient has generalized severe chronic periodontitis with bone loss visible on radiographs. Recommended scaling and root planing all quadrants followed by periodontal maintenance every 3 months.',
  (SELECT id FROM users WHERE username = 'dentist'),
  '{"1": {"facial": [true, true, true], "lingual": [true, true, false]}, "2": {"facial": [true, true, false], "lingual": [true, false, false]}, "3": {"facial": [true, true, true], "lingual": [true, true, false]}}',
  '{"1": 2, "2": 1, "3": 2, "14": 1, "15": 1, "18": 1, "19": 2, "30": 1, "31": 2}',
  '{"3": {"facial": 2, "lingual": 1}, "14": {"facial": 1, "lingual": 0}, "19": {"facial": 2, "lingual": 1}, "30": {"facial": 1, "lingual": 1}}'
),

-- Patient 2: Mild periodontal disease with receding gums
(
  (SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.username = 'patient2'),
  '2025-03-21',
  '{"probingDepths": {"1": {"facial": [3, 4, 3], "lingual": [2, 3, 3]}, "2": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "3": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "4": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "5": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "6": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "7": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "8": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "9": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "10": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "11": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "12": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "13": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "14": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "15": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "16": {"facial": [3, 4, 3], "lingual": [2, 3, 3]}, "17": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "18": {"facial": [3, 3, 3], "lingual": [3, 3, 3]}, "19": {"facial": [4, 4, 3], "lingual": [3, 4, 3]}, "20": {"facial": [3, 3, 3], "lingual": [3, 3, 3]}, "21": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "22": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "23": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "24": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "25": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "26": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "27": {"facial": [3, 3, 3], "lingual": [3, 3, 3]}, "28": {"facial": [4, 4, 3], "lingual": [3, 4, 3]}, "29": {"facial": [3, 3, 3], "lingual": [3, 3, 3]}, "30": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "31": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}}}',
  'Patient shows localized mild periodontitis with gingival recession on #7, #8, #9, #10, #23, #24, #25, #26. Recommended scaling and improved home care techniques with focus on proper brushing to avoid further recession.',
  (SELECT id FROM users WHERE username = 'dentist'),
  '{"7": {"facial": [false, true, false], "lingual": [false, true, false]}, "8": {"facial": [false, true, false], "lingual": [false, false, false]}, "9": {"facial": [false, true, false], "lingual": [false, false, false]}, "10": {"facial": [false, true, false], "lingual": [false, true, false]}}',
  '{"3": 1, "19": 1}',
  '{"3": {"facial": 1, "lingual": 0}, "19": {"facial": 1, "lingual": 0}}'
);

-- Create restorative charts for test patients
INSERT INTO restorative_charts (patient_id, date, chart_data, notes, provider_id)
VALUES
-- Patient 3: Multiple restorative needs (multiple caries)
(
  (SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.username = 'patient3'),
  '2025-03-22',
  '{"restorations": {"2": {"occlusal": "caries", "mesial": "caries"}, "3": {"occlusal": "caries", "distal": "caries"}, "14": {"occlusal": "caries", "buccal": "caries"}, "15": {"occlusal": "caries", "mesial": "caries"}, "18": {"occlusal": "amalgam", "distal": "amalgam"}, "19": {"occlusal": "amalgam", "mesial": "amalgam"}, "20": {"occlusal": "caries", "buccal": "caries"}, "29": {"facial": "caries", "mesial": "caries"}, "30": {"occlusal": "caries", "distal": "caries", "lingual": "caries"}}}',
  'Multiple carious lesions detected. Recommended treatment plan includes composite restorations on teeth #2, #3, #14, #15, #20, #29, #30, and evaluation of existing amalgam restorations on #18 and #19 for potential replacement.',
  (SELECT id FROM users WHERE username = 'dentist')
),

-- Patient 4: Mixed periodontal and restorative needs (senior patient)
(
  (SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.username = 'patient4'),
  '2025-03-22',
  '{"restorations": {"2": {"occlusal": "composite", "mesial": "composite"}, "3": {"occlusal": "crown", "distal": "crown", "mesial": "crown", "buccal": "crown", "lingual": "crown"}, "5": {"missing": true}, "8": {"facial": "composite", "incisal": "composite"}, "9": {"facial": "composite", "incisal": "composite"}, "12": {"occlusal": "crown", "distal": "crown", "mesial": "crown", "buccal": "crown", "lingual": "crown"}, "13": {"occlusal": "bridge pontic", "distal": "bridge pontic", "mesial": "bridge pontic", "buccal": "bridge pontic", "lingual": "bridge pontic"}, "14": {"occlusal": "bridge abutment", "distal": "bridge abutment", "mesial": "bridge abutment", "buccal": "bridge abutment", "lingual": "bridge abutment"}, "19": {"missing": true}, "20": {"missing": true}, "21": {"missing": true}, "28": {"missing": true}, "29": {"occlusal": "caries", "mesial": "caries"}, "30": {"occlusal": "crown", "distal": "crown", "mesial": "crown", "buccal": "crown", "lingual": "crown"}, "31": {"missing": true}}}',
  'Patient has multiple missing teeth and existing restorations. New caries detected on #29. Recommended treatment includes composite restoration on #29, maintenance of existing restorations, and discussion of options for replacing missing teeth including partial denture or implants.',
  (SELECT id FROM users WHERE username = 'dentist')
),

-- Patient 5: Healthy, minimal needs
(
  (SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.username = 'patient5'),
  '2025-03-22',
  '{"restorations": {"3": {"occlusal": "composite"}, "14": {"occlusal": "composite"}, "19": {"occlusal": "composite"}, "30": {"occlusal": "composite"}}}',
  'Patient has good oral health with minimal restorative needs. Only a few small composite restorations present which are in good condition. Recommended continued excellent home care and regular check-ups.',
  (SELECT id FROM users WHERE username = 'dentist')
);

-- Create periodontal chart for Patient 4 (mixed needs)
INSERT INTO periodontal_charts (patient_id, date, chart_data, notes, provider_id, bleeding_points, mobility, furcation)
VALUES
(
  (SELECT p.id FROM patients p JOIN users u ON p.user_id = u.id WHERE u.username = 'patient4'),
  '2025-03-22',
  '{"probingDepths": {"1": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "2": {"facial": [4, 5, 4], "lingual": [4, 4, 4]}, "3": {"facial": [5, 5, 4], "lingual": [4, 4, 4]}, "4": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "6": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "7": {"facial": [4, 4, 3], "lingual": [3, 3, 3]}, "8": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "9": {"facial": [3, 3, 3], "lingual": [2, 3, 2]}, "10": {"facial": [3, 3, 3], "lingual": [3, 3, 3]}, "11": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "12": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "14": {"facial": [4, 5, 4], "lingual": [4, 4, 4]}, "15": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "16": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "17": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "18": {"facial": [4, 4, 3], "lingual": [3, 3, 3]}, "22": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "23": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "24": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "25": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "26": {"facial": [3, 4, 3], "lingual": [3, 3, 3]}, "27": {"facial": [4, 4, 3], "lingual": [3, 3, 3]}, "29": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}, "30": {"facial": [4, 5, 4], "lingual": [4, 4, 4]}, "32": {"facial": [4, 5, 4], "lingual": [3, 4, 3]}}}',
  'Patient has moderate periodontitis with bone loss visible on radiographs, especially in the posterior regions. Recommended scaling and root planing for quadrants 1 and 2, followed by periodontal maintenance every 4 months. Patient also has several missing teeth that should be evaluated for replacement options.',
  (SELECT id FROM users WHERE username = 'dentist'),
  '{"1": {"facial": [true, true, false], "lingual": [true, false, false]}, "2": {"facial": [true, true, false], "lingual": [true, false, false]}, "3": {"facial": [true, true, true], "lingual": [true, true, false]}, "12": {"facial": [true, true, false], "lingual": [true, false, false]}, "14": {"facial": [true, true, false], "lingual": [true, false, false]}, "30": {"facial": [true, true, false], "lingual": [true, false, false]}}',
  '{"3": 1, "12": 1, "14": 1, "30": 1}',
  '{"3": {"facial": 1, "lingual": 0}, "14": {"facial": 1, "lingual": 0}, "30": {"facial": 1, "lingual": 0}}'
);