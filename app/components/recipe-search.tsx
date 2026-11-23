import { useId, useRef, useState } from 'react';
import { Form, useSearchParams } from 'react-router';
import { Button } from './button';
import { Card } from './card';
import { Dialog } from './dialog';
import { SearchIcon } from './search-icon';
import styles from './recipe-search.module.css';

export function RecipeSearch() {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const formId = `${useId()}-search-form`;
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  return (
    <>
      <Card shape="capsule">
        <button type="button" className={styles.trigger} aria-haspopup="dialog"
          aria-label="Search recipes" onClick={() => setOpen(true)}>
          <SearchIcon /><span>Search</span>
        </button>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} title="Search recipes" initialFocusRef={input}
        footer={<Button type="submit" form={formId}>Search</Button>}>
        <Form id={formId} action="/" method="get" role="search" aria-label="Recipes"
          onSubmit={() => setOpen(false)}>
          <Card className={styles.field}>
            <SearchIcon />
            <input ref={input} key={query} type="search" name="q" aria-label="Search recipes"
              placeholder="What would you like to cook?" defaultValue={query} />
          </Card>
        </Form>
      </Dialog>
    </>
  );
}
