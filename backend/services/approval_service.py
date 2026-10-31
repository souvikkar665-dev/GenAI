"""Approval policy. Only Approver/Admin roles can make final decisions."""
class ApprovalEngine:
    APPROVER_ROLES={'Approver','Admin'}
    ACTIONS={'approved','rejected','change_requested'}
    @classmethod
    def authorize(cls,actor_role,action):
        if action not in cls.ACTIONS:raise ValueError('Unsupported approval action.')
        if actor_role not in cls.APPROVER_ROLES:raise PermissionError('Only an authorized Approver or Admin can record a final decision.')
        return True
