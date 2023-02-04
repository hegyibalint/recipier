defmodule RecipierWeb.Home do
  use RecipierWeb, :live_view

  def mount(_params, _session, socket) do
    start_day = Date.beginning_of_week(Date.utc_today())
    weekdays = get_weekdays(start_day)

    mealtimes = [
      %{
        "order" => 1,
        "name" => "Breakfast"
      },
      %{
        "order" => 2,
        "name" => "Lunch"
      },
      %{
        "order" => 3,
        "name" => "Dinner"
      }
    ]

    {:ok, assign(socket, start_day: start_day, weekdays: weekdays, mealtimes: mealtimes)}
  end

  def handle_event("page_up", params, socket) do
    %{assigns: %{start_day: start_day}} = socket
    new_start_day = Date.add(start_day, 7)

    {:noreply, assign(socket, start_day: new_start_day, weekdays: get_weekdays(new_start_day))}
  end

  def handle_event("page_down", params, socket) do
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

  defp format_date_segments(number) do
    number
    |> Integer.to_string()
    |> String.pad_leading(2, "0")
  end
end
