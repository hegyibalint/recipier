import { Ingredient, Unit, Mealtime, Meal } from './model.ts'
import { formatDate, formatISO } from 'date-fns'

export async function getIngredients(): Promise<Ingredient[]> {
    const request = await fetch('/api/ingredients')
    return await request.json()
}

export async function getUnits(): Promise<Unit[]> {
    const request = await fetch('/api/units')
    return await request.json()
}

export async function getMeals(from: Date, to: Date): Promise<Meal[]> {
    const fromStamp = formatISO(from, { representation: 'date' })
    const toStamp = formatISO(to, { representation: 'date' })

    const request = await fetch(`/api/meals?from=${fromStamp}&to=${toStamp}`)
    return await request.json()
}

export async function getMealtimes(): Promise<Mealtime[]> {
    const request = await fetch('/api/mealtimes')
    return await request.json()
}

export async function getRecipes(): Promise<Recipe[]> {
    const request = await fetch('/api/recipes')
    return await request.json()
}
