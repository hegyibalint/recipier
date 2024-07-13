import {ReactNode} from "react";

export interface IngredientPopupProps {
    enabled: boolean;
    children: ReactNode;
}

export function FullScreenPopup(props: IngredientPopupProps) {
    if (!props.enabled) {
        return null;
    }

    return <div className="full-popup">
        <div className="">
            {props.children}
        </div>
    </div>
}