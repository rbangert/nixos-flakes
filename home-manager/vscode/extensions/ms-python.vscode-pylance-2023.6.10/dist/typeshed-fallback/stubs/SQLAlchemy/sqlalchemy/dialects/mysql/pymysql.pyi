from _typeshed import Incomplete
from typing import Any

from ...util.langhelpers import memoized_property
from .mysqldb import MySQLDialect_mysqldb

class MySQLDialect_pymysql(MySQLDialect_mysqldb):
    driver: str
    supports_statement_cache: bool
    description_encoding: Any
    supports_unicode_statements: bool
    supports_unicode_binds: bool
    @memoized_property
    def supports_server_side_cursors(self): ...
    @classmethod
    def dbapi(cls): ...
    def create_connect_args(self, url, _translate_args: Incomplete | None = None): ...
    def is_disconnect(self, e, connection, cursor): ...

dialect = MySQLDialect_pymysql
