import {ChangeEvent, useEffect, useLayoutEffect, useState} from "react";
import {getIngredients, getUnits} from "~/api";
import {Form, json, useFetcher, useLoaderData, useSubmit} from "@remix-run/react";
import {ActionFunctionArgs} from "@remix-run/node";

export interface NewRecipe {
    name?: string;
    ingredients: {
        ingredient_id: number,
        unit_id: number,
        quantity: number,
    }[],
    steps: {
        description: string
    }[];
}

export async function loader() {
    const [ingredients, units] = await Promise.all([
        getIngredients(),
        getUnits()
    ])
    return json({
        ingredients: ingredients,
        units: units
    })
}

export async function action({request}: ActionFunctionArgs) {
    const body = await request.json()
    console.log(`Received recipe: ${JSON.stringify(body)}`)
}

function recoverRecipe(): NewRecipe | null {
    const recipe = sessionStorage.getItem("new-recipe/recipe")
    if (recipe) {
        console.log(`Recovered recipe: ${recipe}`)
        return JSON.parse(recipe)
    } else {
        console.log("No recipe to recover")
        return null
    }
}

function saveRecipe(recipe: NewRecipe | null) {
    if (recipe !== null) {
        sessionStorage.setItem("new-recipe/recipe", JSON.stringify(recipe))
        console.log(`Saved recipe: ${JSON.stringify(recipe)}`)
    }
}

export default function NewRecipePage() {
    const fetcher = useFetcher();
    const data = useLoaderData<typeof loader>()
    const [recipe, setRecipe] = useState<NewRecipe>({
        ingredients: [],
        steps: []
    })
    useLayoutEffect(() => {
        const recoveredRecipe = recoverRecipe()
        if (recoveredRecipe) {
            setRecipe(recoveredRecipe)
        }
    }, [])
    useEffect(() => {
        saveRecipe(recipe)
    }, [recipe])

    function setName(e: ChangeEvent<HTMLInputElement>) {
        setRecipe({...recipe, name: e.target.value})
    }

    function addNewIngredient() {
        console.log("Adding new ingredient")
        setRecipe({
            ...recipe,
            ingredients: [
                ...recipe.ingredients,
                {
                    ingredient_id: data.ingredients[0].id,
                    unit_id: data.units[0].id,
                    quantity: 1,
                }
            ]
        })
    }

    if (recipe === null) return <div>Recovering your recipe...</div>;

    function setRecipeIngredientIngredient(index: number, ingredient_id: number) {
        const newIngredients = [...recipe.ingredients]
        newIngredients[index].ingredient_id = ingredient_id
        setRecipe({...recipe, ingredients: newIngredients})
    }

    function setRecipeIngredientQuantity(i: number, quantity: number) {
        const newIngredients = [...recipe.ingredients]
        newIngredients[i].quantity = quantity
        setRecipe({...recipe, ingredients: newIngredients})
    }

    function setRecipeIngredientUnit(i: number, unit_id: number) {
        const newIngredients = [...recipe.ingredients]
        newIngredients[i].unit_id = unit_id
        setRecipe({...recipe, ingredients: newIngredients})
    }

    function submitRecipeData() {
        console.log("Submitting form")
        submit(recipe, {
            method: 'POST',
            encType: "application/json"
        })
    }

    return <div>
        <Form method="post" onSubmit={submitRecipeData}>
            <input type="text" placeholder="Recipe name" onChange={setName} value={recipe.name}/>
            <hr/>
            <div>
                {
                    recipe.ingredients.map((ingredient, i) =>
                        <div key={`recipe-ingredient-${i}`}>
                            <select
                                name="ingredient_id"
                                value={ingredient.ingredient_id}
                                onChange={(e) => setRecipeIngredientIngredient(i, Number(e.target.value))}
                            >
                                {data.ingredients.map(ingredient => {
                                    return <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
                                })}
                            </select>
                            <input name="quantity"
                                   type="text"
                                   placeholder="Amount"
                                   value={ingredient.quantity}
                                   onChange={(e) => setRecipeIngredientQuantity(i, Number(e.target.value))}
                            />
                            <select
                                name="unit_id"
                                value={ingredient.unit_id}
                                onChange={(e) => setRecipeIngredientUnit(i, Number(e.target.value))}
                            >
                                {data.units.map((unit) => {
                                    return <option key={unit.id} value={unit.id}>{unit.name}</option>
                                })}
                            </select>
                        </div>
                    )
                }
                <button type="button" onClick={addNewIngredient}>Add ingredient</button>
            </div>
            <button type="submit">Save</button>
        </Form>
    </div>
}