export interface ColorPalette {
  name: string
  colors: string[]
  description: string
}

export interface GradientConfig {
  type: 'linear' | 'radial' | 'conic'
  colors: string[]
  direction?: string
  center?: { x: number; y: number }
  angle?: number
}

// Curated color palettes for different moods
export const COLOR_PALETTES: Record<string, ColorPalette> = {
  'warm sunset': {
    name: 'Warm Sunset',
    colors: ['#ff6b6b', '#ffa500', '#ff8c42', '#ff6b9d', '#ffe066'],
    description: 'Warm oranges, corals, and golds'
  },
  'ocean depths': {
    name: 'Ocean Depths', 
    colors: ['#0077be', '#4fb3d9', '#6bb6ff', '#2e8b57', '#1e90ff'],
    description: 'Deep blues and ocean teals'
  },
  'forest morning': {
    name: 'Forest Morning',
    colors: ['#2d5016', '#4a7c59', '#6b9080', '#a4c3b2', '#e8f5e8'],
    description: 'Forest greens and morning mists'
  },
  'cosmic purple': {
    name: 'Cosmic Purple',
    colors: ['#4b0082', '#6a0dad', '#8b00ff', '#9370db', '#dda0dd'],
    description: 'Deep purples and cosmic violets'
  },
  'golden hour': {
    name: 'Golden Hour',
    colors: ['#d4af37', '#ffd700', '#ffb347', '#ff8c69', '#cd853f'],
    description: 'Golden yellows and warm ambers'
  },
  'pink dawn': {
    name: 'Pink Dawn',
    colors: ['#ff69b4', '#ffb6c1', '#ffc0cb', '#ff91a4', '#ff1493'],
    description: 'Soft pinks and dawn roses'
  },
  'electric blue': {
    name: 'Electric Blue',
    colors: ['#0080ff', '#00bfff', '#1e90ff', '#4169e1', '#6495ed'],
    description: 'Vibrant electric blues'
  },
  'earth tones': {
    name: 'Earth Tones',
    colors: ['#8b4513', '#a0522d', '#cd853f', '#daa520', '#b8860b'],
    description: 'Natural earth browns and tans'
  },
  'neon lights': {
    name: 'Neon Lights',
    colors: ['#ff0080', '#00ff80', '#8000ff', '#ff8000', '#0080ff'],
    description: 'Bright neon colors'
  },
  'professional': {
    name: 'Professional',
    colors: ['#2c3e50', '#34495e', '#3498db', '#2980b9', '#16a085'],
    description: 'Professional navy and teal tones'
  }
}

// Get a random subset of colors from a palette
function selectColors(palette: string[], count: number, seed: number): string[] {
  // Use seed to make selection deterministic but varied
  const shuffled = [...palette].sort(() => Math.sin(seed++) - 0.5)
  return shuffled.slice(0, Math.min(count, palette.length))
}

// Generate random gradient direction based on seed
function getGradientDirection(seed: number): string {
  const directions = [
    '0deg',    // top to bottom
    '45deg',   // diagonal
    '90deg',   // left to right
    '135deg',  // diagonal
    '180deg',  // bottom to top
    '225deg',  // diagonal
    '270deg',  // right to left
    '315deg'   // diagonal
  ]
  return directions[seed % directions.length]
}

// Generate radial gradient center point
function getRadialCenter(seed: number): { x: number; y: number } {
  const positions = [
    { x: 50, y: 50 },  // center
    { x: 30, y: 30 },  // top-left
    { x: 70, y: 30 },  // top-right
    { x: 30, y: 70 },  // bottom-left
    { x: 70, y: 70 },  // bottom-right
    { x: 50, y: 20 },  // top center
    { x: 50, y: 80 },  // bottom center
  ]
  return positions[seed % positions.length]
}

// Create SVG gradient definition
function createGradientDef(config: GradientConfig, id: string): string {
  const { type, colors } = config
  
  switch (type) {
    case 'linear': {
      const direction = config.direction || '0deg'
      // Convert CSS angle to SVG coordinates
      const angle = parseFloat(direction.replace('deg', ''))
      const rad = (angle * Math.PI) / 180
      
      // Calculate x1, y1, x2, y2 from angle
      const x1 = 50 - 50 * Math.cos(rad)
      const y1 = 50 - 50 * Math.sin(rad)
      const x2 = 50 + 50 * Math.cos(rad)
      const y2 = 50 + 50 * Math.sin(rad)
      
      const stops = colors.map((color, i) => 
        `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${color}"/>`
      ).join('')
      
      return `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient>`
    }
    
    case 'radial': {
      const center = config.center || { x: 50, y: 50 }
      const stops = colors.map((color, i) => 
        `<stop offset="${(i / (colors.length - 1)) * 100}%" stop-color="${color}"/>`
      ).join('')
      
      return `<radialGradient id="${id}" cx="${center.x}%" cy="${center.y}%" r="70%">${stops}</radialGradient>`
    }
    
    case 'conic': {
      // SVG doesn't have native conic gradients, so we'll simulate with a complex radial
      const center = config.center || { x: 50, y: 50 }
      const stops = colors.map((color, i) => 
        `<stop offset="${(i / colors.length) * 100}%" stop-color="${color}"/>`
      ).join('')
      
      return `<radialGradient id="${id}" cx="${center.x}%" cy="${center.y}%" r="100%">${stops}</radialGradient>`
    }
    
    default:
      return ''
  }
}

// Generate complete SVG gradient
export function generateSVGGradient(
  themeName: string, 
  index: number,
  width: number = 1200,
  height: number = 400,
  seed?: number
): string {
  // Use theme name and index to create deterministic seed
  const baseSeed = seed || (themeName.length * 7 + index * 13 + Date.now())
  
  // Get color palette
  const palette = COLOR_PALETTES[themeName] || COLOR_PALETTES['warm sunset']
  
  // Determine gradient type (cycle through types based on index)
  const types: GradientConfig['type'][] = ['linear', 'radial', 'linear', 'radial', 'conic']
  const type = types[index % types.length]
  
  // Generate gradient config
  const config: GradientConfig = {
    type,
    colors: selectColors(palette.colors, 3, baseSeed),
    direction: type === 'linear' ? getGradientDirection(baseSeed + index) : undefined,
    center: type === 'radial' || type === 'conic' ? getRadialCenter(baseSeed + index) : undefined
  }
  
  // Create unique gradient ID
  const gradientId = `grad-${themeName.replace(/\s+/g, '-')}-${index}`
  
  // Generate SVG
  const gradientDef = createGradientDef(config, gradientId)
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        ${gradientDef}
      </defs>
      <rect width="100%" height="100%" fill="url(#${gradientId})"/>
      
      <!-- Optional subtle texture overlay -->
      <rect width="100%" height="100%" fill="url(#noise)" opacity="0.1"/>
      <defs>
        <filter id="noise">
          <feTurbulence baseFrequency="0.9" numOctaves="1" result="noise"/>
          <feColorMatrix type="saturate" values="0"/>
          <feBlend mode="overlay"/>
        </filter>
      </defs>
    </svg>
  `.trim()
  
  return svg
}

// Convert SVG to data URI
export function svgToDataUri(svg: string): string {
  const encoded = btoa(svg)
  return `data:image/svg+xml;base64,${encoded}`
}

// Generate multiple gradient variations for a theme
export function generateGradientSet(
  themeName: string,
  count: number = 5,
  dimensions: { width: number; height: number } = { width: 1200, height: 400 },
  options: { seed?: number } = {}
): string[] {
  const gradients: string[] = []
  
  const baseSeed = options.seed || Date.now()
  
  for (let i = 0; i < count; i++) {
    const svg = generateSVGGradient(themeName, i, dimensions.width, dimensions.height, baseSeed)
    const dataUri = svgToDataUri(svg)
    gradients.push(dataUri)
  }
  
  return gradients
}

// Get theme names that match a description (for OpenAI integration)
export function getMatchingTheme(description: string): string {
  const desc = description.toLowerCase()
  
  // Theme keywords mapping
  const keywords: Record<string, string> = {
    'sunset': 'warm sunset',
    'warm': 'warm sunset',
    'orange': 'warm sunset',
    'ocean': 'ocean depths', 
    'blue': 'ocean depths',
    'sea': 'ocean depths',
    'forest': 'forest morning',
    'green': 'forest morning',
    'nature': 'forest morning',
    'purple': 'cosmic purple',
    'cosmic': 'cosmic purple',
    'space': 'cosmic purple',
    'gold': 'golden hour',
    'yellow': 'golden hour',
    'golden': 'golden hour',
    'pink': 'pink dawn',
    'dawn': 'pink dawn',
    'electric': 'electric blue',
    'bright': 'neon lights',
    'neon': 'neon lights',
    'vibrant': 'neon lights',
    'professional': 'professional',
    'business': 'professional',
    'corporate': 'professional'
  }
  
  // Find matching theme
  for (const [keyword, theme] of Object.entries(keywords)) {
    if (desc.includes(keyword)) {
      return theme
    }
  }
  
  // Default fallback
  return 'warm sunset'
}