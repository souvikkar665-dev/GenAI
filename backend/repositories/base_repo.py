"""Persistence method expectations documented as an informal Python interface."""
class BaseRepository:
    def portfolio(self):raise NotImplementedError
    def decisions(self):raise NotImplementedError
    def scenarios(self):raise NotImplementedError
    def approvals(self):raise NotImplementedError
    def audit(self):raise NotImplementedError
