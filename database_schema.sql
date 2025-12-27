-- ============================================================================
-- AI STORYBOARD MAKER - DATABASE SCHEMA
-- ============================================================================
-- This SQL script creates the complete database schema for the FrameAI
-- (AI Storyboard Maker) application.
--
-- TABLES:
-- 1. users - Stores user authentication information
-- 2. projects - Stores storyboard projects
-- 3. scenes - Stores individual scenes within projects
--
-- Run this script on your PostgreSQL database to set up the schema.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 1: users
-- ----------------------------------------------------------------------------
-- Stores user account information for authentication
-- Each user can have multiple projects

CREATE TABLE users (
    -- Primary key: unique identifier for each user
    id SERIAL PRIMARY KEY,
    
    -- User's email address (used for login)
    -- UNIQUE ensures no two users can have the same email
    -- NOT NULL ensures every user must have an email
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Hashed password (never store plain text passwords!)
    -- The application uses bcrypt to hash passwords before storing
    password_hash VARCHAR(255) NOT NULL,
    
    -- Timestamp of when the user account was created
    -- DEFAULT CURRENT_TIMESTAMP automatically sets this to the current time
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 2: projects
-- ----------------------------------------------------------------------------
-- Stores storyboard projects created by users
-- Each project belongs to one user and can have multiple scenes

CREATE TABLE projects (
    -- Primary key: unique identifier for each project
    id SERIAL PRIMARY KEY,
    
    -- Foreign key: links this project to a user
    -- References the id column in the users table
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Project title/name
    title VARCHAR(255) NOT NULL,
    
    -- The original user input/idea that was used to generate the script
    -- TEXT allows for longer content than VARCHAR
    original_input TEXT,
    
    -- Timestamp of when the project was created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamp of when the project was last updated
    -- This will be automatically updated when the row changes
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- TABLE 3: scenes
-- ----------------------------------------------------------------------------
-- Stores individual scenes within a project
-- Each scene belongs to one project and contains the storyboard details

CREATE TABLE scenes (
    -- Primary key: unique identifier for each scene
    id SERIAL PRIMARY KEY,
    
    -- Foreign key: links this scene to a project
    -- References the id column in the projects table
    -- ON DELETE CASCADE means if a project is deleted, all its scenes are deleted too
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Scene number (1, 2, 3, etc.) - determines the order of scenes
    scene_number INTEGER NOT NULL,
    
    -- Scene title/heading
    title VARCHAR(255),
    
    -- Location where the scene takes place
    location VARCHAR(255),
    
    -- Visual description of the scene
    description TEXT,
    
    -- What action/events happen in this scene
    action TEXT,
    
    -- The mood/tone of the scene (e.g., "tense", "joyful", "mysterious")
    mood VARCHAR(100),
    
    -- The detailed prompt used to generate the AI image for this scene
    image_prompt TEXT,
    
    -- URL to the generated image (stored after image generation)
    -- Can be NULL if the image hasn't been generated yet
    image_url TEXT,
    
    -- Timestamp of when the scene was created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
-- Indexes improve query performance by allowing faster lookups
-- These are optional but recommended for better performance

-- Index on user_id in projects table
-- Makes it faster to find all projects for a specific user
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Index on project_id in scenes table
-- Makes it faster to find all scenes for a specific project
CREATE INDEX idx_scenes_project_id ON scenes(project_id);

-- Index on email in users table (for faster login queries)
-- This may already exist due to the UNIQUE constraint, but we add it explicitly
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- COMMENTS (Optional - for documentation)
-- ----------------------------------------------------------------------------
-- PostgreSQL allows you to add comments to tables and columns
-- These are helpful for database documentation

COMMENT ON TABLE users IS 'Stores user authentication and account information';
COMMENT ON TABLE projects IS 'Stores storyboard projects created by users';
COMMENT ON TABLE scenes IS 'Stores individual scenes within storyboard projects';

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never store plain text!';
COMMENT ON COLUMN projects.original_input IS 'The user''s original idea/prompt that generated this storyboard';
COMMENT ON COLUMN scenes.image_url IS 'URL to the AI-generated image for this scene';
COMMENT ON COLUMN scenes.image_prompt IS 'Detailed prompt used for AI image generation';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Your database schema is now ready!
--
-- To use this schema:
-- 1. Connect to your PostgreSQL database
-- 2. Run this entire SQL script
-- 3. Verify the tables were created with: \dt (in psql)
--
-- Example connection string format:
-- postgresql://username:password@host:port/database_name
-- ============================================================================
