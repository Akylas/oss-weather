import { lc } from '~/helpers/locale';

const singletons = {};

export abstract class Provider {
    id: string;
    private static _singleton: Provider;

    getName() {
        return lc(`provider.${this.id}`);
    }
    getModelName(key) {
        return key;
    }

    public static getInstance<T extends Provider>(this: new () => T): T {
        // we use static id because prototype.constructor.name might not be uniq when uglified
        const key = this['id'];
        if (!singletons[key]) {
            singletons[key] = new this();
        }
        return singletons[key];
    }
}
