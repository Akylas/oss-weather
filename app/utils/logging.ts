import { getAppId } from 'nativescript-extendedinfo';
// import { crashlytics } from 'nativescript-plugin-firebase'; // and do: firebaseCrashlytics.sendCrashLogexport const DEV_LOG = TNS_ENV === 'development';
export const DEV_LOG = LOG_LEVEL === 'full';

let appId: string;
getAppId().then((r) => (appId = r));
// let chalk: Chalk;

// function getChalk() {
//     if (!chalk) {
//         chalk = require('chalk');
//     }
//     return chalk;
// }

export function log(target: any, k?, desc?: PropertyDescriptor): any;
export function log(always: boolean): (target: any, k?, desc?: PropertyDescriptor) => any;
export function log(alwaysOrTarget: boolean | any, k?, desc?: PropertyDescriptor) {
    // console.log('test log dec', alwaysOrTarget, typeof alwaysOrTarget, k, desc, Object.getOwnPropertyNames(alwaysOrTarget));
    if (typeof alwaysOrTarget !== 'boolean') {
        // console.log(nameOrTarget.name, ' is now decorated');
        return timelineProfileFunctionFactory(alwaysOrTarget, true, k, desc);
    } else {
        // factory
        return function (target: any, key?: string, descriptor?: PropertyDescriptor) {
            // const name = nameOrTarget || target.name;
            return timelineProfileFunctionFactory(target, alwaysOrTarget, key, descriptor);
            // console.log(name, ' is now decorated');
        };
    }
}

// const enum MemberType {
//     Static,
//     Instance
// }
// export const time = Date.now;
function timelineProfileFunctionFactory(target: any, always: boolean, key?, descriptor?: PropertyDescriptor) {
    // save a reference to the original method this way we keep the values currently in the
    // descriptor and don't overwrite what another decorator might have done to the descriptor.
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    if (!always && !DEV_LOG) {
        return descriptor;
    }
    const originalMethod = descriptor.value;

    let className = '';
    if (target && target.constructor && target.constructor.name) {
        className = target.constructor.name + '.';
    }

    const name = className + key;

    // editing the descriptor/value parameter
    descriptor.value = function () {
        // const start = time();
        console.log(name);
        try {
            return originalMethod.apply(this, arguments);
        } finally {
            // const end = time();
            // console.log(`Timeline: Modules: ${name}  (${start}ms. - ${end}ms.)`);
        }
    };

    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
}

// export function console.log(...args) {
//     return console.log.apply(this, [appId].concat(args));
// }
// const origConsole: { [k: string]: Function } = {
//     log: console.log,
//     error: console.error,
//     warn: console.warn
// };
import * as SentryType from '@nativescript-community/sentry';

let Sentry: typeof SentryType;
if (gVars.sentry) {
    Sentry = require('@nativescript-community/sentry');
}
const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
};

function convertArg(arg) {
    const type = typeof arg;
    if (type === 'function' || typeof arg.getClass === 'function' || typeof arg.class === 'function') {
        return (arg as Function).toString();
    } else if (Array.isArray(arg)) {
        return arg.map(convertArg);
    } else if (type === 'object') {
        const str = arg.toString();
        if (str === '[object Object]') {
            return JSON.stringify(arg);
        } else {
            return str;
        }
    } else {
        return arg.toString();
    }
}
function actualLog(level: 'info' | 'log' | 'error' | 'warn' | 'debug', ...args) {
    if (gVars.sentry) {
        Sentry.addBreadcrumb({
            category: 'console',
            message: args.map(convertArg).join(' '),
            level: level as any,
        });
    }
    // we do it this way allow terser to "drop" it
    if (NO_CONSOLE !== true) {
        originalConsole[level](...args);
    }
}
let installed = false;
export function install() {
    if (installed) {
        return;
    }
    installed = true;
    console.log = (...args) => actualLog('log', ...args);
    console.info = (...args) => actualLog('info', ...args);
    console.error = (...args) => actualLog('error', ...args);
    console.warn = (...args) => actualLog('warn', ...args);
    console.debug = (...args) => actualLog('debug', ...args);
}
