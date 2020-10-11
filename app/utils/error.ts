import { BaseError } from 'make-error';
import { l } from '~/helpers/locale';
import { confirm, alert as mdAlert } from '@nativescript-community/ui-material-dialogs';
import { Sentry, isSentryEnabled } from '~/utils/sentry';
import { showSnack } from '@nativescript-community/ui-material-snackbar';
import { lc } from '@nativescript-community/l';
import { NoNetworkError } from '~/services/api';

function evalTemplateString(resource: string, obj: {}) {
    if (!obj) {
        return resource;
    }
    const names = Object.keys(obj);
    const vals = Object.keys(obj).map((key) => obj[key]);
    return new Function(...names, `return \`${resource}\`;`)(...vals);
}

export class CustomError extends BaseError {
    customErrorConstructorName: string;
    isCustomError = true;
    assignedLocalData: any;
    silent?: boolean;
    constructor(props?, customErrorConstructorName?: string) {
        super(props.message);
        this.message = props.message;
        delete props.message;

        this.silent = props.silent;
        delete props.silent;
        // Error.captureStackTrace && Error.captureStackTrace(this, (this as any).constructor);
        // console.log('creating custom error', props, typeof props, props instanceof Error, props instanceof CustomError);

        // we need to understand if we are duplicating or not
        const isError = props instanceof Error;
        // console.log('creating customErrorConstructorName', customErrorConstructorName, props, isError);
        if (customErrorConstructorName || isError) {
            // duplicating
            // use getOwnPropertyNames to get hidden Error props
            const keys = Object.getOwnPropertyNames(props);
            // if (isError) {
            //     keys = keys.concat(['fileName', 'stack', 'lineNumber', 'type']);
            // }
            // console.log('duplicating error', keys, props.stack);
            for (let index = 0; index < keys.length; index++) {
                const k = keys[index];
                if (!props[k] || typeof props[k] === 'function') continue;
                // console.log('assigning', k, props[k], this[k]);
                this[k] = props[k];
            }
        } else {
            // console.log('creating new CustomError', props);
            this.assignedLocalData = props;
        }

        if (!this.customErrorConstructorName) {
            this.customErrorConstructorName = customErrorConstructorName || (this as any).constructor.name; // OR (<any>this).constructor.name;
        }
    }

    localData() {
        const res = {};
        for (const key in this.assignedLocalData) {
            res[key] = this.assignedLocalData[key];
        }
        return res;
    }

    toJSON() {
        const error = {
            message: this.message,
        };
        Object.getOwnPropertyNames(this).forEach((key) => {
            if (typeof this[key] !== 'function') {
                error[key] = this[key];
            }
        });
        return error;
    }
    toData() {
        return JSON.stringify(this.toJSON());
    }
    toString() {
        // console.log('customError to string', this.message, this.assignedLocalData, localize);
        const result = evalTemplateString(l(this.message), Object.assign({ l }, this.assignedLocalData));
        // console.log('customError to string2', result);
        return result;
        // return evalMessageInContext.call(Object.assign({localize}, this.assignedLocalData), localize(this.message))
        // return this.message || this.stack;
    }

    getMessage() {}
}

export async function showError(err: Error | string) {
    if (!err) {
        return;
    }

    if (err['customErrorConstructorName'] === 'NoNetworkError') {
        showSnack({ message: l('no_network') });
        return;
    }
    const realError = typeof err === 'string' ? null : err;
    const isString = realError === null;
    const message = isString ? (err as string) : realError.message || realError.toString();
    const title = lc('error');
    const reporterEnabled = isSentryEnabled;
    let showSendBugReport = reporterEnabled && !isString && !!realError.stack;
    if (realError instanceof NoNetworkError) {
        showSendBugReport = false;
    }
    // if (err['stack']) {
    //     message += '\n' + err['stack'];
    // }
    console.log('showError', message, err, err['stack']);
    const result = await confirm({
        title,
        okButtonText: showSendBugReport ? lc('send_bug_report') : undefined,
        cancelButtonText: showSendBugReport ? lc('cancel') : lc('ok'),
        message,
    });
    // console.log('showError', 'confirmed', result, isSentryEnabled);
    if (result && isSentryEnabled) {
        Sentry.captureException(err);
        // .notify({
        //     error: err
        // })
        // .then(() => {
        this.$alert(l('bug_report_sent'));
        // })
        // .catch(this.$showError);
    }
}

export function alert(message: string) {
    return mdAlert({
        okButtonText: l('ok'),
        message,
    });
}
