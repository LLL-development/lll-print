import AppRouter from './app/AppRouter'
import QueryProvider from './app/QueryProvider'
import { SyntheticStoreProvider } from './context/SyntheticStoreContext'
import './App.css'

export default function App() {
  return (
    <QueryProvider>
      <SyntheticStoreProvider>
        <AppRouter />
      </SyntheticStoreProvider>
    </QueryProvider>
  )
}
