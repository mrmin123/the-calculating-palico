#!/usr/bin/python

import sys
sys.path.insert(0, '/var/www/calculatingpalico/')
from frontend import app

if __name__ == "__main__":
    app.run()
