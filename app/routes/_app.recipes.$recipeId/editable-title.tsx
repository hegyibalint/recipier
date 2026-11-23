import { Form } from 'react-router';
import { Button } from '../../components/button';
import { Editable } from '../../components/editable';
import styles from './styles.module.css';

type Props = { title: string; busy: boolean; saving: boolean; result?: { savedTitle?: string; error?: string } };

export function EditableTitle({ title, busy, saving, result }: Props) {
  return <Form method="post" replace className={styles.titleEditor}>
    <h1 className={styles.title}>
      <Editable value={title} label="Recipe title" name="title" disabled={busy}
        saved={result?.savedTitle ? result : undefined}>
        <Button type="submit" shape="square" name="intent" value="rename" disabled={busy}>{saving ? 'Saving…' : 'Save'}</Button>
      </Editable>
    </h1>
  </Form>;
}
