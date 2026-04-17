import { readFileSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'

const execAsync = promisify(exec)

interface D1Database {
  binding: string
  database_name: string
  database_id: string
}

interface WranglerConfig {
  d1_databases: D1Database[]
}

const runCommand = async (command: string) => {
  try {
    await execAsync(command)
  } catch (error) {
    if (error && typeof error === 'object' && 'stdout' in error && typeof error.stdout === 'string' && error.stdout.trim()) {
      console.error(error.stdout)
    }

    if (error && typeof error === 'object' && 'stderr' in error && typeof error.stderr === 'string' && error.stderr.trim()) {
      console.error(error.stderr)
    }

    throw error
  }
}

async function migrate() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2)
    const mode = args[0]

    if (!mode || !['local', 'remote'].includes(mode)) {
      console.error('Error: Please specify mode (local or remote)')
      process.exit(1)
    }

    // Read wrangler.json
    const wranglerPath = join(process.cwd(), 'wrangler.json')
    let wranglerContent: string
    
    try {
      wranglerContent = readFileSync(wranglerPath, 'utf-8')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error('Error: wrangler.json not found')
      process.exit(1)
    }

    // Parse wrangler.json
    const config = JSON.parse(wranglerContent) as WranglerConfig
    
    if (!config.d1_databases?.[0]?.database_name) {
      console.error('Error: Database name not found in wrangler.json')
      process.exit(1)
    }

    const dbName = config.d1_databases[0].database_name

    // Generate migrations
    console.log('Generating migrations...')
    await runCommand('pnpm exec drizzle-kit generate')
    
    // Applying migrations
    console.log(`Applying migrations to ${mode} database: ${dbName}`)
    await runCommand(`pnpm exec wrangler d1 migrations apply ${dbName} --${mode} --config wrangler.json`)

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
