defmodule Recipier.Repo.Migrations.Initial do
  use Ecto.Migration

  def change do
    # -------------------------------------------------------------------------
    # Mealtime
    # -------------------------------------------------------------------------

    create table(:mealtime) do
      add :name, :string, null: false
      add :order, :integer, null: false
    end

    create unique_index(:mealtime, [:name])
    create unique_index(:mealtime, [:order])

    # -------------------------------------------------------------------------
    # Recipe
    # -------------------------------------------------------------------------

    create table(:recipe) do
      add :name, :string, null: false
    end

    create unique_index(:recipe, [:name])

    # -------------------------------------------------------------------------
    # Meal
    # -------------------------------------------------------------------------

    create table(:meal) do
      add :mealtime_id, references(:mealtime), null: false
      add :recipe_id, references(:recipe), null: false

      add :date, :date, null: false
      add :scale, :integer, null: false, default: 1
    end

    create unique_index(:meal, [:mealtime_id, :recipe_id, :date])
    create constraint(:meal, :scale_must_be_positive, check: "scale > 0")

    # -------------------------------------------------------------------------
    # Unit
    # -------------------------------------------------------------------------

    create table(:unit) do
      add :name, :string, null: false
    end

    create unique_index(:unit, [:name])

    # -------------------------------------------------------------------------
    # Unit Conversion
    # -------------------------------------------------------------------------

    create table(:unit_conversion) do
      add :from_amount, :float, null: false
      add :from_unit_id, references(:unit)

      add :to_amount, :float, null: false
      add :to_unit_id, references(:unit)
    end

    create unique_index(:unit_conversion, [:from_unit_id, :to_unit_id])

    # -------------------------------------------------------------------------
    # Ingredient
    # -------------------------------------------------------------------------

    create table(:ingredient) do
      add :name, :string, null: false
      add :default_unit_id, references(:unit), null: false
    end

    create unique_index(:ingredient, [:name])
  end
end
