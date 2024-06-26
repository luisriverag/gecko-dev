/*
 * Tests for bug 894586: nsSyncLoadService::PushSyncStreamToListener
 * should not fail for channels of unknown size
 */

"use strict";

var contentSecManager = Cc["@mozilla.org/contentsecuritymanager;1"].getService(
  Ci.nsIContentSecurityManager
);

function ProtocolHandler() {
  this.uri = Cc["@mozilla.org/network/simple-uri-mutator;1"]
    .createInstance(Ci.nsIURIMutator)
    .setSpec(this.scheme + ":dummy")
    .finalize();
}

ProtocolHandler.prototype = {
  /** nsIProtocolHandler */
  get scheme() {
    return "x-bug894586";
  },
  newChannel(aURI, aLoadInfo) {
    this.loadInfo = aLoadInfo;
    return this;
  },
  allowPort(port) {
    return port != -1;
  },

  /** nsIChannel */
  get originalURI() {
    return this.uri;
  },
  get URI() {
    return this.uri;
  },
  owner: null,
  notificationCallbacks: null,
  get securityInfo() {
    return null;
  },
  get contentType() {
    return "text/css";
  },
  set contentType(val) {},
  contentCharset: "UTF-8",
  get contentLength() {
    return -1;
  },
  set contentLength(val) {
    throw Components.Exception(
      "Setting content length",
      Cr.NS_ERROR_NOT_IMPLEMENTED
    );
  },
  open() {
    // throws an error if security checks fail
    contentSecManager.performSecurityCheck(this, null);

    var file = do_get_file("test_bug894586.js", false);
    Assert.ok(file.exists());
    var url = Services.io.newFileURI(file);
    return NetUtil.newChannel({
      uri: url,
      loadUsingSystemPrincipal: true,
    }).open();
  },
  asyncOpen() {
    throw Components.Exception("Not implemented", Cr.NS_ERROR_NOT_IMPLEMENTED);
  },
  contentDisposition: Ci.nsIChannel.DISPOSITION_INLINE,
  get contentDispositionFilename() {
    throw Components.Exception("No file name", Cr.NS_ERROR_NOT_AVAILABLE);
  },
  get contentDispositionHeader() {
    throw Components.Exception("No header", Cr.NS_ERROR_NOT_AVAILABLE);
  },

  /** nsIRequest */
  get name() {
    return this.uri.spec;
  },
  isPending: () => false,
  get status() {
    return Cr.NS_OK;
  },
  cancel() {},
  loadGroup: null,
  loadFlags:
    Ci.nsIRequest.LOAD_NORMAL |
    Ci.nsIRequest.INHIBIT_CACHING |
    Ci.nsIRequest.LOAD_BYPASS_CACHE,

  /** nsISupports */
  QueryInterface: ChromeUtils.generateQI([
    "nsIProtocolHandler",
    "nsIRequest",
    "nsIChannel",
  ]),
};

/**
 * Attempt a sync load; we use the stylesheet service to do this for us,
 * based on the knowledge that it forces a sync load under the hood.
 */
function run_test() {
  var handler = new ProtocolHandler();

  Services.io.registerProtocolHandler(
    handler.scheme,
    handler,
    Ci.nsIProtocolHandler.URI_NORELATIVE |
      Ci.nsIProtocolHandler.URI_NOAUTH |
      Ci.nsIProtocolHandler.URI_IS_UI_RESOURCE |
      Ci.nsIProtocolHandler.URI_IS_LOCAL_RESOURCE |
      Ci.nsIProtocolHandler.URI_NON_PERSISTABLE |
      Ci.nsIProtocolHandler.URI_SYNC_LOAD_IS_OK,
    -1
  );
  try {
    var ss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    ss.loadAndRegisterSheet(handler.uri, Ci.nsIStyleSheetService.AGENT_SHEET);
    Assert.ok(
      ss.sheetRegistered(handler.uri, Ci.nsIStyleSheetService.AGENT_SHEET)
    );
  } finally {
    Services.io.unregisterProtocolHandler(handler.scheme);
  }
}

// vim: set et ts=2 :
