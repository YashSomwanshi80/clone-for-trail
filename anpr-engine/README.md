## ANPR Engine

### Windows
#### First Use -
```
    cd anpr-engine
    python -m venv venv
    venv\scripts\activate
    pip install -r requirements.txt
    deactivate
```
#### Everytime -
```
    cd anpr-engine
    venv\scripts\activate # start the virtual enviornment to do work
    fastapi dev main.py # start the fastapi server
    deactivate # close the venv after work
```

### Linux/MacOS/Other UNIX Like OS
#### First Use -
```
    cd anpr-engine
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
```
#### Everytime -
```
    cd anpr-engine
    source venv/bin/activate # start the virtual enviornment to do work
    fastapi dev main.py # start the fastapi server
    deactivate # close the venv after work
```
