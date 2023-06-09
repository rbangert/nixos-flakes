from .base import *
from .sequence import Sequence as Sequence

class MetaStrict(type):
    def __new__(cls, clsname, bases, methods): ...

class MetaSerialisable(type):
    def __new__(cls, clsname, bases, methods): ...

class Strict(metaclass=MetaStrict): ...
