"""Security boundary. The prototype's role selector is not production authentication."""
from backend.services.approval_service import ApprovalEngine

def require_approver(actor_role):
    return ApprovalEngine.authorize(actor_role,'approved')

def organization_filter(record_org_id, actor_org_id):
    if not record_org_id or str(record_org_id)!=str(actor_org_id):
        raise PermissionError('Organization access denied.')
    return True
