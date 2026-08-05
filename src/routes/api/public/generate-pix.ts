import { createFileRoute } from '@tanstack/react-router'
import { generatePixQrCode } from '@/lib/freepay.functions'

export const Route = createFileRoute('/api/public/generate-pix')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const data = await request.json()
          const result = await generatePixQrCode({ data })
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
          })
        } catch (error: any) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
