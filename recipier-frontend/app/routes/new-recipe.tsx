import {useState} from "react";
import {CreateRecipeStep} from "~/model/RecipeStep";
import {FullScreenPopup} from "~/components/popup/FullScreenPopup";
import {RecipeIngredient} from "~/model/model/RecipeIngredient";
import {IngredientPopupContent} from "~/components/popup/IngredientPopupContent";


export default function NewRecipe() {
    const [ingredientPopupEnabled, setIngredientPopupEnabled] = useState(false);
    const [steps, setSteps] = useState<CreateRecipeStep[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

    function addIngredient() {
        setIngredientPopupEnabled(true);
    }

    function addStep() {
        setSteps([...steps, {
            description: ""
        }]);
    }

    function renderStep(index: number, step: CreateRecipeStep) {
        return <div>
            <label htmlFor={`step-${index}`}>Step {index + 1}</label>
            <textarea id={`step-${index}`} on>
            </textarea>
        </div>
    }

    return <div>
        <FullScreenPopup enabled={ingredientPopupEnabled}>
            <IngredientPopupContent />
        </FullScreenPopup>

        <h1>Create a Recipe</h1>
        <form>
            <label htmlFor="title">Title</label>
            <input type="text" id="title"/>
            <label htmlFor="description">Description</label>
            <textarea id="description"></textarea>
            <button type="submit">Create</button>

            <h2>Steps</h2>
            <ul>
                {
                    steps.map((step, index) => {
                        return <li key={index}>
                            {renderStep(index, step)}
                        </li>
                    })
                }
            </ul>

            <button type="button" onClick={addIngredient}>Add Ingredient</button>
            <button type="button" onClick={addStep}>Add Step</button>
        </form>
    </div>
}