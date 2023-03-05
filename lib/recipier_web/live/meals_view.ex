defmodule RecipierWeb.MealsView do
  alias Recipier.Meal
  alias Recipier.Repo
  alias Recipier.Mealtime
  import Ecto.Query
  use RecipierWeb, :live_view

  def mount(%{"date" => date}, _session, socket) do
    mealtimes =
      from(mt in Mealtime, order_by: mt.order)
      |> Repo.all()

    recipes =
      from(
        m in Meal,
        where: m.date == ^date,
        join: r in assoc(m, :recipe),
        order_by: r.name,
        preload: [recipe: r]
      )
      |> Repo.all()
      |> Enum.group_by(fn m -> m.mealtime_id end, fn m -> m.recipe end)

    {
      :ok,
      assign(
        socket,
        date: date,
        recipes: recipes,
        mealtimes: mealtimes
      )
    }
  end

  def handle_event("add_recipe", %{"mealtime-id" => mealtime_id}, socket) do
    IO.puts(mealtime_id)
    {:noreply, socket}
  end
end
