"""Python-side request validation; fail closed before database/model work."""
import math

def required_text(value, label, maximum=500):
    if not isinstance(value,str) or not value.strip():raise ValueError(f'{label} is required.')
    if len(value.strip())>maximum:raise ValueError(f'{label} must be {maximum} characters or fewer.')
    return value.strip()

def decision_payload(body):
    title=required_text(body.get('title'),'Decision title',140)
    question=required_text(body.get('original_question'),'Original question',1200)
    objective=required_text(body.get('objective'),'Decision objective',600)
    horizon=required_text(body.get('time_horizon'),'Time horizon',120)
    constraints=body.get('constraints'); metrics=body.get('metrics')
    if not isinstance(constraints,list) or not any(isinstance(x,str) and x.strip() for x in constraints):raise ValueError('At least one explicit constraint is required.')
    if not isinstance(metrics,list) or not any(isinstance(x,str) and x.strip() for x in metrics):raise ValueError('At least one required metric is required.')
    return {'title':title,'original_question':question,'change_description':required_text(body.get('change_description') or question,'Change description',600),'objective':objective,'time_horizon':horizon,'constraints':[x.strip() for x in constraints if isinstance(x,str) and x.strip()],'metrics':[x.strip() for x in metrics if isinstance(x,str) and x.strip()],'business_unit':required_text(body.get('business_unit') or 'Corporate','Business unit',100),'organization_id':'00000000-0000-4000-8000-000000000001','created_by':'00000000-0000-4000-8000-000000000011'}

def scenario_payload(body):
    return {'name':required_text(body.get('name'),'Scenario name',120),'description':required_text(body.get('description'),'Scenario change description',800),'variable':required_text(body.get('variable') or 'Scenario variable','Variable',120),'value':str(body.get('value') or '').strip(),'assumptions':[x.strip() for x in (body.get('assumptions') or '').split('\n') if x.strip()]}

def validate_prediction(row):
    if row.get('availability')=='unavailable':return row
    for k in ('value','lower_bound','upper_bound','confidence'):
        if not isinstance(row.get(k),(int,float)):raise ValueError(f'Prediction {k} must be numeric.')
        if not math.isfinite(float(row[k])):raise ValueError(f'Prediction {k} must be finite.')
    if row['lower_bound']>row['upper_bound']:raise ValueError('Prediction lower bound exceeds upper bound.')
    if not row['lower_bound']<=row['value']<=row['upper_bound']:raise ValueError('Prediction value must fall inside its bounds.')
    if not 0<=row['confidence']<=1:raise ValueError('Prediction confidence must be between 0 and 1.')
    return row
