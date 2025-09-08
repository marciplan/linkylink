import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { generateGradientSet, COLOR_PALETTES } from '@/lib/gradient-generator'
import { generateAdvancedGradientSet } from '@/lib/advanced-gradient-generator'

export async function POST(request: NextRequest) {
  try {
    const { linkylinkId, title, subtitle, selectedEmoji } = await request.json()

    if (!linkylinkId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify LinkLink exists and user owns it
    const linkylink = await prisma.linkLink.findUnique({
      where: { id: linkylinkId, userId: session.user.id }
    })

    if (!linkylink) {
      return NextResponse.json({ error: 'Bundel not found or access denied' }, { status: 404 })
    }

    // Function to get AI-analyzed emoji color themes
    const getEmojiColorThemes = async (emoji: string): Promise<string[]> => {
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analyze-emoji-colors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emoji }),
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🎨 AI Color Analysis Result:', data)
          return data.suggestedThemes || ['warm sunset', 'professional', 'electric blue']
        }
      } catch (error) {
        console.error('Error analyzing emoji colors:', error)
      }
      
      // Fallback to simple mapping if API fails
      return ['warm sunset', 'professional', 'electric blue']
    }

    // Generate themes with emoji color influence + randomization
    const contentText = `${title} ${subtitle || ''}`.toLowerCase()
    const availableThemes = Object.keys(COLOR_PALETTES)
    
    // Add timestamp-based randomization to ensure different results each time
    const seed = Date.now()
    const random = () => {
      const x = Math.sin(seed + Math.random() * 1000) * 10000
      return x - Math.floor(x)
    }
    
    // Emoji-influenced theme selection with content awareness as fallback
    let candidateThemes: string[] = []
    
    // If emoji is selected, prioritize its AI-analyzed color themes
    if (selectedEmoji) {
      const emojiThemes = await getEmojiColorThemes(selectedEmoji)
      candidateThemes = [...emojiThemes]
      console.log(`🎨 Using AI-analyzed themes for "${selectedEmoji}":`, emojiThemes)
      
      // Add 2 more complementary themes based on content
      if (contentText.includes('tech') || contentText.includes('startup') || contentText.includes('business')) {
        candidateThemes.push('professional', 'electric blue')
      } else if (contentText.includes('art') || contentText.includes('creative') || contentText.includes('design')) {
        candidateThemes.push('cosmic purple', 'pink dawn')  
      } else if (contentText.includes('nature') || contentText.includes('outdoor') || contentText.includes('green')) {
        candidateThemes.push('forest morning', 'earth tones')
      } else if (contentText.includes('food') || contentText.includes('cooking') || contentText.includes('recipe')) {
        candidateThemes.push('warm sunset', 'golden hour')
      } else {
        candidateThemes.push('professional', 'warm sunset')
      }
    } else {
      // No emoji selected - use content-based selection as before
      if (contentText.includes('tech') || contentText.includes('startup') || contentText.includes('business')) {
        candidateThemes = ['professional', 'electric blue', 'cosmic purple', 'neon lights', 'deep ocean']
      } else if (contentText.includes('art') || contentText.includes('creative') || contentText.includes('design')) {
        candidateThemes = ['cosmic purple', 'pink dawn', 'neon lights', 'warm sunset', 'golden hour']  
      } else if (contentText.includes('nature') || contentText.includes('outdoor') || contentText.includes('green')) {
        candidateThemes = ['forest morning', 'earth tones', 'ocean depths', 'warm sunset', 'professional']
      } else if (contentText.includes('food') || contentText.includes('cooking') || contentText.includes('recipe')) {
        candidateThemes = ['warm sunset', 'golden hour', 'earth tones', 'pink dawn', 'forest morning']
      } else {
        // For general content, use all themes with bias toward popular ones
        candidateThemes = [...availableThemes]
      }
    }
    
    // Shuffle candidate themes and mix with other random themes
    const shuffledCandidates = candidateThemes.sort(() => random() - 0.5)
    const otherThemes = availableThemes.filter(theme => !candidateThemes.includes(theme))
    const shuffledOthers = otherThemes.sort(() => random() - 0.5)
    
    // Select 2-3 themes from candidates, rest from all themes
    const selectedThemes: string[] = []
    const numFromCandidates = Math.floor(random() * 2) + 2 // 2 or 3
    
    // Add themes from candidates
    selectedThemes.push(...shuffledCandidates.slice(0, numFromCandidates))
    
    // Fill remaining slots with random themes from all available
    const allShuffled = [...shuffledCandidates, ...shuffledOthers].sort(() => random() - 0.5)
    const remainingThemes = allShuffled.filter(theme => !selectedThemes.includes(theme))
    
    while (selectedThemes.length < 5 && remainingThemes.length > 0) {
      selectedThemes.push(remainingThemes.shift()!)
    }
    
    // Ensure we have exactly 5 themes
    const themes = selectedThemes.slice(0, 5)

    // Generate SVG gradients for each theme
    console.log('Generated themes:', themes)
    
    const selectedImages: string[] = []
    
    // Generate mix of simple and advanced gradients with unique seeds (60% advanced, 40% simple)
    for (let i = 0; i < themes.length; i++) {
      try {
        const theme = themes[i]
        const palette = COLOR_PALETTES[theme] || COLOR_PALETTES['warm sunset']
        
        // Create unique seed for each gradient to ensure variety
        const gradientSeed = seed + i * 1000 + Math.floor(Math.random() * 10000)
        
        if (i < 3) {
          // Use advanced gradient types for first 3 (60%)
          const advancedGradients = generateAdvancedGradientSet(
            theme, 
            palette.colors, 
            1, 
            { width: 1200, height: 400 },
            { seed: gradientSeed }
          )
          if (advancedGradients.length > 0) {
            selectedImages.push(advancedGradients[0])
          } else {
            // Fallback to simple gradient
            const simpleGradients = generateGradientSet(theme, 1, { width: 1200, height: 400 }, { seed: gradientSeed })
            if (simpleGradients.length > 0) {
              selectedImages.push(simpleGradients[0])
            }
          }
        } else {
          // Use simple gradients for remaining 2 (40%)
          const simpleGradients = generateGradientSet(theme, 1, { width: 1200, height: 400 }, { seed: gradientSeed })
          if (simpleGradients.length > 0) {
            selectedImages.push(simpleGradients[0])
          }
        }
      } catch (error) {
        console.error(`Failed to generate gradient for theme ${themes[i]}:`, error)
        
        // Fallback to a simple gradient
        const fallbackGradients = generateGradientSet('warm sunset', 1, { width: 1200, height: 400 })
        if (fallbackGradients.length > 0) {
          selectedImages.push(fallbackGradients[0])
        }
      }
    }
    
    // Ensure we always have 5 gradients
    while (selectedImages.length < 5) {
      const fallbackTheme = themes[selectedImages.length % themes.length] || 'warm sunset'
      const fallbackGradients = generateGradientSet(fallbackTheme, 1, { width: 1200, height: 400 })
      if (fallbackGradients.length > 0) {
        selectedImages.push(fallbackGradients[0])
      } else {
        // Ultimate fallback - create a simple linear gradient data URI
        const fallbackSvg = `<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fallback" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#4ecdc4"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#fallback)"/></svg>`
        const fallbackDataUri = `data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString('base64')}`
        selectedImages.push(fallbackDataUri)
      }
    }
    
    console.log('Generated SVG gradients:', selectedImages.length)
    
    const finalImages = selectedImages.slice(0, 5)

    // Update database with generated data
    await prisma.linkLink.update({
      where: { id: linkylinkId },
      data: {
        headerPrompt: `SVG Gradients: ${themes.join(', ')}`,
        headerImages: finalImages,
        headerImage: finalImages[0], // Auto-select first gradient
      },
    })

    return NextResponse.json({
      prompt: `SVG Gradients: ${themes.join(', ')}`,
      images: finalImages,
      selectedImage: finalImages[0],
      themes: themes,
    })

  } catch (error) {
    console.error('Generate header error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
