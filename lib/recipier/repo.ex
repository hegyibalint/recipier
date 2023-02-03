defmodule Recipier.Repo do
  use Ecto.Repo,
    otp_app: :recipier,
    adapter: Ecto.Adapters.Postgres
end
