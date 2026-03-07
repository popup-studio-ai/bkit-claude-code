## Expected Output Verification

Following the expected structure and format patterns:

## Schema Document Quality
1. Defines all core entities with clear field names, types, and constraints (User, Recipe, Ingredient, Step, Review, Collection, MealPlan)
2. Uses consistent naming convention throughout (camelCase or snake_case, not mixed) for fields and table names
3. Primary keys and foreign keys are explicitly defined for every entity with proper referential integrity
4. Includes created_at and updated_at timestamps on all mutable entities
5. Enum types are defined for fixed-value fields (difficulty: easy/medium/hard, cuisine types, dietary tags)

## Entity Relationship Quality
6. User-to-Recipe relationship is one-to-many with author_id foreign key on Recipe
7. Recipe-to-Ingredient is one-to-many with quantity, unit, and ingredient name fields on the join
8. Recipe-to-Step is one-to-many with explicit ordering via step_number or position field
9. User-to-User follow relationship uses a self-referencing many-to-many junction table (UserFollow)
10. Collection-to-Recipe is many-to-many with a junction table preserving the order recipes were saved

## Naming Convention and Glossary Quality
11. Provides a glossary section defining domain-specific terms (Collection vs Cookbook, MealPlan vs Schedule)
12. Distinguishes between Tag (category metadata) and Recipe attributes (cooking_time, servings, difficulty)
13. Rating and Review are modeled with numeric score (1-5) and optional text body on a single entity
14. Nutritional info fields use standardized units (calories in kcal, macros in grams) with clear field names
15. MealPlan entity links User, Recipe, and a calendar date with meal_type designation (breakfast, lunch, dinner, snack)
