# Recipier (backend)

- Gradle build system
- Java 21
- Spring as the main framework
- Very simple, ORM-less, JDBI-based approach

## DTOs
DTOs should be represented as a Java record, and should be independent from each other.
Each DTO is represented by the following format:
 1. The HTTP method it is received/sent (Get, Post, Delete, ...)
 2. The name of the object represented (Recipe, Unit, Ingredient, ...)
 3. (Optional) The name of the sub-object represented. 
    For example: `GetIngredient` wants to send it's representation of a unit.
    In this case, a `GetIngredientUnit` should be created, independent of any other DTOs.