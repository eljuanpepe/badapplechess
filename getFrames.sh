#!/bin/bash

mkdir frames
ffmpeg -i badapple.mp4 frames/frame_%d.png