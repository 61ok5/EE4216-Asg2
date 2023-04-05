-- Create roles
INSERT INTO role (name) VALUES ('ROLE_ADMIN');
INSERT INTO role (name) VALUES ('ROLE_USER');

-- Create admin user
INSERT INTO users (username, password) VALUES ('admin', '$2a$10$BUKSwZiENOv2kTa39jJTJeINhVQ7OVnF5KTIl5Y3QN56moz98QvQq');
-- INSERT INTO users (username, password) VALUES ('admin', 'admin');
-- Assign admin role to admin user
INSERT INTO user_role (user_id, role_id) SELECT users.id, role.id FROM users, role WHERE users.username = 'admin' AND role.name = 'ROLE_ADMIN';

-- Create regular user
INSERT INTO users (username, password) VALUES ('user1', '$2a$10$ut.LxmK0MZsf.nJD8KNzdOgv49UpTES1iDUrWphXji1wEdz6nhiqO');
-- INSERT INTO users (username, password) VALUES ('user1', 'user1');
-- Assign user role to regular user
INSERT INTO user_role (user_id, role_id) SELECT users.id, role.id FROM users, role WHERE users.username = 'user1' AND role.name = 'ROLE_USER';

-- Insert todo items (assuming admin user has ID 1)
INSERT INTO todo (content, status, created_at, updated_at, user_id) VALUES ('Buy groceries', 'PENDING', '2023-03-31 12:00:00', '2023-03-31 12:00:00', 1);
INSERT INTO todo (content, status, created_at, updated_at, user_id) VALUES ('Pay bills', 'COMPLETED', '2023-03-31 12:30:00', '2023-03-31 12:30:00', 1);
INSERT INTO todo (content, status, created_at, updated_at, user_id) VALUES ('Schedule a dentist appointment', 'PENDING', '2023-03-31 13:00:00', '2023-03-31 13:00:00', 1);