import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import type {
  Asset,
  GenerationJob,
  ModelCapability,
  Project,
  ProviderConfig,
  Scene,
  VideoDuration,
} from './types';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { JobProgressModal } from './components/JobProgressModal';
import { DashboardPage } from './pages/DashboardPage';
import { TextToVideoPage } from './pages/TextToVideoPage';
import { ImageToVideoPage } from './pages/ImageToVideoPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { AssetsPage } from './pages/AssetsPage';
import { ModelSettingsPage } from './pages/ModelSettingsPage';
import { AccountSettingsPage } from './pages/AccountSettingsPage';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelCapability[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  // Active generation job state
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [activeJobScenes, setActiveJobScenes] = useState<Scene[]>([]);
  const [activeFinalVideoUrl, setActiveFinalVideoUrl] = useState<string | undefined>();

  // Prompt handoff from dashboard to text-to-video
  const [handoffPrompt, setHandoffPrompt] = useState<string>('');
  const [handoffDuration, setHandoffDuration] = useState<VideoDuration>(60);

  // Fetch initial data
  const refreshProjects = useCallback(async () => {
    try {
      const res = await api.getProjects();
      if (res.success) {
        setProjects(res.projects);
        if (!activeProjectId && res.projects.length > 0) {
          setActiveProjectId(res.projects[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch projects:', err);
    }
  }, [activeProjectId]);

  const refreshModels = useCallback(async () => {
    try {
      const [modelsRes, settingsRes, healthRes] = await Promise.all([
        api.getModels(),
        api.getSettings(),
        api.getHealth(),
      ]);
      if (modelsRes.success) setModels(modelsRes.models);
      if (settingsRes.success) setProviders(settingsRes.providers);
      setSystemHealth(healthRes);
    } catch (err) {
      console.warn('Failed to load models/settings:', err);
    }
  }, []);

  const refreshAssets = useCallback(async () => {
    try {
      const res = await api.getAssets();
      if (res.success) setAssets(res.assets);
    } catch (err) {
      console.warn('Failed to load assets:', err);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
    refreshModels();
    refreshAssets();
  }, [refreshProjects, refreshModels, refreshAssets]);

  // Polling loop for active job
  useEffect(() => {
    if (!activeJob) return;
    const isRunning = !['completed', 'failed', 'cancelled'].includes(activeJob.status);
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getJob(activeJob.id);
        if (res.success && res.job) {
          setActiveJob(res.job);
          if (res.scenes) setActiveJobScenes(res.scenes);
          if (res.finalVideoUrl) setActiveFinalVideoUrl(res.finalVideoUrl);

          if (['completed', 'failed', 'cancelled'].includes(res.job.status)) {
            refreshProjects();
            if (res.job.status === 'completed') {
              setActiveProjectId(res.job.projectId);
            }
          }
        }
      } catch (err) {
        console.warn('Job polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJob, refreshProjects]);

  // Navigation handlers
  const handleOpenProjectInEditor = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentTab('editor');
  };

  const handleStartNewWithPrompt = (prompt: string, duration: VideoDuration) => {
    setHandoffPrompt(prompt);
    setHandoffDuration(duration);
    setCurrentTab('text-to-video');
  };

  const handleNewProject = () => {
    setHandoffPrompt('');
    setHandoffDuration(60);
    setCurrentTab('text-to-video');
  };

  // Generation actions
  const handleStartGeneration = async (params: any) => {
    try {
      const res = await api.startGeneration(params);
      if (res.success && res.job) {
        setActiveJob(res.job);
        setIsJobModalOpen(true);
        setActiveProjectId(res.projectId);
        refreshProjects();
      }
    } catch (err: any) {
      alert(`Generation error: ${err.message}`);
    }
  };

  const handleStartImageToVideo = async (params: any) => {
    try {
      const res = await api.generateImageToVideo(params);
      if (res.success && res.jobId) {
        const jobRes = await api.getJob(res.jobId);
        if (jobRes.success) {
          setActiveJob(jobRes.job);
          setIsJobModalOpen(true);
          setActiveProjectId(res.projectId);
          refreshProjects();
        }
      }
    } catch (err: any) {
      alert(`Image animation error: ${err.message}`);
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    try {
      const res = await api.regenerateScene(sceneId);
      if (res.success && res.job) {
        setActiveJob(res.job);
        setIsJobModalOpen(true);
      }
    } catch (err: any) {
      alert(`Scene regeneration error: ${err.message}`);
    }
  };

  const handleRenderProject = async (projectId: string, settings: any) => {
    try {
      const res = await api.renderProject(projectId, settings);
      if (res.success && res.jobId) {
        const jobRes = await api.getJob(res.jobId);
        if (jobRes.success) {
          setActiveJob(jobRes.job);
          setIsJobModalOpen(true);
        }
      }
    } catch (err: any) {
      alert(`Render error: ${err.message}`);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await api.cancelJob(jobId);
      setActiveJob((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    } catch (err) {
      console.error(err);
    }
  };

  // Asset actions
  const handleUploadImageFile = async (file: File): Promise<string> => {
    const res = await api.uploadAsset(file);
    refreshAssets();
    return res.url;
  };

  const handleDeleteAsset = async (id: string) => {
    await api.deleteAsset(id);
    refreshAssets();
  };

  // Project management
  const handleDuplicateProject = async (projectId: string) => {
    await api.duplicateProject(projectId);
    refreshProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await api.deleteProject(projectId);
      refreshProjects();
    }
  };

  // Provider configuration
  const handleSaveKey = async (providerId: string, key: string, endpoint?: string) => {
    await api.updateKey(providerId, key, endpoint);
    refreshModels();
  };

  const handleToggleMode = async (providerId: string, mode: 'api' | 'self-hosted', endpoint?: string) => {
    await api.setMode(providerId, mode, endpoint);
    refreshModels();
  };

  // Find active project for Video Editor
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  return (
    <div className="flex min-h-screen bg-[#07080d] text-slate-100 font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeJobsCount={activeJob && !['completed', 'failed', 'cancelled'].includes(activeJob.status) ? 1 : 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentTab={currentTab}
          onNewProject={handleNewProject}
          activeJobStage={
            activeJob && !['completed', 'failed', 'cancelled'].includes(activeJob.status)
              ? activeJob.stageMessage
              : undefined
          }
          onOpenJobModal={() => setIsJobModalOpen(true)}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardPage
              projects={projects}
              onOpenProject={handleOpenProjectInEditor}
              onStartNewWithPrompt={handleStartNewWithPrompt}
              onNavigateToTab={setCurrentTab}
            />
          )}

          {currentTab === 'text-to-video' && (
            <TextToVideoPage
              models={models}
              initialPrompt={handoffPrompt}
              initialDuration={handoffDuration}
              onStartGeneration={handleStartGeneration}
              onGenerateStoryboard={(params) => api.generateStoryboard(params)}
            />
          )}

          {currentTab === 'image-to-video' && (
            <ImageToVideoPage
              models={models}
              onUploadImage={handleUploadImageFile}
              onStartImageToVideo={handleStartImageToVideo}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsPage
              projects={projects}
              onOpenEditor={handleOpenProjectInEditor}
              onDuplicateProject={handleDuplicateProject}
              onDeleteProject={handleDeleteProject}
              onNewProject={handleNewProject}
            />
          )}

          {currentTab === 'editor' && (
            <VideoEditorPage
              project={activeProject}
              onUpdateScene={(sceneId, updates) => api.updateScene(sceneId, updates)}
              onDeleteScene={(sceneId) => api.deleteScene(sceneId)}
              onReorderScenes={(projId, ids) => api.reorderScenes(projId, ids)}
              onRegenerateScene={handleRegenerateScene}
              onRenderProject={handleRenderProject}
            />
          )}

          {currentTab === 'assets' && (
            <AssetsPage
              assets={assets}
              onUploadAsset={handleUploadImageFile}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {currentTab === 'models' && (
            <ModelSettingsPage
              providers={providers}
              models={models}
              onSaveKey={handleSaveKey}
              onToggleMode={handleToggleMode}
            />
          )}

          {currentTab === 'settings' && (
            <AccountSettingsPage
              systemHealth={systemHealth}
              onRefreshHealth={refreshModels}
            />
          )}
        </main>
      </div>

      {/* Real-time Job Progress Modal */}
      <JobProgressModal
        job={activeJob}
        scenes={activeJobScenes}
        finalVideoUrl={activeFinalVideoUrl}
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onCancelJob={handleCancelJob}
        onOpenEditor={handleOpenProjectInEditor}
      />
    </div>
  );
}

export default App;
