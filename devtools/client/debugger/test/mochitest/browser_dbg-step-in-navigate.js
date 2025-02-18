/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// Tests that Step In is cancelled when navigating to another page

"use strict";

add_task(async function () {
  const dbg = await initDebugger("doc-scripts.html", "simple3.js", "long.js");

  // With the debugger stopped at a breakpoint, blackbox the current source and step in
  await selectSource(dbg, "simple3.js");
  await addBreakpoint(dbg, "simple3.js", 5);
  invokeInTab("simple");
  await waitForPaused(dbg, "simple3");

  await clickElement(dbg, "blackbox");
  await waitForDispatch(dbg.store, "BLACKBOX_WHOLE_SOURCES");
  await dbg.actions.stepIn();

  // We should stop at this breakpoint, rather than the first executed script
  await selectSource(dbg, "long.js");
  await addBreakpoint(dbg, "long.js", 1);

  // Navigation should clear the stepping state
  const reloaded = reload(dbg, "simple2.js");
  await waitForPaused(dbg);
  await assertPausedAtSourceAndLine(dbg, findSource(dbg, "long.js").id, 1);

  await resume(dbg);
  await reloaded;
});
