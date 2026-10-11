import { describe, expect, it } from 'vitest';
import { dialogListHeight } from './dialogHeight';

describe('dialogListHeight', () => {
    it('keeps a list that fits between the dialog margins, title and buttons', () => {
        expect(dialogListHeight(300, 900)).toBe(300);
    });
    it('caps a taller list so it scrolls instead of being clipped by the dialog', () => {
        expect(dialogListHeight(613, 915)).toBe(545);
    });
    it('leaves a list without a fixed height alone', () => {
        expect(dialogListHeight(null, 915)).toBeNull();
        expect(dialogListHeight('auto', 915)).toBe('auto');
    });
});
