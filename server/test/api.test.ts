import assert from 'node:assert';
import { db } from '../src/db/db.js';
import { StoryboardGenerator } from '../src/services/llm/storyboardGenerator.js';
import { FFmpegService } from '../src/services/video/ffmpegService.js';

async function runTests() {
  console.log('🧪 Starting VividFlow Studio Automated Tests...\n');

  // Test 1: Database persistence and seed project
  console.log('Test 1: Validating Database and Seed Project...');
  const projects = db.getProjects();
  assert(projects.length > 0, 'Database should contain at least 1 seed project');
  const demo = projects.find((p) => p.name.includes('Alchemist')) || projects[projects.length - 1];
  assert(demo !== undefined, 'Seed project should exist');
  assert(demo.scenes.length === 8, 'Demo project should have 8 scenes for 60s duration');
  console.log(`✅ Seed project validated: "${demo.name}" with ${demo.scenes.length} scenes.`);

  // Test 2: Multi-scene Storyboard Generator for 60s
  console.log('\nTest 2: Validating 60-second Multi-Scene Storyboard Planner...');
  const plan = await StoryboardGenerator.planProject({
    prompt: 'Two cute chemical elements falling in love in a colorful science laboratory',
    totalDuration: 60,
    style: '3d-animation',
    cameraDefault: 'tracking-shot',
    language: 'en',
  });

  assert(plan.scenes.length >= 6, 'Storyboard should have at least 6 scenes for 60s');
  const totalPlannedSecs = plan.scenes.reduce((acc, s) => acc + s.targetDuration, 0);
  console.log(`✅ Generated ${plan.scenes.length} scenes totaling ${totalPlannedSecs.toFixed(1)} seconds.`);
  assert(Math.abs(totalPlannedSecs - 60) <= 2, 'Total duration should match 60s within tolerance');
  assert(plan.continuity.characters.length > 0, 'Continuity document should contain characters');
  console.log(`✅ Character continuity: ${plan.continuity.characters[0].name}`);

  // Test 3: Model Registry and Capabilities
  console.log('\nTest 3: Validating Model Registry & Capabilities...');
  const models = db.getModels();
  assert(models.length >= 6, 'Should expose at least 6 AI models');
  const veo = models.find((m) => m.id === 'veo-2');
  assert(veo !== undefined, 'Google Veo 2 should be in model registry');
  assert(veo.supportsTextToVideo === true, 'Veo should support text to video');
  console.log(`✅ Verified ${models.length} AI model adapters.`);

  // Test 4: FFmpeg Binary and Procedural Clip Generation
  console.log('\nTest 4: Validating FFmpeg Engine & Procedural Synthesis...');
  const ffmpegPath = FFmpegService.getFfmpegPath();
  assert(Boolean(ffmpegPath), 'FFmpeg path should be resolved');
  console.log(`✅ FFmpeg resolved: ${ffmpegPath}`);

  console.log('Generating sample 4s clip with camera motion and audio tone...');
  const clip = await FFmpegService.generateProceduralSceneClip({
    sceneId: 'test_sample',
    title: 'Test Laboratory Scene',
    prompt: 'Two glowing elemental drops swirl together',
    durationSeconds: 4,
    aspectRatio: '16:9',
    resolution: '720p',
    cameraMovement: 'zoom-in',
    motionIntensity: 6,
    visualStyle: '3d-animation',
  });

  assert(clip.videoUrl.endsWith('.mp4'), 'Should generate valid MP4 output');
  assert(clip.duration >= 3.5, 'Actual duration should be close to 4s');
  console.log(`✅ Procedural clip generated successfully: ${clip.videoUrl} (Duration: ${clip.duration}s)`);

  // Test 5: Real Video Generation with Pollinations AI
  console.log('\nTest 5: Testing Pollinations AI Video Adapter...');
  const { PollinationsAdapter } = await import('../src/services/ai/adapters/pollinations.js');
  const pollinations = new PollinationsAdapter();
  const pollRes = await pollinations.generateScene({
    projectId: 'test_proj',
    sceneId: 'test_pollinations_scene',
    prompt: 'A futuristic cybernetic explorer looking at a glowing neon galaxy',
    durationSeconds: 4,
    aspectRatio: '16:9',
    resolution: '720p',
    cameraMovement: 'pan-right',
    motionIntensity: 6,
    style: 'sci-fi',
  });

  assert(pollRes.success === true, 'Pollinations generation should succeed');
  assert(Boolean(pollRes.videoUrl), 'Pollinations should return videoUrl');
  assert(pollRes.videoUrl!.endsWith('.mp4'), 'Pollinations output must be .mp4');
  console.log(`✅ Pollinations Video successfully rendered: ${pollRes.videoUrl}`);

  console.log('\n🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
