import { Canvas, CanvasView } from '@nativescript-community/ui-canvas';

export interface ListItem {
    showBottomLine?: boolean;
    iconFontSize?: number;
    subtitleFontSize?: number;
    rightValue?: string | (() => string);
    rightValueFontSize?: number;
    fontSize?: number;
    html?: any;
    name?: string;
    icon?: string;
    color?: string | Color;
    rippleColor?: string | Color;
    title?: string;
    subtitle?: string;
    type?: string;
    onLinkTap?: (event) => void;
    onDraw?: (item: ListItem, event: { canvas: Canvas; object: CanvasView }) => void;
    [k: string]: any;
}
