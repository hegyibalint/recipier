import {Ingredient, Unit} from "~/model";
import {Response} from "@remix-run/web-fetch";

export async function getIngredients(): Promise<Ingredient[]> {
    const response = await fetch('http://localhost:8080/ingredients')
    if (response.ok) {
        return await response.json()
    } else {
        throw new Error("Failed to get ingredients")
    }
}

export async function getUnits(): Promise<Unit[]> {
    const response = await fetch('http://localhost:8080/units')
    if (response.ok) {
        return await response.json()
    } else {
        throw new Error("Failed to get units")
    }
}

export async function postRecipeFromFormData(formData: FormData): Promise<Response> {
    const name = formData.get("name") as string

}