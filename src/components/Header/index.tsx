import Image from 'next/image';
import Link from 'next/link';

import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={`widthBig ${styles.container}`}>
      <div>
        <Link href="/">
          <a>
            <Image src="/logo.svg" height={26} width={239} alt="logo" />
          </a>
        </Link>
      </div>
    </header>
  );
}
