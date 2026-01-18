-- Add default admin user for testing
INSERT INTO "User" (id, email, password) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@example.com',
  '$2b$10$96aOpgOV2cEQp7m59qvjPOWe2z0UUxOeKITGj9lPh00zNw/4PIDGS'
) ON CONFLICT (email) DO NOTHING;
