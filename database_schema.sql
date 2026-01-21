-- TABLE 1: users
-- Stores user account information for authentication
-- Each user can have multiple projects

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 2: projects
-- Stores storyboard projects created by users
-- Each project belongs to one user and can have multiple scenes

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    original_input TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE 3: scenes
-- Stores individual scenes within a project
-- Each scene belongs to one project and contains the storyboard details

CREATE TABLE scenes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    title VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    action TEXT,
    mood VARCHAR(100),
    image_prompt TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_scenes_project_id ON scenes(project_id);

COMMENT ON TABLE users IS 'Stores user authentication and account information';
COMMENT ON TABLE projects IS 'Stores storyboard projects created by users';
COMMENT ON TABLE scenes IS 'Stores individual scenes within storyboard projects';

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never store plain text!';
COMMENT ON COLUMN projects.original_input IS 'The user''s original idea/prompt that generated this storyboard';
COMMENT ON COLUMN scenes.image_url IS 'URL to the AI-generated image for this scene';
COMMENT ON COLUMN scenes.image_prompt IS 'Detailed prompt used for AI image generation';

