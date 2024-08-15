export interface Ingredient {
    id: string
    name: string
    description: string
}

export type UnitType = 'VOLUME' | 'WEIGHT' | 'QUANTITY'

export interface Unit {
    id: string
    type: UnitType
    name: string
    abbreviation: string
    description: string
}

export interface Mealtime {
    id: number
    sequence: number
    name: string
    description: string
}

export interface Meal {
    id: number
    mealtime_id: number
    recipe_id: number
}

export interface Recipe {
    id: number
    name: string
}
