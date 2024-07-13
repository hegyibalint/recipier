import {Ingredient} from "~/api/model/model/Ingredient";

export async function ingredientsLike(name: string): Promise<Ingredient[]> {
    //const response = await fetch(`/api/ingredient/like/${name}`);
    //return await response.json();
    console.log(`ingredientsLike: ${name}`);
    const ingredients: Ingredient[] = await fetch(`/ingredients/like/${name}`)
}