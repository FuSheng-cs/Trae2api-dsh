"""Own the entire relay tree; exit when the DSH Host disappears."""
import argparse
import os
from pathlib import Path
import signal
import subprocess
import sys
import time


def unix(args):
    child = subprocess.Popen([sys.executable, args.entry], cwd=args.root, start_new_session=True)
    stopping = False

    def stop(*_):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        while child.poll() is None and not stopping:
            try:
                os.kill(args.owner, 0)
            except ProcessLookupError:
                break
            time.sleep(0.25)
    finally:
        # Kill the process group even if its original leader has already exited.
        try:
            os.killpg(child.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            pass
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        child.wait()


def windows(args):
    import _winapi
    import ctypes
    from ctypes import wintypes

    class BasicLimits(ctypes.Structure):
        _fields_ = [('process_time', ctypes.c_longlong), ('job_time', ctypes.c_longlong),
                    ('flags', wintypes.DWORD), ('min_working_set', ctypes.c_size_t),
                    ('max_working_set', ctypes.c_size_t), ('active_processes', wintypes.DWORD),
                    ('affinity', ctypes.c_size_t), ('priority', wintypes.DWORD), ('scheduling', wintypes.DWORD)]

    class IoCounters(ctypes.Structure):
        _fields_ = [(n, ctypes.c_ulonglong) for n in ['read_ops', 'write_ops', 'other_ops', 'read_bytes', 'write_bytes', 'other_bytes']]

    class ExtendedLimits(ctypes.Structure):
        _fields_ = [('basic', BasicLimits), ('io', IoCounters), ('process_memory', ctypes.c_size_t),
                    ('job_memory', ctypes.c_size_t), ('peak_process_memory', ctypes.c_size_t), ('peak_job_memory', ctypes.c_size_t)]

    kernel = ctypes.WinDLL('kernel32', use_last_error=True)
    signatures = {
        'OpenProcess': ([wintypes.DWORD, wintypes.BOOL, wintypes.DWORD], wintypes.HANDLE),
        'CreateJobObjectW': ([ctypes.c_void_p, wintypes.LPCWSTR], wintypes.HANDLE),
        'SetInformationJobObject': ([wintypes.HANDLE, ctypes.c_int, ctypes.c_void_p, wintypes.DWORD], wintypes.BOOL),
        'AssignProcessToJobObject': ([wintypes.HANDLE, wintypes.HANDLE], wintypes.BOOL),
        'WaitForMultipleObjects': ([wintypes.DWORD, ctypes.POINTER(wintypes.HANDLE), wintypes.BOOL, wintypes.DWORD], wintypes.DWORD),
        'WaitForSingleObject': ([wintypes.HANDLE, wintypes.DWORD], wintypes.DWORD),
        'CloseHandle': ([wintypes.HANDLE], wintypes.BOOL),
        'ResumeThread': ([wintypes.HANDLE], wintypes.DWORD),
        'TerminateProcess': ([wintypes.HANDLE, wintypes.UINT], wintypes.BOOL),
        'GetStdHandle': ([wintypes.DWORD], wintypes.HANDLE),
    }
    for name, (argtypes, restype) in signatures.items():
        fn = getattr(kernel, name)
        fn.argtypes, fn.restype = argtypes, restype

    def require(value):
        if not value:
            raise ctypes.WinError(ctypes.get_last_error())
        return value

    owner = job = child = thread = None
    assigned = False
    try:
        owner = require(kernel.OpenProcess(0x00100000, False, args.owner))
        if kernel.WaitForSingleObject(owner, 0) != 258:
            return
        job = require(kernel.CreateJobObjectW(None, None))
        limits = ExtendedLimits()
        limits.basic.flags = 0x00002000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        require(kernel.SetInformationJobObject(job, 9, ctypes.byref(limits), ctypes.sizeof(limits)))
        startup = subprocess.STARTUPINFO()
        startup.dwFlags = subprocess.STARTF_USESTDHANDLES
        startup.hStdInput = kernel.GetStdHandle(-10 & 0xffffffff)
        startup.hStdOutput = kernel.GetStdHandle(-11 & 0xffffffff)
        startup.hStdError = kernel.GetStdHandle(-12 & 0xffffffff)
        command = subprocess.list2cmdline([sys.executable, args.entry])
        # Assign while suspended: venv launcher descendants inherit the job.
        child, thread, _, _ = _winapi.CreateProcess(sys.executable, command, None, None, True,
            subprocess.CREATE_NO_WINDOW | 0x00000004, os.environ.copy(), args.root, startup)
        require(kernel.AssignProcessToJobObject(job, child))
        assigned = True
        if kernel.ResumeThread(thread) == 0xffffffff:
            raise ctypes.WinError(ctypes.get_last_error())
        kernel.CloseHandle(thread)
        thread = None
        waits = (wintypes.HANDLE * 2)(owner, child)
        result = kernel.WaitForMultipleObjects(2, waits, False, 0xffffffff)
        if result == 0xffffffff:
            raise ctypes.WinError(ctypes.get_last_error())
    finally:
        if job:
            kernel.CloseHandle(job)
        if child:
            if not assigned or kernel.WaitForSingleObject(child, 5000) == 258:
                kernel.TerminateProcess(child, 1)
            kernel.CloseHandle(child)
        if thread:
            kernel.CloseHandle(thread)
        if owner:
            kernel.CloseHandle(owner)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--owner', type=int, required=True)
    parser.add_argument('--root', required=True)
    parser.add_argument('--entry', required=True)
    parser.add_argument('--port', type=int, required=True)
    parsed = parser.parse_args()
    os.chdir(Path(parsed.root).resolve())
    (windows if os.name == 'nt' else unix)(parsed)
