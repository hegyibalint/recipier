import {useRef, useState} from "react";
import {Ingredient} from "~/model/model/Ingredient";
import {ingredientsLike} from "~/api";


export function IngredientPopupContent() {
    const queryDebounceId = useRef<number | null>(null);
    const [matchingIngredients, setMatchingIngredients] = useState<Ingredient[]>([]);

    const setQuery = (query: string) => {
        if (!query) {
            setMatchingIngredients([]);
            return;
        } else {
            if (queryDebounceId.current) {
                window.clearTimeout(queryDebounceId.current);
            }
            queryDebounceId.current = window.setTimeout( async () => {
                const ingredients = await ingredientsLike(query)
                setMatchingIngredients(ingredients);
            }, 500)
        }
    }

    return <div>
        <h1>Ingredient Popup 2</h1>
        <input type="text" placeholder="Ingredient Name" onChange={(e) => setQuery(e.target.value)}/>

        <div>
            {
                matchingIngredients.map((ingredient, index) => {
                    return <div key={index}>
                        {ingredient.name}
                    </div>
                })
            }
        </div>
    </div>
}