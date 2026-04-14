import { useState } from 'react'
import Layout from './components/Layout'
import OrderList from './pages/OrderList'
import OrderForm from './pages/OrderForm'
import OrderView from './pages/OrderView'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState({ name: 'list' })

  const navigate = (name, order = null) => setScreen({ name, order })

  return (
    <Layout>
      {screen.name === 'list' && <OrderList onNavigate={navigate} />}
      {screen.name === 'create' && <OrderForm mode="create" onNavigate={navigate} />}
      {screen.name === 'edit' && <OrderForm mode="edit" order={screen.order} onNavigate={navigate} />}
      {screen.name === 'view' && <OrderView order={screen.order} onNavigate={navigate} />}
    </Layout>
  )
}
