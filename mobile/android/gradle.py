# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import subprocess
import sys
import time
from contextlib import contextmanager

import mozpack.path as mozpath
from mozbuild.dirutils import ensureParentDir
from mozbuild.lock import lock_file


@contextmanager
def gradle_lock(topobjdir, max_wait_seconds=600):
    # Building the same Gradle root project with multiple concurrent processes
    # is not well supported, so we use a simple lock file to serialize build
    # steps.
    lock_path = "{}/gradle/mach_android.lockfile".format(topobjdir)
    ensureParentDir(lock_path)
    lock_instance = lock_file(lock_path, max_wait=max_wait_seconds)

    try:
        yield
    finally:
        del lock_instance


def android(verb, *args):
    env = dict(os.environ)
    should_print_status = env.get("MACH") and not env.get("NO_BUILDSTATUS_MESSAGES")
    if should_print_status:
        print("BUILDSTATUS " + str(time.time()) + " START_GradleAcquireLock " + verb)
    import buildconfig

    with gradle_lock(buildconfig.topobjdir):
        if should_print_status:
            print("BUILDSTATUS " + str(time.time()) + " END_GradleAcquireLock " + verb)

        cmd = [
            sys.executable,
            mozpath.join(buildconfig.topsrcdir, "mach"),
            "android",
            verb,
        ]
        cmd.extend(args)
        # Confusingly, `MACH` is set only within `mach build`.
        if env.get("MACH"):
            env["GRADLE_INVOKED_WITHIN_MACH_BUILD"] = "1"
        if env.get("LD_LIBRARY_PATH"):
            del env["LD_LIBRARY_PATH"]

        if should_print_status:
            print("BUILDSTATUS " + str(time.time()) + " START_Gradle " + verb)

        subprocess.check_call(cmd, env=env)

    if should_print_status:
        print("BUILDSTATUS " + str(time.time()) + " END_Gradle " + verb)
    return 0


def assemble_app(dummy_output_file, *inputs):
    return android("assemble-app")


def generate_sdk_bindings(dummy_output_file, *args):
    return android("generate-sdk-bindings", *args)


def generate_generated_jni_wrappers(dummy_output_file, *args):
    return android("generate-generated-jni-wrappers", *args)
