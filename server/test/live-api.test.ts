import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { db } from '../src/db/db.js';
import assetsRouter from '../src/routes/assets.js';
import generateRouter from '../src/routes/generate.js';
import jobsRouter from '../src/routes/jobs.js';
import modelsRouter from '../src/routes/models.js';
import projectsRouter from '../src/routes/projects.js';
import renderRouter from '../src/routes/render.js';
import scenesRouter from '../src/routes/scenes.js';
import settingsRouter from '../src/routes/settings.js';

async function runLiveApiTests() {
  console.log('🚀 Running Live Express API HTTP Validation...\n');

  // Setup test app instance
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      app: 'VividFlow AI Studio Server',
      availableModels: db.getModels().length,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/projects', projectsRouter);
  app.use('/api/scenes', scenesRouter);
  app.use('/api/generate', generateRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/render', renderRouter);
  app.use('/api/models', modelsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/assets', assetsRouter);

  // Start on random ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Live API running on ${baseUrl}`);

  try {
    // 1. Health check
    console.log('\n1. Testing GET /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    assert(healthRes.headers.get('content-type')?.includes('application/json'), 'Content-Type must be application/json');
    const healthJson = await healthRes.json();
    assert.strictEqual(healthJson.status, 'ok');
    console.log('✅ GET /api/health returns HTTP 200 with valid JSON:', healthJson);

    // 2. Models list
    console.log('\n2. Testing GET /api/models...');
    const modelsRes = await fetch(`${baseUrl}/api/models`);
    assert.strictEqual(modelsRes.status, 200);
    assert(modelsRes.headers.get('content-type')?.includes('application/json'), 'Content-Type must be application/json');
    const modelsJson = await modelsRes.json();
    assert.strictEqual(modelsJson.success, true);
    assert(Array.isArray(modelsJson.models) && modelsJson.models.length >= 7, 'Should return 7 models');
    const polModel = modelsJson.models.find((m: any) => m.id === 'pollinations-video');
    assert(polModel !== undefined, 'pollinations-video model must exist');
    assert.strictEqual(polModel.isConfigured, true, 'pollinations-video must be marked isConfigured: true');
    console.log(`✅ GET /api/models returns HTTP 200 with ${modelsJson.models.length} valid models.`);

    // 3. Settings list
    console.log('\n3. Testing GET /api/settings...');
    const settingsRes = await fetch(`${baseUrl}/api/settings`);
    assert.strictEqual(settingsRes.status, 200);
    assert(settingsRes.headers.get('content-type')?.includes('application/json'));
    const settingsJson = await settingsRes.json();
    assert.strictEqual(settingsJson.success, true);
    assert(Array.isArray(settingsJson.providers) && settingsJson.providers.length >= 7);
    console.log(`✅ GET /api/settings returns HTTP 200 with ${settingsJson.providers.length} configured providers.`);

    // 4. Projects list
    console.log('\n4. Testing GET /api/projects...');
    const projectsRes = await fetch(`${baseUrl}/api/projects`);
    assert.strictEqual(projectsRes.status, 200);
    assert(projectsRes.headers.get('content-type')?.includes('application/json'));
    const projectsJson = await projectsRes.json();
    assert.strictEqual(projectsJson.success, true);
    assert(Array.isArray(projectsJson.projects));
    console.log(`✅ GET /api/projects returns HTTP 200 with ${projectsJson.projects.length} projects.`);

    // 5. Storyboard generation
    console.log('\n5. Testing POST /api/generate/storyboard...');
    const storyboardRes = await fetch(`${baseUrl}/api/generate/storyboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'A cyberpunk street food vendor in futuristic Tokyo at midnight',
        totalDuration: 60,
        style: 'sci-fi',
      }),
    });
    assert.strictEqual(storyboardRes.status, 200);
    assert(storyboardRes.headers.get('content-type')?.includes('application/json'));
    const storyboardJson = await storyboardRes.json();
    assert.strictEqual(storyboardJson.success, true);
    assert(storyboardJson.plan && storyboardJson.plan.scenes.length >= 6);
    console.log(`✅ POST /api/generate/storyboard returns HTTP 200 with ${storyboardJson.plan.scenes.length} planned scenes.`);

    // 6. Upfront validation on unconfigured provider
    console.log('\n6. Testing POST /api/generate/start with unconfigured Google key...');
    const badGenRes = await fetch(`${baseUrl}/api/generate/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Epic test video',
        providerId: 'google', // Unconfigured without key
      }),
    });
    assert.strictEqual(badGenRes.status, 400);
    assert(badGenRes.headers.get('content-type')?.includes('application/json'));
    const badGenJson = await badGenRes.json();
    assert.strictEqual(badGenJson.success, false);
    assert(typeof badGenJson.error === 'string' && badGenJson.error.includes('Google AI API Key is not configured'));
    console.log('✅ POST /api/generate/start safely validates credentials and returns clean JSON HTTP 400:', badGenJson.error);

    // 7. Generation start with free Pollinations provider
    console.log('\n7. Testing POST /api/generate/start with Pollinations provider...');
    const startRes = await fetch(`${baseUrl}/api/generate/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Two glowing elemental beings meeting in a neon cavern',
        providerId: 'pollinations',
        modelId: 'pollinations-video',
        targetTotalDuration: 45,
      }),
    });
    assert.strictEqual(startRes.status, 200);
    assert(startRes.headers.get('content-type')?.includes('application/json'));
    const startJson = await startRes.json();
    assert.strictEqual(startJson.success, true);
    assert(Boolean(startJson.jobId), 'Must return jobId');
    assert(Boolean(startJson.projectId), 'Must return projectId');
    console.log(`✅ POST /api/generate/start successfully created job ${startJson.jobId} for project ${startJson.projectId}.`);

    // 8. Jobs status poll
    console.log('\n8. Testing GET /api/jobs/:id...');
    const jobRes = await fetch(`${baseUrl}/api/jobs/${startJson.jobId}`);
    assert.strictEqual(jobRes.status, 200);
    assert(jobRes.headers.get('content-type')?.includes('application/json'));
    const jobJson = await jobRes.json();
    assert.strictEqual(jobJson.success, true);
    assert(Boolean(jobJson.job), 'Must return job object');
    console.log(`✅ GET /api/jobs/:id returned HTTP 200. Job status: "${jobJson.job.status}" (Stage: ${jobJson.job.stageMessage})`);

    console.log('\n🎉 ALL LIVE EXPRESS ENDPOINTS RETURN VALID JSON AND SAFE STATUS CODES!');
  } finally {
    server.close();
  }
}

runLiveApiTests().catch((err) => {
  console.error('❌ Live API test failed:', err);
  process.exit(1);
});
