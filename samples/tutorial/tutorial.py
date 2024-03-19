from covfee import HIT, Project, tasks
from covfee.config import config
from covfee.server.app import create_app_and_socketio  # noqa: F401
from covfee.shared.dataclass import CovfeeApp

config.load_environment("local")

my_task_1 = tasks.TutorialTaskSpec(name="My Task 1", showPhoneField=True)
my_task_2 = tasks.TutorialTaskSpec(name="My Task 2", showPhoneField=False)

hit = HIT("Joint counter")
j1 = hit.add_journey(nodes=[my_task_1, my_task_2])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
