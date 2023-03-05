defmodule Recipier.Repo do
  use Ecto.Repo,
    otp_app: :recipier,
    adapter: Ecto.Adapters.Postgres
end

defmodule Recipier.Unit do
  use Ecto.Schema

  schema "unit" do
    field :name, :string
  end
end

defmodule Recipier.Mealtime do
  use Ecto.Schema

  schema "mealtime" do
    field :name, :string
    field :order, :integer
  end
end

defmodule Recipier.Recipe do
  use Ecto.Schema

  schema "recipe" do
    field :name, :string
  end
end

defmodule Recipier.Meal do
  use Ecto.Schema

  schema "meal" do
    field :date, :date
    field :scale, :integer
    belongs_to :mealtime, Recipier.Mealtime
    belongs_to :recipe, Recipier.Recipe
  end
end

defmodule Recipier.Ingredient do
  use Ecto.Schema

  schema "ingredient" do
    field :name, :string
    belongs_to :default_unit, Recipier.Unit
  end
end
