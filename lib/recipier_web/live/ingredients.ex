defmodule RecipierWeb.Ingredients do
  alias Recipier.Repo
  alias Recipier.Ingredient
  use RecipierWeb, :live_view

  def mount(_params, _session, socket) do
    ingredients = Repo.all(Ingredient) |> Repo.preload(:default_unit)

    {:ok, assign(socket, ingredients: ingredients)}
  end

  def handle_event("search", _params, socket) do
    {:noreply, socket}
  end
end
