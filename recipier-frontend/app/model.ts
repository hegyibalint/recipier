// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface Ingredient {
    id: number;
    name: string;
    description: string;
}

export interface Unit {
    id: number;
    type: "VOLUME" | "WEIGHT" | "QUANTITY";
    name: string;
    abbreviation: string;
    description: string;
}