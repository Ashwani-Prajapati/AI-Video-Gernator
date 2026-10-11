-- ====================================================================
-- VividFlow AI Studio - Relational Database Schema (PostgreSQL / Supabase)
-- ====================================================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'creator', -- 'admin', 'creator'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Model Providers Configuration
CREATE TABLE IF NOT EXISTS model_providers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- 'google', 'openai', 'runway', 'luma', 'replicate', 'comfyui'
    api_endpoint VARCHAR(500),
    is_enabled BOOLEAN DEFAULT true,
    is_self_hosted BOOLEAN DEFAULT false,
    rate_limit_rpm INT DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    target_total_duration INT NOT NULL DEFAULT 60, -- 45, 50, 55, 60 seconds
    aspect_ratio VARCHAR(20) DEFAULT '16:9',
    resolution VARCHAR(20) DEFAULT '1080p',
    visual_style VARCHAR(50) DEFAULT 'cinematic-realism',
    model_id VARCHAR(100) NOT NULL DEFAULT 'veo-2',
    provider_id VARCHAR(100) NOT NULL DEFAULT 'google',
    final_video_url TEXT,
    final_video_duration NUMERIC(6, 2),
    final_video_size_bytes BIGINT,
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'preparing_storyboard', 'generating_scenes', 'rendering_final', 'completed', 'failed'
    continuity_document JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Characters & Continuity Entities
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    appearance TEXT NOT NULL,
    clothing TEXT,
    facial_features TEXT,
    color_palette VARCHAR(255),
    voice_description TEXT,
    reference_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Scenes (Storyboard Items)
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    target_duration NUMERIC(5, 2) NOT NULL, -- in seconds (e.g. 7.50)
    actual_duration NUMERIC(5, 2),
    camera_movement VARCHAR(50) DEFAULT 'static',
    motion_intensity INT DEFAULT 5,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    video_url TEXT,
    thumbnail_url TEXT,
    first_frame_url TEXT,
    last_frame_url TEXT,
    narration_text TEXT,
    audio_track_url TEXT,
    transition_to_next VARCHAR(50) DEFAULT 'crossfade',
    provider_job_id VARCHAR(255),
    error_message TEXT,
    generation_attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Generation Jobs (Asynchronous Worker Queue)
CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'full_project', 'single_scene', 'storyboard_only', 'render_only'
    target_scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'queued',
    stage_message VARCHAR(255) DEFAULT 'Job queued',
    progress_percent INT DEFAULT 0,
    total_scenes INT DEFAULT 0,
    completed_scenes INT DEFAULT 0,
    current_scene_index INT DEFAULT 0,
    provider_id VARCHAR(100) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    error TEXT,
    logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. Assets (Media Storage tracking)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'subtitle'
    url TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_order ON scenes(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);

-- Row Level Security (RLS) Example Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and edit their own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
