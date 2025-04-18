-- Insert admin user
INSERT INTO users (
  username,
  password,
  email,
  first_name,
  last_name,
  role,
  language
) VALUES (
  'admin',
  '$2a$10$X7z3bZ2q3Y4V5w6x7y8z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5',
  'admin@smartdentalai.com',
  'Admin',
  'User',
  'admin',
  'en'
) RETURNING id; 