# Tailwind Zephyr

Tools for working with TailwindCSS utility/component classes programmatically. In other words, it should make building development tooling around Tailwind _a breeze_.

## Usage

```javascript
const {
    generateComponentClasses,
    getClassPatch,
    shortcutToClass,
    siblings,
    nextSibling,
    prevSibling
} = require('tailwind-zephyr');

const cssRules = generateComponentClasses(['hover:bg-green-100', 'bg-green-300', 'border-2'], 'btn');
console.log(cssRules);
/*
`.btn {
    @apply bg-green-300 border-2
}

.btn:hover {
    @apply bg-green-100
}`
*/

const classPatch = getClassPatch('flex justify-center items-start', 'justify-start');
console.log(classPatch);
/*
{
    remove: 'justify-center',
    add: 'justify-start'
}
*/

const family = siblings('list-none');
console.log(family); // ["list-none", "list-disc", "list-decimal"]

const cclass = shortcutToClass['tp3'];
console.log(cclass); // "text-purple-300"; more shortcuts can be found in tailwind-shortcuts.json

const next = nextSibling('list-disc');
console.log(next); // "list-decimal"

const prev = prevSibling('list-none');
console.log(prev); // "list-decimal"
```