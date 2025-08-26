import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { linkylinkId, title, subtitle } = await request.json()

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
      return NextResponse.json({ error: 'LinkyLink not found or access denied' }, { status: 404 })
    }

    // Generate theme variations using OpenAI GPT-4o-mini
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating color themes for abstract gradient backgrounds. Based on the given title and subtitle, suggest 5 different color themes that would complement the content. Each theme should be 2-3 words describing colors/moods (e.g., "warm sunset", "ocean depths", "forest morning", "cosmic purple", "golden hour"). Return only the themes separated by commas, no explanations.'
          },
          {
            role: 'user',
            content: `Title: "${title}"${subtitle ? `\nSubtitle: "${subtitle}"` : ''}`
          }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    })

    let themes = ['warm sunset', 'ocean depths', 'forest morning', 'cosmic purple', 'golden hour']
    
    if (openaiResponse.ok) {
      const openaiData = await openaiResponse.json()
      const themeString = openaiData.choices[0]?.message?.content || ''
      const suggestedThemes = themeString.split(',').map((t: string) => t.trim()).filter(Boolean)
      if (suggestedThemes.length >= 5) {
        themes = suggestedThemes.slice(0, 5)
      }
    }

    // Bulletproof background generation with multiple fallback layers
    const selectedImages = []
    
    console.log('Generated themes:', themes)
    
    // First attempt: Try LUMMI API with error handling and timeout
    const lummiAttempts = []
    for (const theme of themes.slice(0, 3)) { // Only try first 3 themes to save time
      try {
        const searchTerm = `gradient ${theme}`
        const lummiUrl = new URL('https://api.lummi.ai/v1/search')
        lummiUrl.searchParams.append('query', searchTerm)
        lummiUrl.searchParams.append('per_page', '2')
        lummiUrl.searchParams.append('orientation', 'landscape')

        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

        const lummiImageResponse = await fetch(lummiUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.LUMMI_API_KEY}`,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (lummiImageResponse.ok) {
          const lummiData = await lummiImageResponse.json()
          const images = lummiData.data || []
          
          // Validate images before adding
          for (const img of images) {
            if (img.url && typeof img.url === 'string' && img.url.startsWith('http')) {
              // Test if the image actually exists
              try {
                const testResponse = await fetch(img.url, { 
                  method: 'HEAD', 
                  signal: AbortSignal.timeout(2000) 
                })
                if (testResponse.ok) {
                  lummiAttempts.push(img.url)
                  break // Only take one per theme
                }
              } catch (testError) {
                console.log('LUMMI image failed validation:', img.url, testError instanceof Error ? testError.message : 'Unknown error')
                continue
              }
            }
          }
        }
      } catch (error) {
        console.log('LUMMI API error for theme', theme, ':', error instanceof Error ? error.message : 'Unknown error')
        continue
      }
    }

    // Add valid LUMMI results first
    selectedImages.push(...lummiAttempts.slice(0, 5))
    console.log('LUMMI results:', lummiAttempts.length, 'valid images')
    
    // Second layer: Curated atmospheric gradients (always reliable)
    const atmosphericGradients = [
      'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=400&fit=crop&crop=entropy&q=80', // warm sunset gradient
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop&crop=entropy&q=80', // cool blue gradient  
      'https://images.unsplash.com/photo-1519681393784-d120af497cc8?w=1200&h=400&fit=crop&crop=entropy&q=80', // purple cosmic gradient
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop&crop=entropy&q=80', // golden hour gradient
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=400&fit=crop&crop=entropy&q=80', // pink dawn gradient
      'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&h=400&fit=crop&crop=entropy&q=80', // ocean depth gradient
      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=400&fit=crop&crop=entropy&q=80', // forest morning gradient
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop&crop=entropy&q=80', // nature gradient
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop&crop=entropy&q=80', // misty gradient
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=400&fit=crop&crop=entropy&q=80', // ethereal gradient
    ]
    
    // Shuffle and fill remaining slots
    const shuffled = [...atmosphericGradients].sort(() => Math.random() - 0.5)
    
    // Fill up to 5 images total, mixing LUMMI (if any) with curated gradients
    while (selectedImages.length < 5 && shuffled.length > 0) {
      const nextGradient = shuffled.shift()
      if (nextGradient && !selectedImages.includes(nextGradient)) {
        selectedImages.push(nextGradient)
      }
    }
    
    // Third layer: Emergency fallback (should never be needed)
    if (selectedImages.length === 0) {
      selectedImages.push(
        'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=400&fit=crop&crop=entropy&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop&crop=entropy&q=80',
        'https://images.unsplash.com/photo-1519681393784-d120af497cc8?w=1200&h=400&fit=crop&crop=entropy&q=80',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop&crop=entropy&q=80',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=400&fit=crop&crop=entropy&q=80'
      )
    }
    
    console.log('Final selected images:', selectedImages.length)

    const finalImages = selectedImages.slice(0, 5)

    // Update database with generated data
    await prisma.linkLink.update({
      where: { id: linkylinkId },
      data: {
        headerPrompt: `Themed gradients: ${themes.join(', ')}`,
        headerImages: finalImages,
        headerImage: finalImages[0], // Auto-select first image
      },
    })

    return NextResponse.json({
      prompt: `Themed gradients: ${themes.join(', ')}`,
      images: finalImages,
      selectedImage: finalImages[0],
      themes: themes,
    })

  } catch (error) {
    console.error('Generate header error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}