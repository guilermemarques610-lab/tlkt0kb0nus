import { createFileRoute } from '@tanstack/react-router'
import { generatePixQrCode } from '@/lib/freepay.functions'

export const Route = createFileRoute('/api/public/generate-pix')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const data = await request.json()
          console.log("Recebendo dados para geração de PIX:", data)
          
          // Chama o handler da server function diretamente para evitar problemas de roteamento interno
          const result = await generatePixQrCode({ data })
          
          console.log("Resultado da geração:", result)
          
          return new Response(JSON.stringify(result), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          })
        } catch (error: any) {
          console.error("Erro no handler da API:", error)
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      }
    }
  }
})
