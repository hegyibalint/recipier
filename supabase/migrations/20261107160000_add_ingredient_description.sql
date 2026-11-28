-- Extend the v1 shape without requiring changes to existing recipe documents.
alter table public.recipes
  drop constraint recipes_document_v1,
  add constraint recipes_document_v1 check (
    extensions.jsonb_matches_schema(
      $recipe_schema$
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:recipier:schema:recipe:1",
  "title": "Recipe",
  "description": "The agent-friendly format of a recipe.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "title",
    "subtitle",
    "description",
    "ingredients",
    "components"
  ],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "subtitle": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "description": {
      "type": "string",
      "minLength": 1,
      "pattern": "\\S"
    },
    "yield": {
      "$ref": "#/$defs/yield"
    },
    "ingredients": {
      "description": "Recipe-wide ingredient definitions.",
      "type": "array",
      "uniqueItems": true,
      "items": {
        "$ref": "#/$defs/ingredient"
      }
    },
    "components": {
      "type": "array",
      "minItems": 1,
      "items": {
        "$ref": "#/$defs/component"
      }
    }
  },
  "$defs": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$"
    },
    "yield": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "amount",
        "unit"
      ],
      "properties": {
        "amount": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "unit": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "ingredient": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "name"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/id"
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string",
          "minLength": 1,
          "pattern": "\\S"
        }
      }
    },
    "step": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "text"
      ],
      "properties": {
        "text": {
          "description": "Flowing instruction text using the Recipier template format.",
          "type": "string",
          "minLength": 1,
          "format": "recipier-template-v1"
        }
      }
    },
    "component": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "id",
        "steps"
      ],
      "properties": {
        "id": {
          "description": "A stable identifier for this component within the recipe.",
          "$ref": "#/$defs/id"
        },
        "title": {
          "type": "string",
          "minLength": 1
        },
        "yield": {
          "$ref": "#/$defs/yield"
        },
        "depends_on": {
          "description": "Component IDs that must be completed before this component.",
          "type": "array",
          "uniqueItems": true,
          "items": {
            "$ref": "#/$defs/id"
          }
        },
        "steps": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/step"
          }
        }
      }
    }
  }
}
$recipe_schema$::json,
      document
    )
  );
