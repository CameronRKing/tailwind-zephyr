const families = require('./tailwind-families.json');
const shortcuts = require('./tailwind-shortcuts.json');
const { pairs, mapWithKeys, mapInvert, assocIn, last } = require('./utils.js');

exports.familyToClasses = families;

const classToFamily = pairs(families).map(([propsAffected, classes]) =>
    mapWithKeys(classes, cclass => [cclass, propsAffected])
).reduce((acc, lookup) => assocIn(acc, lookup), {});
exports.classToFamily = classToFamily;

const shortcutToClass = shortcuts;
exports.shortcutToClass = shortcutToClass;

const classToShortcut = mapInvert(shortcutToClass);
exports.classToShortcut = classToShortcut;

const allClasses = Object.values(families).reduce((acc, arr) => acc.concat(arr), []);
exports.allClasses = allClasses;

/**
 * Determines which classes should be removed and/or added.
 * 1) If the class is already on the list, it is removed
 * 2) If a sibling of the class is on the list, the sibling is removed and the new class added
 * 3) Else the class is simply added
 * @param {Array<String>} classList 
 * @param {String} givenClass 
 * @param {String} variants 
 */
function getClassPatch(classList, givenClass, variants) {
    // if it's already there, remove it
    const fullClass = (variants ? variants + ':' : '') + givenClass;
    if (classList.includes(fullClass)) {
        return { remove:  fullClass }
    } else {
        const family = classToFamily[givenClass];
        const existingFamilyMember = classList.find(str => {
            const vvariants = str.split(':').slice(0, -1).join(':');
            const cclass = str.split(':').slice(-1)[0];
            return classToFamily[cclass] == family && vvariants == variants;
        });
        if (family !== undefined && existingFamilyMember) {
            return {
                remove: existingFamilyMember,
                add: fullClass
            };
        } else {
            return {
                add: fullClass
            }
        }
    }
}
exports.getClassPatch = getClassPatch;

function generateComponentClasses(classList, componentName) {
    const bySize = { none: [], sm: [], md: [], lg: [], xl: [] };
    classList.forEach(cclass => {
        const size = cclass.slice(0, 2);
        if (bySize[size]) bySize[size].push(cclass.slice(3));
        else bySize.none.push(cclass);
    });
    return pairs(bySize).map(([size, classes]) => {
        if (classes.length == 0) return '';
        const variants = ['hover', 'focus', 'active', 'disabled', 'visited',
            'focus', 'first', 'last', 'odd', 'even', 'group-hover', 'none'];
        const byVariant = mapWithKeys(variants, variant => [variant, []]);
        classes.forEach(cclass => {
            if (!cclass.includes(':')) byVariant.none.push(cclass);
            else {
                const [variant, name] = cclass.split(':');
                // if we don't recognize it, ignore it
                if (!byVariant[variant]) return;
                byVariant[variant].push(name);
            }
        });

        const getRuleName = (variant) => {
            const childMappings = {
                first: ':first-child',
                last: ':last-child',
                odd: ':nth-child(odd)',
                even: ':nth-child(even)',
            };

            if (variant == 'none') return `.${componentName}`;
            if (childMappings[variant]) return `.${componentName}${childMappings[variant]}`;
            if (variant == 'group-hover') return `.group:hover .${componentName}`;
            return `.${componentName}:${variant}`;
        }

        const padding = (size == 'none' ? '' : '    ');
        const rules = pairs(byVariant).map(([variant, classes]) => {
            if (classes.length == 0) return '';
            
            return `${getRuleName(variant)} {
    ${padding}@apply ${classes.join(' ')};
${padding}}`;
        }).filter(str => str != '').join('\n\n').trim();
        return (size == 'none' ? rules : `@screen ${size} {
    ${rules}
}`);
    }).filter(str => str != '').join('\n\n').trim();
}
exports.generateComponentClasses = generateComponentClasses;

/**
 * Returns all utility classes that modify the same property
 **/
function siblings(cclass) {
    return families[classToFamily[cclass]];;
}
exports.siblings = siblings;

/**
 * Returns the next utility class that modifies the same property
 * Cycles continuously by returning to the first member if the last member is given
 **/
function nextSibling(cclass) {
    const family = siblings(cclass);
    const idx = family.indexOf(cclass);

    if (idx == -1 || idx == family.length - 1) return family[0];
    return family[idx + 1];
}
exports.nextSibling = nextSibling;

/**
 * Returns the previous utility class that modifies the same property
 * Cycles continuously by returning to the last member if the first member is given
 **/
function prevSibling(cclass) {
    const family = siblings(cclass);
    const idx = family.indexOf(cclass);

    if (idx == -1 || idx == 0) return last(family);
    return family[idx - 1];
}
exports.prevSibling = prevSibling;