from __future__ import annotations

import datetime
import os
import subprocess
import time
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, Optional

from flask import Blueprint, jsonify, request
from flask import current_app as app
from sqlalchemy import ForeignKey, select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm.attributes import flag_modified

from covfee.server.orm import Base
from covfee.server.tasks.base import BaseCovfeeTask

if TYPE_CHECKING:
    from covfee.server.orm.task import TaskInstance


def jsonify_or_404(res, **kwargs):
    if res is None:
        return {"msg": "not found"}, 404
    else:
        return jsonify(res.to_dict(**kwargs))


class ContinuousAnnotationTask(BaseCovfeeTask):
    @classmethod
    def get_blueprint(cls):
        return bp

    def on_create(self):
        # we read the spec and add the provided annotations to the database
        spec = self.task.spec.spec
        for annot in spec["annotations"]:
            self.session.add(
                Annotation(
                    task_id=self.task.id,
                    category=annot["category"],
                    interface=annot["interface"],
                    participant=annot["participant"],
                )
            )


bp = Blueprint("ContinuousAnnotationTask", __name__)


@bp.route("/tasks/<tid>/annotations/all")
def fetch_all(tid):
    rows = (
        app.session.execute(select(Annotation).where(Annotation.task_id == int(tid)))
        .scalars()
        .all()
    )
    return jsonify([r.to_dict() for r in rows])


@bp.route("/annotations/<annotid>")
def fetch_one(annotid):
    res = app.session.query(Annotation).get(int(annotid))

    return jsonify_or_404(res)


# create a new annotation (without the data)
@bp.route("/annotations", methods=["POST"])
def submit_annotation():
    props = request.json
    annot = Annotation(**props)
    app.session.add(annot)
    app.session.commit()
    return jsonify_or_404(annot)


# update an annotation
@bp.route("/annotations/<annotid>", methods=["UPDATE"])
def update_annotation(annotid):
    annot = app.session.query(Annotation).get(int(annotid))
    if annot is None:
        return jsonify({"msg": "not found"}), 404

    updates = request.json
    for key, value in updates.items():
        if hasattr(annot, key):
            # Never allow client payloads to mutate identity or managed fields.
            if key in ["id", "task_id", "created_at", "updated_at"]:
                continue
            if key == "data_json":
                pressData, current_video_time, time_annot, video_length, video_index = value
                video_index = str(video_index)
                new_data = {
                    "press_data": pressData,
                    "current_video_time": current_video_time,
                    "time_annot": time_annot,
                    "video_length": video_length,
                    "video_index": video_index,
                }
                if annot.data_json is None:
                    annot.data_json = {}
                if video_index not in annot.data_json:
                    annot.data_json[video_index] = []
                annot.data_json[video_index].append(new_data)
                flag_modified(annot, "data_json")
            else:
                setattr(annot, key, value)

    app.session.commit()
    return jsonify_or_404(annot)


# delete an annotation
@bp.route("/annotations/<annotid>", methods=["DELETE"])
def delete_annotation(annotid):
    annot = app.session.query(Annotation).get(int(annotid))
    if annot is None:
        return jsonify({"msg": "not found"}), 404
    app.session.delete(annot)
    app.session.commit()
    return "", 200


# Audio containers a browser MediaRecorder can produce, mapped to the extension we
# store them under. The extension is always derived from here, never from the
# client-supplied filename.
ALLOWED_RECORDING_MIME_TYPES = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
}


def _recording_extension(mime: str) -> Optional[str]:
    """Extension for a mime type, ignoring codec parameters ('audio/webm;codecs=opus')."""
    base_mime = mime.split(";")[0].strip().lower()
    return ALLOWED_RECORDING_MIME_TYPES.get(base_mime)


def _optional_int(form, key: str) -> Optional[int]:
    value = form.get(key)
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _optional_float(form, key: str) -> Optional[float]:
    value = form.get(key)
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


# store an audio recording made by the annotator for one clip
@bp.route("/annotations/<annotid>/recording", methods=["POST"])
def upload_recording(annotid):
    annot = app.session.query(Annotation).get(int(annotid))
    if annot is None:
        return jsonify({"msg": "not found"}), 404

    uploaded = request.files.get("file")
    if uploaded is None:
        return jsonify({"msg": "no file in request"}), 400

    extension = _recording_extension(uploaded.mimetype or "")
    if extension is None:
        return (
            jsonify({"msg": f"unsupported recording type {uploaded.mimetype}"}),
            400,
        )

    clip_index = _optional_int(request.form, "clip_index")
    if clip_index is None:
        return jsonify({"msg": "clip_index is required"}), 400

    # Check the declared size before reading, so an oversized upload is rejected
    # without pulling it into memory.
    max_size = app.config["MAX_RECORDING_SIZE_BYTES"]
    if request.content_length is not None and request.content_length > max_size:
        return jsonify({"msg": f"recording exceeds {max_size} bytes"}), 413

    payload = uploaded.read(max_size + 1)
    if len(payload) == 0:
        return jsonify({"msg": "empty recording"}), 400
    if len(payload) > max_size:
        return jsonify({"msg": f"recording exceeds {max_size} bytes"}), 413

    # Every path component is built from integers, so nothing the client sends can
    # escape the recordings directory.
    relative_path = os.path.join(
        f"task_{annot.task_id}",
        f"annot_{annot.id}",
        f"clip_{clip_index:04d}_{int(time.time() * 1000)}.{extension}",
    )
    absolute_path = os.path.join(app.config["RECORDINGS_PATH"], relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "wb") as f:
        f.write(payload)

    recording = Recording(
        task_id=annot.task_id,
        annotation_id=annot.id,
        clip_index=clip_index,
        batch_item_id=_optional_int(request.form, "batch_item_id"),
        media_src=request.form.get("media_src"),
        path=relative_path,
        mime=uploaded.mimetype,
        size_bytes=len(payload),
        duration_s=_optional_float(request.form, "duration_s"),
    )
    app.session.add(recording)
    app.session.commit()

    return jsonify(recording.to_dict())


# all recordings for a task, so the client can restore its state after a reload
@bp.route("/tasks/<tid>/recordings")
def fetch_all_recordings(tid):
    rows = (
        app.session.execute(select(Recording).where(Recording.task_id == int(tid)))
        .scalars()
        .all()
    )
    return jsonify([r.to_dict() for r in rows])


@bp.route("/video/<video_name>/length")
def get_video_length(video_name):
    return jsonify({"duration": 10.026667})
    local_path = Path("/data/conflab/data_processed/cameras/video_segments")
    try:
        # Run ffprobe to get video duration efficiently
        result = subprocess.run(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(local_path / video_name),
                # "/home/era/Downloads/mov_bbb.mp4",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode == 0:
            duration = float(result.stdout.strip())
            return jsonify({"duration": duration})
        else:
            return jsonify({"error": "Failed to get video duration"}), 400
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout while getting video duration"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


class Annotation(Base):
    """Stores annotations for covfee tasks"""

    __tablename__ = "ContinuousAnnotationTask.annotations"

    id: Mapped[int] = mapped_column(primary_key=True)

    # link to covfee node / task
    task_id: Mapped[int] = mapped_column(ForeignKey("nodeinstances.id"))
    task: Mapped[TaskInstance] = relationship("TaskInstance", backref="annotations")

    category: Mapped[str]
    participant: Mapped[str]
    interface: Mapped[Dict[str, Any]]  # json column
    data_json: Mapped[Optional[Dict[str, Any]]]

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def reset_data(self) -> None:
        self.data_json = None


class Recording(Base):
    """Audio recorded by the annotator for one clip of a ContinuousAnnotationTask.

    The audio itself lives on disk under config RECORDINGS_PATH (outside the folder
    served by /api/media, since it is personal data); this table holds the metadata
    and the relative path to it.
    """

    __tablename__ = "ContinuousAnnotationTask.recordings"

    id: Mapped[int] = mapped_column(primary_key=True)

    task_id: Mapped[int] = mapped_column(ForeignKey("nodeinstances.id"))
    annotation_id: Mapped[int] = mapped_column(
        ForeignKey("ContinuousAnnotationTask.annotations.id")
    )

    # index of the clip within the task's flattened media list
    clip_index: Mapped[int]
    batch_item_id: Mapped[Optional[int]]
    # the clip the annotator was looking at, for joining back to the source media
    media_src: Mapped[Optional[str]]

    path: Mapped[str]  # relative to RECORDINGS_PATH
    mime: Mapped[str]
    size_bytes: Mapped[int]
    duration_s: Mapped[Optional[float]]  # client-reported, best effort

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
