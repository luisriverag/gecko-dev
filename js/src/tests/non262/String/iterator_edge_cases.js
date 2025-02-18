// Test that we can't confuse %StringIteratorPrototype% for a
// StringIterator object.
function TestStringIteratorPrototypeConfusion() {
    var iter = ""[Symbol.iterator]();
    assertThrowsInstanceOfWithMessage(
        () => iter.next.call(Object.getPrototypeOf(iter)),
        TypeError,
        "next method called on incompatible String Iterator");
}
TestStringIteratorPrototypeConfusion();

// Tests that we can use %StringIteratorPrototype%.next on a
// cross-compartment iterator.
function TestStringIteratorWrappers() {
    var iter = ""[Symbol.iterator]();
    assertDeepEq(iter.next.call(newGlobal().eval('"x"[Symbol.iterator]()')),
		 { value: "x", done: false })
}
if (typeof newGlobal === "function") {
    TestStringIteratorWrappers();
}

if (typeof reportCompare === "function")
  reportCompare(true, true);
