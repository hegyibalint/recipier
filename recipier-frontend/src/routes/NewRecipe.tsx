import { useMutation, useQuery } from '@tanstack/react-query'
import { getIngredients, getUnits } from '../api.ts'
import { useFieldArray, useForm } from 'react-hook-form'
import { useEffect } from 'react'

type NewRecipeIngredient = {
    ingredientId?: string
    unitId?: string
    quantity?: number
}

type NewRecipeStep = {
    description?: string
}

type NewRecipe = {
    name?: string
    description?: string
    recipeIngredients: NewRecipeIngredient[]
    steps: NewRecipeStep[]
}

export default function NewRecipe() {
    const updateRecipe = useMutation<any, any, NewRecipe>({
        mutationFn: async (newRecipe) => {
            const request = await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRecipe),
            })
            return await request.json()
        },
    })

    const ingredientQuery = useQuery({
        queryKey: ['ingredients'],
        queryFn: getIngredients,
    })
    const unitsQuery = useQuery({
        queryKey: ['units'],
        queryFn: getUnits,
    })

    const storedForm = sessionStorage.getItem('new-recipe/form')
    const defaultValues: NewRecipe = storedForm
        ? JSON.parse(storedForm)
        : {
              recipeIngredients: [],
              steps: [],
          }

    const { register, control, handleSubmit, watch } = useForm<NewRecipe>({
        defaultValues,
    })
    const {
        fields: ingredientFields,
        append: appendIngredient,
        remove: removeIngredient,
    } = useFieldArray({
        control,
        name: 'recipeIngredients',
    })
    // Field array for recipe steps
    const {
        fields: stepsFields,
        append: appendStep,
        remove: removeStep,
    } = useFieldArray({
        control,
        name: 'steps',
    })

    useEffect(() => {
        const subscription = watch((data) => {
            sessionStorage.setItem('new-recipe/form', JSON.stringify(data))
            console.log(data)
        })
        return () => subscription.unsubscribe()
    }, [watch])

    function onSubmit(data: NewRecipe) {
        // display form data on success
        console.log(data)
        updateRecipe.mutate(data)
    }

    function renderIngredientFormElements() {
        if (
            ingredientQuery.status !== 'success' ||
            unitsQuery.status !== 'success'
        ) {
            return <span>Loading you favourite ingredients...</span>
        } else {
            return (
                <slot>
                    {ingredientFields.map((field, index) => (
                        <div key={field.id}>
                            <select
                                {...register(
                                    `recipeIngredients.${index}.ingredientId`,
                                )}
                            >
                                {ingredientQuery.data.map((ingredient) => (
                                    <option
                                        key={ingredient.id}
                                        value={ingredient.id}
                                    >
                                        {ingredient.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                {...register(
                                    `recipeIngredients.${index}.quantity`,
                                )}
                            />
                            <select
                                {...register(
                                    `recipeIngredients.${index}.unitId`,
                                )}
                            >
                                {unitsQuery.data.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => removeIngredient(index)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() =>
                            appendIngredient({
                                ingredientId: ingredientQuery.data[0].id,
                                unitId: unitsQuery.data[0].id,
                                quantity: 0,
                            })
                        }
                    >
                        Add Ingredient
                    </button>
                </slot>
            )
        }
    }

    function renderStepFormElements() {
        return (
            <slot>
                {stepsFields.map((field, index) => (
                    <div key={field.id}>
                        <textarea {...register(`steps.${index}.description`)} />
                        <button type="button" onClick={() => removeStep(index)}>
                            Delete
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => appendStep({ description: '' })}
                >
                    Add Step
                </button>
            </slot>
        )
    }

    return (
        <slot>
            <h1>New Recipe!</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
                <input placeholder="Recipe's name" {...register('name')} />
                <textarea
                    placeholder="Recipe's description"
                    {...register('description')}
                />
                <hr />
                <h2>Ingredients</h2>
                {renderIngredientFormElements()}
                <hr />
                <h2>Steps</h2>
                {renderStepFormElements()}
                <button type="submit">Submit</button>
            </form>
        </slot>
    )
}
