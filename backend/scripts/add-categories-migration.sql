-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976d2',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint on name for active categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_active ON categories(name) WHERE is_active = true;

-- Add category_id and tags columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags JSON DEFAULT '[]';

-- Create index on category_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);

-- Insert some default categories
INSERT INTO categories (name, description, color) VALUES
    ('Development', 'Software development tasks', '#2196f3'),
    ('Design', 'UI/UX design tasks', '#9c27b0'),
    ('Testing', 'Quality assurance and testing', '#ff9800'),
    ('Documentation', 'Documentation and writing tasks', '#4caf50'),
    ('Meeting', 'Meeting and communication tasks', '#f44336'),
    ('Research', 'Research and analysis tasks', '#607d8b'),
    ('Bug Fix', 'Bug fixes and troubleshooting', '#e91e63'),
    ('Feature', 'New feature development', '#00bcd4')
ON CONFLICT (name) DO NOTHING; 