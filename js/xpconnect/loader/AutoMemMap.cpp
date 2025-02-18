/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "AutoMemMap.h"
#include "ScriptPreloader-inl.h"

#include "mozilla/Unused.h"
#include "mozilla/Try.h"
#include "mozilla/ipc/FileDescriptor.h"
#include "nsIFile.h"

#include <private/pprio.h>

namespace mozilla {
namespace loader {

using namespace mozilla::ipc;

AutoMemMap::~AutoMemMap() { reset(); }

FileDescriptor AutoMemMap::cloneFileDescriptor() const {
  if (fd.get()) {
    auto handle =
        FileDescriptor::PlatformHandleType(PR_FileDesc2NativeHandle(fd.get()));
    return FileDescriptor(handle);
  }
  return FileDescriptor();
}

Result<Ok, nsresult> AutoMemMap::init(nsIFile* file, int flags, int mode,
                                      PRFileMapProtect prot) {
  MOZ_ASSERT(!fd);

  MOZ_TRY(file->OpenNSPRFileDesc(flags, mode, getter_Transfers(fd)));

  return initInternal(prot);
}

Result<Ok, nsresult> AutoMemMap::init(const FileDescriptor& file,
                                      PRFileMapProtect prot, size_t maybeSize) {
  MOZ_ASSERT(!fd);
  if (!file.IsValid()) {
    return Err(NS_ERROR_INVALID_ARG);
  }

  auto handle = file.ClonePlatformHandle();

  fd.reset(PR_ImportFile(PROsfd(handle.get())));
  if (!fd) {
    return Err(NS_ERROR_FAILURE);
  }
  Unused << handle.release();

  return initInternal(prot, maybeSize);
}

Result<Ok, nsresult> AutoMemMap::initInternal(PRFileMapProtect prot,
                                              size_t maybeSize) {
  MOZ_ASSERT(!fileMap);
  MOZ_ASSERT(!addr);

  if (maybeSize > 0) {
    // Some OSes' shared memory objects can't be stat()ed, either at
    // all (Android) or without loosening the sandbox (Mac) so just
    // use the size.
    size_ = maybeSize;
  } else {
    // But if we don't have the size, assume it's a regular file and
    // ask for it.
    PRFileInfo64 fileInfo;
    MOZ_TRY(PR_GetOpenFileInfo64(fd.get(), &fileInfo));

    if (fileInfo.size > UINT32_MAX) {
      return Err(NS_ERROR_INVALID_ARG);
    }
    size_ = fileInfo.size;
  }

  fileMap = PR_CreateFileMap(fd.get(), 0, prot);
  if (!fileMap) {
    return Err(NS_ERROR_FAILURE);
  }

  addr = PR_MemMap(fileMap, 0, size_);
  if (!addr) {
    return Err(NS_ERROR_FAILURE);
  }

  return Ok();
}

FileDescriptor AutoMemMap::cloneHandle() const { return cloneFileDescriptor(); }

void AutoMemMap::reset() {
  if (addr && !persistent_) {
    Unused << NS_WARN_IF(PR_MemUnmap(addr, size()) != PR_SUCCESS);
    addr = nullptr;
  }
  if (fileMap) {
    Unused << NS_WARN_IF(PR_CloseFileMap(fileMap) != PR_SUCCESS);
    fileMap = nullptr;
  }
  fd = nullptr;
}

}  // namespace loader
}  // namespace mozilla
