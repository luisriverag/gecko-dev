// |reftest| skip-if(!this.hasOwnProperty('Iterator'))
/*---
esid: pending
description: "%Iterator.prototype%.map length value and descriptor."
info: >
  17 ECMAScript Standard Built-in Objects
features: [Symbol.iterator]
---*/

assertEq(Iterator.prototype.map.length, 1);

const propertyDescriptor = Reflect.getOwnPropertyDescriptor(Iterator.prototype.map, 'length');
assertEq(propertyDescriptor.value, 1);
assertEq(propertyDescriptor.enumerable, false);
assertEq(propertyDescriptor.writable, false);
assertEq(propertyDescriptor.configurable, true);

if (typeof reportCompare == 'function')
  reportCompare(0, 0);
