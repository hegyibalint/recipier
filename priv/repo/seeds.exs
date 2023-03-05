# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Recipier.Repo.insert!(%Recipier.SomeSchema{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

import Ecto.Query

alias Recipier.Unit
alias Recipier.Repo

alias Recipier.Mealtime
alias Recipier.Recipe
alias Recipier.Meal
alias Recipier.Ingredient

# -----------------------------------------------------------------------------
# Unit
# -----------------------------------------------------------------------------

Repo.insert!(
  %Unit{
    name: "pc"
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Unit{
    name: "gram"
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Unit{
    name: "cup"
  },
  on_conflict: :nothing
)

units =
  Unit
  |> select([u], {u.name, u})
  |> Repo.all()
  |> Enum.into(%{})

# -----------------------------------------------------------------------------
# Mealtime
# -----------------------------------------------------------------------------

Repo.insert!(
  %Mealtime{
    name: "Dinner",
    order: 3
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Mealtime{
    name: "Lunch",
    order: 2
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Mealtime{
    name: "Breakfast",
    order: 1
  },
  on_conflict: :nothing
)

mealtimes =
  Mealtime
  |> Repo.all()

# -----------------------------------------------------------------------------
# Recipe
# -----------------------------------------------------------------------------

Repo.insert!(
  %Recipe{
    name: "Apple Pie"
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Recipe{
    name: "Banana Pudding"
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Recipe{
    name: "Carrot Cake"
  },
  on_conflict: :nothing
)

recipes =
  Recipe
  |> Repo.all()

# -----------------------------------------------------------------------------
# Meal
# -----------------------------------------------------------------------------

today = Date.utc_today()

day_range =
  Date.range(
    Date.add(today, -7),
    Date.add(today, 7)
  )

meals =
  for d <- day_range, m <- mealtimes, r <- recipes do
    IO.inspect(d)
    IO.inspect(m)
    IO.inspect(r)

    Repo.insert!(
      %Meal{
        date: d,
        mealtime: m,
        recipe: r
      },
      on_conflict: :nothing
    )
  end

# -----------------------------------------------------------------------------
# Ingredient
# -----------------------------------------------------------------------------

IO.inspect(units["pc"].id)

Repo.insert!(
  %Ingredient{
    name: "Apple",
    default_unit: units["pc"]
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Ingredient{
    name: "Banana",
    default_unit: units["cup"]
  },
  on_conflict: :nothing
)

Repo.insert!(
  %Ingredient{
    name: "Carrot",
    default_unit: units["gram"]
  },
  on_conflict: :nothing
)
