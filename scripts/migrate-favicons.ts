#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fetchFavicon(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/favicon?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      return data.favicon || null
    }
    return null
  } catch (error) {
    console.log(`Favicon fetch failed for ${url}:`, error)
    return null
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function migrateFavicons() {
  console.log('🚀 Starting favicon migration...')
  
  // Find all links without favicons
  const linksWithoutFavicons = await prisma.link.findMany({
    where: {
      OR: [
        { favicon: null },
        { favicon: "" }
      ]
    },
    select: {
      id: true,
      url: true,
      title: true,
      linkylink: {
        select: {
          slug: true,
          user: {
            select: {
              username: true
            }
          }
        }
      }
    }
  })
  
  console.log(`📊 Found ${linksWithoutFavicons.length} links without favicons`)
  
  if (linksWithoutFavicons.length === 0) {
    console.log('✅ All links already have favicons!')
    return
  }
  
  let processed = 0
  let updated = 0
  let failed = 0
  
  for (const link of linksWithoutFavicons) {
    try {
      console.log(`🔍 [${processed + 1}/${linksWithoutFavicons.length}] Fetching favicon for: ${link.title} (${link.url})`)
      
      const favicon = await fetchFavicon(link.url)
      
      if (favicon) {
        await prisma.link.update({
          where: { id: link.id },
          data: { favicon }
        })
        updated++
        console.log(`✅ Updated favicon for: ${link.title}`)
      } else {
        failed++
        console.log(`❌ No favicon found for: ${link.title}`)
      }
      
      processed++
      
      // Rate limiting: wait 200ms between requests to be nice to services
      await sleep(200)
      
      // Progress update every 10 items
      if (processed % 10 === 0) {
        console.log(`📈 Progress: ${processed}/${linksWithoutFavicons.length} (${updated} updated, ${failed} failed)`)
      }
      
    } catch (error) {
      failed++
      console.error(`💥 Error processing ${link.title}:`, error)
      processed++
    }
  }
  
  console.log(`\n🎉 Favicon migration completed!`)
  console.log(`📊 Total processed: ${processed}`)
  console.log(`✅ Successfully updated: ${updated}`)
  console.log(`❌ Failed: ${failed}`)
}

async function regenerateBackgrounds() {
  console.log('🎨 Starting background regeneration...')
  
  // Find linkylinks without background images
  const linkylinkWithoutBackgrounds = await prisma.linkLink.findMany({
    where: {
      OR: [
        { headerImage: null },
        { headerImage: "" }
      ]
    },
    select: {
      id: true,
      title: true,
      subtitle: true,
      avatar: true,
      user: {
        select: {
          username: true
        }
      }
    }
  })
  
  console.log(`📊 Found ${linkylinkWithoutBackgrounds.length} linkylinks without backgrounds`)
  
  if (linkylinkWithoutBackgrounds.length === 0) {
    console.log('✅ All linkylinks already have backgrounds!')
    return
  }
  
  let processed = 0
  let updated = 0
  let failed = 0
  
  for (const linkylink of linkylinkWithoutBackgrounds) {
    try {
      console.log(`🎨 [${processed + 1}/${linkylinkWithoutBackgrounds.length}] Generating background for: ${linkylink.title}`)
      
      // Import the generator functions
      const { generateEmojiSuggestions } = await import('../src/lib/emoji-generator')
      const { generateBackgroundOptions } = await import('../src/lib/background-generator')
      
      // Generate emoji if none exists
      let emoji = linkylink.avatar
      if (!emoji) {
        const emojiSuggestions = await generateEmojiSuggestions(linkylink.title, linkylink.subtitle)
        emoji = emojiSuggestions[0] || ''
      }
      
      // Generate background
      const backgroundData = await generateBackgroundOptions(linkylink.title, linkylink.subtitle, emoji)
      
      const updateData: {
        avatar?: string;
        headerImage?: string;
        headerPrompt?: string;
        headerImages?: string[];
      } = {}
      
      if (!linkylink.avatar && emoji) {
        updateData.avatar = emoji
      }
      
      if (backgroundData.selectedImage) {
        updateData.headerImage = backgroundData.selectedImage
      }
      
      if (backgroundData.prompt) {
        updateData.headerPrompt = backgroundData.prompt
      }
      
      if (backgroundData.images.length > 0) {
        updateData.headerImages = backgroundData.images
      }
      
      // Update if we have something to update
      if (Object.keys(updateData).length > 0) {
        await prisma.linkLink.update({
          where: { id: linkylink.id },
          data: updateData
        })
        updated++
        console.log(`✅ Updated background for: ${linkylink.title}`)
      } else {
        failed++
        console.log(`❌ No background generated for: ${linkylink.title}`)
      }
      
      processed++
      
      // Rate limiting: wait 1 second between background generations (they're more expensive)
      await sleep(1000)
      
      // Progress update every 5 items
      if (processed % 5 === 0) {
        console.log(`📈 Progress: ${processed}/${linkylinkWithoutBackgrounds.length} (${updated} updated, ${failed} failed)`)
      }
      
    } catch (error) {
      failed++
      console.error(`💥 Error processing ${linkylink.title}:`, error)
      processed++
    }
  }
  
  console.log(`\n🎉 Background regeneration completed!`)
  console.log(`📊 Total processed: ${processed}`)
  console.log(`✅ Successfully updated: ${updated}`)
  console.log(`❌ Failed: ${failed}`)
}

async function main() {
  try {
    const args = process.argv.slice(2)
    const command = args[0] || 'all'
    
    switch (command) {
      case 'favicons':
        await migrateFavicons()
        break
      case 'backgrounds':
        await regenerateBackgrounds()
        break
      case 'all':
      default:
        await migrateFavicons()
        console.log('\n' + '='.repeat(50) + '\n')
        await regenerateBackgrounds()
        break
    }
    
    console.log('\n🎊 All migrations completed successfully!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()