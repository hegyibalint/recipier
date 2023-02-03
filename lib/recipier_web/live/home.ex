defmodule RecipierWeb.Home do
  use RecipierWeb, :live_view

  def mount(_params, _session, socket) do
    today = Date.utc_today()

    days =
      Date.range(
        Date.beginning_of_week(today),
        Date.end_of_week(today)
      )

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

    {:ok, assign(socket, days: days, mealtimes: mealtimes)}
  end

  def handle_event("toggle", %{days: days}, socket) do
    {:noreply, assign(socket, :days, days)}
  end

  defp format_date_segments(number) do
    number
    |> Integer.to_string()
    |> String.pad_leading(2, "0")
  end
end
