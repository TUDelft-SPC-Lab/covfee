from __future__ import annotations

import datetime
import subprocess
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
        if key in ["id", "task_id", "participant", "category", "interface"]:
            continue
        if hasattr(annot, key):
            if key in ["created_at", "updated_at"]:
                continue
            if key == "data_json":
                narrative_data, paused_at, current_video_time, time_annot, video_length, narrative_index = value
                narrative_index = str(narrative_index)
                new_data = {
                    "narratives": narrative_data,
                    "paused_at": paused_at,
                    "current_video_time": current_video_time,
                    "time_annot": time_annot,
                    "video_length": video_length,
                }
                if annot.data_json is None:
                    annot.data_json = {}
                if narrative_index not in annot.data_json:
                    annot.data_json[narrative_index] = []
                annot.data_json[narrative_index].append(new_data)
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


@bp.route("/video/<video_name>/length")
def get_video_length(video_name):
    print(f"Getting length for video: {video_name}")
    try:
        result = subprocess.run(
            [
                "/home/arthurmercier/miniconda3/envs/ffmpeg-8/bin/ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                str(Path(f"/data/ingroup/video_segs/{video_name}")),
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode == 0:
            duration = round(float(result.stdout.strip()), 3)
            print(f"Retrieved duration for video {video_name}: {duration}")
            return jsonify({"duration": duration})
        else:
            print(f"Failed to get duration for video {video_name}")
            return jsonify({"error": "Failed to get video duration"}), 400
    except subprocess.TimeoutExpired:
        print(f"Timeout while getting duration for video {video_name}")
        return jsonify({"error": "Timeout while getting video duration"}), 500
    except Exception as e:
        print(f"Error occurred while getting duration for video {video_name}: {e}")
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
