import { endOfWeek, startOfWeek } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { getMeals, getMealtimes, getRecipes } from '../api.ts'

export default function Meals() {
    // Get all weekdays using date-fns
    const firstDay = startOfWeek(new Date())
    const lastDay = endOfWeek(firstDay)
    const weekdays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(firstDay)
        date.setDate(date.getDate() + i)
        return date
    })
    const mealtimesQuery = useQuery({
        queryKey: ['mealtimes'],
        queryFn: getMealtimes,
    })
    const mealQuery = useQuery({
        queryKey: ['meals', firstDay, lastDay],
        queryFn: () => getMeals(firstDay, lastDay),
    })
    const recipeQuery = useQuery({
        queryKey: ['recipes'],
        queryFn: getRecipes,
    })

    if (mealtimesQuery.isPending || mealQuery.isPending) {
        return <span>Loading...</span>
    }

    return (
        <slot>
            <h1>Meals</h1>
            <ul>
                {weekdays.map((day) => (
                    <li key={day.toISOString()}>
                        <span>{day.toDateString()}</span>
                        <ul>
                            {mealtimesQuery.data?.map((meal) => (
                                <li key={meal.id}>
                                    <span>{meal.name}</span>
                                    <select>
                                        {recipeQuery.data?.map((recipe) => (
                                            <option key={recipe.id}>
                                                {recipe.name}
                                            </option>
                                        ))}
                                    </select>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </slot>
    )
}
