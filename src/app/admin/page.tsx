"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Image, Link, Zap, LucideIcon } from "lucide-react"

interface MigrationResult {
  type?: string
  processed?: number
  updated?: number
  failed?: number
  error?: string
  message?: string
  favicons?: {
    processed: number
    updated: number
    failed: number
  }
  backgrounds?: {
    processed: number
    updated: number
    failed: number
  }
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [results, setResults] = useState<MigrationResult | null>(null)

  const runMigration = async (type: 'favicons' | 'backgrounds' | 'all') => {
    setIsLoading(type)
    setResults(null)
    
    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Migration failed')
      }
      
      const result = await response.json()
      setResults(result)
    } catch (error) {
      console.error('Migration error:', error)
      setResults({ error: error instanceof Error ? error.message : 'Unknown error occurred' })
    } finally {
      setIsLoading(null)
    }
  }

  const MigrationButton = ({ 
    type, 
    title, 
    description, 
    icon: Icon 
  }: { 
    type: 'favicons' | 'backgrounds' | 'all'
    title: string
    description: string
    icon: LucideIcon
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => runMigration(type)}
          disabled={isLoading !== null}
          className="w-full"
        >
          {isLoading === type ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            `Run ${title}`
          )}
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bundel Admin
          </h1>
          <p className="text-gray-600">
            Manage and migrate your Bundel data
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MigrationButton
            type="favicons"
            title="Migrate Favicons"
            description="Update all links missing favicons with proper website icons"
            icon={Link}
          />
          
          <MigrationButton
            type="backgrounds"
            title="Regenerate Backgrounds"
            description="Generate background images for linkylinks without them"
            icon={Image}
          />
          
          <MigrationButton
            type="all"
            title="Run All Migrations"
            description="Run both favicon and background migrations together"
            icon={Zap}
          />
        </div>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  <strong>Error:</strong> {results.error}
                </div>
              ) : (
                <div className="space-y-4">
                  {results.type && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-800 mb-2">
                        {results.type === 'favicons' ? 'Favicon Migration' : 'Background Generation'} Complete
                      </h3>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>📊 Total processed: {results.processed}</p>
                        <p>✅ Successfully updated: {results.updated}</p>
                        <p>❌ Failed: {results.failed}</p>
                      </div>
                    </div>
                  )}
                  
                  {results.favicons && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-800 mb-2">Favicon Migration</h3>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p>📊 Total processed: {results.favicons.processed}</p>
                        <p>✅ Successfully updated: {results.favicons.updated}</p>
                        <p>❌ Failed: {results.favicons.failed}</p>
                      </div>
                    </div>
                  )}
                  
                  {results.backgrounds && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-800 mb-2">Background Generation</h3>
                      <div className="text-sm text-purple-700 space-y-1">
                        <p>📊 Total processed: {results.backgrounds.processed}</p>
                        <p>✅ Successfully updated: {results.backgrounds.updated}</p>
                        <p>❌ Failed: {results.backgrounds.failed}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <h3 className="font-medium mb-2">Usage Instructions:</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Migrate Favicons:</strong> Updates all links without favicons</li>
            <li><strong>Regenerate Backgrounds:</strong> Creates background images for linkylinks missing them</li>
            <li><strong>Run All:</strong> Executes both migrations sequentially</li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> Migrations include rate limiting to be respectful to external services.
            Favicon migration: ~200ms delay between requests. Background generation: ~1s delay between requests.
          </p>
        </div>
      </div>
    </div>
  )
}
