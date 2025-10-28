import WorldMap from '@/components/WorldMap'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#4A90E2] flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        <WorldMap />
      </div>
    </main>
  )
}
