export type GradientType = 
  | 'linear' | 'radial' | 'conic' | 'mesh'
  | 'stripes' | 'checkerboard' | 'halftone' | 'tessellation'
  | 'turbulence' | 'displacement' | 'posterized' | 'pixelated' | 'lighting'
  | 'masked' | 'texture-overlay' | 'blend-mode'
  | 'dithered' | 'scanline' | 'fractal' | 'voronoi';

export interface AdvancedGradientConfig {
  type: GradientType
  colors: string[]
  seed: number
  width: number
  height: number
}

// Utility to generate unique IDs
function generateId(prefix: string, seed: number): string {
  return `${prefix}-${seed.toString(36)}`
}

// Utility to get color at index with cycling
function getColor(colors: string[], index: number): string {
  return colors[index % colors.length]
}

// Utility for seeded random number generation
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647
    return (this.seed - 1) / 2147483646
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }
}

// CORE PRIMITIVES
function generateMeshGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('mesh', seed)
  
  // Create a mesh using multiple overlapping radial gradients
  const meshPoints = []
  for (let i = 0; i < 6; i++) {
    const cx = random.range(10, 90)
    const cy = random.range(10, 90)
    const r = random.range(30, 80)
    const color = getColor(colors, i)
    
    meshPoints.push(`
      <radialGradient id="${id}-${i}" cx="${cx}%" cy="${cy}%" r="${r}%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    `)
  }
  
  const meshRects = meshPoints.map((_, i) => 
    `<rect width="100%" height="100%" fill="url(#${id}-${i})" mix-blend-mode="multiply"/>`
  ).join('')
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>${meshPoints.join('')}</defs>
      <rect width="100%" height="100%" fill="${colors[0]}"/>
      ${meshRects}
    </svg>
  `
}

// PATTERNED GRADIENTS
function generateStripesGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('stripes', seed)
  
  const stripeCount = random.int(8, 16)
  const angle = random.range(0, 360)
  const stripeWidth = 100 / stripeCount
  
  const stops = []
  for (let i = 0; i < stripeCount; i++) {
    const color = getColor(colors, i)
    const pos1 = i * stripeWidth
    const pos2 = (i + 0.5) * stripeWidth
    const pos3 = (i + 1) * stripeWidth
    
    stops.push(`
      <stop offset="${pos1}%" stop-color="${color}"/>
      <stop offset="${pos2}%" stop-color="${color}"/>
      <stop offset="${pos3}%" stop-color="${getColor(colors, i + 1)}"/>
    `)
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%" gradientTransform="rotate(${angle})">
          ${stops.join('')}
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${id})"/>
    </svg>
  `
}

function generateCheckerboardGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('checker', seed)
  
  const size = random.range(30, 80)
  const color1 = getColor(colors, 0)
  const color2 = getColor(colors, 1)
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
          <rect width="${size/2}" height="${size/2}" fill="${color1}"/>
          <rect x="${size/2}" y="${size/2}" width="${size/2}" height="${size/2}" fill="${color1}"/>
          <rect x="${size/2}" width="${size/2}" height="${size/2}" fill="${color2}"/>
          <rect y="${size/2}" width="${size/2}" height="${size/2}" fill="${color2}"/>
        </pattern>
        <linearGradient id="${id}-overlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors[2] || color1}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${colors[3] || color2}" stop-opacity="0.3"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${id})"/>
      <rect width="100%" height="100%" fill="url(#${id}-overlay)"/>
    </svg>
  `
}

function generateHalftoneGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('halftone', seed)
  
  const dotSize = random.range(4, 12)
  const spacing = dotSize * 1.5
  const color1 = getColor(colors, 0)
  const color2 = getColor(colors, 1)
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="${id}" patternUnits="userSpaceOnUse" width="${spacing}" height="${spacing}">
          <circle cx="${spacing/2}" cy="${spacing/2}" r="${dotSize/2}" fill="${color2}"/>
        </pattern>
        <radialGradient id="${id}-bg" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stop-color="${color1}"/>
          <stop offset="100%" stop-color="${colors[2] || color1}"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${id}-bg)"/>
      <rect width="100%" height="100%" fill="url(#${id})" opacity="0.7"/>
    </svg>
  `
}

// FILTERED EFFECTS
function generateTurbulenceGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('turbulence', seed)
  
  const baseFreq = random.range(0.01, 0.05)
  const octaves = random.int(3, 6)
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${id}-filter">
          <feTurbulence baseFrequency="${baseFreq}" numOctaves="${octaves}" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="20"/>
        </filter>
        <linearGradient id="${id}-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${getColor(colors, 0)}"/>
          <stop offset="50%" stop-color="${getColor(colors, 1)}"/>
          <stop offset="100%" stop-color="${getColor(colors, 2)}"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${id}-base)" filter="url(#${id}-filter)"/>
    </svg>
  `
}

function generatePixelatedGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  
  const pixelSize = random.int(8, 20)
  const rows = Math.ceil(height / pixelSize)
  const cols = Math.ceil(width / pixelSize)
  
  let pixels = ''
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const colorIndex = Math.floor(random.next() * colors.length)
      const color = colors[colorIndex]
      const opacity = random.range(0.3, 1)
      
      pixels += `<rect x="${x * pixelSize}" y="${y * pixelSize}" 
                     width="${pixelSize}" height="${pixelSize}" 
                     fill="${color}" opacity="${opacity}"/>`
    }
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${getColor(colors, 0)}"/>
      ${pixels}
    </svg>
  `
}

function generateLightingGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('lighting', seed)
  
  const lightX = random.range(20, 80)
  const lightY = random.range(20, 80)
  const intensity = random.range(1.5, 3)
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="${id}-light" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feSpecularLighting result="specOut" in="blur" specularConstant="${intensity}" 
                             specularExponent="20" lighting-color="white">
            <fePointLight x="${lightX}%" y="${lightY}%" z="50"/>
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut2"/>
          <feComposite in="SourceGraphic" in2="specOut2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
        </filter>
        <radialGradient id="${id}-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="${getColor(colors, 0)}"/>
          <stop offset="50%" stop-color="${getColor(colors, 1)}"/>
          <stop offset="100%" stop-color="${getColor(colors, 2)}"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${id}-bg)" filter="url(#${id}-light)"/>
    </svg>
  `
}

// EXPERIMENTAL PATTERNS
function generateScanlineGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  const id = generateId('scanline', seed)
  
  const lineHeight = random.range(2, 6)
  const spacing = lineHeight * 2
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="${id}-lines" patternUnits="userSpaceOnUse" width="100%" height="${spacing}">
          <rect width="100%" height="${lineHeight}" fill="rgba(0,0,0,0.1)"/>
          <rect y="${lineHeight}" width="100%" height="${lineHeight}" fill="rgba(255,255,255,0.05)"/>
        </pattern>
        <linearGradient id="${id}-bg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${getColor(colors, 0)}"/>
          <stop offset="100%" stop-color="${getColor(colors, 1)}"/>
        </linearGradient>
        <filter id="${id}-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${id}-bg)"/>
      <rect width="100%" height="100%" fill="url(#${id}-lines)" filter="url(#${id}-glow)"/>
    </svg>
  `
}

function generateVoronoiGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  
  // Generate seed points
  const points = []
  const numPoints = random.int(8, 15)
  
  for (let i = 0; i < numPoints; i++) {
    points.push({
      x: random.range(0, 100),
      y: random.range(0, 100),
      color: getColor(colors, i)
    })
  }
  
  // Create polygons (simplified Voronoi approximation)
  const polygons = points.map((point) => {
    const radius = random.range(15, 35)
    const sides = random.int(5, 8)
    
    let path = `M `
    for (let j = 0; j < sides; j++) {
      const angle = (j * 2 * Math.PI) / sides
      const x = point.x + radius * Math.cos(angle)
      const y = point.y + radius * Math.sin(angle)
      path += j === 0 ? `${x},${y} ` : `L ${x},${y} `
    }
    path += 'Z'
    
    return `<path d="${path}" fill="${point.color}" opacity="0.8" transform="scale(${width/100},${height/100})"/>`
  }).join('')
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${getColor(colors, 0)}"/>
      ${polygons}
    </svg>
  `
}

function generateDitheredGradient(config: AdvancedGradientConfig): string {
  const { colors, seed, width, height } = config
  const random = new SeededRandom(seed)
  
  const dotSize = 3
  const rows = Math.floor(height / dotSize)
  const cols = Math.floor(width / dotSize)
  
  let dots = ''
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Create dithering pattern based on position and randomness
      const gradientValue = (x / cols + y / rows) / 2
      const threshold = random.next()
      
      if (gradientValue > threshold) {
        const color = gradientValue > 0.5 ? getColor(colors, 1) : getColor(colors, 0)
        dots += `<rect x="${x * dotSize}" y="${y * dotSize}" 
                     width="${dotSize}" height="${dotSize}" 
                     fill="${color}"/>`
      }
    }
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${getColor(colors, 2) || '#000000'}"/>
      ${dots}
    </svg>
  `
}

// Main generation function
export function generateAdvancedSVGGradient(config: AdvancedGradientConfig): string {
  try {
    switch (config.type) {
      // Core primitives (enhanced)
      case 'mesh':
        return generateMeshGradient(config)
      
      // Patterned
      case 'stripes':
        return generateStripesGradient(config)
      case 'checkerboard':
        return generateCheckerboardGradient(config)
      case 'halftone':
        return generateHalftoneGradient(config)
      
      // Filtered
      case 'turbulence':
        return generateTurbulenceGradient(config)
      case 'pixelated':
        return generatePixelatedGradient(config)
      case 'lighting':
        return generateLightingGradient(config)
      
      // Experimental
      case 'scanline':
        return generateScanlineGradient(config)
      case 'voronoi':
        return generateVoronoiGradient(config)
      case 'dithered':
        return generateDitheredGradient(config)
      
      // Fallback to simple linear gradient
      default:
        const id = generateId('linear', config.seed)
        const stops = config.colors.map((color, i) => 
          `<stop offset="${(i / (config.colors.length - 1)) * 100}%" stop-color="${color}"/>`
        ).join('')
        
        return `
          <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                ${stops}
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#${id})"/>
          </svg>
        `
    }
  } catch (error) {
    console.error('Error generating advanced SVG gradient:', error)
    // Return simple fallback
    return `
      <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${config.colors[0] || '#6366f1'}"/>
      </svg>
    `
  }
}

// Convert SVG to data URI
export function advancedSvgToDataUri(svg: string): string {
  const encoded = btoa(unescape(encodeURIComponent(svg.trim())))
  return `data:image/svg+xml;base64,${encoded}`
}

// Generate a set of advanced gradients
export function generateAdvancedGradientSet(
  themeName: string,
  colors: string[],
  count: number = 5,
  dimensions: { width: number; height: number } = { width: 1200, height: 400 },
  options: { seed?: number } = {}
): string[] {
  const availableTypes: GradientType[] = [
    'mesh', 'stripes', 'checkerboard', 'halftone',
    'turbulence', 'pixelated', 'lighting',
    'scanline', 'voronoi', 'dithered'
  ]
  
  const gradients: string[] = []
  const baseSeed = options.seed || (themeName.length * 7 + Date.now())
  
  for (let i = 0; i < count; i++) {
    const type = availableTypes[i % availableTypes.length]
    const seed = baseSeed + i * 13
    
    const config: AdvancedGradientConfig = {
      type,
      colors,
      seed,
      width: dimensions.width,
      height: dimensions.height
    }
    
    const svg = generateAdvancedSVGGradient(config)
    const dataUri = advancedSvgToDataUri(svg)
    gradients.push(dataUri)
  }
  
  return gradients
}