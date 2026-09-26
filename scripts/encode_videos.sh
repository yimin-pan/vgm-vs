#!/usr/bin/env bash
# Re-encodes the experiment recordings into web-friendly H.264 MP4s under static/videos/.
# Usage: scripts/encode_videos.sh [SRC_DIR]   (default: ~/Projects/vgm-vs-experiments/videos_edit)
set -euo pipefail

SRC="${1:-$HOME/Projects/vgm-vs-experiments/videos_edit}"
DST="$(cd "$(dirname "$0")/.." && pwd)/static/videos"

# External (third-person) recordings are portrait phone videos; ffmpeg applies the rotation metadata.
encode_external() {
  mkdir -p "$(dirname "$DST/$2")"
  ffmpeg -v error -y -i "$SRC/$1" -an \
    -vf "scale=720:-2,fps=30" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p \
    -movflags +faststart "$DST/$2"
  echo "$2: $(du -h "$DST/$2" | cut -f1)"
}

# Wrist camera views are MPEG-4 Part 2 (browsers cannot decode it) and 4:3, while the demo grid
# uses 9:16 tiles. The 4:3 frame is centred on a blurred, darkened copy of itself so it fills the
# tile without black bars.
encode_camera() {
  mkdir -p "$(dirname "$DST/$2")"
  ffmpeg -v error -y -i "$SRC/$1" -an \
    -filter_complex "[0:v]split[bg][fg];\
[bg]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,gblur=sigma=28,eq=brightness=-0.12:saturation=0.85[bgb];\
[fg]scale=720:-2:flags=lanczos[fgs];\
[bgb][fgs]overlay=(W-w)/2:(H-h)/2,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 25 \
    -movflags +faststart "$DST/$2"
  echo "$2: $(du -h "$DST/$2" | cut -f1)"
}

encode_external "ram/initial pose/210926_4.MOV"             ram_insertion/initial_pose.mp4
encode_camera   "ram/initial pose/210926_4/camera_view/video.mp4" ram_insertion/camera_view.mp4
encode_external "ram/occlusion/210926_1.MOV"                ram_insertion/occlusion.mp4
encode_external "ram/dynamic/210926_9.MOV"                  ram_insertion/dynamic.mp4
encode_external "ram/dynamic + covering/210926_12.MOV"      ram_insertion/dynamic_covering.mp4

encode_external "cable picking/initial pose/200926_1.MOV"   cable_picking/initial_pose.mp4
encode_camera   "cable picking/initial pose/200926_1/camera_view/video.mp4" cable_picking/camera_view.mp4
encode_external "cable picking/occlusion/200926.MOV"        cable_picking/occlusion.mp4
encode_external "cable picking/dynamic/200926_3.MOV"        cable_picking/dynamic.mp4

encode_external "cable insertion/initial pose/210926.MOV"   cable_insertion/initial_pose.mp4
encode_camera   "cable insertion/initial pose/210926/camera_view/video.mp4" cable_insertion/camera_view.mp4
encode_external "cable insertion/occlusion/210926_1.MOV"    cable_insertion/occlusion.mp4
encode_external "cable insertion/dynamic/210926_2.MOV"      cable_insertion/dynamic.mp4
