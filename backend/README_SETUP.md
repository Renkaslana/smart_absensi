# Backend setup (Windows) — notes for `.venv` and `dlib`

Follow these steps to create a local `.venv` and install the Python requirements for the backend. dlib can be tricky on Windows; below are suggested approaches.

Minimum recommendations
- Use Python 3.8–3.11 for best binary wheel availability.
- For building dlib from source you need:
  - Visual C++ Build Tools (MSVC) — install "Desktop development with C++" workload
  - CMake (>= 3.18) on PATH

Automated (PowerShell)
1. Open PowerShell as Administrator (if you need to install system tools).
2. From the `backend` folder run:
```
.\setup_venv.ps1
```
This script creates `.venv`, activates it, upgrades pip and tries `pip install -r requirements.txt`. If dlib fails it will attempt to install `cmake` and re-run `pip install dlib`.

Automated (Command Prompt)
1. Open Command Prompt.
2. From the `backend` folder run:
```
setup_venv.bat
```

If `dlib` fails to build
- Option A — Use conda (recommended on Windows):
  1. Install Miniconda or Anaconda.
  2. Create env and install dlib from conda-forge, then pip-install other requirements:
```
conda create -n smartenv python=3.10 -y
conda activate smartenv
conda install -c conda-forge dlib -y
pip install -r requirements.txt
```

- Option B — Use prebuilt wheel (if available):
  1. Visit Christoph Gohlkes Windows binaries page: https://www.lfd.uci.edu/~gohlke/pythonlibs/
  2. Download the `dlib` wheel that matches your Python version and architecture.
  3. Install it inside the venv before `pip install -r requirements.txt`:
```
python -m pip install path\to\dlib‑<version>‑cp310‑cp310‑win_amd64.whl
pip install -r requirements.txt
```

Notes
- The current `requirements.txt` comments out `dlib`. If you need `dlib`, uncomment and pick an approach above.
- If you prefer pure pip, ensure CMake and MSVC are installed and on PATH so dlib can build from source.
- If you hit errors, copy the full pip error output and share it; I can help debug specific build failures.
