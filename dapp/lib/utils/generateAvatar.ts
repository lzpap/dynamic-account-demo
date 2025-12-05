/**
 * Generates a deterministic pixel-art avatar (Minecraft-style) from an address.
 * Returns a data URL for an SVG image.
 */

// Predefined color palettes inspired by Minecraft
const PALETTES = [
  ['#5D8C3E', '#3E6B2B', '#7CB347', '#2D4F1F'], // Grass/Creeper green
  ['#8B5A2B', '#6B4423', '#A0522D', '#4A3728'], // Oak wood brown
  ['#4A90D9', '#3B7BBF', '#6BA8E5', '#2C5F8A'], // Diamond blue
  ['#9B59B6', '#8E44AD', '#A569BD', '#6C3483'], // Ender purple
  ['#E74C3C', '#C0392B', '#EC7063', '#922B21'], // Redstone red
  ['#F39C12', '#D68910', '#F5B041', '#B9770E'], // Gold yellow
  ['#1ABC9C', '#16A085', '#48C9B0', '#117A65'], // Prismarine teal
  ['#7F8C8D', '#616A6B', '#95A5A6', '#4D5656'], // Stone gray
];

// Animal silhouette patterns (16x16 grid, only left half stored - will be mirrored)
// 1 = filled pixel, 0 = empty
const ANIMAL_PATTERNS: { name: string; pattern: number[][] }[] = [
  {
    name: 'cat',
    pattern: [
      [0,0,0,0,0,0,1,1],
      [0,0,0,0,0,1,1,1],
      [0,0,0,0,1,1,1,1],
      [0,0,0,1,1,1,1,1],
      [0,0,0,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,1,0,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,0,0],
      [1,1,0,0,1,1,0,0],
      [1,1,0,0,1,1,0,0],
      [1,1,0,0,1,1,0,0],
    ],
  },
  {
    name: 'dog',
    pattern: [
      [0,0,0,0,0,0,0,0],
      [0,0,1,1,0,0,0,0],
      [0,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,0,0,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,0,1,1,1,1,1],
      [0,0,0,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,0,1,1,0],
      [0,0,1,1,0,1,1,0],
      [0,0,1,1,0,1,1,0],
    ],
  },
  {
    name: 'bird',
    pattern: [
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,0],
      [0,0,0,0,1,1,1,1],
      [0,0,0,1,1,1,1,1],
      [0,0,1,1,1,0,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,0,1,1,1,1,0],
      [0,0,0,0,1,1,0,0],
      [0,0,0,0,1,1,0,0],
      [0,0,0,0,1,0,0,0],
      [0,0,0,1,1,0,0,0],
      [0,0,0,1,0,0,0,0],
      [0,0,0,1,0,0,0,0],
    ],
  },
  {
    name: 'fish',
    pattern: [
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,0],
      [0,0,0,0,0,1,1,1],
      [1,0,0,0,1,1,1,1],
      [1,1,0,1,1,1,0,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [1,1,0,1,1,1,1,1],
      [1,0,0,0,1,1,1,1],
      [0,0,0,0,0,1,1,1],
      [0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
    ],
  },
  {
    name: 'rabbit',
    pattern: [
      [0,0,0,0,0,1,1,0],
      [0,0,0,0,0,1,1,0],
      [0,0,0,0,1,1,1,0],
      [0,0,0,0,1,1,1,0],
      [0,0,0,0,1,1,1,1],
      [0,0,0,1,1,1,1,1],
      [0,0,0,1,1,0,1,1],
      [0,0,0,1,1,1,1,1],
      [0,0,0,0,1,1,1,1],
      [0,0,0,1,1,1,1,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,0,0],
      [0,1,1,1,1,0,0,0],
      [0,0,1,0,1,1,0,0],
      [0,0,1,0,0,1,0,0],
      [0,0,1,0,0,1,0,0],
    ],
  },
  {
    name: 'fox',
    pattern: [
      [0,0,0,0,0,0,0,0],
      [0,0,1,0,0,0,0,0],
      [0,1,1,1,0,0,0,0],
      [0,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,0,0,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,0,1,1,1,1,0],
      [0,0,0,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,1,1,1,1,1,0,0],
      [1,1,1,1,1,0,0,0],
      [1,1,0,0,1,1,0,0],
      [1,0,0,0,1,1,0,0],
      [0,0,0,0,1,0,0,0],
    ],
  },
  {
    name: 'owl',
    pattern: [
      [0,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,0,0],
      [0,0,1,1,1,1,1,0],
      [0,1,1,1,1,1,1,1],
      [0,1,1,0,0,1,1,1],
      [0,1,1,0,0,1,1,1],
      [0,1,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,0,1,1,1,0,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,0,1,1,1,0,0],
      [0,0,0,1,0,1,0,0],
      [0,0,0,1,0,1,0,0],
    ],
  },
  {
    name: 'bear',
    pattern: [
      [0,0,0,0,0,0,0,0],
      [0,0,1,1,0,0,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,1,0,0,1,1,1],
      [0,0,1,1,1,1,1,1],
      [0,0,0,1,1,1,1,0],
      [0,0,0,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0],
      [0,0,1,1,0,1,1,0],
      [0,0,1,1,0,1,1,0],
      [0,0,1,1,0,1,1,0],
    ],
  },
];

/**
 * Simple hash function to convert address string to a number
 */
function hashAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator for deterministic results
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Generates a pixel art avatar as an SVG data URL
 * @param address - The wallet/account address
 * @param size - The size of the avatar in pixels (default 64)
 * @returns A data URL containing the SVG avatar
 */
export function generateAvatar(address: string, size: number = 64): string {
  const hash = hashAddress(address);
  const random = seededRandom(hash);
  
  // Select palette based on hash
  const palette = PALETTES[hash % PALETTES.length];
  
  // Select animal pattern based on hash
  const animalPattern = ANIMAL_PATTERNS[(hash >> 4) % ANIMAL_PATTERNS.length];
  
  // Grid size for pixels (16x16 grid)
  const gridSize = 16;
  const pixelSize = size / gridSize;
  
  // Build SVG
  let svgContent = '';
  
  // Background circle
  const bgColor = palette[3];
  svgContent += `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bgColor}"/>`;
  
  // Clip path for round avatar
  svgContent += `<clipPath id="avatarClip"><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}"/></clipPath>`;
  svgContent += `<g clip-path="url(#avatarClip)">`;
  
  // Draw pixels based on animal pattern
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize / 2; x++) {
      if (animalPattern.pattern[y][x] === 1) {
        // Pick color based on position and random for variation
        const colorIndex = Math.floor(random() * 3);
        const color = palette[colorIndex];
        
        // Left side pixel
        svgContent += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
        
        // Mirrored right side pixel
        const mirrorX = gridSize - 1 - x;
        svgContent += `<rect x="${mirrorX * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
  }
  
  svgContent += `</g>`;
  
  // Add subtle border
  svgContent += `<circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="none" stroke="${palette[1]}" stroke-width="2"/>`;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgContent}</svg>`;
  
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * React component-friendly version that returns the SVG as a string
 */
export function generateAvatarSVG(address: string, size: number = 64): string {
  const hash = hashAddress(address);
  const random = seededRandom(hash);
  
  const palette = PALETTES[hash % PALETTES.length];
  const animalPattern = ANIMAL_PATTERNS[(hash >> 4) % ANIMAL_PATTERNS.length];
  const gridSize = 16;
  const pixelSize = size / gridSize;
  
  let svgContent = '';
  const bgColor = palette[3];
  svgContent += `<circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="${bgColor}"/>`;
  svgContent += `<clipPath id="clip-${hash}"><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}"/></clipPath>`;
  svgContent += `<g clip-path="url(#clip-${hash})">`;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize / 2; x++) {
      if (animalPattern.pattern[y][x] === 1) {
        const colorIndex = Math.floor(random() * 3);
        const color = palette[colorIndex];
        
        svgContent += `<rect x="${x * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
        
        const mirrorX = gridSize - 1 - x;
        svgContent += `<rect x="${mirrorX * pixelSize}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
  }
  
  svgContent += `</g>`;
  svgContent += `<circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="none" stroke="${palette[1]}" stroke-width="2"/>`;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${svgContent}</svg>`;
}
