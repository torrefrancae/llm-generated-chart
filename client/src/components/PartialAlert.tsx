import type { PartialAlertState } from '@/lib/partialSupport';
import styles from '@/components/PartialAlert.module.css';
import React from 'react';

interface Props {
  alert: PartialAlertState;
  onDismiss: () => void;
}

export default function PartialAlert({ alert, onDismiss }: Props) {
  return (
    <div className={styles.banner} role="alert">
      <div className={styles.copy}>
        <p className={styles.kicker}>{alert.title}</p>
        <p className={styles.body}>{alert.body}</p>
        <ul className={styles.list}>
          {alert.unsupported.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss partial alert">
        Dismiss
      </button>
    </div>
  );
}
