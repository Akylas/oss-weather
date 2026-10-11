// the material dialog keeps margins around its window and a title and buttons panel:
// a taller list is clipped by the dialog (and does not scroll), not capped
const DIALOG_CHROME_DIPS = 370;

export function dialogListHeight(height: number | string | null, screenHeightDips: number) {
    return typeof height === 'number' ? Math.min(height, screenHeightDips - DIALOG_CHROME_DIPS) : height;
}
