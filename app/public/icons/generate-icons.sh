#!/bin/bash
# This would normally generate icons, but for now we'll create placeholder text files
echo "Icon placeholder 192x192" > icon-192.png.txt
echo "Icon placeholder 512x512" > icon-512.png.txt
echo "Run: convert -size 192x192 xc:#1F6408 -gravity center -pointsize 100 -fill white -font Arial -annotate +0+0 '🦩' icon-192.png"
echo "Run: convert -size 512x512 xc:#1F6408 -gravity center -pointsize 300 -fill white -font Arial -annotate +0+0 '🦩' icon-512.png"
