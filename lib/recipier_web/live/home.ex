defmodule RecipierWeb.Home do
  alias Recipier.Meal
  alias Recipier.Mealtime
  alias Recipier.Repo
  import Ecto.Query
  use RecipierWeb, :live_view

  def mount(_params, _session, socket) do
    today = Date.utc_today()
    start_day = Date.beginning_of_week(today)
    end_day = Date.end_of_week(today)
    weekdays = get_weekdays(start_day)

    mealtimes =
      from(mt in Mealtime, order_by: mt.order)
      |> Repo.all()

    meals =
      from(m in Meal,
        where: m.date >= ^start_day,
        where: m.date <= ^end_day
      )
      |> Repo.all()
      |> Repo.preload(:recipe)

    {:ok,
     assign(
       socket,
       today: today,
       start_day: start_day,
       weekdays: weekdays,
       mealtimes: mealtimes,
       meals: meals
     )}
  end

  def handle_event("page_up", _params, socket) do
    %{assigns: %{start_day: start_day}} = socket
    new_start_day = Date.add(start_day, 7)

    {:noreply, assign(socket, start_day: new_start_day, weekdays: get_weekdays(new_start_day))}
  end

  def handle_event("page_down", _params, socket) do
    %{assigns: %{start_day: start_day}} = socket
    new_start_day = Date.add(start_day, -7)

    {:noreply, assign(socket, start_day: new_start_day, weekdays: get_weekdays(new_start_day))}
  end

  defp get_weekdays(start_day) do
    Date.range(
      Date.beginning_of_week(start_day),
      Date.end_of_week(start_day)
    )
  end

  defp filter_meals(meals, day, mealtime) do
    for meal <- meals,
        meal.mealtime_id == mealtime.id,
        meal.date == day,
        do: meal
  end
end
