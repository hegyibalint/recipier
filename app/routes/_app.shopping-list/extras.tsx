import { useState } from 'react';
import { Button, IconButton } from '../../components/button';
import { ConfirmDelete } from '../../components/confirm-delete';
import { PencilIcon } from '../../components/pencil-icon';
import type { ExtraIngredient } from '../../lib/planning/shopping-extras';
import type { ExtrasActionResult } from './extras.client';
import { ExtraIngredientEditor } from './extra-ingredient-editor';
import { Quantities } from './quantities';
import { TrashIcon } from './trash-icon';
import styles from './styles.module.css';

type Props = {
  items?: ExtraIngredient[];
  loadError?: string;
  result?: ExtrasActionResult;
  busy: boolean;
  retry: () => void;
};

export function ShoppingExtras({ items, loadError, result, busy, retry }: Props) {
  const [editor, setEditor] = useState<{ item?: ExtraIngredient; previousResult: typeof result } | null>(null);
  const editorResult = editor && result !== editor.previousResult ? result : undefined;
  const editorOpen = editor !== null && (busy || !editorResult || 'error' in editorResult);

  return (
    <section className={styles.extras} aria-labelledby="extras-heading" aria-busy={busy}>
      <h2 id="extras-heading" className="section-title">Extra ingredients</h2>
      <p>Anything you need that isn’t in the meal plan. These stay on your list until you remove them.</p>
      {loadError && <>
        <p role="alert">{loadError}</p>
        <Button variant="secondary" disabled={busy} onClick={retry}>Try again</Button>
      </>}
      {!busy && result && ('error' in result
        ? !editorOpen && <p role="alert">{result.error}</p>
        : <p role="status">{result.message}</p>)}
      {items?.length ? (
        <ul className={styles.items}>
          {items.map(item => <li key={item.id} className={styles.extraRow}>
            <div className={`${styles.itemHeading} ${styles.extraHeading}`}>
              <span>
                <strong>{item.name}</strong>{item.original_name && ` (${item.original_name})`}
                {item.description && <span className={styles.detail}>{item.description}</span>}
              </span>
              <Quantities quantities={item.quantities} hasUnquantifiedMentions={!item.quantities.length} />
            </div>
            <div className={styles.extraActions}>
              <IconButton label={`Edit ${item.name}`} disabled={busy} aria-haspopup="dialog"
                onClick={() => setEditor({ item, previousResult: result })}><PencilIcon /></IconButton>
              <ConfirmDelete itemName={item.name} fields={{ id: item.id }} disabled={busy} preventScrollReset iconOnly
                actionLabel="Remove" description="This removes it from your shopping list."
                aria-label={`Remove ${item.name}`}><TrashIcon /></ConfirmDelete>
            </div>
          </li>)}
        </ul>
      ) : !loadError && <p>No extra ingredients yet.</p>}
      <Button className={styles.addExtra} disabled={busy} aria-haspopup="dialog"
        onClick={() => setEditor({ previousResult: result })}>Add extra ingredient</Button>
      <ExtraIngredientEditor item={editor?.item} open={editorOpen} busy={busy}
        error={editorResult && 'error' in editorResult ? editorResult.error : undefined}
        onClose={() => setEditor(null)} />
    </section>
  );
}
