import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import iconGen from 'icon-gen';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureIcons() {
  const projectRoot = path.resolve(__dirname, '..');
  const iconsDir = path.join(projectRoot, 'src-tauri', 'icons');

  await fs.promises.mkdir(iconsDir, { recursive: true });

  const basePngPath = path.join(iconsDir, 'base-512.png');

  const candidates = [
    path.join(projectRoot, 'assets', 'icon.png'),
    path.join(projectRoot, 'public', 'icon.png'),
    path.join(projectRoot, 'src-tauri', 'icon.png'),
  ];

  let sourcePath = candidates.find((p) => fs.existsSync(p));

  if (!sourcePath) {
    // No source image found — create a solid-color placeholder square.
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: '#4b5dff',
      },
    })
      .png()
      .toFile(basePngPath);
    sourcePath = basePngPath;
  } else {
    // Normalize to 512x512 PNG as base.
    await sharp(sourcePath).resize(512, 512).png().toFile(basePngPath);
    sourcePath = basePngPath;
  }

  const png32 = path.join(iconsDir, '32x32.png');
  const png128 = path.join(iconsDir, '128x128.png');
  const png256 = path.join(iconsDir, '128x128@2x.png'); // 256x256 content

  await Promise.all([
    sharp(sourcePath).resize(32, 32).png().toFile(png32),
    sharp(sourcePath).resize(128, 128).png().toFile(png128),
    sharp(sourcePath).resize(256, 256).png().toFile(png256),
  ]);

  // Generate .ico and .icns from the 256x256 PNG.
  await iconGen(png256, {
    report: false,
    ico: {
      name: 'icon',
      sizes: [16, 24, 32, 48, 64, 128, 256],
    },
    icns: {
      name: 'icon',
      sizes: [16, 32, 64, 128, 256, 512],
    },
    modes: ['ico', 'icns'],
    dir: iconsDir,
  });

  // Ensure file names match tauri.conf.json expectations.
  const icoPath = path.join(iconsDir, 'icon.ico');
  const icnsPath = path.join(iconsDir, 'icon.icns');
  if (!fs.existsSync(icoPath) || !fs.existsSync(icnsPath)) {
    throw new Error('Failed to generate icon.ico or icon.icns');
  }

  // Script is idempotent; running again simply overwrites outputs.
  // All required files will now exist under src-tauri/icons/.
  // This script is run before any Tauri build/dev step.
  console.log('Tauri icons generated in', iconsDir);
}

ensureIcons().catch((err) => {
  console.error('Failed to generate Tauri icons:', err);
  process.exit(1);
});

