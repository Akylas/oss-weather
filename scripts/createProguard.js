const fs = require('fs');
const path = require('path');
const whitelist = fs.readFileSync(path.join('platforms', 'android', 'build-tools', 'whitelist.mdg'), { encoding: 'utf-8' });
const whitelistfilteredLines = [...new Set(whitelist.split('\n'))].filter((l) => l.length > 0 && !l.startsWith('//'));
const blacklist = fs.readFileSync(path.join('platforms', 'android', 'build-tools', 'blacklist.mdg'), { encoding: 'utf-8' });
const blacklistfilteredLines = [...new Set(blacklist.split('\n'))].filter((l) => l.length > 0 && !l.startsWith('//'));

// const KEEP_PARAMS = '-keep,includedescriptorclasses,allowoptimization public class';
const KEEP_PARAMS = '-keep,allowoptimization public class';
const data = `#-dontobfuscate
-dontwarn **
#-keepattributes *Annotation*, EnclosingMethod, Exceptions, InnerClasses
-keepattributes EnclosingMethod, InnerClasses

-keep,includedescriptorclasses        class     com.tns.** { *; }
-keep,includedescriptorclasses public interface com.tns.** { *; }

${whitelistfilteredLines
    .map((l) => {
        if (l.endsWith('*:*')) {
            // const toBlacklist = blacklistfilteredLines.filter((l2) => l2.startsWith(l));
            // if (toBlacklist.length) {
            //     return `${KEEP_PARAMS} ${toBlacklist.map((l) => '!' + l.replace('*:*', '.**')).join(',')},${l.slice(0, -3).replace(':', '.')}.** { public protected *; }`;
            // }
            return `${KEEP_PARAMS} ${l.slice(0, -3).replace(':', '.')}.** { public protected *; }`;
        }
        return `${KEEP_PARAMS} ${l.slice(0, -1).replace(':', '.')}** { public  *; }`;
    })
    .join('\n')}
`;

fs.writeFileSync(path.join('App_Resources', 'Android', 'proguard-rules.pro'), data);
