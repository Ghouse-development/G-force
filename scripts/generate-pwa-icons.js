const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a simple orange "G" icon as SVG
const createSvgIcon = (size) => {
  const fontSize = Math.floor(size * 0.6);
  const padding = Math.floor(size * 0.15);
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#eab308;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">G</text>
</svg>`;
};

async function generateIcons() {
  console.log('Generating PWA icons...');

  for (const size of sizes) {
    const svg = createSvgIcon(size);
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);
      console.log(`Created: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Failed to create icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
