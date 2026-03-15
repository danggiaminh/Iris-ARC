import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLUE = '#0066FF';

async function generateIcons() {
  const projectRoot = path.resolve(__dirname, '..');
  const iconsDir = path.join(projectRoot, 'src-tauri', 'icons');

  await fs.promises.mkdir(iconsDir, { recursive: true });

  const baseSize = 1024;
  const circleSvg = Buffer.from(
    `<svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${baseSize / 2}" cy="${baseSize / 2}" r="280" fill="#FFFFFF" />
    </svg>`
  );

  const sourcePath = path.join(iconsDir, 'source-1024.png');

  await sharp({
    create: {
      width: baseSize,
      height: baseSize,
      channels: 4,
      background: BLUE,
    },
  })
    .composite([{ input: circleSvg }])
    .png()
    .toFile(sourcePath);

  const targets = [
    { name: '32x32.png', size: 32 },
    { name: '128x128.png', size: 128 },
    { name: '128x128@2x.png', size: 256 },
    { name: 'icon.png', size: 512 },
  ];

  for (const target of targets) {
    const outPath = path.join(iconsDir, target.name);
    await sharp(sourcePath).resize(target.size, target.size).png().toFile(outPath);
  }

  const icoBuffers = await Promise.all(
    [16, 32, 48, 256].map((size) =>
      sharp(sourcePath).resize(size, size).png().toBuffer()
    )
  );

  const ico = await pngToIco(icoBuffers);
  await fs.promises.writeFile(path.join(iconsDir, 'icon.ico'), ico);
}

generateIcons().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
