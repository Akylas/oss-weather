import { locals } from '~/variables.module.scss';
import { screen } from '@nativescript/core/platform';

console.log('loading variables', locals);

export const primaryColor: string = locals.primaryColor;
export const glassesColor: string = locals.glassesColor;
export const accentColor: string = locals.accentColor;
export const darkColor: string = locals.darkColor;
export const backgroundColor: string = locals.backgroundColor;
export const latoFontFamily: string = locals.latoFontFamily;
export const wiFontFamily: string = locals.wiFontFamily;
export const mdiFontFamily: string = locals.mdiFontFamily;
export const forecastFontFamily: string = locals.forecastFontFamily;
export const actionBarHeight: number = parseFloat(locals.actionBarHeight);
export const actionBarButtonHeight: number = parseFloat(locals.actionBarButtonHeight);
export const screenHeightDips = screen.mainScreen.heightDIPs;
export const screenWidthDips = screen.mainScreen.widthDIPs;

