// Copyright (C) 2015 André Bargull. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
es6id: 19.4.3.3
description: >
  Symbol.prototype.valueOf.name is "valueOf".
info: |
  Symbol.prototype.valueOf ( )

  17 ECMAScript Standard Built-in Objects:
    Every built-in Function object, including constructors, that is not
    identified as an anonymous function has a name property whose value
    is a String.

    Unless otherwise specified, the name property of a built-in Function
    object, if it exists, has the attributes { [[Writable]]: false,
    [[Enumerable]]: false, [[Configurable]]: true }.
includes: [propertyHelper.js]
features: [Symbol]
---*/

verifyProperty(Symbol.prototype.valueOf, "name", {
  value: "valueOf",
  writable: false,
  enumerable: false,
  configurable: true
});

reportCompare(0, 0);
