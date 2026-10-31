"""Application errors translated to safe JSON API responses."""
class NotFoundError(LookupError):pass
class ConflictError(RuntimeError):pass
class StaleDataError(RuntimeError):pass
