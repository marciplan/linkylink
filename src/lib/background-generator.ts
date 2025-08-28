import { generateGradientSet, COLOR_PALETTES } from '@/lib/gradient-generator'
import { generateAdvancedGradientSet } from '@/lib/advanced-gradient-generator'

interface BackgroundGenerationResult {
  images: string[]
  selectedImage: string
  prompt: string
  themes: string[]
}

// Function to get AI-analyzed emoji color themes
const getEmojiColorThemes = async (emoji: string): Promise<string[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a color theme expert. Based on an emoji, suggest 3 color theme names from this exact list:
            
Available themes: warm sunset, professional, electric blue, cosmic purple, pink dawn, forest morning, earth tones, ocean depths, neon lights, golden hour, deep ocean

Return your response as a JSON object with this exact format:
{
  "suggestedThemes": ["warm sunset", "professional", "electric blue"]
}

Choose themes that match the emoji's colors, mood, or associations. For example:
- 🌅 might suggest: warm sunset, golden hour, pink dawn
- 💼 might suggest: professional, electric blue, ocean depths
- 🌳 might suggest: forest morning, earth tones, ocean depths
- 🚀 might suggest: electric blue, cosmic purple, neon lights`
          },
          {
            role: 'user',
            content: `Emoji: ${emoji}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content || ''
      
      try {
        const parsed = JSON.parse(aiResponse)
        console.log('🎨 AI Color Analysis Result:', parsed)
        return parsed.suggestedThemes || ['warm sunset', 'professional', 'electric blue']
      } catch (parseError) {
        console.error('Error parsing emoji color analysis:', parseError)
      }
    }
  } catch (error) {
    console.error('Error analyzing emoji colors:', error)
  }
  
  // Fallback to simple mapping if API fails
  return ['warm sunset', 'professional', 'electric blue']
}

export async function generateBackgroundOptions(
  title: string, 
  subtitle?: string | null, 
  selectedEmoji?: string
): Promise<BackgroundGenerationResult> {
  try {
    console.log('🎨 GENERATING BACKGROUND OPTIONS')
    console.log('Title:', title)
    console.log('Subtitle:', subtitle || 'None')
    console.log('Selected Emoji:', selectedEmoji || 'None')

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
        const fallbackDataUri = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`
        selectedImages.push(fallbackDataUri)
      }
    }
    
    console.log('Generated SVG gradients:', selectedImages.length)
    
    const finalImages = selectedImages.slice(0, 5)
    const prompt = `SVG Gradients: ${themes.join(', ')}`
    const selectedImage = finalImages[0] // Auto-select first gradient

    console.log('✅ Background generation complete:', { 
      prompt, 
      selectedImage: selectedImage?.substring(0, 50) + '...', 
      totalImages: finalImages.length 
    })

    return {
      images: finalImages,
      selectedImage,
      prompt,
      themes
    }
  } catch (error) {
    console.error('Generate background options error:', error)
    
    // Ultimate fallback
    const fallbackSvg = `<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fallback" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#4ecdc4"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#fallback)"/></svg>`
    const fallbackDataUri = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`
    
    return {
      images: [fallbackDataUri],
      selectedImage: fallbackDataUri,
      prompt: 'Fallback gradient',
      themes: ['warm sunset']
    }
  }
}