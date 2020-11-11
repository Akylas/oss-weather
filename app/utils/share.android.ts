import { Application } from '@nativescript/core';

export async function share(
    content: {
        title?: string;
        message?: string;
        url?: string;
    },
    options: {
        dialogTitle?: string;
        excludedActivityTypes?: string[];
        tintColor?: string;
        subject?: string;
        appearance?: 'light' | 'dark';
    } = {}
) {
    if (content == null) {
        throw new Error('missing_content');
    }
    const Intent = android.content.Intent;

    const intent = new Intent(Intent.ACTION_SEND);
    intent.setTypeAndNormalize('text/plain');

    if (content.title) {
        intent.putExtra(Intent.EXTRA_SUBJECT, content.title);
    }

    if (content.message) {
        intent.putExtra(Intent.EXTRA_TEXT, content.message);
    }

    const chooser = Intent.createChooser(intent, options.dialogTitle);
    chooser.addCategory(Intent.CATEGORY_DEFAULT);

    const currentActivity = Application.android.foregroundActivity || Application.android.startActivity;
    if (currentActivity !== null) {
        currentActivity.startActivity(chooser);
    } else {
        Application.android.context.startActivity(chooser);
    }
    return true;
}
