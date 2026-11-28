import type { ShoppingTotal } from '../../lib/planning/shopping-list';
import styles from './styles.module.css';

const formatAmount = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 15 });

export function Quantities({ quantities, hasUnquantifiedMentions }: Pick<ShoppingTotal, 'quantities' | 'hasUnquantifiedMentions'>) {
  return (
    <span className={styles.quantities}>
      {quantities.length > 0 && <span>{quantities.map(({ amount, unit }) =>
        [formatAmount.format(amount), unit].filter(Boolean).join(' ')).join(' + ')}</span>}
      {hasUnquantifiedMentions && <span className={styles.detail}>
        {quantities.length > 0 ? 'Also mentioned without a quantity' : 'No quantity specified'}
      </span>}
    </span>
  );
}
