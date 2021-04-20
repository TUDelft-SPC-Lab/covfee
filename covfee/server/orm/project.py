from .db import db
from hashlib import sha256
import os
import json

import pandas as pd
from flask import current_app as app

from .hit import HIT


class Project(db.Model):
    """ Represents a set of HITs which make up an experiment or annotation project """
    __tablename__ = 'projects'

    id = db.Column(db.LargeBinary, primary_key=True)
    name = db.Column(db.String)
    email = db.Column(db.String)
    hits = db.relationship("HIT", backref="project", cascade="all, delete-orphan")

    def __init__(self, id, name, email, hits, **kwargs):
        hashstr = Project.get_hashtr(id)
        self.id = sha256(hashstr.encode()).digest()
        self.update(id, name, email, hits)

    def update(self, id, name, email, hits, **kwargs):
        self.name = name
        self.email = email

        hashstr = Project.get_hashtr(id)
        for hit_dict in hits:
            hit = db.session.query(HIT).get(HIT.get_id(hashstr, hit_dict['id']))
            if hit is None:
                self.hits.append(HIT(**hit_dict, hashstr=hashstr))
            else:
                hit.update(**hit_dict, hashstr=hashstr)

    def get_dataframe(self):
        list_of_instances = list()
        for hit in self.hits:
            for instance in hit.instances:
                list_of_instances.append({
                    'hit_name': hit.name,
                    'id': instance.id.hex(),
                    'url': instance.get_url(),
                    'preview_url': instance.get_preview_url(),
                    'completion_code': instance.get_completion_code()
                })
        df = pd.DataFrame(list_of_instances, columns=['hit_name', 'id', 'url', 'preview_url', 'completion_code'])
        
        return df

    def as_dict(self, with_hits=False, with_instances=False):
        project_dict = {c.name: getattr(self, c.name)
                        for c in self.__table__.columns}
        project_dict['id'] = project_dict['id'].hex()
        if with_hits:
            project_dict['hits'] = [hit.as_dict(
                with_instances=with_instances) for hit in self.hits]
        return project_dict

    def info(self):
        txt = f'{self.name}\nID: {self.id.hex():s}\n'
        for tl in self.hits:
            txt += tl.showinfo()
        return txt

    def __str__(self):
        txt = f'{self.name} - ID: {self.id.hex():s}\n'
        for tl in self.hits:
            txt += str(tl)
        return txt

    @staticmethod
    def get_hashtr(id):
        return id + app.config['COVFEE_SECRET_KEY']

    @staticmethod
    def get_id(id):
        return sha256(Project.get_hashtr(id).encode()).digest()

    @staticmethod
    def from_json(fpath: str):
        '''
        Loads a project into ORM objects from a project json file.
        '''
        with open(fpath, 'r') as f:
            proj_dict = json.load(f)

        return Project(**proj_dict)

    def stream_download(self, z, base_path, csv=False):
        for hit in self.hits:
            for instance in hit.instances:
                for chunk in instance.stream_download(z, os.path.join(base_path, instance.id.hex()), csv=csv):
                    yield chunk
