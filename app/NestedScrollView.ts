import { ScrollView } from '@nativescript/core';

export class NestedScrollView extends ScrollView {
    createNativeView() {
        if (__ANDROID__) {
            if (this.orientation === 'horizontal') {
                return new org.nativescript.widgets.HorizontalScrollView(this._context);
            } else {
                return new androidx.core.widget.NestedScrollView(this._context);
            }
        }
        return super.createNativeView();
    }
}
