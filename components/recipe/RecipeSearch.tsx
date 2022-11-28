'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import RecipeOption from './RecipeOption';

const fetcher = (url) => fetch(url).then((r) => r.json());

function addRecipe(recipe: { id: number; name: string }) {}

function removeRecipe() {}

export default function RecipeSearch(props) {
  const [search, setSearch] = useState('');
  const { data, error } = useSWR(
    search && search.length > 0
      ? `/api/recipes/search?q=${search}`
      : '/api/recipes',
    fetcher,
    {
      fallbackData: [],
    }
  );

  console.log(data);
  return (
    <div className="w-full">
      <p>Search: {search}</p>
      <input
        className="border-2 border-black w-full"
        type="text"
        onChange={(e) => setSearch(e.target.value)}
      />
      {data &&
        data.map((recipe) => (
          <RecipeOption
            key={recipe.id}
            name={recipe.name}
            type={'ADD'}
            onClick={() => addRecipe(recipe)}
          />
        ))}
    </div>
  );
}
