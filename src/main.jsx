import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import App from './App'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { SpeedInsights } from "@vercel/speed-insights/next"

dayjs.extend(duration)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ChakraProvider>
      <SpeedInsights />
      <App />
    </ChakraProvider>
  </StrictMode>,
)
