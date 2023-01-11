import { Meal, Mealtime, Recipe } from '@prisma/client';
import { differenceInCalendarWeeks, eachDayOfInterval, format, formatISO, isToday } from 'date-fns';
import CalendarPagerButton from '../PagerButton';
import { trpc } from '../../utils/trpc';

interface CalendarDayMealtimeProps {
  mealtime: Mealtime;
  meals: Meal[];
  recipes: Recipe[];
}

function CalendarDayMealtime(props: CalendarDayMealtimeProps) {
  const mealtimeMeals = props.meals.filter((meal) => meal.mealtimeId === props.mealtime.id);

  return (
    <div className="text-center">
      <p className="font-bold underline">{props.mealtime.name}</p>
      <div>
        {mealtimeMeals.length ? (
          mealtimeMeals
            .map((meal) => ({
              meal: meal,
              recipe: props.recipes.find((recipe) => recipe.id === meal.recipeId) || { id: -1, name: 'unknown' },
            }))
            .sort((a, b) => a.recipe.name.localeCompare(b.recipe.name))
            .map((mealAndRecipe) => (
              <div key={mealAndRecipe.recipe.id} className="w-full flex flex-row gap-1">
                <p>{mealAndRecipe.recipe.name}</p>
              </div>
            ))
        ) : (
          <p className="text-gray-500">-</p>
        )}
      </div>
    </div>
  );
}

interface CalendarDayProps {
  day: Date;
  meals: Meal[];
  mealtimes: Mealtime[];
  recipes: Recipe[];
}

function CalendarDay(props: CalendarDayProps) {
  const dayName = format(props.day, 'EEEE');
  const formatterDate = format(props.day, 'MMM dd');

  const dayKey = formatISO(props.day, { representation: 'date' });
  const dayMeals = props.meals.filter((meal) => meal.date === dayKey);

  const link = `/meals/${dayKey}`;

  return (
    <a
      href={link}
      className="flex-grow border-2 border-b-8 border-b-primary hover:border-b-secondary border-gray-500 shadow-sm transition-color hover:bg-gray-100 hover:cursor-pointer"
      key={dayName.toLowerCase()}
    >
      <div className="p-2">
        <h1 className={`text-center text-2xl ${isToday(props.day) ? 'underline font-extrabold' : ''}`}>{dayName}</h1>
        <h2 className="text-center">{formatterDate}</h2>
        <hr className="border-black mt-2 mb-2" />
        {props.mealtimes.map((mealtime) => (
          <CalendarDayMealtime key={mealtime.id} mealtime={mealtime} meals={dayMeals} recipes={props.recipes}></CalendarDayMealtime>
        ))}
      </div>
    </a>
  );
}

interface MealCalendarProps {
  fromDate: Date;
  toDate: Date;

  onPageLeft: () => void;
  onPageRight: () => void;
  onHome: () => void;
}

interface MealTimesHeaderProps {
  date: Date;
}

function CalendarTimingHeader(props: MealTimesHeaderProps) {
  const formatTimeDistance = (diff: number) => {
    if (diff == 0) return 'This week';
    else if (diff == -1) return 'Previous week';
    else if (diff == +1) return 'Next week';
    else if (diff < -1) return `${Math.abs(diff)} weeks before`;
    else return `${diff} weeks ahead`;
  };

  const weekDifference = differenceInCalendarWeeks(props.date, new Date());
  return (
    <p className="text-2xl">
      <span>~ </span>
      <span>Meals - </span>
      {formatTimeDistance(weekDifference)}
      <span> ~</span>
    </p>
  );
}

export default function MealCalendar(props: MealCalendarProps) {
  const query = trpc.meals.query.useQuery({
    from: formatISO(props.fromDate, { representation: 'date' }),
    to: formatISO(props.toDate, { representation: 'date' }),
  });
  const data = query.data || {
    meals: [],
    mealtimes: [],
    recipes: [],
  };

  return (
    <div className="w-full flex flex-col items-center gap-2 mt-2">
      <CalendarTimingHeader date={props.fromDate} />
      <div className="w-full flex gap-2">
        <CalendarPagerButton className="flex-grow" key="left" direction="left" onClick={props.onPageLeft} onHomeClick={props.onHome} />
        <div className="w-full flex gap-3">
          {eachDayOfInterval({
            start: props.fromDate,
            end: props.toDate,
          }).map((day) => {
            return <CalendarDay key={day.toISOString()} day={day} meals={data.meals} mealtimes={data.mealtimes} recipes={data.recipes} />;
          })}
        </div>
        <CalendarPagerButton key="right" direction="right" onClick={props.onPageRight} onHomeClick={props.onHome} />
      </div>
    </div>
  );
}
