import glob
import optparse
import eyed3
import os
import sys
import random
import shutil

class MusicFiller(object):

    def __init__(self):
        opts = self.parse_cli()
        self.musicLib = opts.path
        self.autoFillDestination = opts.usb
        self.maxAutofillSizeBytes = int(opts.size) * 1024 * 1024 # given in MB 
        self.mp3Files = self.list_mp3_files()
        self.mp3FileDetails = self.get_mp3_data()
        print(opts)

    def parse_cli(self):
        """ CLI option parsing """
        parser = optparse.OptionParser()
        # mandatory
        parser.add_option('-p', '--path', help='path to music lib', dest='path')
        parser.add_option('-u', '--usb', help='path to usb stick', dest='usb')
        parser.add_option(
            '-s', '--size', help='max size autofill in MB', dest='size')
        (opts, args) = parser.parse_args()
        # Making sure all mandatory options appeared.
        mandatories = ['path', 'usb', 'size']
        for m in mandatories:
            if not opts.__dict__[m]:
                print("Mandatory option is missing: [%s]\n" % m)
                parser.print_help()
                exit(-1)
        # validate paths
        for dirName in [opts.path, opts.usb]:
            self.path_exists_check(dirName)
        return opts

    def path_exists_check(self, dirName):
        """ Exit if musicLib and destination (USB) path don't exist """
        if not os.path.isdir(dirName):
            sys.exit("%s does not exist" % dirName)

    def list_mp3_files(self):
        """ Recursively walk through given musicLib dir, listing all mp3 files """
        # http://stackoverflow.com/questions/2186525/use-a-glob-to-find-files-recursively-in-python
        mp3Files = []
        for filename in glob.iglob(self.musicLib + '/**/*.mp3', recursive=True):
            mp3Files.append(filename)
        return mp3Files

    def get_mp3_data(self):
        eyed3.log.setLevel("ERROR")
        mp3FileDetails = {}
        for mp3 in self.mp3Files: 
            try:
                mp3FileDetails[mp3] = {}
                trackInfo = eyed3.load(mp3)

                info = trackInfo.info
                if info is not None:
                    mp3FileDetails[mp3]['bytes'] = info.size_bytes
                    mp3FileDetails[mp3]['seconds'] = info.time_secs

                tag = trackInfo.tag
                if tag is not None:
                    if tag.genre is not None:
                        mp3FileDetails[mp3]['genre'] = tag.genre.name
            except Exception as e:
                print(f'error >> {e} {mp3}')
                continue

        return mp3FileDetails

    def copy_mp3_to_usb(self, mp3ToCopy):
        """ Copies speficied mp3 file to autofill location/path, returns True/False if success/failure """
        destinationFile = self.autoFillDestination + os.sep + os.path.basename(mp3ToCopy)

        try:
            shutil.copyfile(mp3ToCopy, destinationFile)
            return True
        except IOError as e:
            print(e)
            return False

    def auto_fill(self):
        sizeFilled = 0
        successCounter = failureCounter = 0
        songsTaken = []
        keys = list(self.mp3FileDetails.keys())
        while sizeFilled < self.maxAutofillSizeBytes: 
            # take a random song from collection
            randomSong = random.choice(keys)
            # don't take a song twice
            if randomSong in songsTaken:
                continue
            songsTaken.append(randomSong)

            copySuccess = self.copy_mp3_to_usb(randomSong)
            if copySuccess:
                successCounter += 1
            else: 
                failureCounter += 1

            sizeFilled += self.mp3FileDetails[randomSong]['bytes']

        print(f'success {successCounter} failure {failureCounter}')


# instant
m = MusicFiller()
m.auto_fill()
