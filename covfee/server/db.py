from typing import NamedTuple, Optional, Union

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import sessionmaker


class DatabaseEngineConfig(NamedTuple):
    # The path to the database file, if not provided, the database will be in-memory
    database_file: Optional[str] = None

    # Whether to display the SQL commands being executed
    echo_sql_commands: bool = False


def create_database_engine(config: DatabaseEngineConfig) -> Engine:
    """
    Creates an SQLAlchemy engine attached to the database file specified in the config
    """
    print(f"Creating file system engine at {config.database_file}")
    return create_engine(
        f"sqlite:///{config.database_file}", echo=config.echo_sql_commands
    )


def create_database_sessionmaker(
    engine: Union[Engine, DatabaseEngineConfig],
) -> sessionmaker:
    """
    Generates the SQLAlchemy sessionmaker for to generate sessions

    Parameters:
    - engine (Engine | DatabaseEngineConfig): The engine to use for the sessionmaker. If a
      DatabaseEngineConfig is provided, it will be used to create the engine.
    """
    if isinstance(engine, DatabaseEngineConfig):
        engine = create_database_engine(engine)
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
