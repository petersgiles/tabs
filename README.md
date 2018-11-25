# Tabs

A collection of tabs I want to play

(https://petersgiles.github.io/tabs)

## Serve

mkdocs serve

## Deploy

mkdocs gh-deploy

## Music Autofill

### Setup

brew install libmagic

python -m venv music_autofill
source music_autofill/bin/activate

pip3 install eyed3
pip3 install libmagic

### VENV

source music_autofill/bin/activate

python music_autofill.py -p "/Users/xxx/CloudStation/iTunes/Music" -u /Users/xxx/Music/tmp -s 1000 -c

python music_autofill.py -p "music_dir" -u /Volumes/USB\ DISK/ -g  -s 200  -c
