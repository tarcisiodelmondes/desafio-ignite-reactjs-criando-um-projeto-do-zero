import Link from 'next/link';

import styles from './styles.module.scss';

export function ButtonExitPreview(): JSX.Element {
  return (
    <aside className={styles.container}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
}
