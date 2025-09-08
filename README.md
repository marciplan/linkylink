# Bundel - Beautiful Link Sharing

A mobile-first web app for creating and sharing beautiful link collections. Perfect for social media bios, portfolios, and resource collections.

## Features

- 🎨 Beautiful mobile-first design with stunning gradients
- 🔗 Create multiple link collections (Bundels)
- 📱 Fully responsive and optimized for mobile
- 🖼️ Dynamic social media cards (OG images)
- 🔒 Secure authentication with Auth.js
- ⚡ Built with Next.js 15 and React Server Components
- 🎯 SEO optimized
- 📊 View and click tracking

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Database:** Neon (Serverless PostgreSQL)
- **ORM:** Prisma
- **Authentication:** Auth.js (NextAuth v5)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Neon database account (free tier available at [neon.tech](https://neon.tech))

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd linkylink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Neon Database**
   - Create a free account at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy your database connection string

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Copy your Neon database URL here
   DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
   
   # Generate a secret with: openssl rand -base64 32
   NEXTAUTH_SECRET="your-generated-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # For production deployment
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
   ```

5. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your environment variables:
   - `DATABASE_URL` - Your Neon connection string
   - `NEXTAUTH_SECRET` - Your generated secret
   - `NEXTAUTH_URL` - Your production URL (e.g., https://yourdomain.com)
   - `NEXT_PUBLIC_APP_URL` - Same as NEXTAUTH_URL
4. Deploy!

## Project Structure

```
src/
├── app/                  # Next.js app router pages
│   ├── [username]/      # Public Bundel pages
│   ├── api/             # API routes
│   ├── create/          # Create new Bundel
│   ├── dashboard/       # User dashboard
│   ├── directory/       # Browse public Bundels
│   ├── edit/           # Edit Bundel
│   ├── login/          # Login page
│   └── register/       # Registration page
├── components/          # React components
├── lib/                # Utilities and configurations
│   ├── actions.ts      # Server actions
│   ├── auth.ts        # Auth.js configuration
│   ├── prisma.ts      # Prisma client
│   └── utils.ts       # Utility functions
└── types/              # TypeScript type definitions
```

## Usage

1. **Create an account** - Sign up with your email
2. **Create a Bundel** - Give it a title and optional subtitle
3. **Add links** - Add as many links as you want
4. **Share** - Share your Bundel URL anywhere
5. **Track views** - See how many people view your links

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
