import { useState, useCallback } from 'react';
import styles from './BackOffice.module.css';

const COLS = 10;
const ROWS = 12;
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const initialData: Record<string, string> = {
  'A1': 'Entity Name',
  'B1': 'Level',
  'C1': 'Threat',
  'D1': 'Distance (m)',
  'E1': 'Status',
  'A2': 'Smiler',
  'B2': '0',
  'C2': 'EXTREME',
  'D2': '47.3',
  'E2': 'ACTIVE',
  'A3': 'Hound',
  'B3': '1',
  'C3': 'HIGH',
  'D3': '112.8',
  'E3': 'PATROLLING',
  'A4': 'Skin-Stealer',
  'B4': '2',
  'C4': 'EXTREME',
  'D4': '???',
  'E4': 'UNKNOWN',
  'A5': 'Clump',
  'B5': '1',
  'C5': 'MODERATE',
  'D5': '89.1',
  'E5': 'DORMANT',
  'A6': 'Wretched',
  'B6': '2',
  'C6': 'HIGH',
  'D6': '23.7',
  'E6': 'HUNTING',
  'A7': '[REDACTED]',
  'B7': '0',
  'C7': '?????????',
  'D7': '0.0',
  'E7': 'WATCHING',
  'G1': 'Last Updated',
  'G2': 'NEVER',
  'H1': 'Observer',
  'H2': 'YOU',
};

export default function SheetTab() {
  const [cells, setCells] = useState<Record<string, string>>(initialData);

  const getCellKey = (col: number, row: number) => `${COL_LABELS[col]}${row + 1}`;

  const handleCellChange = useCallback((key: string, value: string) => {
    setCells((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className={styles.tabContent}>
      <div className={styles.sheetContainer}>
        <table className={styles.sheetTable}>
          <thead>
            <tr>
              <th className={styles.sheetRowHeader}></th>
              {COL_LABELS.map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, row) => (
              <tr key={row}>
                <td className={styles.sheetRowHeader}>{row + 1}</td>
                {Array.from({ length: COLS }, (_, col) => {
                  const key = getCellKey(col, row);
                  return (
                    <td key={key}>
                      <input
                        className={styles.sheetCell}
                        value={cells[key] || ''}
                        onChange={(e) => handleCellChange(key, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
