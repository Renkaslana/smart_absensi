/**
 * Copy MediaPipe WASM and model files to public directory
 * This ensures assets are served locally instead of from CDN
 */

const fs = require('fs');
const path = require('path');

const mediapipeModules = [
  '@mediapipe/face_detection',
  '@mediapipe/face_mesh',
];

const publicDir = path.join(__dirname, '..', 'public', 'mediapipe');

// Create public/mediapipe directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Created public/mediapipe directory');
}

mediapipeModules.forEach(module => {
  const moduleName = module.split('/')[1]; // e.g., 'face_detection'
  const sourceDir = path.join(__dirname, '..', 'node_modules', module);
  const targetDir = path.join(publicDir, moduleName);
  
  // Create target directory
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copy all files from source to target
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      // Skip directories and package.json
      if (fs.statSync(sourcePath).isFile() && file !== 'package.json') {
        fs.copyFileSync(sourcePath, targetPath);
      }
    });
    
    console.log(`✅ Copied ${module} to public/mediapipe/${moduleName}`);
  } else {
    console.warn(`⚠️  Module ${module} not found in node_modules`);
  }
});

console.log('✅ MediaPipe assets copied successfully!');
