import subprocess
from pathlib import Path
import click
from tqdm import tqdm


@click.command()
@click.option("--audio-folder", required=True, help="Folder with audio samples.")
@click.option(
    "--video-segments-folder", required=True, help="Folder with audio samples."
)
@click.option("--raw-videos-folder", required=True, help="Folder with audio samples.")
@click.option("--output-folder", required=True, help="Folder with audio samples.")
@click.option("--overwrite", is_flag=True, help="Overwrite the output folder.")
def main(
    audio_folder: str,
    output_folder: str,
    video_segments_folder: str,
    raw_videos_folder: str,
    overwrite: bool,
):
    for cam_folder in tqdm(sorted(Path(video_segments_folder).iterdir())):
        if not cam_folder.is_dir():
            continue

        cam_name = cam_folder.stem
        offset_raw_videos: dict[str, float] = dict()
        total_video_length = 0
        if cam_name != "cam10":
            folder_cam_name = cam_name.replace("cam", "cam0")
        else:
            folder_cam_name = cam_name
        for raw_video in sorted((Path(raw_videos_folder) / folder_cam_name).iterdir()):
            if raw_video.suffix != ".MP4" or not raw_video.stem.startswith("GH"):
                continue
            if raw_video.stem.endswith("_rot"):
                continue

            short_name = raw_video.stem[:4]
            if (
                cam_name == "cam10" and short_name == "GH01"
            ):  # Skip the first video of cam10
                total_video_length = 0
                offset_raw_videos = dict()

            assert (
                short_name not in offset_raw_videos
            ), f"{short_name} already in offset_raw_videos."

            offset_raw_videos[short_name] = total_video_length

            # fmt: off
            cmd = [
                    "ffprobe",
                    "-v", "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    str(raw_video),
                ]
            # fmt: on
            res = subprocess.run(cmd, capture_output=True)
            video_length = res.stdout.decode("utf-8").rstrip()
            total_video_length += float(video_length)

        for video_segment in tqdm(sorted(cam_folder.iterdir())):
            if video_segment.is_dir() or video_segment.suffix != ".mp4":
                continue
            video_name = video_segment.stem
            # For 'vid2-seg8-scaled-denoised', we want GH02 and 14:00
            vid_num = int(video_name.split("-")[0][3:])
            seg_num = int(video_name.split("-")[1][3:])

            # Skip all the previous videos and then also skip all the previous 2 minutes segments
            total_offset = offset_raw_videos[f"GH0{vid_num}"] + (seg_num - 1) * 120

            for audio_file in sorted(Path(audio_folder).iterdir()):
                if audio_file.suffix != ".wav":
                    continue

                output_audio_path = (
                    Path(output_folder)
                    / "audio"
                    / cam_name
                    / f"{video_name}-participant{audio_file.stem}.wav"
                )
                output_audio_path.parent.mkdir(parents=True, exist_ok=True)
                # Crop the audio to the same length and offset as the video
                # fmt: off
                cmd = [
                    "ffmpeg",
                    "-hide_banner",
                    "-loglevel", "error",
                    "-i", str(audio_file),
                    "-vcodec", "copy",
                    "-acodec", "copy",
                    "-copyinkf",
                    "-ss", f"{total_offset}",
                    "-t", "00:02:00",
                    str(output_audio_path),
                ]
                if overwrite:
                    cmd.append("-y")
                # fmt: on
                subprocess.run(cmd)

                output_video_path = (
                    Path(output_folder)
                    / "video"
                    / cam_name
                    / f"{video_name}-participant{audio_file.stem}.mp4"
                )
                output_video_path.parent.mkdir(parents=True, exist_ok=True)
                # Combine the video and audio, this is re-encoding the audio because remuxing directly does not work
                # fmt: off
                cmd = [
                    "ffmpeg",
                    "-hide_banner",
                    "-loglevel", "error",
                    "-i", str(video_segment),
                    "-i", str(output_audio_path),
                    "-c:v", "copy",
                    "-map", "0:v:0",
                    "-map", "1:a:0",
                    str(output_video_path),
                ]
                # fmt: on
                if overwrite:
                    cmd.append("-y")
                subprocess.run(cmd)


if __name__ == "__main__":
    # Arguments that this script was called with
    # "--audio-folder", "/data/conflab/data_raw/audio/synced/",
    # "--video-segments-folder", "/data/conflab/data_processed/cameras/video_segments/",
    # "--raw-videos-folder", "/data/conflab/data_raw/cameras/",
    # "--output-folder", "/data/conflab/covfee-annotations/speak-laughter/",
    # "--overwrite",
    main()
