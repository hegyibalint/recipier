import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './routes/Home.tsx'
import NewRecipe from './routes/NewRecipe.tsx'

import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewIngredient from './routes/NewIngredient.tsx'
import NewUnit from './routes/NewUnit.tsx'
import Meals from './routes/Meals.tsx'

const router = createBrowserRouter([
    {
        path: '/',
        element: <Home />,
    },
    {
        path: '/meals',
        element: <Meals />,
    },
    {
        path: '/new-recipe',
        element: <NewRecipe />,
    },
    {
        path: '/new-ingredient',
        element: <NewIngredient />,
    },
    {
        path: '/new-unit',
        element: <NewUnit />,
    },
])

// Create a client
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </React.StrictMode>,
)
